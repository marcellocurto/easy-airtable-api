import { CODEGEN_MODE_VALUES, parseCodegenMode, } from './codegen/options.js';
const VALUE_FLAGS = new Set([
    '--baseId',
    '--accessToken',
    '--apiKey',
    '--schemaPath',
    '--output',
    '--table',
    ...Object.keys(CODEGEN_MODE_VALUES).map((option) => `--${option}`),
]);
const SWITCH_FLAGS = new Set(['--noTableIds', '--noFieldIds']);
/**
 * Reads the CLI's arguments (after `node` and the script). With no command, or
 * with `--help` anywhere, it asks for help. An unknown command is an error that
 * doesn't repeat arguments which could be tokens.
 */
export function parseCliArgs(args) {
    const [command, ...options] = args;
    if (!command ||
        command === '--help' ||
        command === '-h' ||
        options.includes('--help') ||
        options.includes('-h')) {
        return { command: 'help' };
    }
    if (command !== 'generate') {
        throw new Error(unknownCommandMessage(command));
    }
    return { command: 'generate', options: parseGenerateArgs(options) };
}
/**
 * The error for a first argument that isn't a command. It names a word-like
 * typo such as `genrate`, but not anything else, which could be a token passed
 * before the command.
 */
export function unknownCommandMessage(command) {
    return /^[a-z][a-z-]*$/i.test(command)
        ? `Unknown command: ${command}`
        : 'Unknown command. Run easy-airtable-api --help to see the commands.';
}
/**
 * Turns the arguments after `easy-airtable-api generate` into codegen options.
 * Options take `--flag value` or `--flag=value`, `--table` may repeat, and a
 * repeated option keeps its last value. An unknown option, a missing value, or
 * an invalid mode is an error. Errors name the option but never repeat its
 * value, since it may be a token.
 */
export function parseGenerateArgs(args) {
    const values = new Map();
    const tables = [];
    const switches = new Set();
    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        const equals = argument.indexOf('=');
        const flag = equals === -1 ? argument : argument.slice(0, equals);
        if (SWITCH_FLAGS.has(flag) && equals === -1) {
            switches.add(flag);
            continue;
        }
        if (!VALUE_FLAGS.has(flag)) {
            throw new Error(flag.startsWith('--')
                ? `Unknown option: ${flag}`
                : 'Unexpected argument. Options start with --.');
        }
        let value;
        if (equals !== -1) {
            value = argument.slice(equals + 1);
        }
        else {
            // In the space form, a following option means the value is missing.
            value = args[index + 1]?.startsWith('--') ? undefined : args[index + 1];
            index += 1;
        }
        if (!value) {
            throw new Error(`Option ${flag} needs a value.`);
        }
        if (flag === '--table') {
            tables.push(value);
        }
        else {
            values.set(flag, value);
        }
    }
    const schemaPath = values.get('--schemaPath');
    const baseId = values.get('--baseId');
    if (!schemaPath && !baseId) {
        throw new Error('Pass --schemaPath or --baseId.');
    }
    const readMode = (option) => parseCodegenMode(option, values.get(`--${option}`), `--${option}`);
    // Options the caller didn't pass stay undefined, so codegen applies its
    // defaults.
    return {
        source: schemaPath
            ? { schemaPath }
            : {
                baseId: baseId ?? '',
                accessToken: values.get('--accessToken'),
                apiKey: values.get('--apiKey'),
            },
        output: values.get('--output'),
        tableNameOrId: tables.length ? tables : undefined,
        enumMode: readMode('enumMode'),
        schemaMode: readMode('schemaMode'),
        createRequiredMode: readMode('createRequiredMode'),
        unknownFieldBehavior: readMode('unknownFieldBehavior'),
        includeTableIds: !switches.has('--noTableIds'),
        includeFieldIds: !switches.has('--noFieldIds'),
    };
}
