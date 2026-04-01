import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { buildAirtableTypes, generateAirtableTypes } from '../src/codegen/index.js';
import type { AirtableBaseSchema } from '../src/types/metadata.js';

const fixturePath = join(process.cwd(), 'tests/fixtures/base-schema.json');

async function loadFixture(): Promise<AirtableBaseSchema> {
  const content = await readFile(fixturePath, 'utf8');
  return JSON.parse(content) as AirtableBaseSchema;
}

describe('Airtable codegen', () => {
  it('builds drift-tolerant read and write types from schema metadata', async () => {
    const schema = await loadFixture();

    const result = await buildAirtableTypes({
      source: { schema },
      enumMode: 'hybrid',
    });

    expect(result.tablesGenerated).toBe(3);
    expect(result.content).toContain(
      'export type ProjectsStatus = "Todo" | "In Progress" | "Done" | (string & {});'
    );
    expect(result.content).toContain(
      'export interface ProjectsRecordFields {'
    );
    expect(result.content).toContain('  "Created"?: string;');
    expect(result.content).toContain('export interface ProjectsCreateFields {');
    expect(result.content).toContain('  "Assets"?: AttachmentWrite[];');
    const createSection = result.content.split('export interface ProjectsCreateFields {')[1]?.split('export interface ProjectsUpdateFields {')[0] ?? '';
    expect(createSection).not.toContain('"Created"');
    expect(result.content).toContain('export interface ProjectsUpdateFields {');
    expect(result.content).toContain('  "Mystery"?: unknown;');
    expect(result.warnings).toContain(
      'Projects.Mystery: unsupported Airtable field type mysteryField'
    );
  });

  it('resolves sanitized name collisions and can generate from a schema file', async () => {
    const tempDirectory = await mkdtemp(join(tmpdir(), 'easy-airtable-api-'));
    const output = join(tempDirectory, 'airtable.generated.ts');

    const result = await generateAirtableTypes({
      source: { schemaPath: fixturePath },
      output,
      enumMode: 'literal',
    });

    const content = await readFile(output, 'utf8');

    const collisionInterfaces = [
      ...content.matchAll(/export interface (FooBar(?:_[A-Za-z0-9]+)?)RecordFields \{/g),
    ].map((match) => match[1]);

    expect(new Set(collisionInterfaces).size).toBe(2);
    expect(collisionInterfaces.every((name) => name.startsWith('FooBar'))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('Table name collision detected'))).toBe(true);
  });

  it('can fail on unsupported field types when requested', async () => {
    const schema = await loadFixture();

    await expect(
      buildAirtableTypes({
        source: { schema },
        unknownFieldBehavior: 'error',
      })
    ).rejects.toThrow('Mystery: unsupported Airtable field type mysteryField');
  });

  it('can require the primary field on create when opted in', async () => {
    const schema = await loadFixture();

    const result = await buildAirtableTypes({
      source: { schema },
      createRequiredMode: 'primaryField',
    });

    const createSection =
      result.content
        .split('export interface ProjectsCreateFields {')[1]
        ?.split('export interface ProjectsUpdateFields {')[0] ?? '';

    expect(createSection).toContain('  "Name": string;');
    expect(createSection).toContain('  "Status"?: "Todo" | "In Progress" | "Done" | (string & {});');
  });
});
