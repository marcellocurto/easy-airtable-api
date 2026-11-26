import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('https', () => ({ request: requestMock }));

import { airtableRequestRaw } from '../src/requests.js';

type FakeRequest = EventEmitter & {
  write: (chunk: string) => void;
  end: () => void;
};

type FakeResponse = EventEmitter & {
  statusCode?: number;
  headers?: Record<string, string>;
};

const REQUESTS_PER_SECOND = 5;
const LOCKOUT_MS = 30000;

/**
 * A stand-in for one Airtable base: it accepts 5 requests in any one-second
 * window, and a request beyond that locks the whole base for 30 seconds, during
 * which every request gets a 429. It reads the clock from `Date.now()`, which
 * the tests fake, so the 30-second lockouts pass instantly.
 */
function rateLimitedBase() {
  let accepted: number[] = [];
  let lockedUntil = -Infinity;

  return (
    _options: unknown,
    callback: (response: FakeResponse) => void
  ): FakeRequest => {
    const req = new EventEmitter() as FakeRequest;
    req.write = () => undefined;
    req.end = () => {
      const now = Date.now();
      accepted = accepted.filter((time) => time > now - 1000);
      let statusCode = 200;
      if (now < lockedUntil) {
        statusCode = 429;
      } else if (accepted.length >= REQUESTS_PER_SECOND) {
        statusCode = 429;
        lockedUntil = now + LOCKOUT_MS;
      } else {
        accepted.push(now);
      }

      const response = new EventEmitter() as FakeResponse;
      response.statusCode = statusCode;
      response.headers = {};
      callback(response);
      response.emit(
        'data',
        Buffer.from(
          JSON.stringify(
            statusCode === 200
              ? { ok: true }
              : {
                  error: {
                    type: 'RATE_LIMIT_REACHED',
                    message: 'Rate limit exceeded',
                  },
                }
          )
        )
      );
      response.emit('end');
    };
    return req;
  };
}

/** A seeded generator, so each run draws the same jitter. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sends 30 requests at once and counts how many succeed. */
async function burst(useJitter: boolean): Promise<number> {
  const results = Promise.allSettled(
    Array.from({ length: 30 }, () =>
      airtableRequestRaw({
        apiKey: 'pat123',
        method: 'GET',
        path: '/app123/tbl123',
        retry: { maxRetries: 3, useJitter },
      })
    )
  );
  await vi.runAllTimersAsync();
  return (await results).filter(({ status }) => status === 'fulfilled').length;
}

describe('a burst of requests against a rate-limited base', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockImplementation(seededRandom(1));
    requestMock.mockReset();
    requestMock.mockImplementation(rateLimitedBase());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('succeeds when jitter spreads the retries after each lockout', async () => {
    expect(await burst(true)).toBe(30);
  });

  it('loses requests when every caller retries the moment the lockout ends', async () => {
    // Without jitter, all refused callers retry together, so each lockout
    // lets only the first 5 through before the next one starts.
    expect(await burst(false)).toBe(20);
  });
});
