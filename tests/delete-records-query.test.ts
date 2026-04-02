import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', () => ({
  airtableRequest: vi.fn(),
}));

import { deleteRecords } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('deleteRecords query serialization', () => {
  it('serializes repeated record ids safely in the request endpoint', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest.mockResolvedValueOnce({
      records: [
        { id: 'rec/1', deleted: true },
        { id: 'rec 2', deleted: true },
      ],
    });

    await deleteRecords({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      recordIds: ['rec/1', 'rec 2'],
    });

    const requestArgument = mockedRequest.mock.calls[0]?.[0];
    expect(requestArgument?.method).toBe('DELETE');
    expect(requestArgument?.endpoint.startsWith('?')).toBe(true);

    const params = new URLSearchParams(requestArgument?.endpoint.slice(1) ?? '');
    expect(params.getAll('records[]')).toEqual(['rec/1', 'rec 2']);
  });
});
