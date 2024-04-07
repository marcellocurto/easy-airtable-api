import { request, RequestOptions } from 'https';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import {
  AirtableRecord,
  GetRecordsQueryParameters,
  UpdateRecordsRequestOptions,
} from './types/records';
import { ApiRequest, RequestMethods } from './types/tables';

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
  return await airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: 'GET',
  });
}

export async function getRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  options,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  options?: GetRecordsQueryParameters;
}): Promise<AirtableRecord<Fields>[]> {
  validateGetRecordsOptions(options);
  const response = await airtableRequest<{ records: AirtableRecord<Fields>[] }>(
    {
      apiKey,
      baseId,
      tableId,
      endpoint: '/listRecords',
      method: 'POST',
      body: options,
    }
  );
  return response.records;
}

function validateGetRecordsOptions(options?: GetRecordsQueryParameters) {
  if (!options) return;
  if (options.cellFormat === 'string') {
    if (!options.timeZone || !options.userLocale) {
      throw new Error(
        'The timeZone and userLocale parameters are required when using string as the cellFormat.'
      );
    }
  }
}

export async function updateRecord<Fields>({
  apiKey,
  baseId,
  tableId,
  recordId,
  fields,
  options,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  recordId: string;
  fields: object;
  options?: {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
    overwriteFieldsNotSpecified?: boolean;
  };
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: options?.overwriteFieldsNotSpecified === true ? 'PUT' : 'PATCH',
    body: {
      fields,
      typecast: options?.typecast === true ? true : false,
      returnFieldsByFieldId:
        options?.returnFieldsByFieldId === true ? true : false,
    },
  });
}

export async function updateRecords<Fields>({
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
}): Promise<AirtableRecord<Fields>[]> {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(
      'The records array is empty or not provided. Please provide a non-empty array of records to update.'
    );
  }
  return await airtableRequest<AirtableRecord<Fields>[]>({
    apiKey,
    baseId,
    tableId,
    endpoint: '/',
    method: 'PATCH',
    body: { records, ...options },
  });
}

export async function replaceRecord<Fields>({
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
}): Promise<AirtableRecord<Fields>> {
  return await airtableRequest<AirtableRecord<Fields>>({
    apiKey,
    baseId,
    tableId,
    endpoint: `/${recordId}`,
    method: 'PUT',
    body: { fields },
  });
}

export async function replaceRecords<Fields>({
  apiKey,
  baseId,
  tableId,
  records,
}: {
  apiKey: string;
  baseId: string;
  tableId: string;
  records: { id: string; fields: object }[];
}): Promise<AirtableRecord<Fields>[]> {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(
      'The records array is empty or not provided. Please provide a non-empty array of records to replace.'
    );
  }
  return await airtableRequest<AirtableRecord<Fields>[]>({
    apiKey,
    baseId,
    tableId,
    endpoint: '/',
    method: 'PUT',
    body: { records },
  });
}

async function airtableRequest<T>(request: {
  apiKey: string;
  baseId: string;
  tableId: string;
  endpoint: string;
  method: RequestMethods;
  body?: object;
  apiURL?: string;
}): Promise<T> {
  const { apiKey, baseId, tableId, endpoint, method, body, apiURL } = request;

  const url: string = apiURL || 'https://api.airtable.com/v0';

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

  const response = await apiRequest<T>({
    url: `${url}/${baseId}/${tableId}${endpoint}`,
    apiKey,
    method,
    body,
  });

  validateResponse(response);

  return response.data;
}

function validateResponse<T>(response: ApiResponse<T>) {
  const statusCode = response.statusCode;
  if (statusCode === 200) return;
  if (statusCode === 401) throw new Error('Incorrect API Key.');
  else if (statusCode === 403) throw new Error('Not authorized.');
  else if (statusCode === 404) throw new Error('Table or record not found.');
  else if (statusCode === 413) throw new Error('Request body is too large.');
  else if (statusCode === 422) {
    throw new Error('Operation cannot be processed. Do the field names match?');
  } else if (statusCode === 429) {
    throw new Error('Too many requests to the Airtable server.');
  } else if (statusCode === 500) throw new Error('Airtable server error.');
  else if (statusCode === 503) throw new Error('Airtable service unavailable.');
  throw new Error('Unexpected error.');
}


type ApiResponse<T> = {
  data: T;
  statusCode?: number;
  statusMessage?: string;
};

async function apiRequest<T>({
  url,
  method,
  apiKey,
  body,
}: ApiRequest): Promise<ApiResponse<T>> {
  return new Promise<ApiResponse<T>>((resolve, reject) => {
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
          resolve({
            data: JSON.parse(data) as T,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
          });
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
