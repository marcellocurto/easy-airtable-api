import type { ListBasesResponse } from './types/bases.js';
import type { AirtableBaseSchema } from './types/metadata.js';
export declare function listBases({ apiKey, offset, }: {
    apiKey: string;
    offset?: string;
}): Promise<ListBasesResponse>;
export declare function getBaseSchema({ apiKey, baseId, }: {
    apiKey: string;
    baseId: string;
}): Promise<AirtableBaseSchema>;
