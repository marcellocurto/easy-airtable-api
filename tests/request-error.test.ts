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

import { AirtableApiError, airtableRequest } from '../src/requests.js';

describe('airtableRequest errors', () => {
  beforeEach(() => {
    requestMock.mockReset();
    sleepMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
  });


  it('throws a structured AirtableApiError when Airtable returns an error payload', async () => {
    requestMock.mockImplementationOnce((options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = 404;
      response.statusMessage = 'Not Found';

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
                type: 'NOT_FOUND',
                message: 'Record missing',
              },
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    const promise = airtableRequest({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      endpoint: '/rec123',
      method: 'GET',
    });

    await expect(promise).rejects.toMatchObject({
      name: 'AirtableApiError',
      message: 'Record missing',
      statusCode: 404,
      airtableType: 'NOT_FOUND',
      retryable: false,
      request: {
        method: 'GET',
        baseId: 'app123',
        tableId: 'tbl123',
        path: '/rec123',
      },
    });

    await expect(promise).rejects.toBeInstanceOf(AirtableApiError);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock.mock.calls[0]?.[0]).toMatchObject({
      method: 'GET',
      hostname: 'api.airtable.com',
      path: '/v0/app123/tbl123/rec123',
    });
  });

  it('retries a 429 response with jittered backoff and returns the later success payload', async () => {
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
                  message: 'Slow down',
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
          response.emit(
            'data',
            Buffer.from(
              JSON.stringify({
                id: 'rec123',
                createdTime: '2024-01-01T00:00:00.000Z',
                fields: { Name: 'Recovered' },
              })
            )
          );
          response.emit('end');
        };

        return req;
      });

    try {
      const result = await airtableRequest<{ id: string; createdTime: string; fields: { Name: string } }>({
        apiKey: 'pat123',
        baseId: 'app123',
        tableId: 'tbl123',
        endpoint: '/rec123',
        method: 'GET',
      });

      expect(result).toEqual({
        id: 'rec123',
        createdTime: '2024-01-01T00:00:00.000Z',
        fields: { Name: 'Recovered' },
      });
      expect(requestMock).toHaveBeenCalledTimes(2);
      expect(sleepMock).toHaveBeenCalledWith(250);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('prefers Retry-After when Airtable rate limits a request', async () => {
    requestMock
      .mockImplementationOnce((options, callback) => {
        const response = new EventEmitter() as EventEmitter & {
          statusCode?: number;
          statusMessage?: string;
          headers?: Record<string, string>;
        };
        response.statusCode = 429;
        response.statusMessage = 'Too Many Requests';
        response.headers = { 'retry-after': '2' };

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
                  message: 'Slow down',
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
          response.emit(
            'data',
            Buffer.from(
              JSON.stringify({
                id: 'rec999',
                createdTime: '2024-01-01T00:00:00.000Z',
                fields: { Name: 'Recovered after header' },
              })
            )
          );
          response.emit('end');
        };

        return req;
      });

    const result = await airtableRequest<{
      id: string;
      createdTime: string;
      fields: { Name: string };
    }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      endpoint: '/rec999',
      method: 'GET',
    });

    expect(result.id).toBe('rec999');
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledWith(2000);
  });

  it('retries a transient 503 response and later succeeds', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    requestMock
      .mockImplementationOnce((options, callback) => {
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
          response.emit(
            'data',
            Buffer.from(
              JSON.stringify({
                id: 'rec503',
                createdTime: '2024-01-01T00:00:00.000Z',
                fields: { Name: 'Recovered after 503' },
              })
            )
          );
          response.emit('end');
        };

        return req;
      });

    try {
      const result = await airtableRequest<{
        id: string;
        createdTime: string;
        fields: { Name: string };
      }>({
        apiKey: 'pat123',
        baseId: 'app123',
        tableId: 'tbl123',
        endpoint: '/rec503',
        method: 'GET',
      });

      expect(result.id).toBe('rec503');
      expect(requestMock).toHaveBeenCalledTimes(2);
      expect(sleepMock).toHaveBeenCalledWith(250);
    } finally {
      randomSpy.mockRestore();
    }
  });
});
