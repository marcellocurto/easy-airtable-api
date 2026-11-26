import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import { delay } from './utils.js';
const DEFAULT_RETRY_OPTIONS = {
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
    statusCode;
    airtableType;
    /**
     * Whether resending this exact request is safe and could succeed. It is
     * false for a request that isn't safe to repeat, such as a create, when
     * Airtable may already have applied it after a 5xx or a dropped connection.
     */
    retryable;
    retryAfterMs;
    /** How many attempts were sent before the request failed for good. */
    attempts;
    cause;
    request;
    constructor({ message, statusCode, airtableType, retryable, request, retryAfterMs, cause, }) {
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
function resolveRetryOptions(options) {
    const maxRetries = typeof options?.maxRetries === 'number' && Number.isFinite(options.maxRetries)
        ? Math.max(0, Math.floor(options.maxRetries))
        : DEFAULT_RETRY_OPTIONS.maxRetries;
    const baseDelayMs = typeof options?.baseDelayMs === 'number' && Number.isFinite(options.baseDelayMs)
        ? Math.max(0, options.baseDelayMs)
        : DEFAULT_RETRY_OPTIONS.baseDelayMs;
    const maxDelayMs = typeof options?.maxDelayMs === 'number' && Number.isFinite(options.maxDelayMs)
        ? Math.max(0, options.maxDelayMs)
        : DEFAULT_RETRY_OPTIONS.maxDelayMs;
    return {
        maxRetries,
        baseDelayMs,
        maxDelayMs,
        retryOn429: options?.retryOn429 ?? DEFAULT_RETRY_OPTIONS.retryOn429,
        retryOn5xx: options?.retryOn5xx ?? DEFAULT_RETRY_OPTIONS.retryOn5xx,
        retryOnNetworkErrors: options?.retryOnNetworkErrors ??
            DEFAULT_RETRY_OPTIONS.retryOnNetworkErrors,
        useJitter: options?.useJitter ?? DEFAULT_RETRY_OPTIONS.useJitter,
        timeoutMs: typeof options?.timeoutMs === 'number' &&
            Number.isFinite(options.timeoutMs) &&
            options.timeoutMs > 0
            ? options.timeoutMs
            : DEFAULT_RETRY_OPTIONS.timeoutMs,
    };
}
function shouldRetryError(error, attempt, retryOptions) {
    if (!(error instanceof AirtableApiError) || !error.retryable) {
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
    if (error.statusCode === 429) {
        return retryOptions.retryOn429;
    }
    if (error.statusCode !== undefined && error.statusCode >= 500) {
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
function hasRetryableNetworkCode(error) {
    return ('code' in error &&
        typeof error.code === 'string' &&
        RETRYABLE_NETWORK_ERROR_CODES.has(error.code));
}
/** A connection failure from `apiRequest` that a later attempt can get past. */
function isRetryableNetworkError(error) {
    return (error instanceof AirtableApiError &&
        error.statusCode === undefined &&
        error.cause instanceof Error &&
        hasRetryableNetworkCode(error.cause));
}
/**
 * Fills in what only the retry loop knows before a request fails for good: its
 * context, how many attempts were sent, and whether resending it is safe. A
 * request that isn't safe to repeat may already have been applied after a 5xx
 * or a dropped connection, so it isn't retryable. A 429 stays retryable,
 * because the library treats a rate-limited request as not processed.
 */
function finalizeError(error, { attempts, idempotent, context, }) {
    if (!(error instanceof AirtableApiError))
        return error;
    error.attempts = attempts;
    error.request ??= context;
    if (!idempotent && error.statusCode !== 429)
        error.retryable = false;
    return error;
}
// After a 429, Airtable rejects every request for 30 seconds.
// https://airtable.com/developers/web/api/rate-limits
const RATE_LIMIT_LOCKOUT_MS = 30000;
/** The shortest wait after which the server says a retry can succeed. */
function requiredWaitMs(error) {
    if (error.retryAfterMs !== undefined)
        return error.retryAfterMs;
    return error.statusCode === 429 ? RATE_LIMIT_LOCKOUT_MS : 0;
}
function getRetryDelayMs(error, attempt, retryOptions) {
    const cappedDelay = Math.min(retryOptions.baseDelayMs * 2 ** attempt, retryOptions.maxDelayMs);
    const backoff = retryOptions.useJitter
        ? Math.round(Math.random() * cappedDelay)
        : cappedDelay;
    return Math.max(backoff, requiredWaitMs(error));
}
function parseRetryAfterMs(value) {
    const rawValue = Array.isArray(value) ? value[0] : value;
    if (!rawValue)
        return undefined;
    const seconds = Number(rawValue);
    if (!Number.isNaN(seconds) && seconds >= 0) {
        return seconds * 1000;
    }
    const retryAt = Date.parse(rawValue);
    if (Number.isNaN(retryAt))
        return undefined;
    return Math.max(retryAt - Date.now(), 0);
}
export function buildQueryString(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined)
            continue;
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
export function appendQueryToEndpoint(endpoint, query) {
    const queryString = buildQueryString(query);
    if (!queryString)
        return endpoint;
    return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
}
function buildAirtableApiUrl({ apiURL, path, }) {
    const url = apiURL || 'https://api.airtable.com/v0';
    return `${url}${path}`;
}
function normalizeApiPath(path, apiURL) {
    const url = apiURL || 'https://api.airtable.com/v0';
    if (url.endsWith('/v0') && (path === '/v0' || path.startsWith('/v0/'))) {
        return path.slice('/v0'.length);
    }
    return path;
}
export async function airtableApiRequest(request) {
    const { apiKey, path, method, query, body, apiURL, retry, requestContext, } = request;
    if (!apiKey) {
        throw new Error('API key is not set. Please provide a valid Airtable API key.');
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
    const idempotent = request.idempotent ?? (method ?? 'GET').toUpperCase() !== 'POST';
    const retryOptions = idempotent
        ? resolveRetryOptions(retry)
        : {
            ...resolveRetryOptions(retry),
            retryOn5xx: false,
            retryOnNetworkErrors: false,
        };
    for (let attempt = 0;; attempt += 1) {
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
            return parseResponse(response, context);
        }
        catch (error) {
            if (shouldRetryError(error, attempt, retryOptions)) {
                await delay(getRetryDelayMs(error, attempt, retryOptions));
                continue;
            }
            if (retryOptions.retryOnNetworkErrors &&
                isRetryableNetworkError(error) &&
                attempt < retryOptions.maxRetries) {
                await delay(getRetryDelayMs(error, attempt, retryOptions));
                continue;
            }
            throw finalizeError(error, {
                attempts: attempt + 1,
                idempotent,
                context,
            });
        }
    }
}
export async function airtableRequestRaw(request) {
    const { apiKey, method, path, query, body, apiURL, retry } = request;
    return airtableApiRequest({
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
export async function airtableRequest(request) {
    const { apiKey, baseId, tableId, endpoint, method, body, apiURL, retry, idempotent, } = request;
    if (!baseId) {
        throw new Error('Base ID is not set. Please provide a valid Airtable base ID.');
    }
    if (!tableId) {
        throw new Error('Table ID/Name is not set. Please provide a valid Airtable table ID or name.');
    }
    return airtableApiRequest({
        apiKey,
        method,
        body,
        apiURL,
        path: `/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}${endpoint}`,
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
const STATUS_MESSAGES = {
    401: 'Incorrect API Key.',
    403: 'Not authorized.',
    404: 'Table or record not found.',
    413: 'Request body is too large.',
    422: 'Operation cannot be processed. Do the field names match?',
    429: 'Too many requests to the Airtable server.',
    503: 'Airtable service unavailable.',
};
function isRetryableStatus(statusCode) {
    return statusCode !== undefined && (statusCode === 429 || statusCode >= 500);
}
function messageForStatus(statusCode) {
    const message = statusCode === undefined ? undefined : STATUS_MESSAGES[statusCode];
    if (message)
        return message;
    if (statusCode !== undefined && statusCode >= 500) {
        return 'Airtable server error.';
    }
    return 'Unexpected error.';
}
function isAirtableError(data) {
    return (data !== null &&
        typeof data === 'object' &&
        'error' in data &&
        typeof data.error === 'object' &&
        data.error !== null &&
        'message' in data.error &&
        typeof data.error.message === 'string');
}
/**
 * Reads Airtable's `{ error: { type, message } }` payload from an error
 * response. Gateways and proxies can answer with HTML or an empty body, which
 * yields undefined so the error falls back to a message for its status code.
 */
function readAirtableError(body) {
    try {
        const data = JSON.parse(body);
        return isAirtableError(data) ? data.error : undefined;
    }
    catch {
        return undefined;
    }
}
const MAX_BODY_IN_MESSAGE = 200;
/** Keeps an unexpected response body short enough to log. */
function truncateForMessage(body) {
    return body.length > MAX_BODY_IN_MESSAGE
        ? `${body.slice(0, MAX_BODY_IN_MESSAGE)}…`
        : body;
}
/**
 * Returns the parsed JSON body of a 2xx response, or undefined for a 204 No
 * Content. Any other status throws an AirtableApiError carrying the status
 * code, whatever the body contains.
 */
function parseResponse(response, requestContext) {
    const { statusCode, body } = response;
    if (statusCode !== undefined && statusCode >= 200 && statusCode < 300) {
        if (statusCode === 204)
            return undefined;
        try {
            return JSON.parse(body);
        }
        catch {
            throw new Error(`Failed to parse response as JSON: ${truncateForMessage(body)}`);
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
async function apiRequest({ url, method, apiKey, body, timeoutMs, }) {
    return new Promise((resolve, reject) => {
        const { protocol, hostname, port, pathname, search } = new URL(url);
        // URL keeps the brackets around an IPv6 literal, but Node expects the bare
        // address.
        const host = hostname.replace(/^\[(.*)\]$/, '$1');
        // A custom apiURL can point at a plain-HTTP proxy or mock server on any
        // port, so both come from the URL rather than defaulting to HTTPS on 443.
        const send = protocol === 'http:' ? httpRequest : httpsRequest;
        const options = {
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
        const rejectWithCause = (error) => {
            reject(new AirtableApiError({
                message: `airtableApi: ${error.message} (fn_${apiRequest.name})`,
                retryable: hasRetryableNetworkCode(error),
                cause: error,
            }));
        };
        const req = send(options, (res) => {
            // Decode once at the end: a multi-byte UTF-8 character can be split
            // across chunks, and decoding each chunk separately corrupts it.
            const chunks = [];
            res.on('data', (chunk) => {
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
            req.destroy(Object.assign(new Error(`Request timed out after ${options.timeout} ms of inactivity`), { code: 'ETIMEDOUT' }));
        });
        req.on('error', rejectWithCause);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}
