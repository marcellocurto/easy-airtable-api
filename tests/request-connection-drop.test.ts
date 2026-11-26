import { createServer, request as httpRequest, Server } from 'node:http';
import type { RequestOptions } from 'node:https';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Requests go to a real local HTTP server, so Node's own handling of a socket
// that closes mid-response is what the tests exercise.
const { serverPort, sleepMock } = vi.hoisted(() => ({
  serverPort: { value: 0 },
  sleepMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('https', () => ({
  request: (
    options: RequestOptions,
    callback: Parameters<typeof httpRequest>[1]
  ) =>
    httpRequest(
      { ...options, hostname: '127.0.0.1', port: serverPort.value },
      callback
    ),
}));

vi.mock('../src/utils.js', async () => {
  const actual = await vi.importActual('../src/utils.js');
  return { ...actual, delay: sleepMock };
});

import { airtableRequest } from '../src/requests.js';

const record = {
  id: 'rec123',
  createdTime: '2024-01-01T00:00:00.000Z',
  fields: { Name: 'Answered' },
};

let server: Server;

async function startServer(handler: Parameters<typeof createServer>[1]) {
  server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  serverPort.value = (server.address() as AddressInfo).port;
}

function getRecord(maxRetries: number) {
  return airtableRequest<typeof record>({
    apiKey: 'pat123',
    baseId: 'app123',
    tableId: 'tbl123',
    endpoint: '/rec123',
    method: 'GET',
    retry: { maxRetries },
  });
}

// A regression here hangs, so these tests get a short timeout of their own.
describe(
  'airtableRequest when the connection drops mid-response',
  { timeout: 10_000 },
  () => {
    beforeEach(() => {
      sleepMock.mockReset();
      sleepMock.mockResolvedValue(undefined);
    });

    afterEach(async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    });

    it('rejects instead of hanging when the server closes the connection partway through the body', async () => {
      await startServer((_req, res) => {
        res.writeHead(200, {
          'content-type': 'application/json',
          'content-length': '500',
        });
        res.write('{"id":"rec123",');
        setTimeout(() => res.socket?.destroy(), 20);
      });

      const error = await getRecord(0).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error & { cause?: { code?: string } }).cause?.code).toBe(
        'ECONNRESET'
      );
    });

    it('retries a response that was cut off and returns the later answer', async () => {
      let attempts = 0;
      await startServer((_req, res) => {
        attempts += 1;
        if (attempts === 1) {
          res.writeHead(200, {
            'content-type': 'application/json',
            'content-length': '500',
          });
          res.write('{"id":"rec123",');
          setTimeout(() => res.socket?.destroy(), 20);
          return;
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(record));
      });

      await expect(getRecord(1)).resolves.toEqual(record);
      expect(attempts).toBe(2);
    });
  }
);
