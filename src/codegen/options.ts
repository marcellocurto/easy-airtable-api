/** The allowed values of each codegen mode option. */
export const CODEGEN_MODE_VALUES = {
  enumMode: ['literal', 'hybrid', 'broad'],
  schemaMode: ['read', 'write', 'full'],
  createRequiredMode: ['allOptional', 'primaryField'],
  unknownFieldBehavior: ['unknown', 'error'],
} as const satisfies Record<string, readonly string[]>;

export type CodegenModeOption = keyof typeof CODEGEN_MODE_VALUES;

type CodegenModeValue<Option extends CodegenModeOption> =
  (typeof CODEGEN_MODE_VALUES)[Option][number];

function isOneOf<Value extends string>(
  allowed: readonly Value[],
  value: unknown
): value is Value {
  return allowed.some((candidate) => candidate === value);
}

/**
 * Checks a mode option at runtime, because JavaScript callers and the CLI
 * aren't held to its type. `label` names the option in the error, such as the
 * CLI's `--schemaMode`. The error never repeats the value, which may be a
 * token that landed in the wrong place.
 */
export function parseCodegenMode<Option extends CodegenModeOption>(
  option: Option,
  value: unknown,
  label: string = option
): CodegenModeValue<Option> | undefined {
  if (value === undefined) return undefined;
  const allowed: readonly CodegenModeValue<Option>[] =
    CODEGEN_MODE_VALUES[option];
  if (!isOneOf(allowed, value)) {
    throw new Error(
      `Invalid value for ${label}. Use one of: ${allowed.join(', ')}.`
    );
  }
  return value;
}
