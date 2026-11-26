import { EventEmitter } from 'node:events';
import type { RequestOptions } from 'node:https';
import { describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('https', () => ({ request: requestMock }));

import { airtableRequestRaw } from '../src/requests.js';

describe('https apiURL', () => {
  it('sends requests to the port of a custom https apiURL', async () => {
    requestMock.mockImplementationOnce(
      (
        _options: RequestOptions,
        callback: (response: EventEmitter & { statusCode?: number }) => void
      ) => {
        const response = new EventEmitter() as EventEmitter & {
          statusCode?: number;
        };
        response.statusCode = 200;

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
      }
    );

    await airtableRequestRaw({
      apiKey: 'pat123',
      method: 'GET',
      path: '/meta/bases',
      apiURL: 'https://example.test:8443/v0',
    });

    expect(requestMock.mock.calls[0][0]).toMatchObject({
      hostname: 'example.test',
      port: '8443',
      path: '/v0/meta/bases',
    });
  });
});
