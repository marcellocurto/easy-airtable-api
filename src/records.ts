import {
  AirtableRecord,
  DeleteRecordResponse,
  DeleteRecordsResponse,
  GeneratedRecordFieldsCompatibleGetRecordOptions,
  GeneratedRecordFieldsCompatibleGetRecordsOptions,
  GetRecordQueryParameters,
  GetRecordsQueryParameters,
} from './types/records.js';
import { DEFAULT_REQUEST_INTERVAL_MS, sendInChunks } from './batches.js';
import {
  AirtableApiError,
  appendQueryToEndpoint,
  airtableRequest,
  encodePathSegment,
} from './requests.js';
import type { AirtableRetryOptions } from './requests.js';
import { delay } from './utils.js';

/**
 * The table a record helper works on and how it reaches it. Each helper passes
 * these on to `airtableRequest` unchanged.
 */
type TableRequestOptions = {
  apiKey: string;
  baseId: string;
  tableId: string;
  /**
   * The API root to send requests to instead of
   * `https://api.airtable.com/v0`, such as a proxy or a mock server.
   */
  apiURL?: string;
  retry?: AirtableRetryOptions;
};

/**
 * Copies only the table settings from a helper's arguments. Spreading the
 * caller's object instead would also pass on keys `airtableRequest` reads, such
 * as `body` or `idempotent`, and change the request.
 */
function tableRequest({
  apiKey,
  baseId,
  tableId,
  apiURL,
  retry,
}: TableRequestOptions): TableRequestOptions {
  return { apiKey, baseId, tableId, apiURL, retry };
}

/**
 * The path segment for one record. An empty ID would turn the path into the
 * table's list endpoint, so it is rejected before anything is sent;
 * `encodePathSegment` rejects `.` and `..` and encodes every other character,
 * so it stays part of the ID.
 */
function recordPath(recordId: string): string {
  if (!recordId) {
    throw new Error(
      'Record ID is not set. Please provide a valid Airtable record ID.'
    );
  }
  return `/${encodePathSegment(recordId, 'Record ID')}`;
}

export function getRecord<Fields>({
  recordId,
  options,
  ...table
}: TableRequestOptions & {
  recordId: string;
  options?: GeneratedRecordFieldsCompatibleGetRecordOptions;
}): Promise<AirtableRecord<Fields>>;
export function getRecord({
  recordId,
  options,
  ...table
}: TableRequestOptions & {
  recordId: string;
  options?: GetRecordQueryParameters;
}): Promise<AirtableRecord<Record<string, unknown>>>;
export async function getRecord<Fields>({
  recordId,
  options,
  ...table
}: TableRequestOptions & {
  recordId: string;
  options?: GetRecordQueryParameters;
}): Promise<AirtableRecord<Fields>> {
  const endpoint = appendQueryToEndpoint(recordPath(recordId), {
    cellFormat: options?.cellFormat,
    returnFieldsByFieldId: options?.returnFieldsByFieldId,
  });

  return await airtableRequest<AirtableRecord<Fields>>({
    ...tableRequest(table),
    endpoint,
    method: 'GET',
  });
}

export function getRecordsPage<Fields>({
  options,
  ...table
}: TableRequestOptions & {
  options?: GeneratedRecordFieldsCompatibleGetRecordsOptions;
}): Promise<{
  records: AirtableRecord<Fields>[];
  offset?: string;
}>;
export function getRecordsPage({
  options,
  ...table
}: TableRequestOptions & {
  options?: GetRecordsQueryParameters;
}): Promise<{
  records: AirtableRecord<Record<string, unknown>>[];
  offset?: string;
}>;
export async function getRecordsPage<Fields>({
  options,
  ...table
}: TableRequestOptions & {
  options?: GetRecordsQueryParameters;
}): Promise<{
  records: AirtableRecord<Fields>[];
  offset?: string;
}> {
  validateGetRecordsOptions(options);

  return await airtableRequest<{
    records: AirtableRecord<Fields>[];
    offset?: string;
  }>({
    ...tableRequest(table),
    endpoint: '/listRecords',
    method: 'POST',
    body: options && toListRecordsBody(options),
    // listRecords only reads, so it is safe to resend despite using POST.
    idempotent: true,
  });
}

/**
 * `requestInterval` only paces this library's page requests, so it is removed
 * before the options are sent to Airtable as list-records parameters.
 */
function toListRecordsBody(options: GetRecordsQueryParameters) {
  const body = { ...options };
  delete body.requestInterval;
  return body;
}

export function iterateRecordsPages<Fields>({
  options,
  ...table
}: TableRequestOptions & {
  options?: GeneratedRecordFieldsCompatibleGetRecordsOptions;
}): AsyncGenerator<{
  records: AirtableRecord<Fields>[];
  offset?: string;
}>;
export function iterateRecordsPages({
  options,
  ...table
}: TableRequestOptions & {
  options?: GetRecordsQueryParameters;
}): AsyncGenerator<{
  records: AirtableRecord<Record<string, unknown>>[];
  offset?: string;
}>;
export async function* iterateRecordsPages<Fields>({
  options,
  ...table
}: TableRequestOptions & {
  options?: GetRecordsQueryParameters;
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
      ...tableRequest(table),
      options: requestBody,
    })) as {
      records: AirtableRecord<Fields>[];
      offset?: string;
    };

    yield response;
    currentOffset = response.offset;

    if (currentOffset) {
      await delay(options?.requestInterval ?? DEFAULT_REQUEST_INTERVAL_MS);
    }
  } while (currentOffset);
}

export function getRecords<Fields>({
  options,
  ...table
}: TableRequestOptions & {
  options?: GeneratedRecordFieldsCompatibleGetRecordsOptions;
}): Promise<AirtableRecord<Fields>[]>;
export function getRecords({
  options,
  ...table
}: TableRequestOptions & {
  options?: GetRecordsQueryParameters;
}): Promise<AirtableRecord<Record<string, unknown>>[]>;
export async function getRecords<Fields>({
  options,
  ...table
}: TableRequestOptions & {
  options?: GetRecordsQueryParameters;
}): Promise<AirtableRecord<Fields>[]> {
  validateGetRecordsOptions(options);
  let records: AirtableRecord<Fields>[] = [];

  for await (const page of iterateRecordsPages({
    ...tableRequest(table),
    options,
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
  recordId,
  fields,
  options,
  ...table
}: TableRequestOptions & {
  recordId: string;
  fields: Fields;
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
    overwriteFieldsNotSpecified?: boolean;
  };
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    ...tableRequest(table),
    endpoint: recordPath(recordId),
    method: options?.overwriteFieldsNotSpecified === true ? 'PUT' : 'PATCH',
    body: {
      fields,
      typecast: options?.typecast === true ? true : false,
      returnFieldsByFieldId:
        options?.returnFieldsByFieldId === true ? true : false,
    },
  });
}

export async function replaceRecord<Fields>({
  recordId,
  fields,
  options,
  ...table
}: TableRequestOptions & {
  recordId: string;
  fields: Fields;
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
  };
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    ...tableRequest(table),
    endpoint: recordPath(recordId),
    method: 'PUT',
    body: {
      fields,
      typecast: options?.typecast ?? false,
      returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
    },
  });
}

export async function updateRecords<Fields>({
  records,
  options,
  ...table
}: TableRequestOptions & {
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

  return sendInChunks({
    items: records,
    requestInterval: options?.requestInterval,
    send: (chunk) =>
      airtableRequest<{ records: AirtableRecord<Fields>[] }>({
        ...tableRequest(table),
        endpoint: '/',
        method: options?.overwriteFieldsNotSpecified === true ? 'PUT' : 'PATCH',
        body: {
          records: chunk,
          typecast: options?.typecast ?? false,
          returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
        },
      }),
    combine: combineRecords,
  });
}

export async function replaceRecords<Fields>({
  records,
  options,
  ...table
}: TableRequestOptions & {
  records: { id: string; fields: Fields }[];
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
      'The records array is empty or not provided. Please provide a non-empty array of records to update.'
    );
  }

  return sendInChunks({
    items: records,
    requestInterval: options?.requestInterval,
    send: (chunk) =>
      airtableRequest<{ records: AirtableRecord<Fields>[] }>({
        ...tableRequest(table),
        endpoint: '/',
        method: 'PUT',
        body: {
          records: chunk,
          typecast: options?.typecast ?? false,
          returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
        },
      }),
    combine: combineRecords,
  });
}

export async function updateRecordsUpsert<Fields>({
  records,
  options,
  ...table
}: TableRequestOptions & {
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

  const { fieldsToMergeOn } = options;

  return sendInChunks({
    items: records,
    requestInterval: options.requestInterval,
    send: (chunk) =>
      airtableRequest<{
        createdRecords: string[];
        updatedRecords: string[];
        records: AirtableRecord<Fields>[];
      }>({
        ...tableRequest(table),
        endpoint: '/',
        method: options.overwriteFieldsNotSpecified === true ? 'PUT' : 'PATCH',
        body: {
          records: chunk,
          typecast: options.typecast ?? false,
          returnFieldsByFieldId: options.returnFieldsByFieldId ?? false,
          performUpsert: { fieldsToMergeOn },
        },
      }),
    combine: (results) => ({
      createdRecords: results.flatMap((result) => result.createdRecords),
      updatedRecords: results.flatMap((result) => result.updatedRecords),
      records: results.flatMap((result) => result.records),
    }),
  });
}

export async function deleteRecord({
  recordId,
  ...table
}: TableRequestOptions & {
  recordId: string;
}): Promise<DeleteRecordResponse> {
  try {
    return await airtableRequest<DeleteRecordResponse>({
      ...tableRequest(table),
      endpoint: recordPath(recordId),
      method: 'DELETE',
    });
  } catch (error) {
    if (isGoneAfterRetry(error)) return { id: recordId, deleted: true };
    throw error;
  }
}

/**
 * A delete is retried when an earlier attempt failed in a way that may have
 * applied it, such as a dropped connection. If the retry then finds the record
 * gone with a 404, that earlier attempt deleted it.
 */
function isGoneAfterRetry(error: unknown): boolean {
  return (
    error instanceof AirtableApiError &&
    error.statusCode === 404 &&
    error.earlierAttemptMayHaveApplied === true
  );
}

export async function deleteRecords({
  recordIds,
  options,
  ...table
}: TableRequestOptions & {
  recordIds: string[];
  options?: { requestInterval?: number };
}): Promise<DeleteRecordsResponse> {
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    throw new Error(
      'The record ids array is empty or not provided. Please provide a non-empty array of record ids to delete the records.'
    );
  }

  return sendInChunks({
    items: recordIds,
    requestInterval: options?.requestInterval,
    send: (chunk) =>
      airtableRequest<DeleteRecordsResponse>({
        ...tableRequest(table),
        endpoint: appendQueryToEndpoint('', {
          'records[]': chunk,
        }),
        method: 'DELETE',
      }),
    combine: combineRecords,
  });
}

export async function createRecord<Fields>({
  fields,
  options,
  ...table
}: TableRequestOptions & {
  fields: Fields;
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
  };
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    ...tableRequest(table),
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
  records,
  options,
  ...table
}: TableRequestOptions & {
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

  return sendInChunks({
    items: records,
    requestInterval: options?.requestInterval,
    send: (chunk) =>
      airtableRequest<{ records: AirtableRecord<Fields>[] }>({
        ...tableRequest(table),
        endpoint: '',
        method: 'POST',
        body: {
          records: chunk,
          typecast: options?.typecast ?? false,
          returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
        },
      }),
    combine: combineRecords,
  });
}

/** Joins the `records` of each chunk's response, in request order. */
function combineRecords<Row>(results: { records: Row[] }[]): {
  records: Row[];
} {
  return { records: results.flatMap((result) => result.records) };
}
