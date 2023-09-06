import { config } from 'dotenv';
config();

import Airtable from '../lib/main';

async function runTests() {
  const airtable = new Airtable();
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error('API_KEY .env not found');
  airtable.auth(apiKey);

  const baseId = process.env.TEST_BASE_ID;
  if (!baseId) throw new Error('TEST_BASE_ID .env not found');
  airtable.base(baseId);

  const tableId = process.env.TEST_TABLE_NAME_ALL_FIELDS;
  if (!tableId) throw new Error('TEST_TABLE_NAME_ALL_FIELDS .env not found');
  airtable.table(tableId);

  const record = await airtable.getRecord('recLztqW64aB9nee1');
  console.log(record);

  const records = await airtable.getRecords();
  console.log(records);
}

runTests();
