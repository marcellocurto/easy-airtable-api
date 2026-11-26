import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock, sleepMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  sleepMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('https', () => ({
  request: requestMock,
}));

vi.mock('../src/utils.js', async () => {
  const actual = await vi.importActual('../src/utils.js');
  return {
    ...actual,
    delay: sleepMock,
  };
});

import { createRecords, getRecordsPage } from '../src/index.js';

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

function failConnection(message: string) {
  return (): FakeRequest => {
    const req = new EventEmitter() as FakeRequest;
    req.write = () => undefined;
    req.end = () => {
      req.emit('error', new Error(message));
    };
    return req;
  };
}

const created = {
  records: [
    {
      id: 'rec1',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: { Name: 'A' },
    },
  ],
};

const target = { apiKey: 'pat123', baseId: 'app123', tableId: 'tbl123' };

describe('retries for requests that are not safe to repeat', () => {
  beforeEach(() => {
    requestMock.mockReset();
    sleepMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
  });

  it('does not resend a create after the connection drops, because Airtable may already have created the records', async () => {
    requestMock
      .mockImplementationOnce(failConnection('socket hang up'))
      .mockImplementationOnce(respondWith(200, created));

    await expect(
      createRecords({ ...target, records: [{ fields: { Name: 'A' } }] })
    ).rejects.toThrow('socket hang up');

    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it('does not resend a create after a 5xx response', async () => {
    requestMock
      .mockImplementationOnce(respondWith(503, {}))
      .mockImplementationOnce(respondWith(200, created));

    await expect(
      createRecords({ ...target, records: [{ fields: { Name: 'A' } }] })
    ).rejects.toMatchObject({ statusCode: 503 });

    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it('still retries a create that Airtable rate limited, because a 429 means nothing was written', async () => {
    requestMock
      .mockImplementationOnce(respondWith(429, {}))
      .mockImplementationOnce(respondWith(200, created));

    const result = await createRecords({
      ...target,
      records: [{ fields: { Name: 'A' } }],
    });

    expect(result.records.map((record) => record.id)).toEqual(['rec1']);
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('still retries listing records after a 5xx response, because listRecords only reads even though it uses POST', async () => {
    requestMock
      .mockImplementationOnce(respondWith(503, {}))
      .mockImplementationOnce(respondWith(200, created));

    const page = await getRecordsPage({ ...target });

    expect(page.records.map((record) => record.id)).toEqual(['rec1']);
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('still retries listing records after the connection drops', async () => {
    requestMock
      .mockImplementationOnce(failConnection('socket hang up'))
      .mockImplementationOnce(respondWith(200, created));

    const page = await getRecordsPage({ ...target });

    expect(page.records.map((record) => record.id)).toEqual(['rec1']);
    expect(requestMock).toHaveBeenCalledTimes(2);
  });
});
