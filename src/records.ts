import {
  AirtableRecord,
  DeleteRecordResponse,
  DeleteRecordsResponse,
  GetRecordsQueryParameters,
} from './types/records';
import { airtableRequest } from './requests';
import { delay } from './utils.js';

export async function getRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  recordId,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: 'GET',
  });
}

export async function getRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  ...options
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
} & GetRecordsQueryParameters): Promise<AirtableRecord<Fields>[]> {
  const validatedOptions = validateGetRecordsOptions(options);
  return await airtableRequest<AirtableRecord<Fields>[]>({
    apiKey,
    baseId,
    tableId,
    endpoint: '',
    method: 'GET',
    body: validatedOptions,
  });
}

export function validateGetRecordsOptions(options: GetRecordsQueryParameters) {
  const validatedOptions: GetRecordsQueryParameters = {};

  if (options.fields) {
    validatedOptions.fields = options.fields;
  }

  if (options.filterByFormula) {
    validatedOptions.filterByFormula = options.filterByFormula;
  }

  if (options.maxRecords) {
    validatedOptions.maxRecords = options.maxRecords;
  }

  if (options.pageSize) {
    validatedOptions.pageSize = options.pageSize;
  }

  if (options.sort) {
    validatedOptions.sort = options.sort;
  }

  if (options.view) {
    validatedOptions.view = options.view;
  }

  if (options.cellFormat) {
    validatedOptions.cellFormat = options.cellFormat;
  }

  if (options.timeZone) {
    validatedOptions.timeZone = options.timeZone;
  }

  if (options.userLocale) {
    validatedOptions.userLocale = options.userLocale;
  }

  return validatedOptions;
}

export async function updateRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  recordId,
  fields,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  fields: Partial<Fields>;
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: 'PATCH',
    body: { fields },
  });
}

export async function updateRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  records,
  typecast,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  records: { id: string; fields: Partial<Fields> }[];
  typecast?: boolean;
}): Promise<AirtableRecord<Fields>[]> {
  return await airtableRequest<AirtableRecord<Fields>[]>({
    apiKey,
    baseId,
    tableId,
    endpoint: '',
    method: 'PATCH',
    body: { records, typecast },
  });
}

export async function updateRecordsUpsert<Fields>({
  apiKey,
  baseId,
  tableId,
  records,
  typecast,
  performUpsert,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  records: { id: string; fields: Partial<Fields> }[];
  typecast?: boolean;
  performUpsert: { fieldsToMergeOn: (keyof Fields)[] };
}): Promise<AirtableRecord<Fields>[]> {
  return await airtableRequest<AirtableRecord<Fields>[]>({
    apiKey,
    baseId,
    tableId,
    endpoint: '',
    method: 'PATCH',
    body: { records, typecast, performUpsert },
  });
}

export async function deleteRecords({
  apiKey,
  baseId,
  tableId,
  recordIds,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordIds: string[];
}): Promise<DeleteRecordsResponse> {
  if (recordIds.length === 1) {
    const response = await airtableRequest<DeleteRecordResponse>({
      apiKey,
      baseId,
      tableId,
      endpoint: `/${recordIds[0]}`,
      method: 'DELETE',
    });
    return {
      records: [response],
    };
  }

  return await airtableRequest<DeleteRecordsResponse>({
    apiKey,
    baseId,
    tableId,
    endpoint: '',
    method: 'DELETE',
    body: {
      records: recordIds,
    },
  });
}
