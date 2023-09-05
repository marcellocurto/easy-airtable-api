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

interface ListRecordsRequest {
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

interface AirtableBaseRecord {
  id: string;
  createdTime: string;
  fields: RecordField;
}

interface ListRecordsResponse {
  offset?: string;
  records: AirtableBaseRecord[];
}

interface GetRecordQueryParameters {
  cellFormat?: CellFormat;
  returnFieldsByFieldId?: boolean;
}

interface GetRecordPathParameters {
  baseId: BaseId;
  tableIdOrName: TableIdOrName;
  recordId: string;
}

interface UpdatePathParameters {
  baseId: BaseId;
  tableIdOrName: TableIdOrName;
}

interface PerformUpsert {
  fieldsToMergeOn: string[];
}

interface UpdateRecordsRequestBody {
  performUpsert?: PerformUpsert;
  returnFieldsByFieldId?: boolean;
  typecast?: boolean;
  records: AirtableBaseRecord[];
}

interface UpsertResponse {
  createdRecords: string[];
  updatedRecords: string[];
  records: AirtableBaseRecord[];
}

interface UpdateRecordPathParameters {
  baseId: BaseId;
  tableIdOrName: TableIdOrName;
  recordId: string;
}

interface UpdateRecordRequestBody {
  typecast?: boolean;
  fields: RecordField;
}

interface UpdateRecordResponse {
  id: string;
  createdTime: string;
  fields: RecordField;
}

interface CreateRecordsPathParameters {
  baseId: BaseId;
  tableIdOrName: TableIdOrName;
}

interface CreateRecordsRequestBody {
  fields?: RecordField;
  records?: AirtableBaseRecord[];
  returnFieldsByFieldId?: boolean;
  typecast?: boolean;
}

interface CreateRecordResponse {
  id: string;
  createdTime: string;
  fields: RecordField;
}

interface CreateRecordsResponse {
  records: CreateRecordResponse[];
}

interface DeleteRecordsPathParameters {
  baseId: BaseId;
  tableIdOrName: TableIdOrName;
}

interface DeleteRecordsQueryParameters {
  records: string[];
}

interface DeleteRecordResponse {
  id: string;
  deleted: true;
}

interface DeleteRecordsResponse {
  records: DeleteRecordResponse[];
}

interface DeleteRecordPathParameters {
  baseId: BaseId;
  tableIdOrName: TableIdOrName;
  recordId: string;
}

interface SingleDeleteRecordResponse {
  id: string;
  deleted: true;
}
