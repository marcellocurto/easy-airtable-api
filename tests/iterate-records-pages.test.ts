import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', () => ({
  airtableRequest: vi.fn(),
}));

import { iterateRecordsPages } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('iterateRecordsPages', () => {
  it('yields pages in order until Airtable stops returning an offset', async () => {
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
        offset: 'next-page-token',
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

    const pages = [];

    for await (const page of iterateRecordsPages<{ Name: string }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      options: {
        pageSize: 1,
      },
    })) {
      pages.push(page);
    }

    expect(pages).toEqual([
      {
        records: [
          {
            id: 'rec1',
            createdTime: '2024-01-01T00:00:00.000Z',
            fields: { Name: 'One' },
          },
        ],
        offset: 'next-page-token',
      },
      {
        records: [
          {
            id: 'rec2',
            createdTime: '2024-01-01T00:00:00.000Z',
            fields: { Name: 'Two' },
          },
        ],
        offset: undefined,
      },
    ]);

    expect(mockedRequest).toHaveBeenNthCalledWith(1, {
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      endpoint: '/listRecords',
      method: 'POST',
      body: {
        pageSize: 1,
      },
    });

    expect(mockedRequest).toHaveBeenNthCalledWith(2, {
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      endpoint: '/listRecords',
      method: 'POST',
      body: {
        pageSize: 1,
        offset: 'next-page-token',
      },
    });
  });
});
