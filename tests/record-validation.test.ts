import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/requests.js')>();
  return {
    ...actual,
    airtableRequest: vi.fn(),
  };
});

import { getRecords, updateRecordsUpsert } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('record helper validation', () => {
  it('rejects string cellFormat queries without timeZone and userLocale', async () => {
    await expect(
      getRecords({
        apiKey: 'pat123',
        baseId: 'app123',
        tableId: 'tbl123',
        options: {
          cellFormat: 'string',
        },
      })
    ).rejects.toThrow(
      'The timeZone and userLocale parameters are required when using string as the cellFormat.'
    );

    expect(vi.mocked(airtableRequest)).not.toHaveBeenCalled();
  });

  it('rejects upsert requests without fieldsToMergeOn before making a request', async () => {
    await expect(
      updateRecordsUpsert({
        apiKey: 'pat123',
        baseId: 'app123',
        tableId: 'tbl123',
        records: [{ fields: { Name: 'Project A' } }],
      })
    ).rejects.toThrow('fieldsToMergeOn must be an array of strings.');

    expect(vi.mocked(airtableRequest)).not.toHaveBeenCalled();
  });
});
