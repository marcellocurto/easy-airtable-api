import { RequestMethods } from './types/tables.js';
export type AirtableQueryValue = string | number | boolean | Array<string | number | boolean> | undefined;
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
    body?: object;
    apiURL?: string;
    requestContext?: {
        method: string;
        baseId?: string;
        tableId?: string;
        path?: string;
    };
}): Promise<T>;
export declare function airtableRequest<T>(request: {
    apiKey: string;
    baseId: string;
    tableId: string;
    endpoint: string;
    method: RequestMethods;
    body?: object;
    apiURL?: string;
}): Promise<T>;
