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

describe('airtableRequest network error exhaustion', () => {
  beforeEach(() => {
    requestMock.mockReset();
    sleepMock.mockReset();
    randomMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
    randomMock.mockReturnValue(0.5);
    vi.spyOn(Math, 'random').mockImplementation(randomMock);
  });

  it('stops retrying after repeated transient network failures', async () => {
    requestMock.mockImplementation(() => {
      const req = new EventEmitter() as EventEmitter & {
        write: (chunk: string) => void;
        end: () => void;
      };

      req.write = () => undefined;
      req.end = () => {
        req.emit('error', new Error('socket hang up'));
      };

      return req;
    });

    await expect(
      airtableRequest({
        apiKey: 'pat123',
        baseId: 'app123',
        tableId: 'tbl123',
        endpoint: '/recnet2',
        method: 'GET',
      })
    ).rejects.toThrow(/socket hang up/i);

    expect(requestMock).toHaveBeenCalledTimes(6);
    expect(sleepMock).toHaveBeenCalledTimes(5);
    expect(sleepMock.mock.calls.map((call) => call[0])).toEqual([
      250,
      500,
      1000,
      2000,
      4000,
    ]);
  });
});
