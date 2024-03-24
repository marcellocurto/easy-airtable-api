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
const apiURL = 'https://api.airtable.com/v0';
function airtableRequest({ apiKey, baseId, tableId, endpoint, method, body, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!apiKey) {
            throw new Error('API key is not set. Please provide a valid Airtable API key.');
        }
        if (!baseId) {
            throw new Error('Base ID is not set. Please provide a valid Airtable base ID.');
        }
        if (!tableId) {
            throw new Error('Table ID/Name is not set. Please provide a valid Airtable table ID or name.');
        }
        return yield apiRequest({
            url: `${apiURL}/${baseId}/${tableId}${endpoint}`,
            apiKey,
            method,
            body,
        });
    });
}
export function getRecord({ apiKey, baseId, tableId, recordId, }) {
    return __awaiter(this, void 0, void 0, function* () {
        return airtableRequest({
            apiKey,
            baseId,
            tableId,
            endpoint: `/${recordId}`,
            method: 'GET',
        });
    });
}
export function getRecords({ apiKey, baseId, tableId, options, }) {
    return __awaiter(this, void 0, void 0, function* () {
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
export function updateRecord({ apiKey, baseId, tableId, recordId, fields, }) {
    return __awaiter(this, void 0, void 0, function* () {
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
export function updateRecords({ apiKey, baseId, tableId, records, options, }) {
    return __awaiter(this, void 0, void 0, function* () {
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
export function replaceRecord({ apiKey, baseId, tableId, recordId, fields, }) {
    return __awaiter(this, void 0, void 0, function* () {
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
export function replaceMultipleRecords({ apiKey, baseId, tableId, records, }) {
    return __awaiter(this, void 0, void 0, function* () {
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
function apiRequest({ url, method, apiKey, body, }) {
    return __awaiter(this, void 0, void 0, function* () {
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
                        resolve(JSON.parse(data));
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
