import { AirtableRecord, DeleteRecordResponse, DeleteRecordsResponse, GetRecordQueryParameters, GetRecordsQueryParameters } from './types/records.js';
import type { AirtableRetryOptions } from './requests.js';
export declare function getRecord<Fields>({ apiKey, baseId, tableId, recordId, options, retry, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
    options?: GetRecordQueryParameters;
    retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>>;
export declare function getRecordsPage<Fields>({ apiKey, baseId, tableId, options, retry, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    options?: GetRecordsQueryParameters;
    retry?: AirtableRetryOptions;
}): Promise<{
    records: AirtableRecord<Fields>[];
    offset?: string;
}>;
export declare function iterateRecordsPages<Fields>({ apiKey, baseId, tableId, options, retry, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    options?: GetRecordsQueryParameters;
    retry?: AirtableRetryOptions;
}): AsyncGenerator<{
    records: AirtableRecord<Fields>[];
    offset?: string;
}>;
export declare function getRecords<Fields>({ apiKey, baseId, tableId, options, retry, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    options?: GetRecordsQueryParameters;
    retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>[]>;
export declare function updateRecord<Fields>({ apiKey, baseId, tableId, recordId, fields, options, retry, }: {
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
    retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>>;
export declare function replaceRecord<Fields>({ apiKey, baseId, tableId, recordId, fields, options, retry, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
    fields: Fields;
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
    };
    retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>>;
export declare function updateRecords<Fields>({ apiKey, baseId, tableId, records, options, retry, }: {
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
    retry?: AirtableRetryOptions;
}): Promise<{
    records: AirtableRecord<Fields>[];
}>;
export declare function replaceRecords<Fields>({ apiKey, baseId, tableId, records, options, retry, }: {
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
    retry?: AirtableRetryOptions;
}): Promise<{
    records: AirtableRecord<Fields>[];
}>;
export declare function updateRecordsUpsert<Fields>({ apiKey, baseId, tableId, records, options, retry, }: {
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
    retry?: AirtableRetryOptions;
}): Promise<{
    createdRecords: string[];
    updatedRecords: string[];
    records: AirtableRecord<Fields>[];
}>;
export declare function deleteRecord({ apiKey, baseId, tableId, recordId, retry, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordId: string;
    retry?: AirtableRetryOptions;
}): Promise<DeleteRecordResponse>;
export declare function deleteRecords({ apiKey, baseId, tableId, recordIds, options, retry, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordIds: string[];
    options?: {
        requestInterval?: number;
    };
    retry?: AirtableRetryOptions;
}): Promise<DeleteRecordsResponse>;
export declare function createRecord<Fields>({ apiKey, baseId, tableId, fields, options, retry, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    fields: Fields;
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
    };
    retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>>;
export declare function createRecords<Fields>({ apiKey, baseId, tableId, records, options, retry, }: {
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
    retry?: AirtableRetryOptions;
}): Promise<{
    records: AirtableRecord<Fields>[];
}>;
