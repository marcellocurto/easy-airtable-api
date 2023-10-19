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
    private readonly apiURL;
    auth(key: string): this;
    base(baseId: string): this;
    table(tableId: string): this;
    private request;
    getRecord(recordId: string): Promise<AirtableRecord>;
    getRecords(): Promise<AirtableRecord[]>;
    updateRecord(recordId: string, fields: object): Promise<AirtableRecord>;
    updateRecords(records: {
        id: string;
        fields: object;
    }[], options?: {
        typecast?: boolean;
    }): Promise<AirtableRecord[]>;
    replaceRecord(recordId: string, fields: object): Promise<AirtableRecord>;
    replaceRecords(records: {
        id: string;
        fields: object;
    }[]): Promise<AirtableRecord[]>;
}
export {};
