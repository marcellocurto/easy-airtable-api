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

export type { AirtableRecord } from './types/records.js';
export type {
  Attachment,
  AttachmentWrite,
  Collaborator,
} from './types/fields.js';
