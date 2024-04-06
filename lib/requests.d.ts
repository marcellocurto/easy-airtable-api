import { AirtableRecord, GetRecordsQueryParameters, UpdateRecordsRequestOptions } from './types/records';
export declare function getRecord<Fields>({ apiKey, baseId, tableId, recordId, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
}): Promise<AirtableRecord<Fields>>;
export declare function getRecords<Fields>({ apiKey, baseId, tableId, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    options?: GetRecordsQueryParameters;
}): Promise<AirtableRecord<Fields>[]>;
export declare function updateRecord<Fields>({ apiKey, baseId, tableId, recordId, fields, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
    fields: object;
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
        overwriteFieldsNotSpecified?: boolean;
    };
}): Promise<AirtableRecord<Fields>>;
export declare function updateRecords<Fields>({ apiKey, baseId, tableId, records, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    records: {
        id: string;
        fields: object;
    }[];
    options?: UpdateRecordsRequestOptions;
}): Promise<AirtableRecord<Fields>[]>;
export declare function replaceRecord<Fields>({ apiKey, baseId, tableId, recordId, fields, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
    fields: object;
}): Promise<AirtableRecord<Fields>>;
export declare function replaceRecords<Fields>({ apiKey, baseId, tableId, records, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    records: {
        id: string;
        fields: object;
    }[];
}): Promise<AirtableRecord<Fields>[]>;
