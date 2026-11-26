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
  compilerOptions = {},
}: {
  generatedContent: string;
  usageSource?: string;
  compilerOptions?: Record<string, unknown>;
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
          ...compilerOptions,
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

  it('gives every generated type a unique name when tables, fields, and imports collide', async () => {
    const schema = await loadFixture('type-name-collisions-schema.json');

    const result = await buildAirtableTypes({
      source: { schema },
      enumMode: 'hybrid',
    });

    const exportedNames = [
      ...result.content.matchAll(/^export (?:type|interface|const) (\w+)/gm),
    ].map((match) => match[1]);
    expect(new Set(exportedNames).size).toBe(exportedNames.length);

    // Table types keep their plain names unless they collide with an imported
    // type. Select aliases that collide with a table type, or with each other,
    // all take a stable suffix from their field ID.
    expect(result.content).toContain(
      'export type ProjectRecord = AirtableRecord<ProjectRecordFields>;'
    );
    expect(result.content).toContain(
      'export type AirtableRecord_ble001 = AirtableRecord<AirtableRecordFields>;'
    );
    expect(result.content).toContain(
      'export type ProjectRecord_rdSel1 = "Kept" | (string & {});'
    );
    expect(result.content).toContain(
      'export type ProjectTaskStatus_Stat01 = "Open" | "Done" | (string & {});'
    );
    expect(result.content).toContain(
      'export type ProjectTaskStatus_us0001 = "Todo" | (string & {});'
    );
    expect(result.content).not.toContain('export type ProjectTaskStatus =');

    const collisionWarnings = result.warnings.filter((warning) =>
      warning.includes('collides with')
    );
    expect(collisionWarnings).toHaveLength(4);

    await compileGeneratedOutput({ generatedContent: result.content });
  });

  it('keeps an alias plain when it only matches an interface the schema mode skips', async () => {
    const schema = await loadFixture('type-name-collisions-schema.json');

    const result = await buildAirtableTypes({
      source: { schema },
      enumMode: 'hybrid',
      schemaMode: 'write',
    });

    expect(result.content).toContain(
      'export type ProjectRecord = "Kept" | (string & {});'
    );
    await compileGeneratedOutput({ generatedContent: result.content });
  });

  it.each(['read', 'write', 'full'] as const)(
    'imports only the shared types a %s-mode file uses',
    async (schemaMode) => {
      const schema = await loadFixture('base-schema.json');
      schema.tables[0].fields.push({
        id: 'fldNamedLikeTypes',
        name: 'Kind',
        type: 'singleSelect',
        // Choices named like shared types must not count as uses of them.
        options: {
          choices: [
            { id: 'selA', name: 'Attachment' },
            { id: 'selB', name: 'Collaborator' },
          ],
        },
      });

      const result = await buildAirtableTypes({
        source: { schema },
        schemaMode,
      });

      await compileGeneratedOutput({
        generatedContent: result.content,
        compilerOptions: { noUnusedLocals: true },
      });
    }
  );

  it('keeps line breaks in a table name inside the generated comment', async () => {
    const result = await buildAirtableTypes({
      source: {
        schema: {
          tables: [
            {
              id: 'tblInjected01',
              name: 'Evil\nexport const a = 1;\rexport const b = 2;\u2028export const c = 3;\n//',
              primaryFieldId: 'fldName00001',
              fields: [
                { id: 'fldName00001', name: 'Name', type: 'singleLineText' },
              ],
            },
          ],
        },
      },
    });

    // TypeScript ends a `//` comment at any of these line terminators.
    const lines = result.content.split(/\r\n|[\r\n\u2028\u2029]/);
    expect(lines.filter((line) => /^export const [abc] =/.test(line))).toEqual(
      []
    );
    await compileGeneratedOutput({ generatedContent: result.content });
  });

  it('types sync source fields as readonly choices', async () => {
    const result = await buildAirtableTypes({
      source: {
        schema: {
          tables: [
            {
              id: 'tblSynced0001',
              name: 'Synced',
              primaryFieldId: 'fldName00001',
              fields: [
                { id: 'fldName00001', name: 'Name', type: 'singleLineText' },
                {
                  // The older type name for the same field.
                  id: 'fldLegacy0001',
                  name: 'Legacy Source',
                  type: 'syncSource',
                  options: { choices: [{ id: 'sel3', name: 'Asana' }] },
                },
                {
                  id: 'fldSource0001',
                  name: 'Source',
                  type: 'externalSyncSource',
                  options: {
                    choices: [
                      { id: 'sel1', name: 'Salesforce' },
                      { id: 'sel2', name: 'Jira' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
      enumMode: 'literal',
    });

    const recordFields =
      result.content
        .split('export interface SyncedRecordFields {')[1]
        ?.split('}')[0] ?? '';
    const createFields =
      result.content
        .split('export interface SyncedCreateFields {')[1]
        ?.split('}')[0] ?? '';

    expect(recordFields).toContain('"Source"?: "Salesforce" | "Jira";');
    expect(recordFields).toContain('"Legacy Source"?: "Asana";');
    expect(createFields).not.toContain('"Source"');
    expect(result.warnings).toEqual([]);
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

  it('lets update types clear a field with null', async () => {
    const schema = await loadFixture('base-schema.json');

    const result = await buildAirtableTypes({ source: { schema } });

    await compileGeneratedOutput({
      generatedContent: result.content,
      usageSource: `
        import type { ProjectsCreateFields, ProjectsUpdateFields } from './airtable.generated';

        export const clear: ProjectsUpdateFields = { Name: null, Status: null };
        // @ts-expect-error Creates leave a field out instead of sending null.
        export const create: ProjectsCreateFields = { Name: null };
      `,
    });
  });

  it.each([
    ['enumMode', 'literl', 'literal, hybrid, broad'],
    ['schemaMode', 'reed', 'read, write, full'],
    ['createRequiredMode', 'primary', 'allOptional, primaryField'],
    ['unknownFieldBehavior', 'warn', 'unknown, error'],
  ])(
    'rejects an invalid %s from a JavaScript caller',
    async (option, value, allowed) => {
      const schema = await loadFixture('base-schema.json');

      await expect(
        buildAirtableTypes({ source: { schema }, [option]: value })
      ).rejects.toThrow(
        new RegExp(`^Invalid value for ${option}\\. Use one of: ${allowed}\\.$`)
      );
    }
  );
});
