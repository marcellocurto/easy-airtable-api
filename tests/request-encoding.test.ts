import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('https', () => ({
  request: requestMock,
}));

import { airtableRequest } from '../src/requests.js';

describe('airtableRequest encoding', () => {
  it('encodes table names safely when building the Airtable request path', async () => {
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
              id: 'rec123',
              createdTime: '2024-01-01T00:00:00.000Z',
              fields: { Name: 'Encoded' },
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    await airtableRequest({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'Project/Tasks',
      endpoint: '/rec123',
      method: 'GET',
    });

    expect(requestMock.mock.calls[0]?.[0]).toMatchObject({
      path: '/v0/app123/Project%2FTasks/rec123',
    });
  });
});
