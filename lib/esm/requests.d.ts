import { GetRecordsQueryParameters, UpdateRecordsRequestOptions } from './types/records';
type AirtableRecord = {
    id: string;
    createdTime: string;
    fields: {
        [key: string]: unknown;
    };
};
export declare function getRecord({ apiKey, baseId, tableId, recordId, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
}): Promise<AirtableRecord>;
export declare function getRecords({ apiKey, baseId, tableId, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    options: GetRecordsQueryParameters;
}): Promise<AirtableRecord[]>;
export declare function updateRecord({ apiKey, baseId, tableId, recordId, fields, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
    fields: object;
}): Promise<AirtableRecord>;
export declare function updateRecords({ apiKey, baseId, tableId, records, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    records: {
        id: string;
        fields: object;
    }[];
    options?: UpdateRecordsRequestOptions;
}): Promise<AirtableRecord[]>;
export declare function replaceRecord({ apiKey, baseId, tableId, recordId, fields, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
    fields: object;
}): Promise<AirtableRecord>;
export declare function replaceMultipleRecords({ apiKey, baseId, tableId, records, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    records: {
        id: string;
        fields: object;
    }[];
}): Promise<AirtableRecord[]>;
export {};
