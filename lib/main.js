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
        this.apiURL = 'https://api.airtable.com/v0';
    }
    auth(key) {
        this.apiKey = key;
        return this;
    }
    base(baseId) {
        this.baseId = baseId;
        return this;
    }
    table(tableId) {
        this.tableId = tableId;
        return this;
    }
    request({ endpoint, method, body, }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.apiKey || !this.baseId || !this.tableId) {
                throw new Error('API Key, Base ID, and Table ID/Name must be set before making requests.');
            }
            return yield (0, requests_1.apiRequest)({
                url: `${this.apiURL}/${this.baseId}/${this.tableId}${endpoint}`,
                apiKey: this.apiKey,
                method: method,
            });
        });
    }
    getRecord(recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({ endpoint: `/${recordId}`, method: 'GET' });
        });
    }
    getRecords() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({ endpoint: '/', method: 'GET' });
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
    updateRecords(records) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({ endpoint: '/', method: 'PATCH', body: { records } });
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
    replaceRecords(records) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({ endpoint: '/', method: 'PUT', body: { records } });
        });
    }
}
exports.default = Airtable;
