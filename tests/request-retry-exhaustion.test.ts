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

describe('airtableRequest retry exhaustion', () => {
  beforeEach(() => {
    requestMock.mockReset();
    sleepMock.mockReset();
    randomMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
    randomMock.mockReturnValue(0.5);
    vi.spyOn(Math, 'random').mockImplementation(randomMock);
  });

  it('stops retrying after the configured retry budget is exhausted', async () => {
    requestMock.mockImplementation((options, callback) => {
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
                message: 'Still rate limited',
              },
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    await expect(
      airtableRequest({
        apiKey: 'pat123',
        baseId: 'app123',
        tableId: 'tbl123',
        endpoint: '/rec123',
        method: 'GET',
      })
    ).rejects.toMatchObject({
      name: 'AirtableApiError',
      statusCode: 429,
      airtableType: 'RATE_LIMIT_REACHED',
      retryable: true,
      message: 'Still rate limited',
    });

    expect(requestMock).toHaveBeenCalledTimes(6);
    expect(sleepMock).toHaveBeenCalledTimes(5);
    expect(sleepMock.mock.calls.map((call) => call[0])).toEqual([
      250,
      500,
      1000,
      2000,
      4000,
    ]);
    expect(Math.random).toHaveBeenCalledTimes(5);
  });
});
