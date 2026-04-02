import { airtableApiRequest } from './requests.js';
import type { ListBasesResponse } from './types/bases.js';
import type { AirtableBaseSchema } from './types/metadata.js';

export async function listBases({
  apiKey,
  offset,
}: {
  apiKey: string;
  offset?: string;
}): Promise<ListBasesResponse> {
  return airtableApiRequest<ListBasesResponse>({
    apiKey,
    method: 'GET',
    path: '/meta/bases',
    query: { offset },
  });
}

export async function getBaseSchema({
  apiKey,
  baseId,
}: {
  apiKey: string;
  baseId: string;
}): Promise<AirtableBaseSchema> {
  if (!baseId) {
    throw new Error(
      'Base ID is not set. Please provide a valid Airtable base ID.'
    );
  }

  const path = `/meta/bases/${encodeURIComponent(baseId)}/tables`;

  return airtableApiRequest<AirtableBaseSchema>({
    apiKey,
    method: 'GET',
    path,
    requestContext: {
      method: 'GET',
      baseId,
      path,
    },
  });
}
