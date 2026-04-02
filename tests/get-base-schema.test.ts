import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('https', () => ({
  request: requestMock,
}));

import { AirtableApiError, getBaseSchema } from '../src/index.js';

describe('getBaseSchema', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('surfaces shared structured Airtable errors for metadata failures', async () => {
    requestMock.mockImplementationOnce((options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = 403;
      response.statusMessage = 'Forbidden';

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
                type: 'INVALID_PERMISSIONS',
                message: 'You are not allowed to access this base schema',
              },
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    const promise = getBaseSchema({
      apiKey: 'pat123',
      baseId: 'app123',
    });

    await expect(promise).rejects.toMatchObject({
      name: 'AirtableApiError',
      statusCode: 403,
      airtableType: 'INVALID_PERMISSIONS',
      message: 'You are not allowed to access this base schema',
      retryable: false,
      request: {
        method: 'GET',
        baseId: 'app123',
      },
    });
    await expect(promise).rejects.toBeInstanceOf(AirtableApiError);
  });
});
