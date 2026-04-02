import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('https', () => ({
  request: requestMock,
}));

import { buildAirtableTypes } from '../src/codegen/index.js';

describe('Airtable codegen from metadata API', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('loads schema through the shared metadata API path', async () => {
    requestMock.mockImplementationOnce((options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = 200;
      response.statusMessage = 'OK';

      const req = new EventEmitter() as EventEmitter & {
        write: (chunk: string) => void;
        end: () => void;
      };

      req.write = () => undefined;
      req.end = () => {
        callback(response);
        response.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              tables: [
                {
                  id: 'tblProjects',
                  name: 'Projects',
                  primaryFieldId: 'fldName',
                  fields: [
                    { id: 'fldName', name: 'Name', type: 'singleLineText' },
                    {
                      id: 'fldStatus',
                      name: 'Status',
                      type: 'singleSelect',
                      options: {
                        choices: [{ name: 'Todo' }, { name: 'Done' }],
                      },
                    },
                  ],
                  views: [{ id: 'viwMain', name: 'Main', type: 'grid' }],
                },
              ],
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    const result = await buildAirtableTypes({
      source: {
        apiKey: 'pat123',
        baseId: 'app123',
      },
    });

    expect(result.content).toContain('export interface ProjectsRecordFields {');
    expect(result.content).toContain('"Status"?: "Todo" | "Done" | (string & {});');
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock.mock.calls[0]?.[0]).toMatchObject({
      method: 'GET',
      path: '/v0/meta/bases/app123/tables',
    });
  });
});
