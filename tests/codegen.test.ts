import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { buildAirtableTypes, generateAirtableTypes } from '../src/codegen/index.js';
import type { AirtableBaseSchema } from '../src/types/metadata.js';

async function loadFixture(name: string): Promise<AirtableBaseSchema> {
  const fixturePath = join(process.cwd(), 'tests/fixtures', name);
  const content = await readFile(fixturePath, 'utf8');
  return JSON.parse(content) as AirtableBaseSchema;
}

async function compileGeneratedOutput({
  generatedContent,
  usageSource = '',
}: {
  generatedContent: string;
  usageSource?: string;
}): Promise<void> {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'easy-airtable-api-codegen-'));
  const generatedPath = join(tempDirectory, 'airtable.generated.ts');
  const usagePath = join(tempDirectory, 'usage.ts');
  const tsconfigPath = join(tempDirectory, 'tsconfig.json');

  await writeFile(generatedPath, generatedContent, 'utf8');
  await writeFile(usagePath, usageSource, 'utf8');
  await writeFile(
    tsconfigPath,
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          module: 'ESNext',
          target: 'ESNext',
          moduleResolution: 'node',
          types: ['node'],
          typeRoots: [join(process.cwd(), 'node_modules/@types')],
          baseUrl: process.cwd(),
          paths: {
            'easy-airtable-api': ['./src/index.ts'],
            'easy-airtable-api/codegen': ['./src/codegen/index.ts'],
          },
        },
        include: [generatedPath, usagePath],
      },
      null,
      2
    ),
    'utf8'
  );

  execFileSync(process.execPath, ['./node_modules/typescript/lib/tsc.js', '-p', tsconfigPath], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
}

describe('Airtable codegen', () => {
  it('builds drift-tolerant read and write types from schema metadata', async () => {
    const schema = await loadFixture('base-schema.json');

    const result = await buildAirtableTypes({
      source: { schema },
      enumMode: 'hybrid',
    });

    expect(result.tablesGenerated).toBe(3);
    expect(result.content).toContain(
      'export type ProjectsStatus = "Todo" | "In Progress" | "Done" | (string & {});'
    );
    expect(result.content).toContain('export interface ProjectsRecordFields {');
    expect(result.content).toContain('  "Created"?: string;');
    expect(result.content).toContain('export interface ProjectsCreateFields {');
    expect(result.content).toContain('  "Assets"?: AttachmentWrite[];');
    const createSection =
      result.content
        .split('export interface ProjectsCreateFields {')[1]
        ?.split('export interface ProjectsUpdateFields {')[0] ?? '';
    expect(createSection).not.toContain('"Created"');
    expect(result.content).toContain('export interface ProjectsUpdateFields {');
    expect(result.content).toContain('  "Mystery"?: unknown;');
    expect(result.warnings).toContain(
      'Projects.Mystery: unsupported Airtable field type mysteryField'
    );
  });

  it('imports shared public field/value types and models aiText as a structured readonly cell', async () => {
    const schema = await loadFixture('structured-fields-schema.json');

    const result = await buildAirtableTypes({
      source: { schema },
      enumMode: 'hybrid',
    });

    expect(result.content).toContain(
      "import type { AICell, AirtableRecord, Attachment, AttachmentWrite, BarcodeCell, BarcodeWrite, ButtonCell, Collaborator, CollaboratorWrite } from 'easy-airtable-api';"
    );
    expect(result.content).not.toContain('export interface Barcode {');
    expect(result.content).not.toContain('export interface ButtonFieldValue {');
    expect(result.content).toContain('  "AI Summary"?: AICell;');
    expect(result.content).toContain('  "Assignee"?: Collaborator;');
    expect(result.content).toContain('  "Reviewers"?: Collaborator[];');
    expect(result.content).toContain('  "Barcode"?: BarcodeCell;');
    expect(result.content).toContain('  "Action"?: ButtonCell;');
    expect(result.content).toContain('  "Assignee"?: CollaboratorWrite;');
    expect(result.content).toContain('  "Reviewers"?: CollaboratorWrite[];');
    expect(result.content).toContain('  "Barcode"?: BarcodeWrite;');

    const createSection =
      result.content
        .split('export interface GeneratedFieldsCreateFields {')[1]
        ?.split('export interface GeneratedFieldsUpdateFields {')[0] ?? '';

    expect(createSection).not.toContain('"AI Summary"');
    expect(createSection).not.toContain('"Action"');

    await compileGeneratedOutput({
      generatedContent: result.content,
      usageSource: `
        import type {
          AICell,
          Attachment,
          AttachmentWrite,
          BarcodeCell,
          BarcodeWrite,
          ButtonCell,
          Collaborator,
          CollaboratorWrite,
        } from 'easy-airtable-api';
        import type { GeneratedFieldsCreateFields, GeneratedFieldsRecordFields } from './airtable.generated';

        const ai: AICell = { state: 'generated', isStale: false, value: 'hello' };
        const attachment: Attachment = {
          id: 'att123',
          url: 'https://example.com/file.png',
          filename: 'file.png',
          size: 1,
          type: 'image/png',
        };
        const attachmentWrite: AttachmentWrite = { url: 'https://example.com/file.png' };
        const barcodeCell: BarcodeCell = { text: '123' };
        const barcodeWrite: BarcodeWrite = { text: '123' };
        const buttonCell: ButtonCell = { label: 'Open', url: null };
        const collaborator: Collaborator = { id: 'usr123' };
        const collaboratorWrite: CollaboratorWrite = { id: 'usr123' };

        const recordFields: GeneratedFieldsRecordFields = {
          Name: 'Row',
          'AI Summary': ai,
          Assignee: collaborator,
          Reviewers: [collaborator],
          Assets: [attachment],
          Barcode: barcodeCell,
          Action: buttonCell,
          'Related Tasks': ['rec123'],
        };

        const createFields: GeneratedFieldsCreateFields = {
          Name: 'Row',
          Assignee: collaboratorWrite,
          Reviewers: [collaboratorWrite],
          Assets: [attachmentWrite],
          Barcode: barcodeWrite,
          'Related Tasks': ['rec123'],
        };

        void recordFields;
        void createFields;
      `,
    });
  });

  it('canonicalizes legacy metadata aliases and flattens nested lookup collection types', async () => {
    const schema = await loadFixture('alias-and-lookup-schema.json');

    const result = await buildAirtableTypes({
      source: { schema },
      enumMode: 'hybrid',
    });

    expect(result.content).toContain(
      '  "Legacy Lookup Tags"?: Array<"Red" | "Blue" | (string & {})>;' 
    );
    expect(result.content).not.toContain(
      '  "Legacy Lookup Tags"?: Array<Array<"Red" | "Blue" | (string & {})>>;'
    );
    expect(result.content).toContain('  "Lookup Assets"?: Attachment[];');
    expect(result.content).not.toContain('  "Lookup Assets"?: Array<Attachment[]>;');
    expect(result.content).toContain('  "Rollup Assets"?: Attachment[];');
    expect(result.content).toContain('  "Linked Tasks"?: string[];');
    expect(result.content).toContain('  "Legacy Attachment"?: Attachment[];');

    const createSection =
      result.content
        .split('export interface AliasCasesCreateFields {')[1]
        ?.split('export interface AliasCasesUpdateFields {')[0] ?? '';

    expect(createSection).toContain('  "Linked Tasks"?: string[];');
    expect(createSection).toContain('  "Legacy Attachment"?: AttachmentWrite[];');
  });

  it('normalizes unicode identifiers and keeps generated output compile-safe under collisions', async () => {
    const schema = await loadFixture('unicode-and-collisions-schema.json');

    const result = await buildAirtableTypes({
      source: { schema },
      enumMode: 'hybrid',
    });

    const osterreichInterfaces = [
      ...result.content.matchAll(/export interface (Osterreich_[A-Za-z0-9]+)RecordFields \{/g),
    ].map((match) => match[1]);

    expect(osterreichInterfaces).toHaveLength(2);
    expect(result.content).toContain('export const tables = {');
    expect(result.content).toMatch(/  Foo_Bar_[A-Za-z0-9]+: "tblFooSlash001",/);
    expect(result.content).toMatch(/  Foo_Bar_[A-Za-z0-9]+: "tblFooSpace002",/);
    expect(result.content).toContain('  "Duplicated"?: string | number;');
    expect(result.content).toMatch(/    A_B_[A-Za-z0-9]+: "fldABSlash01",/);
    expect(result.content).toMatch(/    A_B_[A-Za-z0-9]+: "fldABSpace02",/);
    expect(result.content).toMatch(/    generated: "fldTokyo0005",/);
    expect(result.warnings).toContain(
      'Duplicate field name detected for Österreich.Duplicated. Generated interfaces merge the colliding fields into a union.'
    );
    expect(result.warnings.some((warning) => warning.includes('Field const key collision detected for Österreich.A/B'))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('Table const key collision detected for Foo Bar'))).toBe(true);

    await compileGeneratedOutput({
      generatedContent: result.content,
    });
  });

  it('resolves sanitized name collisions and can generate from a schema file', async () => {
    const tempDirectory = await mkdtemp(join(tmpdir(), 'easy-airtable-api-'));
    const output = join(tempDirectory, 'airtable.generated.ts');

    const result = await generateAirtableTypes({
      source: { schemaPath: join(process.cwd(), 'tests/fixtures/base-schema.json') },
      output,
      enumMode: 'literal',
    });

    const content = await readFile(output, 'utf8');

    const collisionInterfaces = [
      ...content.matchAll(/export interface (FooBar(?:_[A-Za-z0-9]+)?)RecordFields \{/g),
    ].map((match) => match[1]);

    expect(new Set(collisionInterfaces).size).toBe(2);
    expect(collisionInterfaces.every((name) => name.startsWith('FooBar'))).toBe(true);
    expect(
      result.warnings.some((warning) => warning.includes('Table name collision detected'))
    ).toBe(true);
  });

  it('can fail on unsupported field types when requested', async () => {
    const schema = await loadFixture('base-schema.json');

    await expect(
      buildAirtableTypes({
        source: { schema },
        unknownFieldBehavior: 'error',
      })
    ).rejects.toThrow('Mystery: unsupported Airtable field type mysteryField');
  });

  it('can require the primary field on create when opted in', async () => {
    const schema = await loadFixture('base-schema.json');

    const result = await buildAirtableTypes({
      source: { schema },
      createRequiredMode: 'primaryField',
    });

    const createSection =
      result.content
        .split('export interface ProjectsCreateFields {')[1]
        ?.split('export interface ProjectsUpdateFields {')[0] ?? '';

    expect(createSection).toContain('  "Name": string;');
    expect(createSection).toContain(
      '  "Status"?: "Todo" | "In Progress" | "Done" | (string & {});'
    );
  });
});
