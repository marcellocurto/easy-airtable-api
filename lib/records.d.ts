import { AirtableRecord, DeleteRecordResponse, DeleteRecordsResponse, GetRecordQueryParameters, GetRecordsQueryParameters } from './types/records.js';
export declare function getRecord<Fields>({ apiKey, baseId, tableId, recordId, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
    options?: GetRecordQueryParameters;
}): Promise<AirtableRecord<Fields>>;
export declare function getRecordsPage<Fields>({ apiKey, baseId, tableId, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    options?: GetRecordsQueryParameters;
}): Promise<{
    records: AirtableRecord<Fields>[];
    offset?: string;
}>;
export declare function iterateRecordsPages<Fields>({ apiKey, baseId, tableId, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    options?: GetRecordsQueryParameters;
}): AsyncGenerator<{
    records: AirtableRecord<Fields>[];
    offset?: string;
}>;
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
    fields: Fields;
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
        overwriteFieldsNotSpecified?: boolean;
    };
}): Promise<AirtableRecord<Fields>>;
export declare function replaceRecord<Fields>({ apiKey, baseId, tableId, recordId, fields, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
    fields: Fields;
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
    };
}): Promise<AirtableRecord<Fields>>;
export declare function updateRecords<Fields>({ apiKey, baseId, tableId, records, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    records: {
        id: string;
        fields: Fields;
    }[];
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
        overwriteFieldsNotSpecified?: boolean;
        requestInterval?: number;
    };
}): Promise<{
    records: AirtableRecord<Fields>[];
}>;
export declare function replaceRecords<Fields>({ apiKey, baseId, tableId, records, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    records: {
        id: string;
        fields: Fields;
    }[];
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
        requestInterval?: number;
    };
}): Promise<{
    records: AirtableRecord<Fields>[];
}>;
export declare function updateRecordsUpsert<Fields>({ apiKey, baseId, tableId, records, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    records: {
        id?: string;
        fields: Fields;
    }[];
    options?: {
        fieldsToMergeOn: string[];
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
        overwriteFieldsNotSpecified?: boolean;
        requestInterval?: number;
    };
}): Promise<{
    createdRecords: string[];
    updatedRecords: string[];
    records: AirtableRecord<Fields>[];
}>;
export declare function deleteRecord({ apiKey, baseId, tableId, recordId, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
}): Promise<DeleteRecordResponse>;
export declare function deleteRecords({ apiKey, baseId, tableId, recordIds, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordIds: string[];
    options?: {
        requestInterval?: number;
    };
}): Promise<DeleteRecordsResponse>;
export declare function createRecord<Fields>({ apiKey, baseId, tableId, fields, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    fields: Fields;
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
    };
}): Promise<AirtableRecord<Fields>>;
export declare function createRecords<Fields>({ apiKey, baseId, tableId, records, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    records: {
        fields: Fields;
    }[];
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
        requestInterval?: number;
    };
}): Promise<{
    records: AirtableRecord<Fields>[];
}>;
