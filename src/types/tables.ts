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
  performUpsert: { fieldsToMergeOn: FieldsToMergeOn };
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

export type UpdateRecord = {
  fields: unknown;
};

export type UpdateRecords = UpdateRecord[];

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

type BaseTableDetails = {
  name: string;
  description?: string;
};

type TableConfig = {
  name: string;
  description?: string;
  fields: FieldConfig[];
};

type ViewType =
  | 'grid'
  | 'form'
  | 'calendar'
  | 'gallery'
  | 'kanban'
  | 'timeline'
  | 'block';

type View = {
  id: string;
  name: string;
  type: ViewType;
  visibleFieldIds?: string[];
};

type TableModel = {
  id: string;
  primaryFieldId: string;
  name: string;
  description?: string;
  fields: FieldConfig[];
  views: View[];
};

type UpdateTableRequestBody = {
  name?: string;
  description?: string;
};

type CreateTableRequestBody = {
  name: string;
  description?: string;
  fields: FieldConfig[];
};
