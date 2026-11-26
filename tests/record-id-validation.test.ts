import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/requests.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/requests.js')>();
  return { ...actual, airtableRequest: vi.fn() };
});

import {
  deleteRecord,
  getRecord,
  replaceRecord,
  updateRecord,
} from '../src/index.js';
import { airtableRequest } from '../src/requests.js';

const target = { apiKey: 'pat123', baseId: 'app123', tableId: 'tbl123' };

describe('single-record helpers', () => {
  beforeEach(() => {
    vi.mocked(airtableRequest).mockReset();
  });

  it.each([
    ['getRecord', () => getRecord({ ...target, recordId: '' })],
    [
      'updateRecord',
      () => updateRecord({ ...target, recordId: '', fields: {} }),
    ],
    [
      'replaceRecord',
      () => replaceRecord({ ...target, recordId: '', fields: {} }),
    ],
    ['deleteRecord', () => deleteRecord({ ...target, recordId: '' })],
  ])(
    '%s rejects an empty record ID before sending a request',
    async (_name, call) => {
      await expect(call()).rejects.toThrow('Record ID is not set.');
      expect(vi.mocked(airtableRequest)).not.toHaveBeenCalled();
    }
  );

  it('encodes the record ID so its characters stay part of the path', async () => {
    vi.mocked(airtableRequest).mockResolvedValueOnce({});

    await getRecord({ ...target, recordId: 'rec1?x=1#y/z' });

    expect(vi.mocked(airtableRequest).mock.calls[0][0].endpoint).toBe(
      '/rec1%3Fx%3D1%23y%2Fz'
    );
  });
});
