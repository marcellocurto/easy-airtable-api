import { request, RequestOptions } from 'https';
import { IncomingMessage } from 'http';
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
};

const DEFAULT_RETRY_OPTIONS: Required<AirtableRetryOptions> = {
  maxRetries: 5,
  baseDelayMs: 500,
  maxDelayMs: 8000,
  retryOn429: true,
  retryOn5xx: true,
  retryOnNetworkErrors: true,
  useJitter: true,
};

export class AirtableApiError extends Error {
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
  };
}

function shouldRetryError(
  error: unknown,
  attempt: number,
  retryOptions: Required<AirtableRetryOptions>
): error is AirtableApiError {
  if (!(error instanceof AirtableApiError) || !error.retryable) {
    return false;
  }

  if (attempt >= retryOptions.maxRetries) {
    return false;
  }

  if (error.statusCode === 429) {
    return retryOptions.retryOn429;
  }

  if (error.statusCode !== undefined && error.statusCode >= 500) {
    return retryOptions.retryOn5xx;
  }

  return false;
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('socket hang up') ||
    message.includes('timed out') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('network')
  );
}

function getRetryDelayMs(
  error: AirtableApiError,
  attempt: number,
  retryOptions: Required<AirtableRetryOptions>
): number {
  if (error.retryAfterMs !== undefined) {
    return error.retryAfterMs;
  }

  const cappedDelay = Math.min(
    retryOptions.baseDelayMs * 2 ** attempt,
    retryOptions.maxDelayMs
  );

  if (!retryOptions.useJitter) {
    return cappedDelay;
  }

  return Math.round(Math.random() * cappedDelay);
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
  requestContext?: {
    method: string;
    baseId?: string;
    tableId?: string;
    path?: string;
  };
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
  const retryOptions = resolveRetryOptions(retry);

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await apiRequest<T>({
        url: buildAirtableApiUrl({
          apiURL,
          path: resolvedPath,
        }),
        apiKey,
        method,
        body,
      });
      validateResponse(response, context);

      return response.data;
    } catch (error) {
      if (shouldRetryError(error, attempt, retryOptions)) {
        await delay(getRetryDelayMs(error, attempt, retryOptions));
        continue;
      }

      if (
        error instanceof Error &&
        retryOptions.retryOnNetworkErrors &&
        isRetryableNetworkError(error) &&
        attempt < retryOptions.maxRetries
      ) {
        const retryableError = new AirtableApiError({
          message: error.message,
          retryable: true,
          request: context,
          cause: error,
        });
        await delay(getRetryDelayMs(retryableError, attempt, retryOptions));
        continue;
      }

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
}): Promise<T> {
  const { apiKey, baseId, tableId, endpoint, method, body, apiURL, retry } = request;

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
    path: `/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}${endpoint}`,
    retry,
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

function validateResponse<T>(
  response: ApiResponse<T>,
  requestContext: {
    method: string;
    baseId?: string;
    tableId?: string;
    path?: string;
  }
) {
  const statusCode = response.statusCode;
  const retryAfterMs = parseRetryAfterMs(response.headers?.['retry-after']);
  if (
    statusCode !== undefined &&
    statusCode >= 200 &&
    statusCode < 300
  )
    return;

  const isAirtableError = (data: unknown): data is AirtableErrorResponse => {
    return (
      data !== null &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'object' &&
      data.error !== null &&
      'message' in data.error &&
      typeof data.error.message === 'string'
    );
  };

  if (response.data && isAirtableError(response.data)) {
    throw new AirtableApiError({
      message: response.data.error.message,
      statusCode,
      airtableType: response.data.error.type,
      retryable: statusCode === 429 || statusCode === 500 || statusCode === 503,
      request: requestContext,
      retryAfterMs,
    });
  }

  if (statusCode === 401)
    throw new AirtableApiError({
      message: 'Incorrect API Key.',
      statusCode,
      retryable: false,
      request: requestContext,
      retryAfterMs,
    });
  else if (statusCode === 403)
    throw new AirtableApiError({
      message: 'Not authorized.',
      statusCode,
      retryable: false,
      request: requestContext,
      retryAfterMs,
    });
  else if (statusCode === 404)
    throw new AirtableApiError({
      message: 'Table or record not found.',
      statusCode,
      retryable: false,
      request: requestContext,
      retryAfterMs,
    });
  else if (statusCode === 413)
    throw new AirtableApiError({
      message: 'Request body is too large.',
      statusCode,
      retryable: false,
      request: requestContext,
      retryAfterMs,
    });
  else if (statusCode === 422) {
    throw new AirtableApiError({
      message: 'Operation cannot be processed. Do the field names match?',
      statusCode,
      retryable: false,
      request: requestContext,
      retryAfterMs,
    });
  } else if (statusCode === 429) {
    throw new AirtableApiError({
      message: 'Too many requests to the Airtable server.',
      statusCode,
      retryable: true,
      request: requestContext,
      retryAfterMs,
    });
  } else if (statusCode === 500)
    throw new AirtableApiError({
      message: 'Airtable server error.',
      statusCode,
      retryable: true,
      request: requestContext,
      retryAfterMs,
    });
  else if (statusCode === 503)
    throw new AirtableApiError({
      message: 'Airtable service unavailable.',
      statusCode,
      retryable: true,
      request: requestContext,
      retryAfterMs,
    });
  throw new AirtableApiError({
    message: 'Unexpected error.',
    statusCode,
    retryable: false,
    request: requestContext,
    retryAfterMs,
  });
}

type ApiResponse<T> = {
  data: T;
  statusCode?: number;
  statusMessage?: string;
  headers?: IncomingMessage['headers'];
};

async function apiRequest<T>({
  url,
  method,
  apiKey,
  body,
}: ApiRequest): Promise<ApiResponse<T>> {
  return new Promise<ApiResponse<T>>((resolve, reject) => {
    const parsedUrl = new URL(url);
    const { hostname, pathname, search } = parsedUrl;

    const options: RequestOptions = {
      method,
      hostname,
      path: `${pathname}${search}`,
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const req = request(options, (res: IncomingMessage) => {
      let data = '';

      res.on('data', (chunk: Buffer) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            data: JSON.parse(data) as T,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response as JSON: ${data}`));
        }
      });
    });

    req.on('error', (error: Error) => {
      reject(
        new Error(`airtableApi: ${error.message} (fn_${apiRequest.name})`)
      );
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

