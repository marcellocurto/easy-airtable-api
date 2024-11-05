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
    if (currentOffset && (options?.maxRecords ?? 100) > 100) {
      const interval: number = options?.requestInterval || 500;
      await delay(interval);
    }
  } while (currentOffset);

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
  if (!options.maxRecords) {
    options.maxRecords = 100;
  }
}

export async function updateRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  recordId,
  fields,
  options,
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
