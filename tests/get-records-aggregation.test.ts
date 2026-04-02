import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/requests.js')>();
  return {
    ...actual,
    airtableRequest: vi.fn(),
  };
});

import { getRecords } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('getRecords aggregation', () => {
  it('returns a flat record list across all Airtable pages', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest
      .mockResolvedValueOnce({
        records: [
          {
            id: 'rec1',
            createdTime: '2024-01-01T00:00:00.000Z',
            fields: { Name: 'One' },
          },
        ],
        offset: 'next-page',
      })
      .mockResolvedValueOnce({
        records: [
          {
            id: 'rec2',
            createdTime: '2024-01-01T00:00:00.000Z',
            fields: { Name: 'Two' },
          },
        ],
      });

    const records = await getRecords<{ Name: string }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      options: {
        pageSize: 1,
      },
    });

    expect(records).toEqual([
      {
        id: 'rec1',
        createdTime: '2024-01-01T00:00:00.000Z',
        fields: { Name: 'One' },
      },
      {
        id: 'rec2',
        createdTime: '2024-01-01T00:00:00.000Z',
        fields: { Name: 'Two' },
      },
    ]);
  });
});
