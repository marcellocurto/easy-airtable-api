import type { GenerateAirtableTypesOptions } from './codegen/types.js';
/**
 * The error for a first argument that isn't a command. It names a word-like
 * typo such as `genrate`, but not anything else, which could be a token passed
 * before the command.
 */
export declare function unknownCommandMessage(command: string): string;
/**
 * Turns the arguments after `easy-airtable-api generate` into codegen options.
 * Options take `--flag value` or `--flag=value`, `--table` may repeat, and a
 * repeated option keeps its last value. An unknown option, a missing value, or
 * an invalid mode is an error. Errors name the option but never repeat its
 * value, since it may be a token.
 */
export declare function parseGenerateArgs(args: string[]): GenerateAirtableTypesOptions;
