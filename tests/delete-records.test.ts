import 'dotenv/config';
import { expect, test } from 'vitest';
import { deleteRecords } from '../src/requests';

const apiKey = process.env.API_KEY as string;
const baseId = process.env.TEST_BASE_ID as string;
const tableId = process.env.TEST_TABLE_NAME_ALL_FIELDS as string;

type TestFields = {
  Name?: string;
  Notes?: string;
  Status?: string;
  recordId?: string;
};

test('deleteRecords', async () => {
  const recordIds = ['recLztqW64aB9nee1', 'recP3kAIPZjv22OOI'];

  const response = await deleteRecords({
    apiKey,
    baseId,
    tableId,
    recordIds,
  });

  console.log(response);
  expect(response.records.length).toBe(recordIds.length);
});
