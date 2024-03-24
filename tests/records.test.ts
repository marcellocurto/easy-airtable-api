import 'dotenv/config';
import { expect, test } from 'vitest';
import { getRecord } from '../src/index';

const apiKey = process.env.API_KEY as string;
const baseId = process.env.TEST_BASE_ID as string;
const tableId = process.env.TEST_TABLE_NAME_ALL_FIELDS as string;

test('getRecord', async () => {
  const record = await getRecord({
    apiKey,
    baseId,
    tableId,
    recordId: 'recLztqW64aB9nee1',
  });
  expect(record).toEqual({
    id: 'recLztqW64aB9nee1',
    createdTime: '2023-09-06T12:46:28.000Z',
    fields: {
      Name: 'a',
      recordId: 'recLztqW64aB9nee1',
    },
  });
});
