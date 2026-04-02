import type { AirtableRetryOptions } from './requests.js';
import type { ListBasesResponse } from './types/bases.js';
import type { AirtableBaseSchema } from './types/metadata.js';
export declare function listBases({ apiKey, offset, retry, }: {
    apiKey: string;
    offset?: string;
    retry?: AirtableRetryOptions;
}): Promise<ListBasesResponse>;
export declare function getBaseSchema({ apiKey, baseId, retry, }: {
    apiKey: string;
    baseId: string;
    retry?: AirtableRetryOptions;
}): Promise<AirtableBaseSchema>;
