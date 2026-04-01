import { RequestMethods } from './types/tables';
import type { AirtableBaseSchema } from './types/metadata.js';
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
