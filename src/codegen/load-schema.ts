import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getBaseSchema } from '../bases.js';
import type { AirtableBaseSchema } from '../types/metadata.js';
import type { AirtableSchemaSource } from './types.js';
import { isRecord } from './utils.js';

function isAirtableBaseSchema(value: unknown): value is AirtableBaseSchema {
  if (!isRecord(value)) return false;
  return Array.isArray(value.tables);
}

export async function loadSchema(
  source: AirtableSchemaSource
): Promise<AirtableBaseSchema> {
  if ('schema' in source) {
    return source.schema;
  }

  if ('schemaPath' in source) {
    const filePath = resolve(source.schemaPath);
    const content = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as unknown;

    if (!isAirtableBaseSchema(parsed)) {
      throw new Error(`Schema file at ${filePath} is not a valid Airtable base schema.`);
    }

    return parsed;
  }

  const token = source.accessToken || source.apiKey;
  if (!token) {
    throw new Error(
      'An Airtable access token is required when loading schema from the Airtable metadata API.'
    );
  }

  return getBaseSchema({ apiKey: token, baseId: source.baseId });
}
