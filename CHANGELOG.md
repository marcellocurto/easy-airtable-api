# Changelog

## 0.2.1

### Fixed

- 0.2.0 was published without its `lib/` folder, so importing the package failed. 0.2.1 contains the same code as 0.2.0, packaged correctly.
- Release tarballs are no longer packed into the published package.

## 0.2.0

### Breaking changes

- Requires Node.js 20 or later.
- Every request that Airtable or the network fails for good throws `AirtableApiError`, connection failures included (`statusCode` unset, Node's error as `cause`). Errors gain `attempts` and `earlierAttemptMayHaveApplied`, and `retryable` now means resending is safe: a create that failed after a 5xx or a dropped connection reports `false`.
- Creates are no longer resent after a 5xx or a dropped connection. They are still retried after a 429 or when the connection never opened, and updates, deletes, and reads still retry.
- When a later chunk of a batch helper fails, it throws `AirtableBatchError` with `completed`, `pending`, and the original error as `cause`.
- `maxDelayMs` defaults to 30 seconds. A server-requested wait longer than `maxDelayMs` now fails immediately instead of sleeping.
- `requestInterval: 0` means no pause, and record pagination now pauses between pages (500 ms by default).
- Generated `UpdateFields` accept `null`, generated files import only the shared types they use, and colliding type names get stable suffixes.
- The CLI rejects unknown options and invalid values. The unused codegen `format` option is removed.

### Added

- `retry.timeoutMs` to set the socket inactivity timeout.
- `AirtableBatchError`, exported from the package root.

### Fixed

- Text with multi-byte characters was corrupted when a character spanned two response chunks.
- Requests hung forever when the connection dropped mid-response.
- 429 retries now wait out Airtable's 30-second lockout.
- Every 5xx is retried. Error responses that aren't JSON keep their status code, and a 204 resolves to `undefined`.
- Network errors are recognized by Node's error code, so timeouts and DNS failures are retried.
- `apiURL` honors its protocol, port, and IPv6 hosts.
- `deleteRecord` retried after a 5xx or a dropped connection treats a 404 as success, since the earlier attempt deleted the record.
- Record, base, and table IDs are URL-encoded; empty IDs and `.` or `..` are rejected.
- Codegen types sync source fields correctly, and table names can no longer inject code through the generated comments.

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
