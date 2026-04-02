import { RequestMethods } from './types/tables.js';
import type { AirtableBaseSchema } from './types/metadata.js';
export declare class AirtableApiError extends Error {
    statusCode?: number;
    airtableType?: string;
    retryable: boolean;
    retryAfterMs?: number;
    request?: {
        method: string;
        baseId?: string;
        tableId?: string;
        path?: string;
    };
    constructor({ message, statusCode, airtableType, retryable, request, retryAfterMs, }: {
        message: string;
        statusCode?: number;
        airtableType?: string;
        retryable: boolean;
        retryAfterMs?: number;
        request?: {
            method: string;
            baseId?: string;
            tableId?: string;
            path?: string;
        };
    });
}
export declare function airtableRequest<T>(request: {
    apiKey: string;
    baseId: string;
    tableId: string;
    endpoint: string;
    method: RequestMethods;
    body?: object;
    apiURL?: string;
}): Promise<T>;
export declare function getBaseSchema({ apiKey, baseId, }: {
    apiKey: string;
    baseId: string;
}): Promise<AirtableBaseSchema>;
