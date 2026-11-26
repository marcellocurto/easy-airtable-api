import { describe, expect, it } from 'vitest';

import { parseGenerateArgs } from '../src/cli-args.js';

describe('parseGenerateArgs', () => {
  it('reads every option, in both --flag value and --flag=value form', () => {
    expect(
      parseGenerateArgs([
        '--schemaPath',
        './schema.json',
        '--output=./out.ts',
        '--table',
        'Projects',
        '--table=Tasks',
        '--enumMode',
        'literal',
        '--schemaMode=read',
        '--createRequiredMode',
        'primaryField',
        '--unknownFieldBehavior',
        'error',
        '--noTableIds',
        '--noFieldIds',
      ])
    ).toEqual({
      source: { schemaPath: './schema.json' },
      output: './out.ts',
      tableNameOrId: ['Projects', 'Tasks'],
      enumMode: 'literal',
      schemaMode: 'read',
      createRequiredMode: 'primaryField',
      unknownFieldBehavior: 'error',
      includeTableIds: false,
      includeFieldIds: false,
    });
  });

  it('reads a base ID and token as the metadata API source', () => {
    expect(
      parseGenerateArgs(['--baseId', 'app123', '--accessToken', 'pat123'])
    ).toMatchObject({
      source: { baseId: 'app123', accessToken: 'pat123' },
    });
  });

  it('rejects a mode value that is not one of the allowed ones', () => {
    expect(() =>
      parseGenerateArgs(['--schemaPath', 's.json', '--schemaMode', 'reed'])
    ).toThrow(
      'Invalid value "reed" for --schemaMode. Use one of: read, write, full.'
    );
  });

  it('rejects an unknown option', () => {
    expect(() =>
      parseGenerateArgs(['--schemaPath', 's.json', '--ouput', 'out.ts'])
    ).toThrow('Unknown option: --ouput');
  });

  it('rejects an option whose value is missing', () => {
    expect(() =>
      parseGenerateArgs(['--schemaPath', '--output', 'out.ts'])
    ).toThrow('Option --schemaPath needs a value.');
  });

  it('requires a schema path or a base ID', () => {
    expect(() => parseGenerateArgs(['--output', 'out.ts'])).toThrow(
      'Pass --schemaPath or --baseId.'
    );
  });

  it('names a misspelled option without repeating its value', () => {
    expect(() =>
      parseGenerateArgs(['--baseId', 'app123', '--acessToken=pat123secret'])
    ).toThrow(/^Unknown option: --acessToken$/);
    expect(() =>
      parseGenerateArgs(['--baseId', 'app123', 'pat123secret'])
    ).toThrow(/^Unexpected argument/);
  });

  it('accepts a value that starts with -- in the --flag=value form', () => {
    expect(
      parseGenerateArgs(['--schemaPath', 's.json', '--table=--weird'])
    ).toMatchObject({ tableNameOrId: ['--weird'] });
  });

  it('keeps the last value of a repeated option', () => {
    expect(
      parseGenerateArgs([
        '--schemaPath',
        's.json',
        '--schemaMode',
        'reed',
        '--schemaMode',
        'read',
      ])
    ).toMatchObject({ schemaMode: 'read' });
  });

  it('rejects a value given to a switch', () => {
    expect(() =>
      parseGenerateArgs(['--schemaPath', 's.json', '--noTableIds=x'])
    ).toThrow('Unknown option: --noTableIds');
  });
});
