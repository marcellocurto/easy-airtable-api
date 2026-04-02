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

import { updateRecordsUpsert } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('updateRecordsUpsert chunking', () => {
  beforeEach(() => {
    vi.mocked(airtableRequest).mockReset();
    delayMock.mockReset();
    delayMock.mockResolvedValue(undefined);
  });

  it('chunks upsert batches and combines created, updated, and returned records', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest
      .mockResolvedValueOnce({
        createdRecords: ['rec11'],
        updatedRecords: ['rec1', 'rec2', 'rec3', 'rec4', 'rec5', 'rec6', 'rec7', 'rec8', 'rec9'],
        records: Array.from({ length: 10 }, (_, index) => ({
          id: `rec${index + 1}`,
          createdTime: '2024-01-01T00:00:00.000Z',
          fields: { Name: `Project ${index + 1}` },
        })),
      })
      .mockResolvedValueOnce({
        createdRecords: ['rec12'],
        updatedRecords: ['rec10'],
        records: [
          {
            id: 'rec11',
            createdTime: '2024-01-01T00:00:00.000Z',
            fields: { Name: 'Project 11' },
          },
          {
            id: 'rec12',
            createdTime: '2024-01-01T00:00:00.000Z',
            fields: { Name: 'Project 12' },
          },
        ],
      });

    const records = Array.from({ length: 12 }, (_, index) => ({
      fields: { Name: `Project ${index + 1}` },
    }));

    const result = await updateRecordsUpsert<{ Name: string }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      records,
      options: {
        fieldsToMergeOn: ['Name'],
        requestInterval: 321,
      },
    });

    expect(result.createdRecords).toEqual(['rec11', 'rec12']);
    expect(result.updatedRecords).toEqual([
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
    ]);
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
      method: 'PATCH',
      endpoint: '/',
      body: {
        records: records.slice(0, 10),
        typecast: false,
        returnFieldsByFieldId: false,
        performUpsert: { fieldsToMergeOn: ['Name'] },
      },
    });
    expect(mockedRequest.mock.calls[1]?.[0]).toMatchObject({
      method: 'PATCH',
      endpoint: '/',
      body: {
        records: records.slice(10),
        typecast: false,
        returnFieldsByFieldId: false,
        performUpsert: { fieldsToMergeOn: ['Name'] },
      },
    });
    expect(delayMock).toHaveBeenCalledTimes(1);
    expect(delayMock).toHaveBeenCalledWith(321);
  });
});
