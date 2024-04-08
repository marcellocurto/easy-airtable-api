import 'dotenv/config';
import { expect, test } from 'vitest';
import { getRecords } from '../src/index';

const apiKey = process.env.API_KEY as string;
const baseId = process.env.TEST_BASE_ID as string;
const tableId = process.env.TEST_TABLE_NAME_ALL_FIELDS as string;

type TestFields = {
  Name?: string;
  Notes?: string;
  Status?: string;
  recordId?: string;
};

test('getRecords', async () => {
  const records = await getRecords<TestFields>({
    apiKey,
    baseId,
    tableId,
    options: {
      maxRecords: 50000,
    },
  });

  console.log(records.length);

  expect(records.length > 0).toBe(true);
});
