import { airtableApiRequest } from './requests.js';
import type { AirtableRetryOptions } from './requests.js';
import type { ListBasesResponse } from './types/bases.js';
import type { AirtableBaseSchema } from './types/metadata.js';

export async function listBases({
  apiKey,
  offset,
  retry,
}: {
  apiKey: string;
  offset?: string;
  retry?: AirtableRetryOptions;
}): Promise<ListBasesResponse> {
  return airtableApiRequest<ListBasesResponse>({
    apiKey,
    method: 'GET',
    path: '/meta/bases',
    query: { offset },
    retry,
  });
}

export async function getBaseSchema({
  apiKey,
  baseId,
  retry,
}: {
  apiKey: string;
  baseId: string;
  retry?: AirtableRetryOptions;
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
    retry,
    requestContext: {
      method: 'GET',
      baseId,
      path,
    },
  });
}
