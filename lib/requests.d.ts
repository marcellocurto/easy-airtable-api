import { ApiRequest } from './types/tables';
export declare const apiRequest: <T>({ url, method, apiKey, body, }: ApiRequest) => Promise<T>;
