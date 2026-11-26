import type { GenerateAirtableTypesOptions } from './codegen/types.js';
/**
 * Turns the arguments after `easy-airtable-api generate` into codegen options.
 * Options take `--flag value` or `--flag=value`, `--table` may repeat, and an
 * unknown option, a missing value, or an invalid mode is an error.
 */
export declare function parseGenerateArgs(args: string[]): GenerateAirtableTypesOptions;
