"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceMultipleRecords = exports.replaceRecord = exports.updateRecords = exports.updateRecord = exports.getRecords = exports.getRecord = void 0;
const https_1 = require("https");
const url_1 = require("url");
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
function getRecord({ apiKey, baseId, tableId, recordId, }) {
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
exports.getRecord = getRecord;
function getRecords({ apiKey, baseId, tableId, options, }) {
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
exports.getRecords = getRecords;
function updateRecord({ apiKey, baseId, tableId, recordId, fields, }) {
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
exports.updateRecord = updateRecord;
function updateRecords({ apiKey, baseId, tableId, records, options, }) {
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
exports.updateRecords = updateRecords;
function replaceRecord({ apiKey, baseId, tableId, recordId, fields, }) {
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
exports.replaceRecord = replaceRecord;
function replaceMultipleRecords({ apiKey, baseId, tableId, records, }) {
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
exports.replaceMultipleRecords = replaceMultipleRecords;
function apiRequest({ url, method, apiKey, body, }) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const parsedUrl = new url_1.URL(url);
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
            const req = (0, https_1.request)(options, (res) => {
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