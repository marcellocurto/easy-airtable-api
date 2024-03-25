var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { request } from 'https';
import { URL } from 'url';
export function getRecord(_a) {
    return __awaiter(this, arguments, void 0, function* ({ apiKey, baseId, tableId, recordId, }) {
        return airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: `/${recordId}`,
            method: 'GET',
        });
    });
}
export function getRecords(_a) {
    return __awaiter(this, arguments, void 0, function* ({ apiKey, baseId, tableId, options, }) {
        return airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: '/listRecords',
            method: 'POST',
            body: options,
        });
    });
}
export function updateRecord(_a) {
    return __awaiter(this, arguments, void 0, function* ({ apiKey, baseId, tableId, recordId, fields, }) {
        return airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: `/${recordId}`,
            method: 'PATCH',
            body: { fields },
        });
    });
}
export function updateRecords(_a) {
    return __awaiter(this, arguments, void 0, function* ({ apiKey, baseId, tableId, records, options, }) {
        if (!Array.isArray(records) || records.length === 0) {
            throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to update.');
        }
        return airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: '/',
            method: 'PATCH',
            body: Object.assign({ records }, options),
        });
    });
}
export function replaceRecord(_a) {
    return __awaiter(this, arguments, void 0, function* ({ apiKey, baseId, tableId, recordId, fields, }) {
        return airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: `/${recordId}`,
            method: 'PUT',
            body: { fields },
        });
    });
}
export function replaceRecords(_a) {
    return __awaiter(this, arguments, void 0, function* ({ apiKey, baseId, tableId, records, }) {
        if (!Array.isArray(records) || records.length === 0) {
            throw new Error('The records array is empty or not provided. Please provide a non-empty array of records to replace.');
        }
        return airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: '/',
            method: 'PUT',
            body: { records },
        });
    });
}
function airtableRequest(request) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const response = yield apiRequest({
            url: `${url}/${baseId}/${tableId}${endpoint}`,
            apiKey,
            method,
            body,
        });
        validateResponse(response);
        return response.data;
    });
}
function validateResponse(response) {
    const statusCode = response.statusCode;
    console.log(response);
    if (statusCode === 200)
        return;
    if (statusCode === 401)
        throw new Error('Wrong API Key.');
    else if (statusCode === 403)
        throw new Error('NOT_AUTHORIZED');
    else if (statusCode === 404)
        throw new Error('NOT_FOUND');
    else if (statusCode === 413)
        throw new Error('Request body is too large');
    else if (statusCode === 422)
        throw new Error('Operation cannot be processed');
    else if (statusCode === 429)
        throw new Error('TOO_MANY_REQUESTS');
    else if (statusCode === 500)
        throw new Error('SERVER_ERROR');
    else if (statusCode === 503)
        throw new Error('SERVICE_UNAVAILABLE');
    throw new Error('UNEXPECTED_ERROR');
}
function apiRequest(_a) {
    return __awaiter(this, arguments, void 0, function* ({ url, method, apiKey, body, }) {
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
    });
}
