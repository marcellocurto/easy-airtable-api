export type SingleLineText = string | null;
export type MultilineText = string | null;
export type RichText = string;
export type SingleSelect = string;
export type MultipleSelects = string[];
export type MultipleLookupValues = string[];
export type Checkbox = boolean;
export type AirtableUrl = string | null;
export type AirtableEmail = string;
export type AirtableInteger = number | null;
export type Count = number;
export type Duration = number;
export type Formula = string | string[] | number;
export type MultipleRecordLinks = string[];
export type MultipleAttachments = Attachment[];
export type FormulaSingleReturn = string | number;
export type Rollup = string | number;
export type AutoNumber = number;
export type AirtableButton = {
    label: string;
    url: string;
};
export type LastModifiedTime = string;
export type CreatedTime = string;
export type DateTime = string;
export type PhoneNumber = string;
export type Currency = number;
export type Percent = number;
export interface Attachment {
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string;
    thumbnails?: {
        small: Thumbnail;
        large: Thumbnail;
        full: Thumbnail;
    };
}
export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}
export type UpserptRecords = {
    records: {
        id: string;
        createdTime: string;
        fields: unknown;
    }[];
    updatedRecords: string[];
    createdRecords: string[];
};
export interface UpdateRecordsBody {
    typecast: boolean;
    records: UpdateRecords;
}
export interface UpdateRecordsBodyUpsert extends UpdateRecordsBody {
    performUpsert: {
        fieldsToMergeOn: FieldsToMergeOn;
    };
}
export type BaseId = string;
export type TableId = string;
export type FieldsToMergeOn = string[];
export type ApiRequest = {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    apiKey: string;
    body?: RequestBody;
};
export interface RequestMethod {
    url: string;
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
export type UpdateRecord = {
    fields: unknown;
};
export type UpdateRecords = UpdateRecord[];
