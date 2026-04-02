import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', () => ({
  airtableRequest: vi.fn(),
}));

import { deleteRecord } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('deleteRecord', () => {
  it('deletes a single record through the public API', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest.mockResolvedValueOnce({
      id: 'rec123',
      deleted: true,
    });

    const result = await deleteRecord({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      recordId: 'rec123',
    });

    expect(result).toEqual({
      id: 'rec123',
      deleted: true,
    });

    expect(mockedRequest).toHaveBeenCalledWith({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      endpoint: '/rec123',
      method: 'DELETE',
    });
  });
});
