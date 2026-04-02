import { describe, expect, test } from 'vitest';
import { airtableRequestRaw, createBase } from '../src/index.js';

const hasCreateBaseIntegrationEnv =
  process.env.RUN_AIRTABLE_INTEGRATION_TESTS === 'true' &&
  Boolean(process.env.API_KEY && process.env.TEST_WORKSPACE_ID);

describe.skipIf(!hasCreateBaseIntegrationEnv)('createBase integration', () => {
  test('creates a base and can clean it up through the metadata API', async () => {
    const created = await createBase({
      apiKey: process.env.API_KEY!,
      body: {
        workspaceId: process.env.TEST_WORKSPACE_ID!,
        name: `easy-airtable-api integration ${Date.now()}`,
        tables: [
          {
            name: 'Projects',
            fields: [
              { name: 'Name', type: 'singleLineText' },
              {
                name: 'Visited',
                type: 'checkbox',
                options: { color: 'greenBright', icon: 'check' },
              },
            ],
          },
        ],
      },
    });

    expect(created.id).toMatch(/^app/);
    expect(created.tables[0]).toMatchObject({
      name: 'Projects',
      primaryFieldId: expect.any(String),
    });

    await airtableRequestRaw<{ id: string; deleted: true }>({
      apiKey: process.env.API_KEY!,
      method: 'DELETE',
      path: `/v0/meta/bases/${created.id}`,
    });
  });
});
