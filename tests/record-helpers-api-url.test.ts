import { createServer, Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  createRecord,
  createRecords,
  deleteRecord,
  deleteRecords,
  getRecord,
  getRecords,
  getRecordsPage,
  iterateRecordsPages,
  replaceRecord,
  replaceRecords,
  updateRecord,
  updateRecords,
  updateRecordsUpsert,
} from '../src/index.js';

// A real local server standing in for a mock Airtable or a proxy, so the test
// shows where each helper's request actually goes.
let server: Server;
let apiURL: string;
let received: string[] = [];

// One body that every record helper can read as its response.
const responseBody = JSON.stringify({
  id: 'rec123',
  createdTime: '2024-01-01T00:00:00.000Z',
  fields: {},
  deleted: true,
  records: [],
  createdRecords: [],
  updatedRecords: [],
});

beforeAll(async () => {
  server = createServer((req, res) => {
    received.push(`${req.method} ${req.url}`);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(responseBody);
  });
  const port = await new Promise<number>((resolve) => {
    server.listen(0, '127.0.0.1', () =>
      resolve((server.address() as AddressInfo).port)
    );
  });
  apiURL = `http://127.0.0.1:${port}/v0`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  received = [];
});

const target = () => ({
  apiKey: 'pat123',
  baseId: 'app123',
  tableId: 'tbl123',
  apiURL,
  retry: { maxRetries: 0 },
});

describe('apiURL on record helpers', () => {
  it.each([
    ['getRecord', () => getRecord({ ...target(), recordId: 'rec123' }), 'GET /v0/app123/tbl123/rec123'],
    ['getRecordsPage', () => getRecordsPage(target()), 'POST /v0/app123/tbl123/listRecords'],
    [
      'iterateRecordsPages',
      async () => {
        for await (const page of iterateRecordsPages(target())) void page;
      },
      'POST /v0/app123/tbl123/listRecords',
    ],
    ['getRecords', () => getRecords(target()), 'POST /v0/app123/tbl123/listRecords'],
    ['createRecord', () => createRecord({ ...target(), fields: {} }), 'POST /v0/app123/tbl123'],
    ['createRecords', () => createRecords({ ...target(), records: [{ fields: {} }] }), 'POST /v0/app123/tbl123'],
    ['updateRecord', () => updateRecord({ ...target(), recordId: 'rec123', fields: {} }), 'PATCH /v0/app123/tbl123/rec123'],
    ['replaceRecord', () => replaceRecord({ ...target(), recordId: 'rec123', fields: {} }), 'PUT /v0/app123/tbl123/rec123'],
    [
      'updateRecords',
      () => updateRecords({ ...target(), records: [{ id: 'rec123', fields: {} }] }),
      'PATCH /v0/app123/tbl123/',
    ],
    [
      'replaceRecords',
      () => replaceRecords({ ...target(), records: [{ id: 'rec123', fields: {} }] }),
      'PUT /v0/app123/tbl123/',
    ],
    [
      'updateRecordsUpsert',
      () =>
        updateRecordsUpsert({
          ...target(),
          records: [{ fields: { Name: 'A' } }],
          options: { fieldsToMergeOn: ['Name'] },
        }),
      'PATCH /v0/app123/tbl123/',
    ],
    ['deleteRecord', () => deleteRecord({ ...target(), recordId: 'rec123' }), 'DELETE /v0/app123/tbl123/rec123'],
    [
      'deleteRecords',
      () => deleteRecords({ ...target(), recordIds: ['rec123'] }),
      'DELETE /v0/app123/tbl123?records%5B%5D=rec123',
    ],
  ])('%s sends its request to the custom apiURL', async (_name, call, request) => {
    await call();
    expect(received).toEqual([request]);
  });
});
