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
const requests_1 = require("./requests");
class Airtable {
    constructor() {
        this.apiKey = undefined;
        this.baseId = undefined;
        this.tableId = undefined;
        this.apiURL = 'https://api.airtable.com/v0';
    }
    url(url) {
        if (typeof url === 'string') {
            this.apiURL = url;
        }
        else {
            throw new Error('API URL must be a string');
        }
        return this;
    }
    auth(key) {
        if (typeof key === 'string') {
            this.apiKey = key;
        }
        else {
            throw new Error('API Key must be a string');
        }
        return this;
    }
    base(baseId) {
        if (typeof baseId === 'string') {
            this.baseId = baseId;
        }
        else {
            throw new Error('baseId must be a string');
        }
        return this;
    }
    table(tableId) {
        if (typeof tableId === 'string') {
            this.tableId = tableId;
        }
        else {
            throw new Error('tableId/tableName must be a string');
        }
        return this;
    }
    request({ endpoint, method, body, }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.apiKey) {
                throw new Error('API Key must be set before making requests.');
            }
            if (!this.baseId) {
                throw new Error('Base ID must be set before making requests.');
            }
            if (!this.tableId) {
                throw new Error('Table ID/Name must be set before making requests.');
            }
            return yield (0, requests_1.apiRequest)({
                url: `${this.apiURL}/${this.baseId}/${this.tableId}${endpoint}`,
                apiKey: this.apiKey,
                method: method,
                body,
            });
        });
    }
    getRecord(recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                endpoint: `/${recordId}`,
                method: 'GET',
            });
        });
    }
    getRecords(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                endpoint: '/listRecords',
                method: 'POST',
                body: options,
            });
        });
    }
    updateRecord(recordId, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                endpoint: `/${recordId}`,
                method: 'PATCH',
                body: { fields },
            });
        });
    }
    updateRecords(records, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(records)) {
                throw new Error('records to update must be an array.');
            }
            if (records.length === 0) {
                throw new Error('records to update array must have at least one item.');
            }
            return this.request({
                endpoint: '/',
                method: 'PATCH',
                body: Object.assign({ records }, options),
            });
        });
    }
    replaceRecord(recordId, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                endpoint: `/${recordId}`,
                method: 'PUT',
                body: { fields },
            });
        });
    }
    replaceMultipleRecords(records) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({ endpoint: '/', method: 'PUT', body: { records } });
        });
    }
}
exports.default = Airtable;
