import { RequestMethods } from './types/tables.js';
export type AirtableQueryValue = string | number | boolean | Array<string | number | boolean> | undefined;
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
export declare class AirtableApiError extends Error {
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
    constructor({ message, statusCode, airtableType, retryable, request, retryAfterMs, cause, }: {
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
    });
}
export declare function buildQueryString(query: Record<string, AirtableQueryValue>): string;
/**
 * Encodes one ID for a request path. URL parsing collapses `.` and `..`
 * segments, which would send the request to a different Airtable path with the
 * caller's token, so those are rejected before anything is sent. `name` labels
 * the ID in the error, such as "Table ID".
 */
export declare function encodePathSegment(value: string, name: string): string;
export declare function appendQueryToEndpoint(endpoint: string, query: Record<string, AirtableQueryValue>): string;
export declare function airtableApiRequest<T>(request: {
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
}): Promise<T>;
export declare function airtableRequestRaw<T = unknown>(request: {
    apiKey: string;
    method: RequestMethods;
    path: string;
    query?: Record<string, AirtableQueryValue>;
    body?: unknown;
    apiURL?: string;
    retry?: AirtableRetryOptions;
}): Promise<T>;
export declare function airtableRequest<T>(request: {
    apiKey: string;
    baseId: string;
    tableId: string;
    endpoint: string;
    method: RequestMethods;
    body?: object;
    apiURL?: string;
    retry?: AirtableRetryOptions;
    idempotent?: boolean;
}): Promise<T>;
type RequestContext = {
    method: string;
    baseId?: string;
    tableId?: string;
    path?: string;
};
export {};
