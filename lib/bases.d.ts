import type { AirtableRetryOptions } from './requests.js';
import type { CreateBaseRequestBody, CreateBaseResponse, ListBasesResponse } from './types/bases.js';
import type { AirtableBaseSchema } from './types/metadata.js';
export declare function listBases({ apiKey, offset, retry, }: {
    apiKey: string;
    offset?: string;
    retry?: AirtableRetryOptions;
}): Promise<ListBasesResponse>;
export declare function createBase({ apiKey, body, retry, }: {
    apiKey: string;
    body: CreateBaseRequestBody;
    retry?: AirtableRetryOptions;
}): Promise<CreateBaseResponse>;
export declare function getBaseSchema({ apiKey, baseId, retry, }: {
    apiKey: string;
    baseId: string;
    retry?: AirtableRetryOptions;
}): Promise<AirtableBaseSchema>;
