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
exports.delay = exports.getErrorMessage = exports.getArrayInChunks = exports.getAllAirtableRecords = exports.getAirtableRecords = void 0;
const requests_1 = require("./requests");
const getAirtableRecords = ({ recordId, baseId, tableName, options, }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId ? recordId : ''}?cellFormat=json${options ? options : ''}`;
    try {
        return yield (0, requests_1.getRequest)({ url });
    }
    catch (error) {
        console.log(error);
    }
});
exports.getAirtableRecords = getAirtableRecords;
const getAllAirtableRecords = ({ baseId, tableName, options, }) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let records = [];
    const request = yield (0, exports.getAirtableRecords)({ baseId, tableName, options });
    if ((_a = request === null || request === void 0 ? void 0 : request.error) === null || _a === void 0 ? void 0 : _a.message)
        throw new Error((_b = request === null || request === void 0 ? void 0 : request.error) === null || _b === void 0 ? void 0 : _b.message);
    const requestRecords = request.records;
    records = [...records, ...requestRecords];
    let paginationToken = request === null || request === void 0 ? void 0 : request.offset;
    if (paginationToken) {
        do {
            const request = yield (0, exports.getAirtableRecords)({
                baseId,
                tableName,
                options: `${options}&offset=${paginationToken}`,
            });
            const requestRecords = request === null || request === void 0 ? void 0 : request.records;
            records = [...records, ...requestRecords];
            paginationToken = request === null || request === void 0 ? void 0 : request.offset;
        } while (paginationToken);
    }
    return records;
});
exports.getAllAirtableRecords = getAllAirtableRecords;
const getArrayInChunks = (records) => __awaiter(void 0, void 0, void 0, function* () {
    const chunks = [];
    const chunkSize = 10;
    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        chunks.push(chunk);
    }
    return chunks;
});
exports.getArrayInChunks = getArrayInChunks;
const getErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    return String(error);
};
exports.getErrorMessage = getErrorMessage;
const delay = (ms = 0) => __awaiter(void 0, void 0, void 0, function* () {
    return yield new Promise((resolve) => setTimeout(resolve, ms));
});
exports.delay = delay;
