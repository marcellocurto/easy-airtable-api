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
  options,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GetRecordsQueryParameters;
}): Promise<AirtableRecord<Fields>[]> {
  validateGetRecordsOptions(options);
  let records: AirtableRecord<Fields>[] = [];
  let currentOffset: string | undefined;
  do {
    const requestBody = currentOffset
      ? { ...options, offset: currentOffset }
      : options;
    const response = await airtableRequest<{
      records: AirtableRecord<Fields>[];
      offset?: string;
    }>({
      apiKey,
      baseId,
      tableId,
      endpoint: '/listRecords',
      method: 'POST',
      body: requestBody,
    });
    records = records.concat(response.records);
    currentOffset = response.offset;
    if (currentOffset) await delay(options?.requestInterval ?? 500);
  } while (currentOffset);

  return records;
}

function validateGetRecordsOptions(options?: GetRecordsQueryParameters) {
  const validatedOptions: GetRecordsQueryParameters = {};

  if (!options) return validatedOptions;

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
  options,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  records: { id: string; fields: Fields }[];
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
    overwriteFieldsNotSpecified?: boolean;
    requestInterval?: number;
  };
}): Promise<{
  records: AirtableRecord<Fields>[];
}> {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(
      'The records array is empty or not provided. Please provide a non-empty array of records to update.'
    );
  }

  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(records.slice(i, i + chunkSize));
  }

  let combinedResults: AirtableRecord<Fields>[] = [];

  for (const chunk of chunks) {
    const result = await airtableRequest<{
      createdRecords: string[];
      updatedRecords: string[];
      records: AirtableRecord<Fields>[];
    }>({
      apiKey,
      baseId,
      tableId,
      endpoint: '/',
      method: options?.overwriteFieldsNotSpecified === true ? 'PUT' : 'PATCH',
      body: {
        records: chunk,
        typecast: options?.typecast ?? false,
        returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
      },
    });

    combinedResults = combinedResults.concat(result.records);
    await delay(options?.requestInterval ?? 500);
  }

  return { records: combinedResults };
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
  options,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordIds: string[];
  options?: { requestInterval?: number };
}): Promise<DeleteRecordsResponse> {
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    throw new Error(
      'The record ids array is empty or not provided. Please provide a non-empty array of record ids to delete the records.'
    );
  }

  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < recordIds.length; i += chunkSize) {
    chunks.push(recordIds.slice(i, i + chunkSize));
  }

  let combinedResults: DeleteRecordResponse[] = [];

  for (const chunk of chunks) {
    const query = chunk.map((id) => `records[]=${id}`).join('&');
    const result = await airtableRequest<DeleteRecordsResponse>({
      apiKey,
      baseId,
      tableId,
      endpoint: `?${query}`,
      method: 'DELETE',
    });

    combinedResults = combinedResults.concat(result.records);
    await delay(options?.requestInterval ?? 500);
  }

  return { records: combinedResults };
}

export async function createRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  fields,
  options,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  fields: Fields;
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
  };
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint: '',
    method: 'POST',
    body: {
      fields,
      typecast: options?.typecast ?? false,
      returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
    },
  });
}

export async function createRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  records,
  options,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  records: { fields: Fields }[];
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
    requestInterval?: number;
  };
}): Promise<{
  records: AirtableRecord<Fields>[];
}> {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(
      'The records array is empty or not provided. Please provide a non-empty array of records to create.'
    );
  }

  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(records.slice(i, i + chunkSize));
  }

  let combinedResults: AirtableRecord<Fields>[] = [];

  for (const chunk of chunks) {
    const result = await airtableRequest<{
      records: AirtableRecord<Fields>[];
    }>({
      apiKey,
      baseId,
      tableId,
      endpoint: '',
      method: 'POST',
      body: {
        records: chunk,
        typecast: options?.typecast ?? false,
        returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
      },
    });
    combinedResults = combinedResults.concat(result.records);
  }

  return {
    records: combinedResults,
  };
}
