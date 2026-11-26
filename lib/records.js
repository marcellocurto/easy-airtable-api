import { DEFAULT_REQUEST_INTERVAL_MS, sendInChunks } from './batches.js';
import { AirtableApiError, appendQueryToEndpoint, airtableRequest, } from './requests.js';
import { delay } from './utils.js';
/**
 * An empty ID would turn `/{recordId}` into the table's list endpoint, so the
 * single-record helpers check it before sending anything.
 */
function requireRecordId(recordId) {
    if (!recordId) {
        throw new Error('Record ID is not set. Please provide a valid Airtable record ID.');
    }
}
export async function getRecord({ apiKey, baseId, tableId, recordId, options, retry, }) {
    requireRecordId(recordId);
    const endpoint = appendQueryToEndpoint(`/${encodeURIComponent(recordId)}`, {
        cellFormat: options?.cellFormat,
        returnFieldsByFieldId: options?.returnFieldsByFieldId,
    });
    return await airtableRequest({
        apiKey,
        baseId,
        tableId,
        endpoint,
        method: 'GET',
        retry,
    });
}
export async function getRecordsPage({ apiKey, baseId, tableId, options, retry, }) {
    validateGetRecordsOptions(options);
    return await airtableRequest({
        apiKey,
        baseId,
        tableId,
        endpoint: '/listRecords',
        method: 'POST',
        body: options && toListRecordsBody(options),
        retry,
        // listRecords only reads, so it is safe to resend despite using POST.
        idempotent: true,
    });
}
/**
 * `requestInterval` only paces this library's page requests, so it is removed
 * before the options are sent to Airtable as list-records parameters.
 */
function toListRecordsBody(options) {
    const body = { ...options };
    delete body.requestInterval;
    return body;
}
export async function* iterateRecordsPages({ apiKey, baseId, tableId, options, retry, }) {
    let currentOffset;
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
        }));
        yield response;
        currentOffset = response.offset;
        if (currentOffset) {
            await delay(options?.requestInterval ?? DEFAULT_REQUEST_INTERVAL_MS);
        }
    } while (currentOffset);
}
export async function getRecords({ apiKey, baseId, tableId, options, retry, }) {
    validateGetRecordsOptions(options);
    let records = [];
    for await (const page of iterateRecordsPages({
        apiKey,
        baseId,
        tableId,
        options,
        retry,
    })) {
        records = records.concat(page.records);
    }
    return records;
}
function validateGetRecordsOptions(options) {
    if (!options)
        return;
    if (options.cellFormat === 'string') {
        if (!options.timeZone || !options.userLocale) {
            throw new Error('The timeZone and userLocale parameters are required when using string as the cellFormat.');
        }
    }
}
export async function updateRecord({ apiKey, baseId, tableId, recordId, fields, options, retry, }) {
    requireRecordId(recordId);
    return await airtableRequest({
        apiKey,
        baseId,
        tableId,
        endpoint: `/${encodeURIComponent(recordId)}`,
        method: options?.overwriteFieldsNotSpecified === true ? 'PUT' : 'PATCH',
        body: {
            fields,
            typecast: options?.typecast === true ? true : false,
            returnFieldsByFieldId: options?.returnFieldsByFieldId === true ? true : false,
        },
        retry,
    });
}
export async function replaceRecord({ apiKey, baseId, tableId, recordId, fields, options, retry, }) {
    requireRecordId(recordId);
    return await airtableRequest({
        apiKey,
        baseId,
        tableId,
        endpoint: `/${encodeURIComponent(recordId)}`,
        method: 'PUT',
        body: {
            fields,
            typecast: options?.typecast ?? false,
            returnFieldsByFieldId: options?.returnFieldsByFieldId ?? false,
        },
        retry,
    });
}
export async function updateRecords({ apiKey, baseId, tableId, records, options, retry, }) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to update.');
    }
    return sendInChunks({
        items: records,
        requestInterval: options?.requestInterval,
        send: (chunk) => airtableRequest({
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
        }),
        combine: combineRecords,
    });
}
export async function replaceRecords({ apiKey, baseId, tableId, records, options, retry, }) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to update.');
    }
    return sendInChunks({
        items: records,
        requestInterval: options?.requestInterval,
        send: (chunk) => airtableRequest({
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
        }),
        combine: combineRecords,
    });
}
export async function updateRecordsUpsert({ apiKey, baseId, tableId, records, options, retry, }) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to update.');
    }
    if (!Array.isArray(options?.fieldsToMergeOn) ||
        options?.fieldsToMergeOn.length === 0) {
        throw new Error('fieldsToMergeOn must be an array of strings.');
    }
    const { fieldsToMergeOn } = options;
    return sendInChunks({
        items: records,
        requestInterval: options.requestInterval,
        send: (chunk) => airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: '/',
            method: options.overwriteFieldsNotSpecified === true ? 'PUT' : 'PATCH',
            body: {
                records: chunk,
                typecast: options.typecast ?? false,
                returnFieldsByFieldId: options.returnFieldsByFieldId ?? false,
                performUpsert: { fieldsToMergeOn },
            },
            retry,
        }),
        combine: (results) => ({
            createdRecords: results.flatMap((result) => result.createdRecords),
            updatedRecords: results.flatMap((result) => result.updatedRecords),
            records: results.flatMap((result) => result.records),
        }),
    });
}
export async function deleteRecord({ apiKey, baseId, tableId, recordId, retry, }) {
    requireRecordId(recordId);
    try {
        return await airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: `/${encodeURIComponent(recordId)}`,
            method: 'DELETE',
            retry,
        });
    }
    catch (error) {
        if (isGoneAfterRetry(error))
            return { id: recordId, deleted: true };
        throw error;
    }
}
/**
 * A delete whose response was lost is retried, and the retry finds the record
 * already gone with a 404. That 404 means the delete worked.
 */
function isGoneAfterRetry(error) {
    return (error instanceof AirtableApiError &&
        error.statusCode === 404 &&
        (error.attempts ?? 1) > 1);
}
export async function deleteRecords({ apiKey, baseId, tableId, recordIds, options, retry, }) {
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
        throw new Error('The record ids array is empty or not provided. Please provide a non-empty array of record ids to delete the records.');
    }
    return sendInChunks({
        items: recordIds,
        requestInterval: options?.requestInterval,
        send: (chunk) => airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: appendQueryToEndpoint('', {
                'records[]': chunk,
            }),
            method: 'DELETE',
            retry,
        }).catch((error) => {
            if (!isGoneAfterRetry(error))
                throw error;
            return {
                records: chunk.map((id) => ({ id, deleted: true })),
            };
        }),
        combine: combineRecords,
    });
}
export async function createRecord({ apiKey, baseId, tableId, fields, options, retry, }) {
    return await airtableRequest({
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
export async function createRecords({ apiKey, baseId, tableId, records, options, retry, }) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to create.');
    }
    return sendInChunks({
        items: records,
        requestInterval: options?.requestInterval,
        send: (chunk) => airtableRequest({
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
        }),
        combine: combineRecords,
    });
}
/** Joins the `records` of each chunk's response, in request order. */
function combineRecords(results) {
    return { records: results.flatMap((result) => result.records) };
}
