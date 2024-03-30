import 'dotenv/config';
import { expect, test } from 'vitest';
import { getRecords } from '../src/index';

const apiKey = process.env.API_KEY as string;
const baseId = process.env.TEST_BASE_ID as string;
const tableId = process.env.TEST_TABLE_NAME_ALL_FIELDS as string;

test('getRecords', async () => {
  const records = await getRecords({
    apiKey,
    baseId,
    tableId,
  });
  console.log(records);

  expect(records.length > 0).toBe(true);
});
