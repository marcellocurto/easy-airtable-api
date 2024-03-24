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
exports.apiRequest = void 0;
const https_1 = require("https");
const url_1 = require("url");
const apiRequest = ({ url, method, apiKey, body, }) => __awaiter(void 0, void 0, void 0, function* () {
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
            reject(new Error(`airtableApi: ${error.message} (fn_${exports.apiRequest.name})`));
        });
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
});
exports.apiRequest = apiRequest;
