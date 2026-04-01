import { describe, expect, test } from 'vitest';
import { deleteRecords } from '../src/index.js';
import { hasIntegrationEnv, integrationEnv } from './integration-helpers.js';

describe.skipIf(!hasIntegrationEnv)('deleteRecords integration', () => {
  test('deletes records through the public API', async () => {
    const recordIds = ['recLztqW64aB9nee1', 'recP3kAIPZjv22OOI'];

    const response = await deleteRecords({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      recordIds,
    });

    expect(response.records.length).toBe(recordIds.length);
  });
});
