import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('https', () => ({
  request: requestMock,
}));

import { airtableRequest } from '../src/requests.js';

describe('airtableRequest success statuses', () => {
  it('treats non-200 2xx responses as success', async () => {
    requestMock.mockImplementationOnce((options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = 201;
      response.statusMessage = 'Created';

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
              id: 'rec201',
              createdTime: '2024-01-01T00:00:00.000Z',
              fields: { Name: 'Created' },
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
      endpoint: '/rec201',
      method: 'POST',
      body: {
        fields: { Name: 'Created' },
      },
    });

    expect(result).toEqual({
      id: 'rec201',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: { Name: 'Created' },
    });
  });
});
