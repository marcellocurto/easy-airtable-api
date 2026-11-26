/** The allowed values of each codegen mode option. */
export const CODEGEN_MODE_VALUES = {
    enumMode: ['literal', 'hybrid', 'broad'],
    schemaMode: ['read', 'write', 'full'],
    createRequiredMode: ['allOptional', 'primaryField'],
    unknownFieldBehavior: ['unknown', 'error'],
};
function isOneOf(allowed, value) {
    return allowed.some((candidate) => candidate === value);
}
/**
 * Checks a mode option at runtime, because JavaScript callers and the CLI
 * aren't held to its type. `label` names the option in the error, such as the
 * CLI's `--schemaMode`. The error never repeats the value, which may be a
 * token that landed in the wrong place.
 */
export function parseCodegenMode(option, value, label = option) {
    if (value === undefined)
        return undefined;
    const allowed = CODEGEN_MODE_VALUES[option];
    if (!isOneOf(allowed, value)) {
        throw new Error(`Invalid value for ${label}. Use one of: ${allowed.join(', ')}.`);
    }
    return value;
}
