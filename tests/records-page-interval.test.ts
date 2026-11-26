import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sleepMock } = vi.hoisted(() => ({
  sleepMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('../src/requests.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/requests.js')>();
  return { ...actual, airtableRequest: vi.fn() };
});

vi.mock('../src/utils.js', async () => {
  const actual = await vi.importActual('../src/utils.js');
  return { ...actual, delay: sleepMock };
});

import { getRecords } from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

const page = (id: string, offset?: string) => ({
  records: [{ id, createdTime: '2024-01-01T00:00:00.000Z', fields: {} }],
  offset,
});

describe('getRecords page interval', () => {
  beforeEach(() => {
    vi.mocked(airtableRequest).mockReset();
    sleepMock.mockReset();
    sleepMock.mockResolvedValue(undefined);
  });

  it('waits requestInterval between pages when reading a whole table', async () => {
    vi.mocked(airtableRequest)
      .mockResolvedValueOnce(page('rec1', 'page2'))
      .mockResolvedValueOnce(page('rec2', 'page3'))
      .mockResolvedValueOnce(page('rec3'));

    const records = await getRecords({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      options: { requestInterval: 250 },
    });

    expect(records.map((record) => record.id)).toEqual([
      'rec1',
      'rec2',
      'rec3',
    ]);
    expect(sleepMock.mock.calls.map((call) => call[0])).toEqual([250, 250]);
  });

  it('keeps requestInterval out of the request sent to Airtable', async () => {
    vi.mocked(airtableRequest).mockResolvedValueOnce(page('rec1'));

    await getRecords({
      apiKey: 'pat123',
      baseId: 'app123',
      tableId: 'tbl123',
      options: { pageSize: 50, requestInterval: 250 },
    });

    expect(vi.mocked(airtableRequest).mock.calls[0][0].body).toEqual({
      pageSize: 50,
    });
  });

  it('waits 500 ms between pages by default', async () => {
    vi.mocked(airtableRequest)
      .mockResolvedValueOnce(page('rec1', 'page2'))
      .mockResolvedValueOnce(page('rec2'));

    await getRecords({ apiKey: 'pat123', baseId: 'app123', tableId: 'tbl123' });

    expect(sleepMock.mock.calls.map((call) => call[0])).toEqual([500]);
  });
});
