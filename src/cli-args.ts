import type { GenerateAirtableTypesOptions } from './codegen/types.js';

const MODE_VALUES = {
  '--enumMode': ['literal', 'hybrid', 'broad'],
  '--schemaMode': ['read', 'write', 'full'],
  '--createRequiredMode': ['allOptional', 'primaryField'],
  '--unknownFieldBehavior': ['unknown', 'error'],
} as const satisfies Record<string, readonly string[]>;

const VALUE_FLAGS = new Set<string>([
  '--baseId',
  '--accessToken',
  '--apiKey',
  '--schemaPath',
  '--output',
  '--table',
  ...Object.keys(MODE_VALUES),
]);

const SWITCH_FLAGS = new Set(['--noTableIds', '--noFieldIds']);

type ModeFlag = keyof typeof MODE_VALUES;

function isOneOf<Value extends string>(
  allowed: readonly Value[],
  value: string
): value is Value {
  return allowed.some((candidate) => candidate === value);
}

function readMode<Flag extends ModeFlag>(
  flag: Flag,
  value: string | undefined
): (typeof MODE_VALUES)[Flag][number] | undefined {
  if (value === undefined) return undefined;
  const allowed: readonly (typeof MODE_VALUES)[Flag][number][] =
    MODE_VALUES[flag];
  if (!isOneOf(allowed, value)) {
    throw new Error(
      `Invalid value "${value}" for ${flag}. Use one of: ${allowed.join(', ')}.`
    );
  }
  return value;
}

/**
 * Turns the arguments after `easy-airtable-api generate` into codegen options.
 * Options take `--flag value` or `--flag=value`, `--table` may repeat, and a
 * repeated option keeps its last value. An unknown option, a missing value, or
 * an invalid mode is an error. Errors name the option but never repeat its
 * value, since it may be a token.
 */
export function parseGenerateArgs(
  args: string[]
): GenerateAirtableTypesOptions {
  const values = new Map<string, string>();
  const tables: string[] = [];
  const switches = new Set<string>();

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const equals = argument.indexOf('=');
    const flag = equals === -1 ? argument : argument.slice(0, equals);

    if (SWITCH_FLAGS.has(flag) && equals === -1) {
      switches.add(flag);
      continue;
    }
    if (!VALUE_FLAGS.has(flag)) {
      throw new Error(
        flag.startsWith('--')
          ? `Unknown option: ${flag}`
          : 'Unexpected argument. Options start with --.'
      );
    }

    let value: string | undefined;
    if (equals !== -1) {
      value = argument.slice(equals + 1);
    } else {
      // In the space form, a following option means the value is missing.
      value = args[index + 1]?.startsWith('--') ? undefined : args[index + 1];
      index += 1;
    }
    if (!value) {
      throw new Error(`Option ${flag} needs a value.`);
    }

    if (flag === '--table') {
      tables.push(value);
    } else {
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
    createRequiredMode: readMode(
      '--createRequiredMode',
      values.get('--createRequiredMode')
    ),
    unknownFieldBehavior: readMode(
      '--unknownFieldBehavior',
      values.get('--unknownFieldBehavior')
    ),
    includeTableIds: !switches.has('--noTableIds'),
    includeFieldIds: !switches.has('--noFieldIds'),
  };
}
