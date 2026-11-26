import { request } from 'https';
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
};
export class AirtableApiError extends Error {
    statusCode;
    airtableType;
    retryable;
    retryAfterMs;
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
function isRetryableNetworkError(error) {
    if (!(error instanceof Error))
        return false;
    const { cause } = error;
    return (cause instanceof Error &&
        'code' in cause &&
        typeof cause.code === 'string' &&
        RETRYABLE_NETWORK_ERROR_CODES.has(cause.code));
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
    const { apiKey, path, method, query, body, apiURL, retry, idempotent = method !== 'POST', requestContext, } = request;
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
            });
            validateResponse(response, context);
            return response.data;
        }
        catch (error) {
            if (shouldRetryError(error, attempt, retryOptions)) {
                await delay(getRetryDelayMs(error, attempt, retryOptions));
                continue;
            }
            if (error instanceof Error &&
                retryOptions.retryOnNetworkErrors &&
                isRetryableNetworkError(error) &&
                attempt < retryOptions.maxRetries) {
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
function validateResponse(response, requestContext) {
    const statusCode = response.statusCode;
    const retryAfterMs = parseRetryAfterMs(response.headers?.['retry-after']);
    if (statusCode !== undefined &&
        statusCode >= 200 &&
        statusCode < 300)
        return;
    const isAirtableError = (data) => {
        return (data !== null &&
            typeof data === 'object' &&
            'error' in data &&
            typeof data.error === 'object' &&
            data.error !== null &&
            'message' in data.error &&
            typeof data.error.message === 'string');
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
    }
    else if (statusCode === 429) {
        throw new AirtableApiError({
            message: 'Too many requests to the Airtable server.',
            statusCode,
            retryable: true,
            request: requestContext,
            retryAfterMs,
        });
    }
    else if (statusCode === 500)
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
async function apiRequest({ url, method, apiKey, body, }) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const { hostname, pathname, search } = parsedUrl;
        const options = {
            method,
            hostname,
            path: `${pathname}${search}`,
            timeout: 300000,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
        };
        const req = request(options, (res) => {
            // Decode once at the end: a multi-byte UTF-8 character can be split
            // across chunks, and decoding each chunk separately corrupts it.
            const chunks = [];
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });
            res.on('end', () => {
                const data = Buffer.concat(chunks).toString('utf8');
                try {
                    resolve({
                        data: JSON.parse(data),
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                    });
                }
                catch (error) {
                    reject(new Error(`Failed to parse response as JSON: ${data}`));
                }
            });
        });
        // Node only reports an idle socket; without destroying the request here,
        // a server that stops answering leaves this promise pending forever. The
        // ETIMEDOUT code is what marks the error as retryable.
        req.on('timeout', () => {
            req.destroy(Object.assign(new Error(`Request timed out after ${options.timeout} ms of inactivity`), { code: 'ETIMEDOUT' }));
        });
        // The original error stays as `cause` so retries can read its Node code.
        req.on('error', (error) => {
            reject(new Error(`airtableApi: ${error.message} (fn_${apiRequest.name})`, {
                cause: error,
            }));
        });
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}
