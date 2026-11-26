import { AirtableRecord, DeleteRecordResponse, DeleteRecordsResponse, GeneratedRecordFieldsCompatibleGetRecordOptions, GeneratedRecordFieldsCompatibleGetRecordsOptions, GetRecordQueryParameters, GetRecordsQueryParameters } from './types/records.js';
import type { AirtableRetryOptions } from './requests.js';
/**
 * The table a record helper works on and how it reaches it. Each helper passes
 * these on to `airtableRequest` unchanged.
 */
type TableRequestOptions = {
    apiKey: string;
    baseId: string;
    tableId: string;
    /**
     * The API root to send requests to instead of
     * `https://api.airtable.com/v0`, such as a proxy or a mock server.
     */
    apiURL?: string;
    retry?: AirtableRetryOptions;
};
export declare function getRecord<Fields>({ recordId, options, ...table }: TableRequestOptions & {
    recordId: string;
    options?: GeneratedRecordFieldsCompatibleGetRecordOptions;
}): Promise<AirtableRecord<Fields>>;
export declare function getRecord({ recordId, options, ...table }: TableRequestOptions & {
    recordId: string;
    options?: GetRecordQueryParameters;
}): Promise<AirtableRecord<Record<string, unknown>>>;
export declare function getRecordsPage<Fields>({ options, ...table }: TableRequestOptions & {
    options?: GeneratedRecordFieldsCompatibleGetRecordsOptions;
}): Promise<{
    records: AirtableRecord<Fields>[];
    offset?: string;
}>;
export declare function getRecordsPage({ options, ...table }: TableRequestOptions & {
    options?: GetRecordsQueryParameters;
}): Promise<{
    records: AirtableRecord<Record<string, unknown>>[];
    offset?: string;
}>;
export declare function iterateRecordsPages<Fields>({ options, ...table }: TableRequestOptions & {
    options?: GeneratedRecordFieldsCompatibleGetRecordsOptions;
}): AsyncGenerator<{
    records: AirtableRecord<Fields>[];
    offset?: string;
}>;
export declare function iterateRecordsPages({ options, ...table }: TableRequestOptions & {
    options?: GetRecordsQueryParameters;
}): AsyncGenerator<{
    records: AirtableRecord<Record<string, unknown>>[];
    offset?: string;
}>;
export declare function getRecords<Fields>({ options, ...table }: TableRequestOptions & {
    options?: GeneratedRecordFieldsCompatibleGetRecordsOptions;
}): Promise<AirtableRecord<Fields>[]>;
export declare function getRecords({ options, ...table }: TableRequestOptions & {
    options?: GetRecordsQueryParameters;
}): Promise<AirtableRecord<Record<string, unknown>>[]>;
export declare function updateRecord<Fields>({ recordId, fields, options, ...table }: TableRequestOptions & {
    recordId: string;
    fields: Fields;
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
        overwriteFieldsNotSpecified?: boolean;
    };
}): Promise<AirtableRecord<Fields>>;
export declare function replaceRecord<Fields>({ recordId, fields, options, ...table }: TableRequestOptions & {
    recordId: string;
    fields: Fields;
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
    };
}): Promise<AirtableRecord<Fields>>;
export declare function updateRecords<Fields>({ records, options, ...table }: TableRequestOptions & {
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
export declare function replaceRecords<Fields>({ records, options, ...table }: TableRequestOptions & {
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
export declare function updateRecordsUpsert<Fields>({ records, options, ...table }: TableRequestOptions & {
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
export declare function deleteRecord({ recordId, ...table }: TableRequestOptions & {
    recordId: string;
}): Promise<DeleteRecordResponse>;
export declare function deleteRecords({ recordIds, options, ...table }: TableRequestOptions & {
    recordIds: string[];
    options?: {
        requestInterval?: number;
    };
}): Promise<DeleteRecordsResponse>;
export declare function createRecord<Fields>({ fields, options, ...table }: TableRequestOptions & {
    fields: Fields;
    options?: {
        typecast?: boolean;
        returnFieldsByFieldId?: boolean;
    };
}): Promise<AirtableRecord<Fields>>;
export declare function createRecords<Fields>({ records, options, ...table }: TableRequestOptions & {
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
export {};
