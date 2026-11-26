import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock, sleepMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  sleepMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('https', () => ({ request: requestMock }));

vi.mock('../src/utils.js', async () => {
  const actual = await vi.importActual('../src/utils.js');
  return { ...actual, delay: sleepMock };
});

import {
  AirtableApiError,
  airtableRequestRaw,
  createRecords,
  deleteRecord,
  deleteRecords,
} from '../src/index.js';

type FakeRequest = EventEmitter & {
  write: (chunk: string) => void;
  end: () => void;
};

function respondWith(statusCode: number, body: unknown) {
  return (
    _options: unknown,
    callback: (response: EventEmitter & { statusCode?: number }) => void
  ): FakeRequest => {
    const response = new EventEmitter() as EventEmitter & {
      statusCode?: number;
    };
    response.statusCode = statusCode;
    const req = new EventEmitter() as FakeRequest;
    req.write = () => undefined;
    req.end = () => {
      callback(response);
      response.emit('data', Buffer.from(JSON.stringify(body)));
      response.emit('end');
    };
    return req;
  };
}

// Node reports a dropped connection as ECONNRESET.
function dropConnection(): FakeRequest {
  const req = new EventEmitter() as FakeRequest;
  req.write = () => undefined;
  req.end = () => {
    req.emit(
      'error',
      Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' })
    );
  };
  return req;
}

const target = { apiKey: 'pat123', baseId: 'app123', tableId: 'tbl123' };
const notFound = { error: { type: 'NOT_FOUND', message: 'Record not found' } };

beforeEach(() => {
  requestMock.mockReset();
  sleepMock.mockReset();
  sleepMock.mockResolvedValue(undefined);
});

describe('errors a request finally fails with', () => {
  it('reports an exhausted network failure as an AirtableApiError with the Node error as cause', async () => {
    requestMock.mockImplementation(dropConnection);

    const error = await airtableRequestRaw({
      apiKey: 'pat123',
      method: 'GET',
      path: '/meta/bases',
      retry: { maxRetries: 2 },
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AirtableApiError);
    expect(error).toMatchObject({
      statusCode: undefined,
      retryable: true,
      attempts: 3,
      cause: { code: 'ECONNRESET' },
    });
  });

  it('marks a create that failed after Airtable may have applied it as not retryable', async () => {
    requestMock.mockImplementation(respondWith(503, {}));

    await expect(
      createRecords({ ...target, records: [{ fields: { Name: 'A' } }] })
    ).rejects.toMatchObject({ statusCode: 503, retryable: false, attempts: 1 });
  });

  it('marks a create whose connection dropped as not retryable and does not resend it', async () => {
    requestMock.mockImplementation(dropConnection);

    await expect(
      createRecords({ ...target, records: [{ fields: { Name: 'A' } }] })
    ).rejects.toMatchObject({ retryable: false, attempts: 1 });
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it('retries a create whose connection was refused, since nothing reached Airtable', async () => {
    requestMock
      .mockImplementationOnce(() => {
        const req = new EventEmitter() as FakeRequest;
        req.write = () => undefined;
        req.end = () => {
          req.emit(
            'error',
            Object.assign(new Error('connect ECONNREFUSED'), {
              code: 'ECONNREFUSED',
            })
          );
        };
        return req;
      })
      .mockImplementationOnce(respondWith(200, { records: [] }));

    await expect(
      createRecords({ ...target, records: [{ fields: { Name: 'A' } }] })
    ).resolves.toEqual({ records: [] });
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('keeps a rate-limited create retryable, since Airtable did not process it', async () => {
    requestMock.mockImplementation(respondWith(429, {}));

    await expect(
      createRecords({
        ...target,
        records: [{ fields: { Name: 'A' } }],
        retry: { maxRetries: 0 },
      })
    ).rejects.toMatchObject({ statusCode: 429, retryable: true });
  });
});

describe('deletes whose first response was lost', () => {
  it('treats a 404 on a retried delete as success, because the record is gone', async () => {
    requestMock
      .mockImplementationOnce(dropConnection)
      .mockImplementationOnce(respondWith(404, notFound));

    await expect(
      deleteRecord({ ...target, recordId: 'rec1' })
    ).resolves.toEqual({ id: 'rec1', deleted: true });
  });

  it('still fails a delete whose first attempt returns 404', async () => {
    requestMock.mockImplementationOnce(respondWith(404, notFound));

    await expect(
      deleteRecord({ ...target, recordId: 'rec1' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('still fails a delete retried after a 429, since Airtable did not process the first attempt', async () => {
    requestMock
      .mockImplementationOnce(respondWith(429, {}))
      .mockImplementationOnce(respondWith(404, notFound));

    await expect(
      deleteRecord({ ...target, recordId: 'recTypo' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('reports a 404 on a retried batch delete, because it does not say which ID was missing', async () => {
    requestMock
      .mockImplementationOnce(dropConnection)
      .mockImplementationOnce(respondWith(404, notFound));

    await expect(
      deleteRecords({ ...target, recordIds: ['rec1', 'recStale'] })
    ).rejects.toMatchObject({
      statusCode: 404,
      earlierAttemptMayHaveApplied: true,
    });
  });
});
