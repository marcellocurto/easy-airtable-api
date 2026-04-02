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

import { createRecords } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('createRecords chunking', () => {
  beforeEach(() => {
    vi.mocked(airtableRequest).mockReset();
    delayMock.mockReset();
    delayMock.mockResolvedValue(undefined);
  });

  it('chunks large batches into Airtable-sized requests and preserves result order', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest
      .mockResolvedValueOnce({
        records: Array.from({ length: 10 }, (_, index) => ({
          id: `rec${index + 1}`,
          createdTime: '2024-01-01T00:00:00.000Z',
          fields: { Name: `Record ${index + 1}` },
        })),
      })
      .mockResolvedValueOnce({
        records: Array.from({ length: 2 }, (_, index) => ({
          id: `rec${index + 11}`,
          createdTime: '2024-01-01T00:00:00.000Z',
          fields: { Name: `Record ${index + 11}` },
        })),
      });

    const records = Array.from({ length: 12 }, (_, index) => ({
      fields: { Name: `Record ${index + 1}` },
    }));

    const result = await createRecords<{ Name: string }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      records,
      options: {
        requestInterval: 123,
      },
    });

    expect(result.records.map((record) => record.id)).toEqual([
      'rec1',
      'rec2',
      'rec3',
      'rec4',
      'rec5',
      'rec6',
      'rec7',
      'rec8',
      'rec9',
      'rec10',
      'rec11',
      'rec12',
    ]);

    expect(mockedRequest).toHaveBeenCalledTimes(2);
    expect(mockedRequest.mock.calls[0]?.[0]).toMatchObject({
      method: 'POST',
      endpoint: '',
      body: {
        records: records.slice(0, 10),
        typecast: false,
        returnFieldsByFieldId: false,
      },
    });
    expect(mockedRequest.mock.calls[1]?.[0]).toMatchObject({
      method: 'POST',
      endpoint: '',
      body: {
        records: records.slice(10),
        typecast: false,
        returnFieldsByFieldId: false,
      },
    });
    expect(delayMock).toHaveBeenCalledTimes(1);
    expect(delayMock).toHaveBeenCalledWith(123);
  });
});
