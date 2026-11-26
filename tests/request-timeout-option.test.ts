import { createServer, request as httpRequest, Server } from 'node:http';
import type { RequestOptions } from 'node:https';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { serverPort, timeouts } = vi.hoisted(() => ({
  serverPort: { value: 0 },
  timeouts: [] as Array<number | undefined>,
}));

// Route to a local server without touching the timeout, so the configured
// value is what Node uses.
vi.mock('https', () => ({
  request: (
    options: RequestOptions,
    callback: Parameters<typeof httpRequest>[1]
  ) => {
    timeouts.push(options.timeout);
    return httpRequest(
      { ...options, hostname: '127.0.0.1', port: serverPort.value },
      callback
    );
  },
}));

import { airtableRequestRaw } from '../src/requests.js';

let server: Server;

afterEach(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

describe('retry.timeoutMs', { timeout: 10_000 }, () => {
  it('fails an attempt after the configured inactivity timeout', async () => {
    server = createServer(() => undefined);
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve)
    );
    serverPort.value = (server.address() as AddressInfo).port;

    const started = Date.now();
    await expect(
      airtableRequestRaw({
        apiKey: 'pat123',
        method: 'GET',
        path: '/meta/bases',
        retry: { maxRetries: 0, timeoutMs: 100 },
      })
    ).rejects.toMatchObject({ cause: { code: 'ETIMEDOUT' } });
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it.each([0, -5, Number.NaN])(
    'uses the five-minute default for timeoutMs %s, which Node would treat as no timeout or reject',
    async (timeoutMs) => {
      server = createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('{}');
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      );
      serverPort.value = (server.address() as AddressInfo).port;
      timeouts.length = 0;

      await airtableRequestRaw({
        apiKey: 'pat123',
        method: 'GET',
        path: '/meta/bases',
        retry: { maxRetries: 0, timeoutMs },
      });

      expect(timeouts).toEqual([300000]);
    }
  );
});
