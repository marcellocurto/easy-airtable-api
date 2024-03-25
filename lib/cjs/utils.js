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
exports.delay = exports.getErrorMessage = exports.getArrayInChunks = void 0;
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
const delay = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (ms = 0) {
    return yield new Promise((resolve) => setTimeout(resolve, ms));
});
exports.delay = delay;
