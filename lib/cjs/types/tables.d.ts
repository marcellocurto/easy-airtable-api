export type UpserptRecords = {
    records: {
        id: string;
        createdTime: string;
        fields: unknown;
    }[];
    updatedRecords: string[];
    createdRecords: string[];
};
export interface UpdateRecordsBody<Fields> {
    typecast: boolean;
    records: UpdateRecords<Fields>;
}
export interface UpdateRecordsBodyUpsert<Fields> extends UpdateRecordsBody<Fields> {
    performUpsert: {
        fieldsToMergeOn: FieldsToMergeOn;
    };
}
export type BaseId = string;
export type TableId = string;
export type FieldsToMergeOn = string[];
export type ApiRequest = {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    apiKey: string;
    body?: RequestBody;
};
export type RequestMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export interface RequestMethodProps {
    url: string;
    apiKey: string;
    body?: RequestBody;
}
export type RequestBody = unknown;
export interface AirtableRecordRequest {
    baseId: string;
    tableId: string;
    atId?: string;
    body: RequestBody;
}
export interface UpdateAirtableRecordRequest {
    atId?: string;
    baseId: string;
    tableId: string;
    body?: RequestBody;
}
export interface RequestBodyWebsiteInfos {
    fields: unknown;
}
export type UpdateRecord<Fields> = {
    fields: Fields;
};
export type UpdateRecords<Fields> = UpdateRecord<Fields>[];
type FieldType = 'singleLineText' | 'checkbox';
type TableFieldOptions = {
    color?: string;
    icon?: string;
};
type FieldConfig = {
    id?: string;
    name: string;
    description?: string;
    type: FieldType;
    options?: TableFieldOptions;
};
export type BaseTableDetails = {
    name: string;
    description?: string;
};
export type TableConfig = {
    name: string;
    description?: string;
    fields: FieldConfig[];
};
type ViewType = 'grid' | 'form' | 'calendar' | 'gallery' | 'kanban' | 'timeline' | 'block';
export type View = {
    id: string;
    name: string;
    type: ViewType;
    visibleFieldIds?: string[];
};
export type TableModel = {
    id: string;
    primaryFieldId: string;
    name: string;
    description?: string;
    fields: FieldConfig[];
    views: View[];
};
export type UpdateTableRequestBody = {
    name?: string;
    description?: string;
};
export type CreateTableRequestBody = {
    name: string;
    description?: string;
    fields: FieldConfig[];
};
export {};
