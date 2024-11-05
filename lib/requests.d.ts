import { RequestMethods } from './types/tables';
export declare function airtableRequest<T>(request: {
    apiKey: string;
    baseId: string;
    tableId: string;
    endpoint: string;
    method: RequestMethods;
    body?: object;
    apiURL?: string;
}): Promise<T>;
type AirtableField = {
    id: string;
    name: string;
    type: string;
    options?: object;
};
type AirtableTable = {
    id: string;
    name: string;
    primaryFieldId: string;
    fields: AirtableField[];
};
type AirtableBaseSchema = {
    tables: AirtableTable[];
};
export declare function getBaseSchema({ apiKey, baseId, }: {
    apiKey: string;
    baseId: string;
}): Promise<AirtableBaseSchema>;
export {};
