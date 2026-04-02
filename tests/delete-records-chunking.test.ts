import { beforeEach, describe, expect, it, vi } from 'vitest';

const { delayMock } = vi.hoisted(() => ({
  delayMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('../src/requests.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/requests.js')>();
  return {
    ...actual,
    airtableRequest: vi.fn(),
  };
});

vi.mock('../src/utils.js', async () => {
  const actual = await vi.importActual('../src/utils.js');
  return {
    ...actual,
    delay: delayMock,
  };
});

import { deleteRecords } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('deleteRecords chunking', () => {
  beforeEach(() => {
    vi.mocked(airtableRequest).mockReset();
    delayMock.mockReset();
    delayMock.mockResolvedValue(undefined);
  });

  it('splits delete batches across repeated records[] query params and preserves response order', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest
      .mockResolvedValueOnce({
        records: Array.from({ length: 10 }, (_, index) => ({
          id: `rec${index + 1}`,
          deleted: true,
        })),
      })
      .mockResolvedValueOnce({
        records: [
          { id: 'rec11', deleted: true },
          { id: 'rec12', deleted: true },
        ],
      });

    const recordIds = Array.from({ length: 12 }, (_, index) => `rec${index + 1}`);

    const result = await deleteRecords({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      recordIds,
      options: {
        requestInterval: 456,
      },
    });

    expect(result.records).toEqual([
      { id: 'rec1', deleted: true },
      { id: 'rec2', deleted: true },
      { id: 'rec3', deleted: true },
      { id: 'rec4', deleted: true },
      { id: 'rec5', deleted: true },
      { id: 'rec6', deleted: true },
      { id: 'rec7', deleted: true },
      { id: 'rec8', deleted: true },
      { id: 'rec9', deleted: true },
      { id: 'rec10', deleted: true },
      { id: 'rec11', deleted: true },
      { id: 'rec12', deleted: true },
    ]);

    expect(mockedRequest).toHaveBeenCalledTimes(2);

    const firstEndpoint = mockedRequest.mock.calls[0]?.[0]?.endpoint ?? '';
    const secondEndpoint = mockedRequest.mock.calls[1]?.[0]?.endpoint ?? '';

    expect(new URLSearchParams(firstEndpoint.slice(1)).getAll('records[]')).toEqual(
      recordIds.slice(0, 10)
    );
    expect(new URLSearchParams(secondEndpoint.slice(1)).getAll('records[]')).toEqual(
      recordIds.slice(10)
    );

    expect(delayMock).toHaveBeenCalledTimes(1);
    expect(delayMock).toHaveBeenCalledWith(456);
  });
});
