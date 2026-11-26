import type { GenerateAirtableTypesOptions } from './codegen/types.js';
/**
 * Turns the arguments after `easy-airtable-api generate` into codegen options.
 * Options take `--flag value` or `--flag=value`, `--table` may repeat, and a
 * repeated option keeps its last value. An unknown option, a missing value, or
 * an invalid mode is an error. Errors name the option but never repeat its
 * value, since it may be a token.
 */
export declare function parseGenerateArgs(args: string[]): GenerateAirtableTypesOptions;
