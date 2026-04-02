import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', () => ({
  airtableRequest: vi.fn(),
}));

import { replaceRecords } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('replaceRecords', () => {
  it('replaces multiple records with PUT through the public API', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest.mockResolvedValueOnce({
      records: [
        {
          id: 'rec1',
          createdTime: '2024-01-01T00:00:00.000Z',
          fields: { Name: 'One' },
        },
        {
          id: 'rec2',
          createdTime: '2024-01-01T00:00:00.000Z',
          fields: { Name: 'Two' },
        },
      ],
    });

    const result = await replaceRecords<{ Name: string }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      records: [
        { id: 'rec1', fields: { Name: 'One' } },
        { id: 'rec2', fields: { Name: 'Two' } },
      ],
      options: {
        typecast: true,
        returnFieldsByFieldId: true,
      },
    });

    expect(result.records).toHaveLength(2);
    expect(mockedRequest).toHaveBeenCalledWith({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      endpoint: '/',
      method: 'PUT',
      body: {
        records: [
          { id: 'rec1', fields: { Name: 'One' } },
          { id: 'rec2', fields: { Name: 'Two' } },
        ],
        typecast: true,
        returnFieldsByFieldId: true,
      },
    });
  });
});
