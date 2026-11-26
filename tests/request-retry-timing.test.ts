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

import { airtableRequestRaw } from '../src/requests.js';

type FakeRequest = EventEmitter & {
  write: (chunk: string) => void;
  end: () => void;
};

type FakeResponse = EventEmitter & {
  statusCode?: number;
  headers?: Record<string, string>;
};

function respondWith(
  statusCode: number,
  body: string,
  headers: Record<string, string> = {}
) {
  return (
    _options: unknown,
    callback: (response: FakeResponse) => void
  ): FakeRequest => {
    const response = new EventEmitter() as FakeResponse;
    response.statusCode = statusCode;
    response.headers = headers;

    const req = new EventEmitter() as FakeRequest;
    req.write = () => undefined;
    req.end = () => {
      callback(response);
      response.emit('data', Buffer.from(body));
      response.emit('end');
    };
    return req;
  };
}

// Node reports connection failures as errors carrying a system error code.
function failWithCode(code: string) {
  return (): FakeRequest => {
    const req = new EventEmitter() as FakeRequest;
    req.write = () => undefined;
    req.end = () => {
      req.emit('error', Object.assign(new Error(`connect ${code}`), { code }));
    };
    return req;
  };
}

const ok = JSON.stringify({ ok: true });
const rateLimited = JSON.stringify({
  error: { type: 'RATE_LIMIT_REACHED', message: 'Rate limit exceeded' },
});

function get(retry?: { maxDelayMs?: number }) {
  return airtableRequestRaw({
    apiKey: 'pat123',
    method: 'GET',
    path: '/meta/bases',
    retry,
  });
}

describe('retry timing', () => {
  beforeEach(() => {
    requestMock.mockReset();
    sleepMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
  });

  it("waits out Airtable's 30-second rate-limit lockout before retrying a 429", async () => {
    requestMock
      .mockImplementationOnce(respondWith(429, rateLimited))
      .mockImplementationOnce(respondWith(200, ok));

    await expect(get()).resolves.toEqual({ ok: true });
    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(30000);
  });

  it('fails without waiting when Retry-After asks for longer than maxDelayMs', async () => {
    requestMock
      .mockImplementationOnce(
        respondWith(429, rateLimited, { 'retry-after': '3600' })
      )
      .mockImplementationOnce(respondWith(200, ok));

    await expect(get({ maxDelayMs: 1000 })).rejects.toMatchObject({
      statusCode: 429,
      retryAfterMs: 3600000,
    });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('fails without waiting when the 30-second lockout is longer than maxDelayMs', async () => {
    requestMock
      .mockImplementationOnce(respondWith(429, rateLimited))
      .mockImplementationOnce(respondWith(200, ok));

    await expect(get({ maxDelayMs: 1000 })).rejects.toMatchObject({
      statusCode: 429,
    });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });
});

describe('network error retries', () => {
  beforeEach(() => {
    requestMock.mockReset();
    sleepMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
  });

  it.each(['ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND', 'EPIPE'])(
    'retries a request that failed with %s',
    async (code) => {
      requestMock
        .mockImplementationOnce(failWithCode(code))
        .mockImplementationOnce(respondWith(200, ok));

      await expect(get()).resolves.toEqual({ ok: true });
      expect(requestMock).toHaveBeenCalledTimes(2);
    }
  );

  it('does not retry a malformed response just because its body mentions the network', async () => {
    requestMock
      .mockImplementationOnce(respondWith(200, '<html>network error</html>'))
      .mockImplementationOnce(respondWith(200, ok));

    await expect(get()).rejects.toThrow(/Failed to parse response as JSON/);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});
