# Changelog

## 0.1.0

- Exported a broader canonical public field/value type surface, including shared types used by generated code such as `AICell`, `BarcodeCell`, `BarcodeWrite`, `ButtonCell`, and `CollaboratorWrite`.
- Improved code generation to normalize legacy Airtable metadata variants, normalize Unicode identifiers, and emit collision-safe table/field constants and interface properties.
- Fixed generated typing for `aiText`, lookup/rollup nested collection results, duplicate field names, and response-mode guardrails for field-name-keyed generated record types.
- Expanded codegen fixture coverage and compile/type-level tests for aliases, Unicode, collisions, generated output safety, and response-mode compatibility.

## 0.0.17

- Reworked Airtable type generation around the new `easy-airtable-api/codegen` workflow.
- Added public metadata/base helpers: `listBases`, `getBaseSchema`, and verified `createBase`.
- Added `airtableRequestRaw` as a public escape hatch for unsupported Airtable endpoints.
- Hardened the shared request layer with structured `AirtableApiError`, retries, `Retry-After`, jittered backoff, safer encoding, and configurable retry options.
- Added record API parity helpers including `deleteRecord`, `replaceRecord`, `replaceRecords`, `getRecord(..., options)`, `getRecordsPage`, and `iterateRecordsPages`.
- Expanded offline and opt-in integration test coverage for retries, batching, validation, metadata, codegen, and non-mutation guarantees.

## 0.0.16

- Improved type generation to support more Airtable field types.

## 0.0.15

- Type generation wraps type keys in quotations
- Fix various type generation issues
- added createRecords and createRecord methods

## 0.0.14

- Exported generateTypeScriptDefinitions function.

## 0.0.13

- Added generateTypeScriptDefinitions function to generate TypeScript definitions for Airtable tables.

## 0.0.12

- Reverted making apiKey, baseId, tableId default to undefined
- Added option to customize delay between requests via options.requestInterval

## 0.0.11

- Make apiKey, baseId, tableId default to undefined #12
- Missing .js in utils import #13

## 0.0.10

- Fixed deleteRecords implementation errors.

## 0.0.9

- Implemented the deleteRecords method.

## 0.0.8

- Implemented the updateRecords method.
- Implemented the updateRecordsUpsert method.
- Added a delay when executing many requests in succession.
- Fixed the updateRecord and updateRecords methods to return correct field types.

## 0.0.7

- Added all available options for updateRecords.
- Modified the getRecords function to automatically retrieve all records.

## 0.0.6

- Added all available options for updateRecord.
- Corrected the path to index.d.ts.

## 0.0.5

- Discontinued CJS build, supporting only ESM for now.

## 0.0.4

- Exported all available methods.
- Restructured the lib folder to eliminate duplicate types.

## 0.0.3

- Supported both ESM & CJS builds.
- Enhanced server error handling.
- Introduced generic field types.

## 0.0.2

- Developed basic request functions to retrieve or update records.
- Added type definitions for requests and fields.
- Conducted basic tests to verify the core functionality of the library.

## 0.0.1

- Initial project setup with no real functionality implemented.
