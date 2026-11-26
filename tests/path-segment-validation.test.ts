import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('https', () => ({ request: requestMock }));

import { getBaseSchema } from '../src/bases.js';
import { airtableRequest } from '../src/requests.js';

// URL parsing collapses "." and ".." path segments, so these IDs would send the
// request to a different Airtable path with the caller's token.
describe('base and table IDs in request paths', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it.each([
    [
      'base',
      { baseId: '..', tableId: 'tbl123' },
      'Base ID must not be "." or "..".',
    ],
    [
      'table',
      { baseId: 'app123', tableId: '.' },
      'Table ID must not be "." or "..".',
    ],
  ])(
    'rejects a %s ID that URL parsing would collapse into another path',
    async (_kind, ids, message) => {
      await expect(
        airtableRequest({
          apiKey: 'pat123',
          ...ids,
          endpoint: '/rec123',
          method: 'DELETE',
        })
      ).rejects.toThrow(message);
      expect(requestMock).not.toHaveBeenCalled();
    }
  );

  it('rejects a dot base ID when fetching a base schema', async () => {
    await expect(
      getBaseSchema({ apiKey: 'pat123', baseId: '..' })
    ).rejects.toThrow('Base ID must not be "." or "..".');
    expect(requestMock).not.toHaveBeenCalled();
  });
});
