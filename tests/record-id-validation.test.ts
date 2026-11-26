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
});
