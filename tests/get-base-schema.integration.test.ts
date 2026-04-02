import { describe, expect, test } from 'vitest';
import { getBaseSchema } from '../src/index.js';

const hasMetadataIntegrationEnv =
  process.env.RUN_AIRTABLE_INTEGRATION_TESTS === 'true' &&
  Boolean(process.env.API_KEY && process.env.TEST_BASE_ID);

describe.skipIf(!hasMetadataIntegrationEnv)('getBaseSchema integration', () => {
  test('returns Airtable metadata for the configured base', async () => {
    const schema = await getBaseSchema({
      apiKey: process.env.API_KEY!,
      baseId: process.env.TEST_BASE_ID!,
    });

    expect(Array.isArray(schema.tables)).toBe(true);
    expect(schema.tables.length).toBeGreaterThan(0);
    expect(schema.tables[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      primaryFieldId: expect.any(String),
      fields: expect.any(Array),
    });
  });
});
