import { apiRequest } from './requests';
import { RequestMethods } from './types/tables';

type AirtableRecord = {
  id: string;
  fields: { [key: string]: unknown };
};

export default class Airtable {
  private apiKey: string | undefined = undefined;
  private baseId: string | undefined = undefined;
  private tableId: string | undefined = undefined;
  private apiURL: string = 'https://api.airtable.com/v0';

  url(url: string): this {
    if (typeof url === 'string') {
      this.apiURL = url;
    } else {
      throw new Error('API URL must be a string');
    }
    return this;
  }

  auth(key: string): this {
    if (typeof key === 'string') {
      this.apiKey = key;
    } else {
      throw new Error('API Key must be a string');
    }
    return this;
  }

  base(baseId: string): this {
    if (typeof baseId === 'string') {
      this.baseId = baseId;
    } else {
      throw new Error('baseId must be a string');
    }
    return this;
  }

  table(tableId: string): this {
    if (typeof tableId === 'string') {
      this.tableId = tableId;
    } else {
      throw new Error('tableId/tableName must be a string');
    }
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
    if (!this.apiKey) {
      throw new Error('API Key must be set before making requests.');
    }
    if (!this.baseId) {
      throw new Error('Base ID must be set before making requests.');
    }
    if (!this.tableId) {
      throw new Error('Table ID/Name must be set before making requests.');
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
