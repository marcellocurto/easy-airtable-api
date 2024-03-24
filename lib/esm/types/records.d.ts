type BaseId = string;
type TableIdOrName = string;
type Timezone = string;
type SortDirection = 'asc' | 'desc';
type CellFormat = 'json' | 'string';
type RecordMetadataOptions = 'commentCount';
interface SortObject {
    field: string;
    direction?: SortDirection;
}
export interface GetRecordsQueryParameters {
    timeZone?: Timezone;
    userLocale?: string;
    pageSize?: number;
    maxRecords?: number;
    offset?: string;
    view?: string;
    sort?: SortObject[];
    filterByFormula?: string;
    cellFormat?: CellFormat;
    fields?: string[];
    returnFieldsByFieldId?: boolean;
    recordMetadata?: RecordMetadataOptions[];
}
type RecordField = {
    [key: string]: unknown;
};
export interface AirtableBaseRecord {
    id: string;
    createdTime: string;
    fields: RecordField;
}
export interface ListRecordsResponse {
    offset?: string;
    records: AirtableBaseRecord[];
}
export interface GetRecordQueryParameters {
    cellFormat?: CellFormat;
    returnFieldsByFieldId?: boolean;
}
export interface GetRecordPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
    recordId: string;
}
export interface UpdatePathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
}
export interface PerformUpsert {
    fieldsToMergeOn: string[];
}
export interface UpdateRecordsRequestBody {
    performUpsert?: PerformUpsert;
    returnFieldsByFieldId?: boolean;
    typecast?: boolean;
    records: AirtableBaseRecord[];
}
export interface UpsertResponse {
    createdRecords: string[];
    updatedRecords: string[];
    records: AirtableBaseRecord[];
}
export interface UpdateRecordPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
    recordId: string;
}
export interface UpdateRecordRequestBody {
    typecast?: boolean;
    fields: RecordField;
}
export interface UpdateRecordResponse {
    id: string;
    createdTime: string;
    fields: RecordField;
}
export interface CreateRecordsPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
}
export interface CreateRecordsRequestBody {
    fields?: RecordField;
    records?: AirtableBaseRecord[];
    returnFieldsByFieldId?: boolean;
    typecast?: boolean;
}
export type UpdateRecordsRequestOptions = {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
};
export interface CreateRecordResponse {
    id: string;
    createdTime: string;
    fields: RecordField;
}
export interface CreateRecordsResponse {
    records: CreateRecordResponse[];
}
export interface DeleteRecordsPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
}
export interface DeleteRecordsQueryParameters {
    records: string[];
}
export interface DeleteRecordResponse {
    id: string;
    deleted: true;
}
export interface DeleteRecordsResponse {
    records: DeleteRecordResponse[];
}
export interface DeleteRecordPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
    recordId: string;
}
export interface SingleDeleteRecordResponse {
    id: string;
    deleted: true;
}
export {};
