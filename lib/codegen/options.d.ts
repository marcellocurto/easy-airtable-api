/** The allowed values of each codegen mode option. */
export declare const CODEGEN_MODE_VALUES: {
    readonly enumMode: readonly ["literal", "hybrid", "broad"];
    readonly schemaMode: readonly ["read", "write", "full"];
    readonly createRequiredMode: readonly ["allOptional", "primaryField"];
    readonly unknownFieldBehavior: readonly ["unknown", "error"];
};
export type CodegenModeOption = keyof typeof CODEGEN_MODE_VALUES;
type CodegenModeValue<Option extends CodegenModeOption> = (typeof CODEGEN_MODE_VALUES)[Option][number];
/**
 * Checks a mode option at runtime, because JavaScript callers and the CLI
 * aren't held to its type. `label` names the option in the error, such as the
 * CLI's `--schemaMode`. The error never repeats the value, which may be a
 * token that landed in the wrong place.
 */
export declare function parseCodegenMode<Option extends CodegenModeOption>(option: Option, value: unknown, label?: string): CodegenModeValue<Option> | undefined;
export {};
