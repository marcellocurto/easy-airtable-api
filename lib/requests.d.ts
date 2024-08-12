import { AirtableRecord, DeleteRecordsResponse, GetRecordsQueryParameters } from './types/records';
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
    fields: Fields;
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
export declare function deleteRecords({ apiKey, baseId, tableId, recordIds, options, }: {
    apiKey: string;
    baseId: string;
    tableId: string;
    recordIds: string[];
    options?: {
        requestInterval?: number;
    };
}): Promise<DeleteRecordsResponse>;
