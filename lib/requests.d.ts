import { AirtableRecordRequest, ApiRequest, BaseId, FieldsToMergeOn, TableId, UpdateRecords } from './types';
export declare const apiRequest: ({ method, url, body, apiKey, }: ApiRequest) => Promise<any>;
export declare const patchAirtableRequest: ({ baseId, tableId, body, atId, }: AirtableRecordRequest) => Promise<any>;
export declare const updateRecordsOnAirtableUpsert: ({ baseId, tableId, records, fieldsToMergeOn, }: {
    baseId: BaseId;
    tableId: TableId;
    records: UpdateRecords;
    fieldsToMergeOn: FieldsToMergeOn;
}) => Promise<string[] | null>;
