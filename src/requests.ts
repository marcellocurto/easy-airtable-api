import { request, RequestOptions } from 'https';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { getArrayInChunks, delay, getErrorMessage } from './records';
import {
  AirtableRecordRequest,
  ApiRequest,
  BaseId,
  FieldsToMergeOn,
  RequestMethodProps,
  TableId,
  UpdateRecords,
  UpdateRecordsBodyUpsert,
  UpserptRecords,
} from './types';

export const apiRequest = async ({
  method,
  url,
  body,
  apiKey,
}: ApiRequest): Promise<any> => {
  return new Promise((resolve, reject) => {
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
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
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
};

export const patchAirtableRequest = async ({
  baseId,
  tableId,
  body,
  atId,
}: AirtableRecordRequest) => {
  const url = atId
    ? `https://api.airtable.com/v0/${baseId}/${tableId}/${atId}`
    : `https://api.airtable.com/v0/${baseId}/${tableId}`;
  return await patchRequest({ url, body });
};

export const updateRecordsOnAirtableUpsert = async ({
  baseId,
  tableId,
  records,
  fieldsToMergeOn,
}: {
  baseId: BaseId;
  tableId: TableId;
  records: UpdateRecords;
  fieldsToMergeOn: FieldsToMergeOn;
}) => {
  const allUpdatedRecords = [];
  const chunks = await getArrayInChunks(records);
  if (!chunks) return null;
  for (const chunk of chunks) {
    const body = {
      performUpsert: { fieldsToMergeOn },
      typecast: true,
      records: chunk,
    };
    const req = (await updateRecordsOnAirtableRequest({
      baseId,
      tableId,
      body,
    })) as UpserptRecords;
    const updatedRecords = req.records;
    for (const record of updatedRecords) {
      allUpdatedRecords.push(record.id);
    }
    await delay(2000);
  }
  return allUpdatedRecords;
};

const updateRecordsOnAirtableRequest = async ({
  baseId,
  tableId,
  body,
}: {
  baseId: BaseId;
  tableId: TableId;
  body: UpdateRecordsBodyUpsert;
}) => {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  try {
    return await patchRequest({ url, body });
  } catch (error) {
    if (getErrorMessage(error) === 'fetch failed') {
      try {
        await delay(20000);
        return await patchRequest({ url, body });
      } catch (error) {
        console.log(`error after fetch failed: ${getErrorMessage(error)}`);
      }
    } else {
      console.log(getErrorMessage(error));
    }
  }
};
