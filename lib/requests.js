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
exports.updateRecordsOnAirtableUpsert = exports.patchAirtableRequest = exports.putRequest = exports.patchRequest = exports.postRequest = exports.getRequest = void 0;
const https_1 = require("https");
const url_1 = require("url");
const records_1 = require("./records");
const apiRequest = ({ method, url, body, apiKey, }) => __awaiter(void 0, void 0, void 0, function* () {
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
                    reject(new Error(`Failed to parse response: ${data}`));
                }
            });
        });
        req.on('error', (error) => {
            reject(new Error(`airtableApi: ${error.code} - ${error.message} (fn_${apiRequest.name})`));
        });
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
});
const getRequest = ({ url }) => __awaiter(void 0, void 0, void 0, function* () {
    return yield apiRequest({ url, method: 'GET' });
});
exports.getRequest = getRequest;
const postRequest = ({ url, body }) => __awaiter(void 0, void 0, void 0, function* () {
    return yield apiRequest({ url, body, method: 'POST' });
});
exports.postRequest = postRequest;
const patchRequest = ({ url, body }) => __awaiter(void 0, void 0, void 0, function* () {
    return yield apiRequest({ url, body, method: 'PATCH' });
});
exports.patchRequest = patchRequest;
const putRequest = ({ url, body }) => __awaiter(void 0, void 0, void 0, function* () {
    return yield apiRequest({ url, body, method: 'PUT' });
});
exports.putRequest = putRequest;
const patchAirtableRequest = ({ baseId, tableId, body, atId, }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = atId
        ? `https://api.airtable.com/v0/${baseId}/${tableId}/${atId}`
        : `https://api.airtable.com/v0/${baseId}/${tableId}`;
    return yield (0, exports.patchRequest)({ url, body });
});
exports.patchAirtableRequest = patchAirtableRequest;
const updateRecordsOnAirtableUpsert = ({ baseId, tableId, records, fieldsToMergeOn, }) => __awaiter(void 0, void 0, void 0, function* () {
    const allUpdatedRecords = [];
    const chunks = yield (0, records_1.getArrayInChunks)(records);
    if (!chunks)
        return null;
    for (const chunk of chunks) {
        const body = {
            performUpsert: { fieldsToMergeOn },
            typecast: true,
            records: chunk,
        };
        const req = (yield updateRecordsOnAirtableRequest({
            baseId,
            tableId,
            body,
        }));
        const updatedRecords = req.records;
        for (const record of updatedRecords) {
            allUpdatedRecords.push(record.id);
        }
        yield (0, records_1.delay)(2000);
    }
    return allUpdatedRecords;
});
exports.updateRecordsOnAirtableUpsert = updateRecordsOnAirtableUpsert;
const updateRecordsOnAirtableRequest = ({ baseId, tableId, body, }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    try {
        return yield (0, exports.patchRequest)({ url, body });
    }
    catch (error) {
        if ((0, records_1.getErrorMessage)(error) === 'fetch failed') {
            try {
                yield (0, records_1.delay)(20000);
                return yield (0, exports.patchRequest)({ url, body });
            }
            catch (error) {
                console.log(`error after fetch failed: ${(0, records_1.getErrorMessage)(error)}`);
            }
        }
        else {
            console.log((0, records_1.getErrorMessage)(error));
        }
    }
});
