import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('https', () => ({
  request: requestMock,
}));

import { airtableRequest } from '../src/requests.js';

describe('airtableRequest response decoding', () => {
  it('decodes multi-byte UTF-8 characters split across response chunks', async () => {
    const body = Buffer.from(
      JSON.stringify({
        id: 'rec1',
        createdTime: '2024-01-01T00:00:00.000Z',
        fields: { Name: '香港貓' },
      })
    );
    // Split inside the three-byte encoding of 港 so neither chunk is valid
    // UTF-8 on its own.
    const splitAt = body.indexOf(Buffer.from('港')) + 1;

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
        response.emit('data', body.subarray(0, splitAt));
        response.emit('data', body.subarray(splitAt));
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
      endpoint: '/rec1',
      method: 'GET',
    });

    expect(result.fields.Name).toBe('香港貓');
  });
});
