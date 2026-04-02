import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('https', () => ({
  request: requestMock,
}));

import { AirtableApiError, createBase } from '../src/index.js';

describe('createBase', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('creates a base through the metadata API and returns the created schema', async () => {
    const writeMock = vi.fn();

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

      req.write = writeMock;
      req.end = () => {
        callback(response);
        response.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              id: 'appCreated123',
              tables: [
                {
                  id: 'tblApartments',
                  name: 'Apartments',
                  primaryFieldId: 'fldName',
                  fields: [
                    { id: 'fldName', name: 'Name', type: 'singleLineText' },
                    {
                      id: 'fldVisited',
                      name: 'Visited',
                      type: 'checkbox',
                      options: { color: 'greenBright', icon: 'check' },
                    },
                  ],
                  views: [{ id: 'viwGrid', name: 'Grid view', type: 'grid' }],
                },
              ],
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    const body = {
      workspaceId: 'wsp123',
      name: 'Apartment Hunting',
      tables: [
        {
          name: 'Apartments',
          description: 'Places to visit',
          fields: [
            { name: 'Name', type: 'singleLineText' },
            {
              name: 'Visited',
              type: 'checkbox',
              options: { color: 'greenBright', icon: 'check' },
            },
          ],
        },
      ],
    } as const;

    const result = await createBase({
      apiKey: 'pat123',
      body,
    });

    expect(result.id).toBe('appCreated123');
    expect(result.tables[0]?.name).toBe('Apartments');
    expect(requestMock.mock.calls[0]?.[0]).toMatchObject({
      method: 'POST',
      hostname: 'api.airtable.com',
      path: '/v0/meta/bases',
    });
    expect(writeMock).toHaveBeenCalledWith(JSON.stringify(body));
  });

  it('surfaces shared structured errors for create base failures', async () => {
    requestMock.mockImplementationOnce((options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        statusMessage?: string;
      };
      response.statusCode = 403;
      response.statusMessage = 'Forbidden';

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
              error: {
                type: 'INVALID_PERMISSIONS',
                message: 'Only workspace creators can create bases here',
              },
            })
          )
        );
        response.emit('end');
      };

      return req;
    });

    const promise = createBase({
      apiKey: 'pat123',
      body: {
        workspaceId: 'wsp123',
        name: 'Apartment Hunting',
        tables: [
          {
            name: 'Apartments',
            fields: [{ name: 'Name', type: 'singleLineText' }],
          },
        ],
      },
    });

    await expect(promise).rejects.toMatchObject({
      name: 'AirtableApiError',
      statusCode: 403,
      airtableType: 'INVALID_PERMISSIONS',
      message: 'Only workspace creators can create bases here',
      retryable: false,
      request: {
        method: 'POST',
        path: '/meta/bases',
      },
    });
    await expect(promise).rejects.toBeInstanceOf(AirtableApiError);
  });
});
