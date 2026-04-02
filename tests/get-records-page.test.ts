import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', () => ({
  airtableRequest: vi.fn(),
}));

import { getRecordsPage } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('getRecordsPage', () => {
  it('returns a single page of records and the next offset', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest.mockResolvedValueOnce({
      records: [
        {
          id: 'rec1',
          createdTime: '2024-01-01T00:00:00.000Z',
          fields: { Name: 'One' },
        },
      ],
      offset: 'next-page-token',
    });

    const result = await getRecordsPage<{ Name: string }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      options: {
        maxRecords: 50,
        view: 'Grid view',
      },
    });

    expect(result).toEqual({
      records: [
        {
          id: 'rec1',
          createdTime: '2024-01-01T00:00:00.000Z',
          fields: { Name: 'One' },
        },
      ],
      offset: 'next-page-token',
    });

    expect(mockedRequest).toHaveBeenCalledWith({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      endpoint: '/listRecords',
      method: 'POST',
      body: {
        maxRecords: 50,
        view: 'Grid view',
      },
    });
  });
});
