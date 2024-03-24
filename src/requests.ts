import { request, RequestOptions } from 'https';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import {
  GetRecordsQueryParameters,
  UpdateRecordsRequestOptions,
} from './types/records';
import { ApiRequest, RequestMethods } from './types/tables';

type AirtableRecord<Fields> = {
  id: string;
  createdTime: string;
  fields: Fields | { [key: string]: unknown };
};

const apiURL = 'https://api.airtable.com/v0';

async function airtableRequest<T>({
  apiKey,
  baseId,
  tableId,
  endpoint,
  method,
  body,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  endpoint: string;
  method: RequestMethods;
  body?: object;
}): Promise<T> {
  if (!apiKey) {
    throw new Error(
      'API key is not set. Please provide a valid Airtable API key.'
    );
  }
  if (!baseId) {
    throw new Error(
      'Base ID is not set. Please provide a valid Airtable base ID.'
    );
  }
  if (!tableId) {
    throw new Error(
      'Table ID/Name is not set. Please provide a valid Airtable table ID or name.'
    );
  }

  return await apiRequest<T>({
    url: `${apiURL}/${baseId}/${tableId}${endpoint}`,
    apiKey,
    method,
    body,
  });
}

export async function getRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  recordId,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
}): Promise<AirtableRecord<Fields>> {
  return airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: 'GET',
  });
}

export async function getRecords({
  apiKey,
  baseId,
  tableId,
  options,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options: GetRecordsQueryParameters;
}): Promise<AirtableRecord[]> {
  return airtableRequest<AirtableRecord[]>({
    apiKey,
    baseId,
    tableId,
    endpoint: '/listRecords',
    method: 'POST',
    body: options,
  });
}

export async function updateRecord({
  apiKey,
  baseId,
  tableId,
  recordId,
  fields,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  fields: object;
}): Promise<AirtableRecord> {
  return airtableRequest<AirtableRecord>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: 'PATCH',
    body: { fields },
  });
}

export async function updateRecords({
  apiKey,
  baseId,
  tableId,
  records,
  options,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  records: { id: string; fields: object }[];
  options?: UpdateRecordsRequestOptions;
}): Promise<AirtableRecord[]> {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(
      'The records array is empty or not provided. Please provide a non-empty array of records to update.'
    );
  }
  return airtableRequest<AirtableRecord[]>({
    apiKey,
    baseId,
    tableId,
    endpoint: '/',
    method: 'PATCH',
    body: { records, ...options },
  });
}

export async function replaceRecord({
  apiKey,
  baseId,
  tableId,
  recordId,
  fields,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  fields: object;
}): Promise<AirtableRecord> {
  return airtableRequest<AirtableRecord>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: 'PUT',
    body: { fields },
  });
}

export async function replaceMultipleRecords({
  apiKey,
  baseId,
  tableId,
  records,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  records: { id: string; fields: object }[];
}): Promise<AirtableRecord[]> {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(
      'The records array is empty or not provided. Please provide a non-empty array of records to replace.'
    );
  }
  return airtableRequest<AirtableRecord[]>({
    apiKey,
    baseId,
    tableId,
    endpoint: '/',
    method: 'PUT',
    body: { records },
  });
}

async function apiRequest<T>({
  url,
  method,
  apiKey,
  body,
}: ApiRequest): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const parsedUrl = new URL(url);
    const { hostname, pathname, search } = parsedUrl;

    const options: RequestOptions = {
      method,
      hostname,
      path: `${pathname}${search}`,
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const req = request(options, (res: IncomingMessage) => {
      let data = '';

      res.on('data', (chunk: Buffer) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as T);
        } catch (error) {
          reject(new Error(`Failed to parse response as JSON: ${data}`));
        }
      });
    });

    req.on('error', (error: Error) => {
      reject(
        new Error(`airtableApi: ${error.message} (fn_${apiRequest.name})`)
      );
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}
