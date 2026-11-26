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
};
export declare class AirtableApiError extends Error {
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
     * safe to repeat is retried only after a 429, because Airtable rejects a
     * rate-limited request without applying it. After a 5xx or a dropped
     * connection it may already have been applied, so it is not resent.
     */
    idempotent?: boolean;
    requestContext?: {
        method: string;
        baseId?: string;
        tableId?: string;
        path?: string;
    };
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
