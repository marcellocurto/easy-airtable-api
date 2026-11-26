import type { GenerateAirtableTypesOptions } from './codegen/types.js';
/** What the CLI should do with its arguments. */
export type CliCommand = {
    command: 'help';
} | {
    command: 'generate';
    options: GenerateAirtableTypesOptions;
};
/**
 * Reads the CLI's arguments (after `node` and the script). With no command, or
 * with `--help` anywhere, it asks for help. An unknown command is an error that
 * doesn't repeat arguments which could be tokens.
 */
export declare function parseCliArgs(args: string[]): CliCommand;
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
