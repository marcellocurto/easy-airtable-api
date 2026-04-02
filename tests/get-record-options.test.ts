import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/requests.js')>();
  return {
    ...actual,
    airtableRequest: vi.fn(),
  };
});

import { getRecord } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

describe('getRecord options', () => {
  it('passes supported query options through the public API', async () => {
    const mockedRequest = vi.mocked(airtableRequest);
    mockedRequest.mockResolvedValueOnce({
      id: 'rec123',
      createdTime: '2024-01-01T00:00:00.000Z',
      fields: { Name: 'Project' },
    });

    await getRecord<{ Name: string }>({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      recordId: 'rec123',
      options: {
        cellFormat: 'json',
        returnFieldsByFieldId: true,
      },
    });

    const requestArgument = mockedRequest.mock.calls[0]?.[0];
    expect(requestArgument?.method).toBe('GET');
    expect(requestArgument?.endpoint.startsWith('/rec123?')).toBe(true);

    const query = new URLSearchParams(
      requestArgument?.endpoint.split('?')[1] ?? ''
    );

    expect(query.get('cellFormat')).toBe('json');
    expect(query.get('returnFieldsByFieldId')).toBe('true');
  });
});
