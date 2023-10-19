import { apiRequest } from './requests';
import { RequestMethods } from './types/tables';

type AirtableRecord = {
  id: string;
  fields: { [key: string]: unknown };
};

export default class Airtable {
  private apiKey: string | undefined;
  private baseId: string | undefined;
  private tableId: string | undefined;
  private readonly apiURL: string = 'https://api.airtable.com/v0';

  auth(key: string): this {
    this.apiKey = key;
    return this;
  }

  base(baseId: string): this {
    this.baseId = baseId;
    return this;
  }

  table(tableId: string): this {
    this.tableId = tableId;
    return this;
  }

  private async request({
    endpoint,
    method,
    body,
  }: {
    endpoint: string;
    method: RequestMethods;
    body?: object;
  }): Promise<unknown> {
    if (!this.apiKey || !this.baseId || !this.tableId) {
      throw new Error(
        'API Key, Base ID, and Table ID/Name must be set before making requests.'
      );
    }
    return await apiRequest({
      url: `${this.apiURL}/${this.baseId}/${this.tableId}${endpoint}`,
      apiKey: this.apiKey,
      method: method,
      body,
    });
  }

  async getRecord(recordId: string): Promise<AirtableRecord> {
    return this.request({ endpoint: `/${recordId}`, method: 'GET' });
  }

  async getRecords(): Promise<AirtableRecord[]> {
    return this.request({ endpoint: '/', method: 'GET' });
  }

  async updateRecord(
    recordId: string,
    fields: object
  ): Promise<AirtableRecord> {
    return this.request({
      endpoint: `/${recordId}`,
      method: 'PATCH',
      body: { fields },
    });
  }

  async updateRecords(
    records: { id: string; fields: object }[],
    options?: { typecast?: boolean }
  ): Promise<AirtableRecord[]> {
    return this.request({ endpoint: '/', method: 'PATCH', body: { records } });
  }

  async replaceRecord(
    recordId: string,
    fields: object
  ): Promise<AirtableRecord> {
    return this.request({
      endpoint: `/${recordId}`,
      method: 'PUT',
      body: { fields },
    });
  }

  async replaceRecords(
    records: { id: string; fields: object }[]
  ): Promise<AirtableRecord[]> {
    return this.request({ endpoint: '/', method: 'PUT', body: { records } });
  }
}
