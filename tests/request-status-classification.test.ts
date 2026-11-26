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

import { AirtableApiError, airtableRequestRaw } from '../src/requests.js';

type FakeRequest = EventEmitter & {
  write: (chunk: string) => void;
  end: () => void;
};

function respondWith(statusCode: number, body: string) {
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
      if (body) response.emit('data', Buffer.from(body));
      response.emit('end');
    };
    return req;
  };
}

const ok = JSON.stringify({ ok: true });
const gatewayPage = '<html><body>502 Bad Gateway</body></html>';

function get(retry?: { maxRetries: number }) {
  return airtableRequestRaw({
    apiKey: 'pat123',
    method: 'GET',
    path: '/meta/bases',
    retry,
  });
}

describe('response status classification', () => {
  beforeEach(() => {
    requestMock.mockReset();
    sleepMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
  });

  it.each([502, 504])(
    'retries a %i response like any other 5xx',
    async (statusCode) => {
      requestMock
        .mockImplementationOnce(
          respondWith(
            statusCode,
            JSON.stringify({ error: { type: 'GATEWAY', message: 'upstream' } })
          )
        )
        .mockImplementationOnce(respondWith(200, ok));

      await expect(get()).resolves.toEqual({ ok: true });
      expect(requestMock).toHaveBeenCalledTimes(2);
    }
  );

  it('retries a 5xx whose body is an HTML page from a gateway', async () => {
    requestMock
      .mockImplementationOnce(respondWith(503, gatewayPage))
      .mockImplementationOnce(respondWith(200, ok));

    await expect(get()).resolves.toEqual({ ok: true });
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('reports a non-JSON error body as an AirtableApiError with its status code', async () => {
    requestMock.mockImplementationOnce(respondWith(502, gatewayPage));

    const error = await get({ maxRetries: 0 }).catch((caught) => caught);

    expect(error).toBeInstanceOf(AirtableApiError);
    expect(error).toMatchObject({ statusCode: 502, retryable: true });
  });

  it('keeps 4xx errors with non-JSON bodies unretried', async () => {
    requestMock.mockImplementationOnce(
      respondWith(404, '<html>Not Found</html>')
    );

    await expect(get()).rejects.toMatchObject({
      name: 'AirtableApiError',
      statusCode: 404,
      retryable: false,
    });
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it('resolves a 204 response with an empty body as undefined', async () => {
    requestMock.mockImplementationOnce(respondWith(204, ''));

    await expect(
      airtableRequestRaw({
        apiKey: 'pat123',
        method: 'DELETE',
        path: '/bases/app123/webhooks/ach123',
      })
    ).resolves.toBeUndefined();
  });

  it.each(['', '<html>Maintenance</html>'])(
    'rejects a 200 whose body is not JSON (%j) with a parse error',
    async (body) => {
      requestMock.mockImplementationOnce(respondWith(200, body));

      const error = await get().catch((caught) => caught);

      expect(error).not.toBeInstanceOf(AirtableApiError);
      expect(error.message).toMatch(/Failed to parse response as JSON/);
      expect(requestMock).toHaveBeenCalledTimes(1);
    }
  );
});
