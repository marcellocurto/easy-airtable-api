import { AirtableRecordRequest, BaseId, FieldsToMergeOn, RequestMethod, TableId, UpdateRecords } from './types';
export declare const getRequest: ({ url }: RequestMethod) => Promise<any>;
export declare const postRequest: ({ url, body }: RequestMethod) => Promise<any>;
export declare const patchRequest: ({ url, body }: RequestMethod) => Promise<any>;
export declare const putRequest: ({ url, body }: RequestMethod) => Promise<any>;
export declare const patchAirtableRequest: ({ baseId, tableId, body, atId, }: AirtableRecordRequest) => Promise<any>;
export declare const updateRecordsOnAirtableUpsert: ({ baseId, tableId, records, fieldsToMergeOn, }: {
    baseId: BaseId;
    tableId: TableId;
    records: UpdateRecords;
    fieldsToMergeOn: FieldsToMergeOn;
}) => Promise<string[] | null>;
