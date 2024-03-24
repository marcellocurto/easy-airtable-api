import { GetRecordsQueryParameters, UpdateRecordsRequestOptions } from './types/records';
type AirtableRecord = {
    id: string;
    fields: {
        [key: string]: unknown;
    };
};
export default class Airtable {
    private apiKey;
    private baseId;
    private tableId;
    private apiURL;
    url(url: string): this;
    auth(key: string): this;
    base(baseId: string): this;
    table(tableId: string): this;
    private request;
    getRecord(recordId: string): Promise<AirtableRecord>;
    getRecords(options: GetRecordsQueryParameters): Promise<AirtableRecord[]>;
    updateRecord(recordId: string, fields: object): Promise<AirtableRecord>;
    updateRecords(records: {
        id: string;
        fields: object;
    }[], options?: UpdateRecordsRequestOptions): Promise<AirtableRecord[]>;
    replaceRecord(recordId: string, fields: object): Promise<AirtableRecord>;
    replaceMultipleRecords(records: {
        id: string;
        fields: object;
    }[]): Promise<AirtableRecord[]>;
}
export {};
