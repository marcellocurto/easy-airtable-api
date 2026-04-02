import {
  AirtableRecord,
  DeleteRecordResponse,
  DeleteRecordsResponse,
  GeneratedRecordFieldsCompatibleGetRecordOptions,
  GeneratedRecordFieldsCompatibleGetRecordsOptions,
  GetRecordQueryParameters,
  GetRecordsQueryParameters,
} from './types/records.js';
import { appendQueryToEndpoint, airtableRequest } from './requests.js';
import type { AirtableRetryOptions } from './requests.js';
import { delay } from './utils.js';

export function getRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  recordId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  options?: GeneratedRecordFieldsCompatibleGetRecordOptions;
  retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>>;
export function getRecord({
  apiKey,
  baseId,
  tableId,
  recordId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  options?: GetRecordQueryParameters;
  retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Record<string, unknown>>>;
export async function getRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  recordId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  options?: GetRecordQueryParameters;
  retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>> {
  const endpoint = appendQueryToEndpoint(`/${recordId}`, {
    cellFormat: options?.cellFormat,
    returnFieldsByFieldId: options?.returnFieldsByFieldId,
  });

  return await airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint,
    method: 'GET',
    retry,
  });
}

export function getRecordsPage<Fields>({
  apiKey,
  baseId,
  tableId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GeneratedRecordFieldsCompatibleGetRecordsOptions;
  retry?: AirtableRetryOptions;
}): Promise<{
  records: AirtableRecord<Fields>[];
  offset?: string;
}>;
export function getRecordsPage({
  apiKey,
  baseId,
  tableId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GetRecordsQueryParameters;
  retry?: AirtableRetryOptions;
}): Promise<{
  records: AirtableRecord<Record<string, unknown>>[];
  offset?: string;
}>;
export async function getRecordsPage<Fields>({
  apiKey,
  baseId,
  tableId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GetRecordsQueryParameters;
  retry?: AirtableRetryOptions;
}): Promise<{
  records: AirtableRecord<Fields>[];
  offset?: string;
}> {
  validateGetRecordsOptions(options);

  return await airtableRequest<{
    records: AirtableRecord<Fields>[];
    offset?: string;
  }>({
    apiKey,
    baseId,
    tableId,
    endpoint: '/listRecords',
    method: 'POST',
    body: options,
    retry,
  });
}

export function iterateRecordsPages<Fields>({
  apiKey,
  baseId,
  tableId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GeneratedRecordFieldsCompatibleGetRecordsOptions;
  retry?: AirtableRetryOptions;
}): AsyncGenerator<{
  records: AirtableRecord<Fields>[];
  offset?: string;
}>;
export function iterateRecordsPages({
  apiKey,
  baseId,
  tableId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GetRecordsQueryParameters;
  retry?: AirtableRetryOptions;
}): AsyncGenerator<{
  records: AirtableRecord<Record<string, unknown>>[];
  offset?: string;
}>;
export async function* iterateRecordsPages<Fields>({
  apiKey,
  baseId,
  tableId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GetRecordsQueryParameters;
  retry?: AirtableRetryOptions;
}): AsyncGenerator<{
  records: AirtableRecord<Fields>[];
  offset?: string;
}> {
  let currentOffset: string | undefined;

  do {
    const requestBody = currentOffset
      ? { ...options, offset: currentOffset }
      : options;
    const response = (await getRecordsPage({
      apiKey,
      baseId,
      tableId,
      options: requestBody,
      retry,
    })) as {
      records: AirtableRecord<Fields>[];
      offset?: string;
    };

    yield response;
    currentOffset = response.offset;

    if (currentOffset && (options?.maxRecords ?? 100) > 100) {
      const interval: number = options?.requestInterval || 500;
      await delay(interval);
    }
  } while (currentOffset);
}

export function getRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GeneratedRecordFieldsCompatibleGetRecordsOptions;
  retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>[]>;
export function getRecords({
  apiKey,
  baseId,
  tableId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GetRecordsQueryParameters;
  retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Record<string, unknown>>[]>;
export async function getRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GetRecordsQueryParameters;
  retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>[]> {
  validateGetRecordsOptions(options);
  let records: AirtableRecord<Fields>[] = [];

  for await (const page of iterateRecordsPages({
    apiKey,
    baseId,
    tableId,
    options,
    retry,
  }) as AsyncGenerator<{
    records: AirtableRecord<Fields>[];
    offset?: string;
  }>) {
    records = records.concat(page.records);
  }

  return records;
}

function validateGetRecordsOptions(options?: GetRecordsQueryParameters) {
  if (!options) return;
  if (options.cellFormat === 'string') {
    if (!options.timeZone || !options.userLocale) {
      throw new Error(
        'The timeZone and userLocale parameters are required when using string as the cellFormat.'
      );
    }
  }
}

export async function updateRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  recordId,
  fields,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  fields: Fields;
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
    overwriteFieldsNotSpecified?: boolean;
  };
  retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: options?.overwriteFieldsNotSpecified === true ? 'PUT' : 'PATCH',
    body: {
      fields,
      typecast: options?.typecast === true ? true : false,
      returnFieldsByFieldId:
        options?.returnFieldsByFieldId === true ? true : false,
    },
    retry,
  });
}

export async function replaceRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  recordId,
  fields,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  fields: Fields;
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
  };
  retry?: AirtableRetryOptions;
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: 'PUT',
    body: {
      fields,
      typecast: options?.typecast ?? false,
      returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
    },
    retry,
  });
}

export async function updateRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  records,
  options,
  retry,
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
  retry?: AirtableRetryOptions;
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
      retry,
    });

    combinedResults = combinedResults.concat(result.records);
    if (
      records.length > chunkSize &&
      chunks.indexOf(chunk) < chunks.length - 1
    ) {
      const interval: number = options?.requestInterval || 500;
      await delay(interval);
    }
  }

  return { records: combinedResults };
}

export async function replaceRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  records,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  records: { id: string; fields: Fields }[];
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
    requestInterval?: number;
  };
  retry?: AirtableRetryOptions;
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
      records: AirtableRecord<Fields>[];
    }>({
      apiKey,
      baseId,
      tableId,
      endpoint: '/',
      method: 'PUT',
      body: {
        records: chunk,
        typecast: options?.typecast ?? false,
        returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
      },
      retry,
    });

    combinedResults = combinedResults.concat(result.records);
    if (
      records.length > chunkSize &&
      chunks.indexOf(chunk) < chunks.length - 1
    ) {
      const interval: number = options?.requestInterval || 500;
      await delay(interval);
    }
  }

  return { records: combinedResults };
}

export async function updateRecordsUpsert<Fields>({
  apiKey,
  baseId,
  tableId,
  records,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  records: { id?: string; fields: Fields }[];
  options?: {
    fieldsToMergeOn: string[];
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
    overwriteFieldsNotSpecified?: boolean;
    requestInterval?: number;
  };
  retry?: AirtableRetryOptions;
}): Promise<{
  createdRecords: string[];
  updatedRecords: string[];
  records: AirtableRecord<Fields>[];
}> {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(
      'The records array is empty or not provided. Please provide a non-empty array of records to update.'
    );
  }

  if (
    !Array.isArray(options?.fieldsToMergeOn) ||
    options?.fieldsToMergeOn.length === 0
  ) {
    throw new Error('fieldsToMergeOn must be an array of strings.');
  }

  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(records.slice(i, i + chunkSize));
  }

  let allCreatedRecords: string[] = [];
  let allUpdatedRecords: string[] = [];
  let allRecords: AirtableRecord<Fields>[] = [];

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
        performUpsert: { fieldsToMergeOn: options.fieldsToMergeOn },
      },
      retry,
    });

    allCreatedRecords = allCreatedRecords.concat(result.createdRecords);
    allUpdatedRecords = allUpdatedRecords.concat(result.updatedRecords);
    allRecords = allRecords.concat(result.records);
    if (records.length > chunkSize && chunks.indexOf(chunk) < chunks.length - 1) {
      const interval: number = options?.requestInterval || 500;
      await delay(interval);
    }
  }

  return {
    createdRecords: allCreatedRecords,
    updatedRecords: allUpdatedRecords,
    records: allRecords,
  };
}

export async function deleteRecord({
  apiKey,
  baseId,
  tableId,
  recordId,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  retry?: AirtableRetryOptions;
}): Promise<DeleteRecordResponse> {
  return await airtableRequest<DeleteRecordResponse>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: 'DELETE',
    retry,
  });
}

export async function deleteRecords({
  apiKey,
  baseId,
  tableId,
  recordIds,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordIds: string[];
  options?: { requestInterval?: number };
  retry?: AirtableRetryOptions;
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
    const result = await airtableRequest<DeleteRecordsResponse>({
      apiKey,
      baseId,
      tableId,
      endpoint: appendQueryToEndpoint('', {
        'records[]': chunk,
      }),
      method: 'DELETE',
      retry,
    });

    combinedResults = combinedResults.concat(result.records);
    if (recordIds.length > chunkSize && chunks.indexOf(chunk) < chunks.length - 1) {
      const interval: number = options?.requestInterval || 500;
      await delay(interval);
    }
  }

  return { records: combinedResults };
}

export async function createRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  fields,
  options,
  retry,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  fields: Fields;
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
  };
  retry?: AirtableRetryOptions;
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
    retry,
  });
}

export async function createRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  records,
  options,
  retry,
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
  retry?: AirtableRetryOptions;
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
      retry,
    });
    combinedResults = combinedResults.concat(result.records);
    if (
      records.length > chunkSize &&
      chunks.indexOf(chunk) < chunks.length - 1
    ) {
      const interval: number = options?.requestInterval || 500;
      await delay(interval);
    }
  }

  return { records: combinedResults };
}
