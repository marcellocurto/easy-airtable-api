import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it } from 'vitest';

async function typecheck(source: string): Promise<void> {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'easy-airtable-api-types-'));
  const sourcePath = join(tempDirectory, 'index.ts');
  const tsconfigPath = join(tempDirectory, 'tsconfig.json');

  await writeFile(sourcePath, source, 'utf8');
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
        include: [sourcePath],
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

describe('record response-mode typing guardrails', () => {
  it('allows generated field-name keyed types only with Airtable default json response mode', async () => {
    await typecheck(`
      import { getRecord, getRecords } from 'easy-airtable-api';

      type ProjectFields = {
        Name?: string;
      };

      async function main() {
        await getRecord<ProjectFields>({
          apiKey: 'pat123',
          baseId: 'app123',
          tableId: 'tbl123',
          recordId: 'rec123',
          options: {
            cellFormat: 'json',
            returnFieldsByFieldId: false,
          },
        });

        await getRecords<ProjectFields>({
          apiKey: 'pat123',
          baseId: 'app123',
          tableId: 'tbl123',
          options: {
            cellFormat: 'json',
            returnFieldsByFieldId: false,
          },
        });

        // @ts-expect-error generated field-name keyed types are incompatible with field-id keyed responses
        await getRecord<ProjectFields>({ apiKey: 'pat123', baseId: 'app123', tableId: 'tbl123', recordId: 'rec123', options: { returnFieldsByFieldId: true } });

        // @ts-expect-error generated field-name keyed types are incompatible with string cell formatting
        await getRecords<ProjectFields>({ apiKey: 'pat123', baseId: 'app123', tableId: 'tbl123', options: { cellFormat: 'string', timeZone: 'GMT', userLocale: 'en-gb' } });

        const fieldIdRecord = await getRecord({
          apiKey: 'pat123',
          baseId: 'app123',
          tableId: 'tbl123',
          recordId: 'rec123',
          options: {
            returnFieldsByFieldId: true,
          },
        });

        fieldIdRecord.fields['fld123'];
      }

      void main;
    `);
  });
});
