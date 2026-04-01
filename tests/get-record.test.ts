import { describe, expect, test } from 'vitest';
import { getRecord } from '../src/index.js';
import { hasIntegrationEnv, integrationEnv } from './integration-helpers.js';

describe.skipIf(!hasIntegrationEnv)('getRecord integration', () => {
  test('returns a record by id', async () => {
    const record = await getRecord({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      recordId: 'recLztqW64aB9nee1',
    });

    expect(record.id).toBe('recLztqW64aB9nee1');
    expect(record.createdTime).toBeTruthy();
    expect(record.fields).toBeTruthy();
  });

  test('returns an auth-related error for a bad token', async () => {
    await expect(
      getRecord({
        apiKey: 'wrongKey',
        baseId: integrationEnv.baseId!,
        tableId: integrationEnv.tableId!,
        recordId: 'recLztqW64aB9nee1',
      })
    ).rejects.toThrow(/auth|token|authorized|required/i);
  });

  test('returns a not found error for a bad base id', async () => {
    await expect(
      getRecord({
        apiKey: integrationEnv.apiKey!,
        baseId: 'baseId',
        tableId: integrationEnv.tableId!,
        recordId: 'recLztqW64aB9nee1',
      })
    ).rejects.toThrow(/not found/i);
  });

  test('returns an authorization-style error for a bad table id', async () => {
    await expect(
      getRecord({
        apiKey: integrationEnv.apiKey!,
        baseId: integrationEnv.baseId!,
        tableId: 'tableId',
        recordId: 'recLztqW64aB9nee1',
      })
    ).rejects.toThrow(/auth|token|authorized|not found/i);
  });

  test('returns a not found error for a bad record id', async () => {
    await expect(
      getRecord({
        apiKey: integrationEnv.apiKey!,
        baseId: integrationEnv.baseId!,
        tableId: integrationEnv.tableId!,
        recordId: 'wrongId',
      })
    ).rejects.toThrow(/not found/i);
  });
});
