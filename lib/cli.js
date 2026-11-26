#!/usr/bin/env node
import { parseGenerateArgs, unknownCommandMessage } from './cli-args.js';
import { generateAirtableTypes } from './codegen/generate.js';
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
        throw new Error(unknownCommandMessage(command));
    }
    const options = args.slice(1);
    if (options.includes('--help') || options.includes('-h')) {
        printHelp();
        return;
    }
    const result = await generateAirtableTypes(parseGenerateArgs(options));
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
