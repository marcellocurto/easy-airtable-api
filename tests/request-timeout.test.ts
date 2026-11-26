import { createServer, request as httpRequest, Server } from 'node:http';
import type { RequestOptions } from 'node:https';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Requests go to a real local HTTP server so Node's own socket timeout and
// destroy behavior are under test. The 5-minute production timeout is
// shortened to keep the tests fast.
const SOCKET_TIMEOUT_MS = 50;

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
      {
        ...options,
        hostname: '127.0.0.1',
        port: serverPort.value,
        // Shorten only a timeout the library actually sets (0 means none), so
        // these tests hang and fail if `apiRequest` stops passing one.
        timeout: options.timeout ? SOCKET_TIMEOUT_MS : undefined,
      },
      callback
    ),
}));

vi.mock('../src/utils.js', async () => {
  const actual = await vi.importActual('../src/utils.js');
  return {
    ...actual,
    delay: sleepMock,
  };
});

import { airtableRequest } from '../src/requests.js';

type Handler = Parameters<typeof createServer>[1];

const record = {
  id: 'rec123',
  createdTime: '2024-01-01T00:00:00.000Z',
  fields: { Name: 'Answered' },
};

let server: Server;

async function startServer(handler: Handler) {
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

describe('airtableRequest socket timeouts', { timeout: 2000 }, () => {
  beforeEach(() => {
    sleepMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  it('rejects when Airtable never answers', async () => {
    await startServer(() => undefined);

    await expect(getRecord(0)).rejects.toThrow(/timed out/);
  });

  it('rejects when Airtable stops sending the response body', async () => {
    await startServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write('{"id":');
    });

    await expect(getRecord(0)).rejects.toThrow(/timed out/);
  });

  it('retries a timed-out request and returns the later answer', async () => {
    let attempts = 0;
    await startServer((_req, res) => {
      attempts += 1;
      if (attempts === 1) return;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(record));
    });

    await expect(getRecord(1)).resolves.toEqual(record);
    expect(attempts).toBe(2);
  });
});
