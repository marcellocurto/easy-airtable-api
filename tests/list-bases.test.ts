import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('https', () => ({
  request: requestMock,
}));

import { AirtableApiError, listBases } from '../src/index.js';

describe('listBases', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('requests the metadata base listing endpoint with offset pagination', async () => {
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

      req.write = () => undefined;
      req.end = () => {
        callback(response);
        response.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              bases: [
                {
                  id: 'app123',
                  name: 'Product Roadmap',
                  permissionLevel: 'create',
                },
              ],
              offset: 'itrNext',
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    const result = await listBases({
      apiKey: 'pat123',
      offset: 'page/2?cursor=yes',
    });

    expect(result).toEqual({
      bases: [
        {
          id: 'app123',
          name: 'Product Roadmap',
          permissionLevel: 'create',
        },
      ],
      offset: 'itrNext',
    });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock.mock.calls[0]?.[0]).toMatchObject({
      method: 'GET',
      hostname: 'api.airtable.com',
      path: '/v0/meta/bases?offset=page%2F2%3Fcursor%3Dyes',
    });
  });

  it('forwards retry configuration through the public metadata helper', async () => {
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
                message: 'Stop here',
              },
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    const promise = listBases({
      apiKey: 'pat123',
      retry: {
        retryOn429: false,
      },
    });

    await expect(promise).rejects.toMatchObject({
      statusCode: 429,
      airtableType: 'RATE_LIMIT_REACHED',
      message: 'Stop here',
    });
    await expect(promise).rejects.toBeInstanceOf(AirtableApiError);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});
