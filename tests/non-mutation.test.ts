import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/requests.js')>();
  return {
    ...actual,
    airtableRequest: vi.fn(),
  };
});

import { getRecords } from '../src/index.js';
import { airtableRequest, buildQueryString } from '../src/requests.js';

describe('non-mutation guarantees', () => {
  it('does not mutate caller-provided record query options while draining pages', async () => {
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

    const options = {
      pageSize: 1,
      maxRecords: 100,
      sort: [{ field: 'Name', direction: 'asc' as const }],
    };

    await getRecords<{ Name: string }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      options,
    });

    expect(options).toEqual({
      pageSize: 1,
      maxRecords: 100,
      sort: [{ field: 'Name', direction: 'asc' }],
    });
    expect(mockedRequest.mock.calls[0]?.[0]?.body).toEqual(options);
    expect(mockedRequest.mock.calls[1]?.[0]?.body).toEqual({
      ...options,
      offset: 'next-page-token',
    });
  });

  it('does not mutate caller-provided raw query objects while serializing', () => {
    const query = {
      offset: 'page/2?cursor=yes',
      include: ['tables', 'views'],
      verbose: true,
    };

    const serialized = buildQueryString(query);

    expect(serialized).toBe(
      'offset=page%2F2%3Fcursor%3Dyes&include=tables&include=views&verbose=true'
    );
    expect(query).toEqual({
      offset: 'page/2?cursor=yes',
      include: ['tables', 'views'],
      verbose: true,
    });
  });
});
