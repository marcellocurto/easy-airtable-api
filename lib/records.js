import { airtableRequest } from './requests.js';
import { delay } from './utils.js';
export async function getRecord({ apiKey, baseId, tableId, recordId, options, }) {
    const query = new URLSearchParams();
    if (options?.cellFormat) {
        query.set('cellFormat', options.cellFormat);
    }
    if (options?.returnFieldsByFieldId !== undefined) {
        query.set('returnFieldsByFieldId', String(options.returnFieldsByFieldId));
    }
    const endpoint = query.size ? `/${recordId}?${query.toString()}` : `/${recordId}`;
    return await airtableRequest({
        apiKey,
        baseId,
        tableId,
        endpoint,
        method: 'GET',
    });
}
export async function getRecordsPage({ apiKey, baseId, tableId, options, }) {
    validateGetRecordsOptions(options);
    return await airtableRequest({
        apiKey,
        baseId,
        tableId,
        endpoint: '/listRecords',
        method: 'POST',
        body: options,
    });
}
export async function* iterateRecordsPages({ apiKey, baseId, tableId, options, }) {
    let currentOffset;
    do {
        const requestBody = currentOffset
            ? { ...options, offset: currentOffset }
            : options;
        const response = await getRecordsPage({
            apiKey,
            baseId,
            tableId,
            options: requestBody,
        });
        yield response;
        currentOffset = response.offset;
        if (currentOffset && (options?.maxRecords ?? 100) > 100) {
            const interval = options?.requestInterval || 500;
            await delay(interval);
        }
    } while (currentOffset);
}
export async function getRecords({ apiKey, baseId, tableId, options, }) {
    validateGetRecordsOptions(options);
    let records = [];
    for await (const page of iterateRecordsPages({
        apiKey,
        baseId,
        tableId,
        options,
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
export async function updateRecord({ apiKey, baseId, tableId, recordId, fields, options, }) {
    return await airtableRequest({
        apiKey,
        baseId,
        tableId,
        endpoint: `/${recordId}`,
        method: options?.overwriteFieldsNotSpecified === true ? 'PUT' : 'PATCH',
        body: {
            fields,
            typecast: options?.typecast === true ? true : false,
            returnFieldsByFieldId: options?.returnFieldsByFieldId === true ? true : false,
        },
    });
}
export async function replaceRecord({ apiKey, baseId, tableId, recordId, fields, options, }) {
    return await airtableRequest({
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
    });
}
export async function updateRecords({ apiKey, baseId, tableId, records, options, }) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to update.');
    }
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
        chunks.push(records.slice(i, i + chunkSize));
    }
    let combinedResults = [];
    for (const chunk of chunks) {
        const result = await airtableRequest({
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
        if (records.length > chunkSize &&
            chunks.indexOf(chunk) < chunks.length - 1) {
            const interval = options?.requestInterval || 500;
            await delay(interval);
        }
    }
    return { records: combinedResults };
}
export async function replaceRecords({ apiKey, baseId, tableId, records, options, }) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to update.');
    }
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
        chunks.push(records.slice(i, i + chunkSize));
    }
    let combinedResults = [];
    for (const chunk of chunks) {
        const result = await airtableRequest({
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
        });
        combinedResults = combinedResults.concat(result.records);
        if (records.length > chunkSize &&
            chunks.indexOf(chunk) < chunks.length - 1) {
            const interval = options?.requestInterval || 500;
            await delay(interval);
        }
    }
    return { records: combinedResults };
}
export async function updateRecordsUpsert({ apiKey, baseId, tableId, records, options, }) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to update.');
    }
    if (!Array.isArray(options?.fieldsToMergeOn) ||
        options?.fieldsToMergeOn.length === 0) {
        throw new Error('fieldsToMergeOn must be an array of strings.');
    }
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
        chunks.push(records.slice(i, i + chunkSize));
    }
    let allCreatedRecords = [];
    let allUpdatedRecords = [];
    let allRecords = [];
    for (const chunk of chunks) {
        const result = await airtableRequest({
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
            const interval = options?.requestInterval || 500;
            await delay(interval);
        }
    }
    return {
        createdRecords: allCreatedRecords,
        updatedRecords: allUpdatedRecords,
        records: allRecords,
    };
}
export async function deleteRecord({ apiKey, baseId, tableId, recordId, }) {
    return await airtableRequest({
        apiKey,
        baseId,
        tableId,
        endpoint: `/${recordId}`,
        method: 'DELETE',
    });
}
export async function deleteRecords({ apiKey, baseId, tableId, recordIds, options, }) {
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
        throw new Error('The record ids array is empty or not provided. Please provide a non-empty array of record ids to delete the records.');
    }
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < recordIds.length; i += chunkSize) {
        chunks.push(recordIds.slice(i, i + chunkSize));
    }
    let combinedResults = [];
    for (const chunk of chunks) {
        const query = chunk.map((id) => `records[]=${id}`).join('&');
        const result = await airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: `?${query}`,
            method: 'DELETE',
        });
        combinedResults = combinedResults.concat(result.records);
        if (recordIds.length > chunkSize && chunks.indexOf(chunk) < chunks.length - 1) {
            const interval = options?.requestInterval || 500;
            await delay(interval);
        }
    }
    return { records: combinedResults };
}
export async function createRecord({ apiKey, baseId, tableId, fields, options, }) {
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
    });
}
export async function createRecords({ apiKey, baseId, tableId, records, options, }) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to create.');
    }
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
        chunks.push(records.slice(i, i + chunkSize));
    }
    let combinedResults = [];
    for (const chunk of chunks) {
        const result = await airtableRequest({
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
        if (records.length > chunkSize &&
            chunks.indexOf(chunk) < chunks.length - 1) {
            const interval = options?.requestInterval || 500;
            await delay(interval);
        }
    }
    return { records: combinedResults };
}
