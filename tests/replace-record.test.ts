import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', () => ({
  airtableRequest: vi.fn(),
}));

import { replaceRecord } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('replaceRecord', () => {
  it('replaces a single record with PUT through the public API', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest.mockResolvedValueOnce({
      id: 'rec123',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: {
        Name: 'Updated project',
      },
    });

    const result = await replaceRecord<{ Name: string }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      recordId: 'rec123',
      fields: {
        Name: 'Updated project',
      },
      options: {
        typecast: true,
        returnFieldsByFieldId: true,
      },
    });

    expect(result).toEqual({
      id: 'rec123',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: {
        Name: 'Updated project',
      },
    });

    expect(mockedRequest).toHaveBeenCalledWith({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      endpoint: '/rec123',
      method: 'PUT',
      body: {
        fields: {
          Name: 'Updated project',
        },
        typecast: true,
        returnFieldsByFieldId: true,
      },
    });
  });
});
