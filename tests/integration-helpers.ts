import 'dotenv/config';

export const integrationEnv = {
  apiKey: process.env.API_KEY,
  baseId: process.env.TEST_BASE_ID,
  tableId: process.env.TEST_TABLE_NAME_ALL_FIELDS,
};

export const hasIntegrationEnv =
  process.env.RUN_AIRTABLE_INTEGRATION_TESTS === 'true' &&
  Boolean(
    integrationEnv.apiKey && integrationEnv.baseId && integrationEnv.tableId
  );
