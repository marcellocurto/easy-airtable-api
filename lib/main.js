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
    request(endpoint, method = 'GET', body) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.apiKey || !this.baseId || !this.tableId) {
                throw new Error('API Key, Base ID, and Table ID must be set before making requests.');
            }
            const headers = {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            };
            const response = yield fetch(`${this.apiURL}/${this.baseId}/${this.tableId}${endpoint}`, {
                method: method,
                headers: headers,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) {
                throw new Error(`Airtable API error: ${response.statusText}`);
            }
            return response.json();
        });
    }
    getRecord(recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`/${recordId}`);
        });
    }
    getRecords() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/');
        });
    }
    updateRecord(recordId, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`/${recordId}`, 'PATCH', { fields });
        });
    }
    updateRecords(records) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/', 'PATCH', { records });
        });
    }
}
exports.default = Airtable;
