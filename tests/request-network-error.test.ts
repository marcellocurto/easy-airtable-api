import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock, sleepMock, randomMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  sleepMock: vi.fn(() => Promise.resolve()),
  randomMock: vi.fn(() => 0.5),
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

import { airtableRequest } from '../src/requests.js';

describe('airtableRequest network errors', () => {
  beforeEach(() => {
    requestMock.mockReset();
    sleepMock.mockReset();
    randomMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
    randomMock.mockReturnValue(0.5);
    vi.spyOn(Math, 'random').mockImplementation(randomMock);
  });

  it('retries a transient request error and later succeeds', async () => {
    requestMock
      .mockImplementationOnce(() => {
        const req = new EventEmitter() as EventEmitter & {
          write: (chunk: string) => void;
          end: () => void;
        };

        req.write = () => undefined;
        req.end = () => {
          req.emit('error', new Error('socket hang up'));
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
                id: 'recnet1',
                createdTime: '2024-01-01T00:00:00.000Z',
                fields: { Name: 'Recovered network request' },
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
      endpoint: '/recnet1',
      method: 'GET',
    });

    expect(result.id).toBe('recnet1');
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledWith(250);
  });
});
