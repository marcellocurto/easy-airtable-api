export {
  getRecord,
  getRecordsPage,
  iterateRecordsPages,
  getRecords,
  createRecord,
  createRecords,
  updateRecord,
  replaceRecord,
  updateRecords,
  replaceRecords,
  updateRecordsUpsert,
  deleteRecord,
  deleteRecords,
} from './records.js';

export { listBases, createBase, getBaseSchema } from './bases.js';
export { airtableRequestRaw, AirtableApiError } from './requests.js';
export type { AirtableRetryOptions } from './requests.js';
export type { AirtableRecord } from './types/records.js';
export type {
  CreateBaseFieldConfig,
  CreateBaseRequestBody,
  CreateBaseResponse,
  CreateBaseTableConfig,
  ListBasesResponse,
} from './types/bases.js';
export type {
  AirtableBaseSchema,
  AirtableFieldSchema,
  AirtableTableSchema,
  AirtableViewSchema,
} from './types/metadata.js';
export type {
  Attachment,
  AttachmentWrite,
  Collaborator,
} from './types/fields.js';
