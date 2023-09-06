type AirtableRecord = {
  id: string;
  fields: { [key: string]: any };
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

  private async request(
    endpoint: string,
    method: string = 'GET',
    body?: object
  ): Promise<any> {
    if (!this.apiKey || !this.baseId || !this.tableId) {
      throw new Error(
        'API Key, Base ID, and Table ID must be set before making requests.'
      );
    }

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(
      `${this.apiURL}/${this.baseId}/${this.tableId}${endpoint}`,
      {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getRecord(recordId: string): Promise<AirtableRecord> {
    return this.request(`/${recordId}`);
  }

  async getRecords(): Promise<AirtableRecord[]> {
    return this.request('/');
  }

  async updateRecord(
    recordId: string,
    fields: object
  ): Promise<AirtableRecord> {
    return this.request(`/${recordId}`, 'PATCH', { fields });
  }

  async updateRecords(
    records: { id: string; fields: object }[]
  ): Promise<AirtableRecord[]> {
    return this.request('/', 'PATCH', { records });
  }
}
