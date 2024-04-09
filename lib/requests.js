import { request } from 'https';
import { URL } from 'url';
import { delay } from './utils';
export async function getRecord({ apiKey, baseId, tableId, recordId, }) {
    return await airtableRequest({
        apiKey,
        baseId,
        tableId,
        endpoint: `/${recordId}`,
        method: 'GET',
    });
}
export async function getRecords({ apiKey, baseId, tableId, options, }) {
    validateGetRecordsOptions(options);
    let records = [];
    let currentOffset;
    do {
        const requestBody = currentOffset
            ? { ...options, offset: currentOffset }
            : options;
        const response = await airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: '/listRecords',
            method: 'POST',
            body: requestBody,
        });
        records = records.concat(response.records);
        currentOffset = response.offset;
        if (currentOffset)
            await delay(500);
    } while (currentOffset);
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
    if (!options.maxRecords) {
        options.maxRecords = 100;
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
        await delay(500);
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
        await delay(500);
    }
    return {
        createdRecords: allCreatedRecords,
        updatedRecords: allUpdatedRecords,
        records: allRecords,
    };
}
export async function deleteRecords({ apiKey, baseId, tableId, recordIds, }) {
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
        await delay(500);
    }
    return { records: combinedResults };
}
async function airtableRequest(request) {
    const { apiKey, baseId, tableId, endpoint, method, body, apiURL } = request;
    const url = apiURL || 'https://api.airtable.com/v0';
    if (!apiKey) {
        throw new Error('API key is not set. Please provide a valid Airtable API key.');
    }
    if (!baseId) {
        throw new Error('Base ID is not set. Please provide a valid Airtable base ID.');
    }
    if (!tableId) {
        throw new Error('Table ID/Name is not set. Please provide a valid Airtable table ID or name.');
    }
    const response = await apiRequest({
        url: `${url}/${baseId}/${tableId}${endpoint}`,
        apiKey,
        method,
        body,
    });
    validateResponse(response);
    return response.data;
}
function validateResponse(response) {
    const statusCode = response.statusCode;
    if (statusCode === 200)
        return;
    if (statusCode === 401)
        throw new Error('Incorrect API Key.');
    else if (statusCode === 403)
        throw new Error('Not authorized.');
    else if (statusCode === 404)
        throw new Error('Table or record not found.');
    else if (statusCode === 413)
        throw new Error('Request body is too large.');
    else if (statusCode === 422) {
        throw new Error('Operation cannot be processed. Do the field names match?');
    }
    else if (statusCode === 429) {
        throw new Error('Too many requests to the Airtable server.');
    }
    else if (statusCode === 500)
        throw new Error('Airtable server error.');
    else if (statusCode === 503)
        throw new Error('Airtable service unavailable.');
    throw new Error('Unexpected error.');
}
async function apiRequest({ url, method, apiKey, body, }) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const { hostname, pathname, search } = parsedUrl;
        const options = {
            method,
            hostname,
            path: `${pathname}${search}`,
            timeout: 300000,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
        };
        const req = request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        data: JSON.parse(data),
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                    });
                }
                catch (error) {
                    reject(new Error(`Failed to parse response as JSON: ${data}`));
                }
            });
        });
        req.on('error', (error) => {
            reject(new Error(`airtableApi: ${error.message} (fn_${apiRequest.name})`));
        });
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}
