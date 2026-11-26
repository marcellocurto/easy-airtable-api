import { beforeEach, describe, expect, it, vi } from 'vitest';

const { delayMock } = vi.hoisted(() => ({
  delayMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('../src/requests.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/requests.js')>();
  return { ...actual, airtableRequest: vi.fn() };
});

vi.mock('../src/utils.js', async () => {
  const actual = await vi.importActual('../src/utils.js');
  return { ...actual, delay: delayMock };
});

import {
  AirtableApiError,
  AirtableBatchError,
  createRecords,
  deleteRecords,
  replaceRecords,
  updateRecords,
  updateRecordsUpsert,
} from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

const target = { apiKey: 'pat123', baseId: 'app123', tableId: 'tbl123' };

const invalidValue = new AirtableApiError({
  message: 'Invalid value for column',
  statusCode: 422,
  airtableType: 'INVALID_VALUE_FOR_COLUMN',
  retryable: false,
});

function createdChunk(from: number, count: number) {
  return {
    records: Array.from({ length: count }, (_, index) => ({
      id: `rec${from + index}`,
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: { Name: `Record ${from + index}` },
    })),
  };
}

const inputs = Array.from({ length: 25 }, (_, index) => ({
  fields: { Name: `Record ${index + 1}` },
}));

describe('batch helpers when a later chunk fails', () => {
  beforeEach(() => {
    vi.mocked(airtableRequest).mockReset();
    delayMock.mockReset();
    delayMock.mockResolvedValue(undefined);
  });

  it('reports the records Airtable already created and the ones it did not', async () => {
    vi.mocked(airtableRequest)
      .mockResolvedValueOnce(createdChunk(1, 10))
      .mockResolvedValueOnce(createdChunk(11, 10))
      .mockRejectedValueOnce(invalidValue);

    const error = await createRecords({ ...target, records: inputs }).catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(AirtableBatchError);
    const batchError = error as AirtableBatchError;
    expect(batchError.cause).toBe(invalidValue);
    expect(batchError.completed).toEqual({
      records: [
        ...createdChunk(1, 10).records,
        ...createdChunk(11, 10).records,
      ],
    });
    expect(batchError.pending).toEqual(inputs.slice(20));
  });

  it('rethrows the original error when the first chunk fails, since nothing was written', async () => {
    vi.mocked(airtableRequest).mockRejectedValueOnce(invalidValue);

    await expect(createRecords({ ...target, records: inputs })).rejects.toBe(
      invalidValue
    );
  });

  it('reports created and updated ids from the chunks an upsert finished', async () => {
    vi.mocked(airtableRequest)
      .mockResolvedValueOnce({
        createdRecords: ['rec1'],
        updatedRecords: ['rec2'],
        records: createdChunk(1, 2).records,
      })
      .mockRejectedValueOnce(invalidValue);

    const records = Array.from({ length: 12 }, (_, index) => ({
      fields: { Name: `Record ${index + 1}` },
    }));
    const error = await updateRecordsUpsert({
      ...target,
      records,
      options: { fieldsToMergeOn: ['Name'] },
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AirtableBatchError);
    expect((error as AirtableBatchError).completed).toEqual({
      createdRecords: ['rec1'],
      updatedRecords: ['rec2'],
      records: createdChunk(1, 2).records,
    });
    expect((error as AirtableBatchError).pending).toEqual(records.slice(10));
  });

  it('reports which record ids were deleted and which were not', async () => {
    const recordIds = Array.from(
      { length: 15 },
      (_, index) => `rec${index + 1}`
    );
    vi.mocked(airtableRequest)
      .mockResolvedValueOnce({
        records: recordIds.slice(0, 10).map((id) => ({ id, deleted: true })),
      })
      .mockRejectedValueOnce(invalidValue);

    const error = await deleteRecords({ ...target, recordIds }).catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(AirtableBatchError);
    expect((error as AirtableBatchError).completed).toEqual({
      records: recordIds.slice(0, 10).map((id) => ({ id, deleted: true })),
    });
    expect((error as AirtableBatchError).pending).toEqual(recordIds.slice(10));
  });
});

describe.each([
  { helper: updateRecords, method: 'PATCH' },
  { helper: replaceRecords, method: 'PUT' },
])('$method batch helper', ({ helper, method }) => {
  const updates = Array.from({ length: 12 }, (_, index) => ({
    id: `rec${index + 1}`,
    fields: { Name: `Record ${index + 1}` },
  }));

  beforeEach(() => {
    vi.mocked(airtableRequest).mockReset();
    delayMock.mockReset();
    delayMock.mockResolvedValue(undefined);
  });

  it('sends each chunk with its method and joins the results in order', async () => {
    vi.mocked(airtableRequest)
      .mockResolvedValueOnce(createdChunk(1, 10))
      .mockResolvedValueOnce(createdChunk(11, 2));

    const result = await helper({ ...target, records: updates });

    expect(result.records.map((record) => record.id)).toEqual(
      updates.map((update) => update.id)
    );
    expect(
      vi.mocked(airtableRequest).mock.calls.map(([request]) => request.method)
    ).toEqual([method, method]);
  });

  it('reports the finished chunk when the next one fails', async () => {
    vi.mocked(airtableRequest)
      .mockResolvedValueOnce(createdChunk(1, 10))
      .mockRejectedValueOnce(invalidValue);

    const error = await helper({ ...target, records: updates }).catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(AirtableBatchError);
    expect((error as AirtableBatchError).completed).toEqual(
      createdChunk(1, 10)
    );
    expect((error as AirtableBatchError).pending).toEqual(updates.slice(10));
  });
});
