import { createServer, IncomingMessage, Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';

import { encodePathSegment } from '../src/index.js';
import { airtableRequestRaw } from '../src/requests.js';

// A real local HTTP server, so the test shows where the request actually goes.
let server: Server | undefined;

function startServer(onRequest: (req: IncomingMessage) => void) {
  return new Promise<number>((resolve) => {
    server = createServer((req, res) => {
      onRequest(req);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    server.listen(0, '127.0.0.1', () => {
      resolve((server?.address() as AddressInfo).port);
    });
  });
}

afterEach(async () => {
  await new Promise((resolve) => server?.close(resolve));
  server = undefined;
});

// Some machines and containers have no IPv6 loopback; the IPv6 test needs one.
const hasIpv6Loopback = await new Promise<boolean>((resolve) => {
  const probe = createServer();
  probe.once('error', () => resolve(false));
  probe.listen(0, '::1', () => probe.close(() => resolve(true)));
});

describe('apiURL', () => {
  it('sends requests to the protocol, host, and port of a custom apiURL', async () => {
    const paths: string[] = [];
    const port = await startServer((req) => paths.push(req.url ?? ''));

    const result = await airtableRequestRaw({
      apiKey: 'pat123',
      method: 'GET',
      path: '/meta/bases',
      apiURL: `http://127.0.0.1:${port}/v0`,
      retry: { maxRetries: 0 },
    });

    expect(result).toEqual({ ok: true });
    expect(paths).toEqual(['/v0/meta/bases']);
  });

  it.skipIf(!hasIpv6Loopback)(
    'connects to an IPv6 literal host in a custom apiURL',
    async () => {
      const paths: string[] = [];
      server = createServer((req, res) => {
        paths.push(req.url ?? '');
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
      const port = await new Promise<number>((resolve) => {
        server?.listen(0, '::1', () =>
          resolve((server?.address() as AddressInfo).port)
        );
      });

      await expect(
        airtableRequestRaw({
          apiKey: 'pat123',
          method: 'GET',
          path: '/meta/bases',
          apiURL: `http://[::1]:${port}/v0`,
          retry: { maxRetries: 0 },
        })
      ).resolves.toEqual({ ok: true });
      expect(paths).toEqual(['/v0/meta/bases']);
    }
  );

  it('sends a hand-built path with IDs encoded by encodePathSegment', async () => {
    const paths: string[] = [];
    const port = await startServer((req) => paths.push(req.url ?? ''));
    const field = 'Photos & scans';

    await airtableRequestRaw({
      apiKey: 'pat123',
      method: 'POST',
      path: `/${encodePathSegment('app123', 'Base ID')}/${encodePathSegment('rec123', 'Record ID')}/${encodePathSegment(field, 'Field')}/uploadAttachment`,
      body: { contentType: 'text/plain', file: 'aGk=', filename: 'hi.txt' },
      apiURL: `http://127.0.0.1:${port}/v0`,
      retry: { maxRetries: 0 },
    });

    expect(paths).toEqual([
      '/v0/app123/rec123/Photos%20%26%20scans/uploadAttachment',
    ]);
    expect(() => encodePathSegment('..', 'Record ID')).toThrow(
      'Record ID must not be "." or "..".'
    );
  });
});
