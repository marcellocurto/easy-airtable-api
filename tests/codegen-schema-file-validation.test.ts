import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { buildAirtableTypes } from '../src/codegen/index.js';

describe('Airtable codegen schema file validation', () => {
  it('fails clearly when a schema file does not contain an Airtable base schema', async () => {
    const tempDirectory = await mkdtemp(join(tmpdir(), 'easy-airtable-api-invalid-schema-'));
    const schemaPath = join(tempDirectory, 'invalid-schema.json');

    await writeFile(
      schemaPath,
      JSON.stringify({
        notTables: [],
      })
    );

    await expect(
      buildAirtableTypes({
        source: { schemaPath },
      })
    ).rejects.toThrow(`Schema file at ${schemaPath} is not a valid Airtable base schema.`);
  });
});
