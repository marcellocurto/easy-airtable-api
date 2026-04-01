import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildAirtableTypes } from './build.js';
import { writeAtomic } from './write-atomic.js';
async function defaultOutputPath() {
    try {
        await access(resolve('src'));
        return './src/airtable.generated.ts';
    }
    catch {
        return './airtable.generated.ts';
    }
}
export async function generateAirtableTypes(options) {
    const result = await buildAirtableTypes(options);
    const outputPath = options.output ?? (await defaultOutputPath());
    const writtenPath = await writeAtomic(outputPath, result.content);
    return {
        outputPath: writtenPath,
        tablesGenerated: result.tablesGenerated,
        warnings: result.warnings,
    };
}
