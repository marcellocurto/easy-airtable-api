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

import { AirtableApiError, airtableRequestRaw } from '../src/index.js';

describe('airtableRequestRaw', () => {
  beforeEach(() => {
    requestMock.mockReset();
    sleepMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
  });

  it('accepts Airtable-style /v0 paths, serializes query arrays, and sends JSON bodies', async () => {
    const writeMock = vi.fn();

    requestMock.mockImplementationOnce((options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = 200;
      response.statusMessage = 'OK';

      const req = new EventEmitter() as EventEmitter & {
        write: (chunk: string) => void;
        end: () => void;
      };

      req.write = writeMock;
      req.end = () => {
        callback(response);
        response.emit('data', Buffer.from(JSON.stringify({ ok: true })));
        response.emit('end');
      };

      return req;
    });

    const result = await airtableRequestRaw<{ ok: boolean }>({
      apiKey: 'pat123',
      method: 'POST',
      path: '/v0/meta/bases',
      query: {
        offset: 'page/2?cursor=yes',
        include: ['tables', 'views'],
      },
      body: {
        hello: 'world',
      },
    });

    expect(result).toEqual({ ok: true });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock.mock.calls[0]?.[0]).toMatchObject({
      method: 'POST',
      hostname: 'api.airtable.com',
      path: '/v0/meta/bases?offset=page%2F2%3Fcursor%3Dyes&include=tables&include=views',
    });
    expect(writeMock).toHaveBeenCalledWith('{"hello":"world"}');
  });

  it('surfaces structured Airtable errors with the caller-facing raw path', async () => {
    requestMock.mockImplementationOnce((options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = 422;
      response.statusMessage = 'Unprocessable Entity';

      const req = new EventEmitter() as EventEmitter & {
        write: (chunk: string) => void;
        end: () => void;
      };

      req.write = () => undefined;
      req.end = () => {
        callback(response);
        response.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              error: {
                type: 'INVALID_REQUEST_UNKNOWN',
                message: 'Bad raw request',
              },
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    const promise = airtableRequestRaw({
      apiKey: 'pat123',
      method: 'GET',
      path: '/v0/meta/bases',
      query: {
        offset: 'cursor/1',
      },
    });

    await expect(promise).rejects.toMatchObject({
      name: 'AirtableApiError',
      statusCode: 422,
      airtableType: 'INVALID_REQUEST_UNKNOWN',
      message: 'Bad raw request',
      retryable: false,
      request: {
        method: 'GET',
        path: '/v0/meta/bases?offset=cursor%2F1',
      },
    });
    await expect(promise).rejects.toBeInstanceOf(AirtableApiError);
  });

  it('can disable retries for specific failure classes', async () => {
    requestMock.mockImplementationOnce((options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = 429;
      response.statusMessage = 'Too Many Requests';

      const req = new EventEmitter() as EventEmitter & {
        write: (chunk: string) => void;
        end: () => void;
      };

      req.write = () => undefined;
      req.end = () => {
        callback(response);
        response.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              error: {
                type: 'RATE_LIMIT_REACHED',
                message: 'Do not retry me',
              },
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    const promise = airtableRequestRaw({
      apiKey: 'pat123',
      method: 'GET',
      path: '/v0/meta/bases',
      retry: {
        retryOn429: false,
      },
    });

    await expect(promise).rejects.toMatchObject({
      statusCode: 429,
      airtableType: 'RATE_LIMIT_REACHED',
      message: 'Do not retry me',
    });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('uses custom retry limits and backoff settings', async () => {
    const randomSpy = vi.spyOn(Math, 'random');

    requestMock.mockImplementation((options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = 503;
      response.statusMessage = 'Service Unavailable';

      const req = new EventEmitter() as EventEmitter & {
        write: (chunk: string) => void;
        end: () => void;
      };

      req.write = () => undefined;
      req.end = () => {
        callback(response);
        response.emit('data', Buffer.from(JSON.stringify({})));
        response.emit('end');
      };

      return req;
    });

    try {
      await expect(
        airtableRequestRaw({
          apiKey: 'pat123',
          method: 'GET',
          path: '/v0/meta/bases/app123/tables',
          retry: {
            maxRetries: 1,
            baseDelayMs: 123,
            maxDelayMs: 123,
            useJitter: false,
          },
        })
      ).rejects.toMatchObject({
        statusCode: 503,
        retryable: true,
      });

      expect(requestMock).toHaveBeenCalledTimes(2);
      expect(sleepMock).toHaveBeenCalledTimes(1);
      expect(sleepMock).toHaveBeenCalledWith(123);
      expect(randomSpy).not.toHaveBeenCalled();
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('reuses shared structured errors and retry behavior', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    requestMock
      .mockImplementationOnce((options, callback) => {
        const response = new EventEmitter() as EventEmitter & {
          statusCode?: number;
          statusMessage?: string;
        };
        response.statusCode = 429;
        response.statusMessage = 'Too Many Requests';

        const req = new EventEmitter() as EventEmitter & {
          write: (chunk: string) => void;
          end: () => void;
        };

        req.write = () => undefined;
        req.end = () => {
          callback(response);
          response.emit(
            'data',
            Buffer.from(
              JSON.stringify({
                error: {
                  type: 'RATE_LIMIT_REACHED',
                  message: 'Slow down raw client',
                },
              })
            )
          );
          response.emit('end');
        };

        return req;
      })
      .mockImplementationOnce((options, callback) => {
        const response = new EventEmitter() as EventEmitter & {
          statusCode?: number;
          statusMessage?: string;
        };
        response.statusCode = 200;
        response.statusMessage = 'OK';

        const req = new EventEmitter() as EventEmitter & {
          write: (chunk: string) => void;
          end: () => void;
        };

        req.write = () => undefined;
        req.end = () => {
          callback(response);
          response.emit('data', Buffer.from(JSON.stringify({ ok: true })));
          response.emit('end');
        };

        return req;
      });

    try {
      const result = await airtableRequestRaw<{ ok: boolean }>({
        apiKey: 'pat123',
        method: 'GET',
        path: '/v0/meta/bases/app123/tables',
      });

      expect(result).toEqual({ ok: true });
      expect(requestMock).toHaveBeenCalledTimes(2);
      expect(sleepMock).toHaveBeenCalledWith(250);
    } finally {
      randomSpy.mockRestore();
    }
  });
});
