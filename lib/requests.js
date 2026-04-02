import { request } from 'https';
import { URL } from 'url';
import { delay } from './utils.js';
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
function shouldRetryError(error, attempt) {
    return (error instanceof AirtableApiError && error.retryable && attempt < 5);
}
function isRetryableNetworkError(error) {
    if (!(error instanceof Error))
        return false;
    const message = error.message.toLowerCase();
    return (message.includes('socket hang up') ||
        message.includes('timed out') ||
        message.includes('econnreset') ||
        message.includes('econnrefused') ||
        message.includes('network'));
}
function getRetryDelayMs(error, attempt) {
    if (error.retryAfterMs !== undefined) {
        return error.retryAfterMs;
    }
    const cappedDelay = Math.min(500 * 2 ** attempt, 8000);
    return Math.round(Math.random() * cappedDelay);
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
    const { apiKey, path, method, query, body, apiURL, requestContext, } = request;
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
            if (shouldRetryError(error, attempt)) {
                await delay(getRetryDelayMs(error, attempt));
                continue;
            }
            if (error instanceof Error && isRetryableNetworkError(error) && attempt < 5) {
                const retryableError = new AirtableApiError({
                    message: error.message,
                    retryable: true,
                    request: context,
                    cause: error,
                });
                await delay(getRetryDelayMs(retryableError, attempt));
                continue;
            }
            throw error;
        }
    }
}
export async function airtableRequestRaw(request) {
    const { apiKey, method, path, query, body, apiURL } = request;
    return airtableApiRequest({
        apiKey,
        method,
        query,
        body,
        apiURL,
        path: normalizeApiPath(path, apiURL),
        requestContext: {
            method,
            path: appendQueryToEndpoint(path, query ?? {}),
        },
    });
}
export async function airtableRequest(request) {
    const { apiKey, baseId, tableId, endpoint, method, body, apiURL } = request;
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
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
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
        req.on('error', (error) => {
            reject(new Error(`airtableApi: ${error.message} (fn_${apiRequest.name})`));
        });
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}
