const MODE_VALUES = {
    '--enumMode': ['literal', 'hybrid', 'broad'],
    '--schemaMode': ['read', 'write', 'full'],
    '--createRequiredMode': ['allOptional', 'primaryField'],
    '--unknownFieldBehavior': ['unknown', 'error'],
};
const VALUE_FLAGS = new Set([
    '--baseId',
    '--accessToken',
    '--apiKey',
    '--schemaPath',
    '--output',
    '--table',
    ...Object.keys(MODE_VALUES),
]);
const SWITCH_FLAGS = new Set(['--noTableIds', '--noFieldIds']);
function isModeFlag(flag) {
    return flag in MODE_VALUES;
}
function isOneOf(allowed, value) {
    return allowed.some((candidate) => candidate === value);
}
function readMode(flag, value) {
    if (value === undefined)
        return undefined;
    const allowed = MODE_VALUES[flag];
    if (!isOneOf(allowed, value)) {
        throw new Error(`Invalid value "${value}" for ${flag}. Use one of: ${allowed.join(', ')}.`);
    }
    return value;
}
/**
 * Turns the arguments after `easy-airtable-api generate` into codegen options.
 * Options take `--flag value` or `--flag=value`, `--table` may repeat, and an
 * unknown option, a missing value, or an invalid mode is an error.
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
            throw new Error(`Unknown option: ${argument}`);
        }
        let value;
        if (equals !== -1) {
            value = argument.slice(equals + 1);
        }
        else {
            value = args[index + 1];
            index += 1;
        }
        if (!value || value.startsWith('--')) {
            throw new Error(`Option ${flag} needs a value.`);
        }
        if (flag === '--table') {
            tables.push(value);
        }
        else {
            if (isModeFlag(flag))
                readMode(flag, value);
            values.set(flag, value);
        }
    }
    const schemaPath = values.get('--schemaPath');
    const baseId = values.get('--baseId');
    if (!schemaPath && !baseId) {
        throw new Error('Pass --schemaPath or --baseId.');
    }
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
        enumMode: readMode('--enumMode', values.get('--enumMode')),
        schemaMode: readMode('--schemaMode', values.get('--schemaMode')),
        createRequiredMode: readMode('--createRequiredMode', values.get('--createRequiredMode')),
        unknownFieldBehavior: readMode('--unknownFieldBehavior', values.get('--unknownFieldBehavior')),
        includeTableIds: !switches.has('--noTableIds'),
        includeFieldIds: !switches.has('--noFieldIds'),
    };
}
