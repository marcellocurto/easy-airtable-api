import { IncomingMessage, request as httpRequest } from 'http';
import { request as httpsRequest, RequestOptions } from 'https';
import { URL } from 'url';
import { ApiRequest, RequestMethods } from './types/tables.js';
import { delay } from './utils.js';

export type AirtableQueryValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | undefined;

export type AirtableRetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOn429?: boolean;
  retryOn5xx?: boolean;
  retryOnNetworkErrors?: boolean;
  useJitter?: boolean;
  /**
   * How long an attempt may wait without receiving data before it fails with
   * ETIMEDOUT, which is retried like other network errors. Defaults to five
   * minutes.
   */
  timeoutMs?: number;
};

const DEFAULT_RETRY_OPTIONS: Required<AirtableRetryOptions> = {
  maxRetries: 5,
  baseDelayMs: 500,
  // Long enough to wait out Airtable's 30-second rate-limit lockout.
  maxDelayMs: 30000,
  retryOn429: true,
  retryOn5xx: true,
  retryOnNetworkErrors: true,
  useJitter: true,
  timeoutMs: 300000,
};

export class AirtableApiError extends Error {
  statusCode?: number;
  airtableType?: string;
  /**
   * Whether resending this exact request is safe and could succeed. It is
   * false for a request that isn't safe to repeat, such as a create, when
   * Airtable may already have applied it after a 5xx or a dropped connection.
   */
  retryable: boolean;
  retryAfterMs?: number;
  /** How many attempts were sent before the request failed for good. */
  attempts?: number;
  /**
   * Whether an earlier attempt failed in a way that may have applied the
   * request, such as a 5xx or a connection that dropped after sending. The
   * delete helpers use it to read a 404 on the final attempt as "already
   * deleted".
   */
  earlierAttemptMayHaveApplied?: boolean;
  cause?: unknown;
  request?: {
    method: string;
    baseId?: string;
    tableId?: string;
    path?: string;
  };

  constructor({
    message,
    statusCode,
    airtableType,
    retryable,
    request,
    retryAfterMs,
    cause,
  }: {
    message: string;
    statusCode?: number;
    airtableType?: string;
    retryable: boolean;
    retryAfterMs?: number;
    cause?: unknown;
    request?: {
      method: string;
      baseId?: string;
      tableId?: string;
      path?: string;
    };
  }) {
    super(message);
    this.name = 'AirtableApiError';
    this.statusCode = statusCode;
    this.airtableType = airtableType;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
    this.cause = cause;
    this.request = request;
  }
}

function resolveRetryOptions(
  options?: AirtableRetryOptions
): Required<AirtableRetryOptions> {
  const maxRetries =
    typeof options?.maxRetries === 'number' && Number.isFinite(options.maxRetries)
      ? Math.max(0, Math.floor(options.maxRetries))
      : DEFAULT_RETRY_OPTIONS.maxRetries;
  const baseDelayMs =
    typeof options?.baseDelayMs === 'number' && Number.isFinite(options.baseDelayMs)
      ? Math.max(0, options.baseDelayMs)
      : DEFAULT_RETRY_OPTIONS.baseDelayMs;
  const maxDelayMs =
    typeof options?.maxDelayMs === 'number' && Number.isFinite(options.maxDelayMs)
      ? Math.max(0, options.maxDelayMs)
      : DEFAULT_RETRY_OPTIONS.maxDelayMs;

  return {
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    retryOn429: options?.retryOn429 ?? DEFAULT_RETRY_OPTIONS.retryOn429,
    retryOn5xx: options?.retryOn5xx ?? DEFAULT_RETRY_OPTIONS.retryOn5xx,
    retryOnNetworkErrors:
      options?.retryOnNetworkErrors ??
      DEFAULT_RETRY_OPTIONS.retryOnNetworkErrors,
    useJitter: options?.useJitter ?? DEFAULT_RETRY_OPTIONS.useJitter,
    timeoutMs:
      typeof options?.timeoutMs === 'number' &&
      Number.isFinite(options.timeoutMs) &&
      options.timeoutMs > 0
        ? options.timeoutMs
        : DEFAULT_RETRY_OPTIONS.timeoutMs,
  };
}

function shouldRetryError(
  error: AirtableApiError,
  attempt: number,
  retryOptions: Required<AirtableRetryOptions>
): boolean {
  if (!error.retryable) {
    return false;
  }

  if (attempt >= retryOptions.maxRetries) {
    return false;
  }

  // When the server needs a longer wait than the caller allows, a retry would
  // either sleep past the caller's limit or arrive too early to succeed.
  if (requiredWaitMs(error) > retryOptions.maxDelayMs) {
    return false;
  }

  if (error.statusCode === undefined) {
    return retryOptions.retryOnNetworkErrors;
  }

  if (error.statusCode === 429) {
    return retryOptions.retryOn429;
  }

  if (error.statusCode >= 500) {
    return retryOptions.retryOn5xx;
  }

  return false;
}

// Node system error codes for connection failures that a later attempt can
// get past: the connection was refused, reset, or timed out, the network was
// unreachable, or DNS was briefly unavailable.
const RETRYABLE_NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'ENOTFOUND',
]);

/**
 * Checks the Node error that `apiRequest` keeps as `cause`. Matching on its
 * code rather than message text keeps a response body that happens to mention
 * "network" from being mistaken for a connection failure.
 */
function hasRetryableNetworkCode(error: Error): boolean {
  return (
    'code' in error &&
    typeof error.code === 'string' &&
    RETRYABLE_NETWORK_ERROR_CODES.has(error.code)
  );
}

// Connection failures that happen before anything is sent, so Airtable can't
// have applied the request.
const PRE_SEND_NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'ENOTFOUND',
]);

/**
 * Whether Airtable may have applied a request that failed this way: a 5xx, or
 * a connection that failed after the request may have been sent. A 429 and
 * other 4xx responses mean Airtable didn't apply it.
 */
function couldHaveBeenApplied(error: AirtableApiError): boolean {
  if (error.statusCode !== undefined) return error.statusCode >= 500;
  const { cause } = error;
  const code =
    cause instanceof Error && 'code' in cause ? String(cause.code) : undefined;
  return code === undefined || !PRE_SEND_NETWORK_ERROR_CODES.has(code);
}

// After a 429, Airtable rejects every request for 30 seconds.
// https://airtable.com/developers/web/api/rate-limits
const RATE_LIMIT_LOCKOUT_MS = 30000;

/** The shortest wait after which the server says a retry can succeed. */
function requiredWaitMs(error: AirtableApiError): number {
  if (error.retryAfterMs !== undefined) return error.retryAfterMs;
  return error.statusCode === 429 ? RATE_LIMIT_LOCKOUT_MS : 0;
}

function getRetryDelayMs(
  error: AirtableApiError,
  attempt: number,
  retryOptions: Required<AirtableRetryOptions>
): number {
  const cappedDelay = Math.min(
    retryOptions.baseDelayMs * 2 ** attempt,
    retryOptions.maxDelayMs
  );
  const backoff = retryOptions.useJitter
    ? Math.round(Math.random() * cappedDelay)
    : cappedDelay;

  return Math.max(backoff, requiredWaitMs(error));
}

function parseRetryAfterMs(value: string | string[] | undefined): number | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return undefined;

  const seconds = Number(rawValue);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const retryAt = Date.parse(rawValue);
  if (Number.isNaN(retryAt)) return undefined;

  return Math.max(retryAt - Date.now(), 0);
}

export function buildQueryString(
  query: Record<string, AirtableQueryValue>
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        params.append(key, String(entry));
      });
      continue;
    }

    params.append(key, String(value));
  }

  return params.toString();
}

/**
 * Encodes one ID for a request path. URL parsing collapses `.` and `..`
 * segments, which would send the request to a different Airtable path with the
 * caller's token, so those are rejected before anything is sent. `name` labels
 * the ID in the error, such as "Table ID".
 */
export function encodePathSegment(value: string, name: string): string {
  if (value === '.' || value === '..') {
    throw new Error(`${name} must not be "." or "..".`);
  }
  return encodeURIComponent(value);
}

export function appendQueryToEndpoint(
  endpoint: string,
  query: Record<string, AirtableQueryValue>
): string {
  const queryString = buildQueryString(query);
  if (!queryString) return endpoint;

  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
}

function buildAirtableApiUrl({
  apiURL,
  path,
}: {
  apiURL?: string;
  path: string;
}): string {
  const url = apiURL || 'https://api.airtable.com/v0';
  return `${url}${path}`;
}

function normalizeApiPath(path: string, apiURL?: string): string {
  const url = apiURL || 'https://api.airtable.com/v0';

  if (url.endsWith('/v0') && (path === '/v0' || path.startsWith('/v0/'))) {
    return path.slice('/v0'.length);
  }

  return path;
}

export async function airtableApiRequest<T>(request: {
  apiKey: string;
  path: string;
  method: RequestMethods;
  query?: Record<string, AirtableQueryValue>;
  body?: unknown;
  apiURL?: string;
  retry?: AirtableRetryOptions;
  /**
   * Whether sending this request twice has the same effect as sending it
   * once. Defaults to true for every method except POST. A request that is not
   * safe to repeat is not resent after a 5xx or a connection that dropped after
   * sending, because Airtable may already have applied it. It is still retried
   * after a 429, which the library treats as a request Airtable did not
   * process, and after a connection that never opened (for example
   * ECONNREFUSED or ENOTFOUND).
   */
  idempotent?: boolean;
  requestContext?: RequestContext;
}): Promise<T> {
  const {
    apiKey,
    path,
    method,
    query,
    body,
    apiURL,
    retry,
    requestContext,
  } = request;

  if (!apiKey) {
    throw new Error(
      'API key is not set. Please provide a valid Airtable API key.'
    );
  }

  if (!path.startsWith('/')) {
    throw new Error('Airtable API paths must start with "/".');
  }

  const resolvedPath = appendQueryToEndpoint(path, query ?? {});
  const context = requestContext ?? {
    method,
    path: resolvedPath,
  };
  // JavaScript callers can pass a lowercase method, which Node still sends as
  // POST, or none, which Node sends as GET.
  const idempotent =
    request.idempotent ?? (method ?? 'GET').toUpperCase() !== 'POST';
  const retryOptions = resolveRetryOptions(retry);
  let earlierAttemptMayHaveApplied = false;

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await apiRequest({
        url: buildAirtableApiUrl({
          apiURL,
          path: resolvedPath,
        }),
        apiKey,
        method,
        body,
        timeoutMs: retryOptions.timeoutMs,
      });

      return parseResponse<T>(response, context);
    } catch (error) {
      if (!(error instanceof AirtableApiError)) throw error;

      // A request that isn't safe to repeat, such as a create, is resent only
      // when Airtable can't have applied the attempt that failed.
      const mayHaveApplied = couldHaveBeenApplied(error);
      if (!idempotent && mayHaveApplied) error.retryable = false;

      if (shouldRetryError(error, attempt, retryOptions)) {
        earlierAttemptMayHaveApplied ||= mayHaveApplied;
        await delay(getRetryDelayMs(error, attempt, retryOptions));
        continue;
      }

      error.attempts = attempt + 1;
      error.earlierAttemptMayHaveApplied = earlierAttemptMayHaveApplied;
      error.request ??= context;
      throw error;
    }
  }
}

export async function airtableRequestRaw<T = unknown>(request: {
  apiKey: string;
  method: RequestMethods;
  path: string;
  query?: Record<string, AirtableQueryValue>;
  body?: unknown;
  apiURL?: string;
  retry?: AirtableRetryOptions;
}): Promise<T> {
  const { apiKey, method, path, query, body, apiURL, retry } = request;

  return airtableApiRequest<T>({
    apiKey,
    method,
    query,
    body,
    apiURL,
    retry,
    path: normalizeApiPath(path, apiURL),
    requestContext: {
      method,
      path: appendQueryToEndpoint(path, query ?? {}),
    },
  });
}

export async function airtableRequest<T>(request: {
  apiKey: string;
  baseId: string;
  tableId: string;
  endpoint: string;
  method: RequestMethods;
  body?: object;
  apiURL?: string;
  retry?: AirtableRetryOptions;
  idempotent?: boolean;
}): Promise<T> {
  const {
    apiKey,
    baseId,
    tableId,
    endpoint,
    method,
    body,
    apiURL,
    retry,
    idempotent,
  } = request;

  if (!baseId) {
    throw new Error(
      'Base ID is not set. Please provide a valid Airtable base ID.'
    );
  }
  if (!tableId) {
    throw new Error(
      'Table ID/Name is not set. Please provide a valid Airtable table ID or name.'
    );
  }

  return airtableApiRequest<T>({
    apiKey,
    method,
    body,
    apiURL,
    path: `/${encodePathSegment(baseId, 'Base ID')}/${encodePathSegment(tableId, 'Table ID')}${endpoint}`,
    retry,
    idempotent,
    requestContext: {
      method,
      baseId,
      tableId,
      path: endpoint,
    },
  });
}

interface AirtableErrorResponse {
  error: {
    type: string;
    message: string;
  };
}

type RequestContext = {
  method: string;
  baseId?: string;
  tableId?: string;
  path?: string;
};

const STATUS_MESSAGES: Partial<Record<number, string>> = {
  401: 'Incorrect API Key.',
  403: 'Not authorized.',
  404: 'Table or record not found.',
  413: 'Request body is too large.',
  422: 'Operation cannot be processed. Do the field names match?',
  429: 'Too many requests to the Airtable server.',
  503: 'Airtable service unavailable.',
};

function isRetryableStatus(statusCode: number | undefined): boolean {
  return statusCode !== undefined && (statusCode === 429 || statusCode >= 500);
}

function messageForStatus(statusCode: number | undefined): string {
  const message =
    statusCode === undefined ? undefined : STATUS_MESSAGES[statusCode];
  if (message) return message;
  if (statusCode !== undefined && statusCode >= 500) {
    return 'Airtable server error.';
  }
  return 'Unexpected error.';
}

function isAirtableError(data: unknown): data is AirtableErrorResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null &&
    'message' in data.error &&
    typeof data.error.message === 'string'
  );
}

/**
 * Reads Airtable's `{ error: { type, message } }` payload from an error
 * response. Gateways and proxies can answer with HTML or an empty body, which
 * yields undefined so the error falls back to a message for its status code.
 */
function readAirtableError(
  body: string
): AirtableErrorResponse['error'] | undefined {
  try {
    const data: unknown = JSON.parse(body);
    return isAirtableError(data) ? data.error : undefined;
  } catch {
    return undefined;
  }
}

const MAX_BODY_IN_MESSAGE = 200;

/** Keeps an unexpected response body short enough to log. */
function truncateForMessage(body: string): string {
  return body.length > MAX_BODY_IN_MESSAGE
    ? `${body.slice(0, MAX_BODY_IN_MESSAGE)}…`
    : body;
}

/**
 * Returns the parsed JSON body of a 2xx response, or undefined for a 204 No
 * Content. Any other status throws an AirtableApiError carrying the status
 * code, whatever the body contains.
 */
function parseResponse<T>(
  response: ApiResponse,
  requestContext: RequestContext
): T {
  const { statusCode, body } = response;

  if (statusCode !== undefined && statusCode >= 200 && statusCode < 300) {
    if (statusCode === 204) return undefined as T;

    try {
      return JSON.parse(body) as T;
    } catch {
      throw new Error(
        `Failed to parse response as JSON: ${truncateForMessage(body)}`
      );
    }
  }

  const airtableError = readAirtableError(body);
  throw new AirtableApiError({
    message: airtableError?.message ?? messageForStatus(statusCode),
    statusCode,
    airtableType: airtableError?.type,
    retryable: isRetryableStatus(statusCode),
    request: requestContext,
    retryAfterMs: parseRetryAfterMs(response.headers?.['retry-after']),
  });
}

type ApiResponse = {
  body: string;
  statusCode?: number;
  headers?: IncomingMessage['headers'];
};

async function apiRequest({
  url,
  method,
  apiKey,
  body,
  timeoutMs,
}: ApiRequest & { timeoutMs: number }): Promise<ApiResponse> {
  return new Promise<ApiResponse>((resolve, reject) => {
    const { protocol, hostname, port, pathname, search } = new URL(url);
    // URL keeps the brackets around an IPv6 literal, but Node expects the bare
    // address.
    const host = hostname.replace(/^\[(.*)\]$/, '$1');
    // A custom apiURL can point at a plain-HTTP proxy or mock server on any
    // port, so both come from the URL rather than defaulting to HTTPS on 443.
    const send = protocol === 'http:' ? httpRequest : httpsRequest;

    const options: RequestOptions = {
      method,
      hostname: host,
      port,
      path: `${pathname}${search}`,
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };

    // Connection failures become AirtableApiErrors, like HTTP failures. The
    // original error stays as `cause` so retries can read its Node code.
    const rejectWithCause = (error: Error) => {
      reject(
        new AirtableApiError({
          message: `airtableApi: ${error.message} (fn_${apiRequest.name})`,
          retryable: hasRetryableNetworkCode(error),
          cause: error,
        })
      );
    };

    const req = send(options, (res: IncomingMessage) => {
      // Decode once at the end: a multi-byte UTF-8 character can be split
      // across chunks, and decoding each chunk separately corrupts it.
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        resolve({
          body: Buffer.concat(chunks).toString('utf8'),
          statusCode: res.statusCode,
          headers: res.headers,
        });
      });

      // A connection that drops after the headers fires neither `end` nor the
      // request's timeout. Node reports it here as an ECONNRESET error, which
      // the retry logic treats as a dropped connection.
      res.on('error', rejectWithCause);
    });

    // Node only reports an idle socket; without destroying the request here,
    // a server that stops answering leaves this promise pending forever. The
    // ETIMEDOUT code is what marks the error as retryable.
    req.on('timeout', () => {
      req.destroy(
        Object.assign(
          new Error(
            `Request timed out after ${options.timeout} ms of inactivity`
          ),
          { code: 'ETIMEDOUT' }
        )
      );
    });

    req.on('error', rejectWithCause);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

