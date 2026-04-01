#!/usr/bin/env node
import { generateAirtableTypes } from './codegen/generate.js';
function readFlag(args, flag) {
    const index = args.indexOf(flag);
    if (index === -1)
        return undefined;
    return args[index + 1];
}
function readMultiFlag(args, flag) {
    const values = [];
    args.forEach((argument, index) => {
        if (argument === flag && args[index + 1]) {
            values.push(args[index + 1]);
        }
    });
    return values;
}
function hasFlag(args, flag) {
    return args.includes(flag);
}
function printHelp() {
    console.log(`easy-airtable-api generate [options]

Options:
  --baseId <id>
  --accessToken <token>
  --apiKey <token>
  --schemaPath <path>
  --output <path>
  --table <nameOrId>        Repeatable
  --enumMode <mode>         literal | hybrid | broad
  --schemaMode <mode>       read | write | full
  --createRequiredMode <mode> allOptional | primaryField
  --unknownFieldBehavior <mode> unknown | error
  --noTableIds
  --noFieldIds
  --help
`);
}
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command || command === '--help' || command === '-h') {
        printHelp();
        return;
    }
    if (command !== 'generate') {
        throw new Error(`Unknown command: ${command}`);
    }
    const tables = readMultiFlag(args, '--table');
    const schemaPath = readFlag(args, '--schemaPath');
    const baseId = readFlag(args, '--baseId');
    const accessToken = readFlag(args, '--accessToken');
    const apiKey = readFlag(args, '--apiKey');
    const source = schemaPath
        ? { schemaPath }
        : {
            baseId: baseId ?? '',
            accessToken,
            apiKey,
        };
    const result = await generateAirtableTypes({
        source,
        output: readFlag(args, '--output'),
        tableNameOrId: tables.length ? tables : undefined,
        enumMode: readFlag(args, '--enumMode'),
        schemaMode: readFlag(args, '--schemaMode'),
        createRequiredMode: readFlag(args, '--createRequiredMode'),
        unknownFieldBehavior: readFlag(args, '--unknownFieldBehavior'),
        includeTableIds: !hasFlag(args, '--noTableIds'),
        includeFieldIds: !hasFlag(args, '--noFieldIds'),
    });
    console.log(`Generated ${result.tablesGenerated} table(s) at ${result.outputPath}`);
    if (result.warnings.length) {
        console.warn(`Warnings:\n- ${result.warnings.join('\n- ')}`);
    }
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
});
