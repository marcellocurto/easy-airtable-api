# Easy Airtable API

Easy Airtable API is a lightweight, TypeScript-first Airtable client for records, metadata/base APIs, code generation, and raw Airtable requests.

It is built to stay practical:

- small runtime API
- typed CRUD helpers
- code generation from Airtable metadata
- a better fit for app code than a large SDK surface

The intended workflow is simple:

1. generate types from your Airtable base
2. import the generated types in your app
3. use the runtime helpers with those types

## Install

```bash
npm install easy-airtable-api
```

```bash
bun add easy-airtable-api
```

## Recommended project setup

A good setup is to generate Airtable types once and commit the generated file.

### Example file structure

```txt
.
├── scripts/
│   └── generate-airtable-types.ts
├── src/
│   ├── airtable.generated.ts
│   └── airtable.ts
├── .env
└── package.json
```

### Example environment variables

```bash
AIRTABLE_ACCESS_TOKEN=pat_xxx
AIRTABLE_BASE_ID=app_xxx
AIRTABLE_PROJECTS_TABLE_ID=tbl_xxx
AIRTABLE_WORKSPACE_ID=wsp_xxx
```

### Example `package.json` scripts

```json
{
  "scripts": {
    "airtable:types": "tsx scripts/generate-airtable-types.ts"
  }
}
```

## 1) Generate types into your project

Create `scripts/generate-airtable-types.ts`:

```ts
import { generateAirtableTypes } from 'easy-airtable-api/codegen';

await generateAirtableTypes({
  source: {
    baseId: process.env.AIRTABLE_BASE_ID!,
    accessToken: process.env.AIRTABLE_ACCESS_TOKEN!,
  },
  output: './src/airtable.generated.ts',
  enumMode: 'hybrid',
});
```

Then run:

```bash
npm run airtable:types
```

## 2) Use the generated types in your app

Create `src/airtable.ts`:

```ts
import { createRecord, getRecords, updateRecord } from 'easy-airtable-api';
import type {
  ProjectsCreateFields,
  ProjectsRecordFields,
} from './airtable.generated';

const apiKey = process.env.AIRTABLE_ACCESS_TOKEN!;
const baseId = process.env.AIRTABLE_BASE_ID!;
const tableId = process.env.AIRTABLE_PROJECTS_TABLE_ID!;

export async function listProjects() {
  return getRecords<ProjectsRecordFields>({
    apiKey,
    baseId,
    tableId,
    options: {
      maxRecords: 100,
    },
  });
}

export async function createProject(fields: ProjectsCreateFields) {
  return createRecord<ProjectsCreateFields>({
    apiKey,
    baseId,
    tableId,
    fields,
    options: {
      typecast: true,
    },
  });
}

export async function markProjectInProgress(recordId: string) {
  return updateRecord<ProjectsCreateFields>({
    apiKey,
    baseId,
    tableId,
    recordId,
    fields: {
      Status: 'In Progress',
    },
  });
}
```

## Codegen

### `generateAirtableTypes()`

```ts
import { generateAirtableTypes } from 'easy-airtable-api/codegen';
```

Supported schema sources:

- Airtable metadata API via `baseId` + `accessToken` / `apiKey`
- local schema file via `schemaPath`
- in-memory schema object via `schema`

Example using a local schema file:

```ts
await generateAirtableTypes({
  source: {
    schemaPath: './airtable-schema.json',
  },
  output: './src/airtable.generated.ts',
});
```

### Enum typing modes

Choice-like fields such as single select and multiple select support 3 modes:

- `literal` — exact Airtable option values only
- `hybrid` — exact Airtable values plus a string fallback
- `broad` — generic `string` / `string[]`

`hybrid` is the default and usually the best fit for real Airtable projects because it preserves autocomplete while tolerating schema drift.

### Useful codegen options

```ts
await generateAirtableTypes({
  source: {
    baseId: process.env.AIRTABLE_BASE_ID!,
    accessToken: process.env.AIRTABLE_ACCESS_TOKEN!,
  },
  output: './src/airtable.generated.ts',
  tableNameOrId: ['Projects', 'Tasks'],
  enumMode: 'hybrid',
  createRequiredMode: 'allOptional',
  unknownFieldBehavior: 'unknown',
  includeTableIds: true,
  includeFieldIds: true,
  schemaMode: 'full',
});
```

### Generated type assumptions

Generated read types target Airtable's default JSON response mode:

- `cellFormat: 'json'`
- `returnFieldsByFieldId: false`

If you switch to `cellFormat: 'string'` or `returnFieldsByFieldId: true`, the response shape is no longer compatible with field-name-keyed generated interfaces. The read helpers now include type-level guardrails for this path, and incompatible calls fall back to untyped field maps unless you stay on the default JSON mode.

### Shared field/value types

Generated files import shared canonical field/value types from the package root instead of emitting duplicate local interfaces. You can import the same types in application code:

```ts
import type {
  AICell,
  Attachment,
  AttachmentWrite,
  BarcodeCell,
  BarcodeWrite,
  ButtonCell,
  Collaborator,
  CollaboratorWrite,
} from 'easy-airtable-api';
```

Examples:

- `aiText` read values use `AICell`
- attachment reads use `Attachment[]`, writes use `AttachmentWrite[]`
- collaborator reads use `Collaborator` / `Collaborator[]`, writes use `CollaboratorWrite` / `CollaboratorWrite[]`
- barcode reads use `BarcodeCell`, writes use `BarcodeWrite`
- button fields are readonly and use `ButtonCell`

These shared types make generated output and application code agree on one canonical public surface. They do not, by themselves, guarantee that every structured write shape has been exhaustively live-verified against Airtable in every edge case.

## Metadata/base APIs

### List accessible bases

```ts
import { listBases } from 'easy-airtable-api';

const result = await listBases({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
});

for (const base of result.bases) {
  console.log(base.id, base.name, base.permissionLevel);
}
```

### Fetch a base schema directly

```ts
import { getBaseSchema } from 'easy-airtable-api';

const schema = await getBaseSchema({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
});

console.log(schema.tables.map((table) => table.name));
```

This is the same metadata path used by the code generator when `source` includes a `baseId` and token.

### Create a base

```ts
import { createBase } from 'easy-airtable-api';

const created = await createBase({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  body: {
    workspaceId: process.env.AIRTABLE_WORKSPACE_ID!,
    name: 'Apartment Hunting',
    tables: [
      {
        name: 'Apartments',
        fields: [
          { name: 'Name', type: 'singleLineText' },
          {
            name: 'Visited',
            type: 'checkbox',
            options: { color: 'greenBright', icon: 'check' },
          },
        ],
      },
    ],
  },
});

console.log(created.id);
```

Per Airtable's metadata API documentation, creating a base requires a token authorized for `schema.bases:write`, and the caller must be able to create bases in the target workspace (documented as workspace creator permissions).

## Raw Airtable request escape hatch

Use `airtableRequestRaw()` when you need an Airtable endpoint that this library does not wrap yet, but still want the shared auth, retry, encoding, and structured error behavior.

```ts
import { airtableRequestRaw } from 'easy-airtable-api';

const schema = await airtableRequestRaw({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  method: 'GET',
  path: '/v0/meta/bases/app123/tables',
});
```

It accepts either Airtable-style `/v0/...` paths or paths relative to the API root used internally.

## Retry configuration

All runtime helpers accept an optional top-level `retry` object for tuning retry behavior without leaving the library's shared request layer.

```ts
import { getRecords } from 'easy-airtable-api';

const records = await getRecords({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  tableId: process.env.AIRTABLE_PROJECTS_TABLE_ID!,
  retry: {
    maxRetries: 2,
    baseDelayMs: 250,
    maxDelayMs: 1000,
    retryOn429: true,
    retryOn5xx: true,
    retryOnNetworkErrors: true,
    useJitter: false,
  },
});
```

The same `retry` option is supported by metadata helpers such as `listBases()` / `getBaseSchema()` and by `airtableRequestRaw()`.

## Runtime examples

### Get a single record

```ts
import { getRecord } from 'easy-airtable-api';
import type { ProjectsRecordFields } from './airtable.generated';

const record = await getRecord<ProjectsRecordFields>({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  tableId: process.env.AIRTABLE_PROJECTS_TABLE_ID!,
  recordId: 'rec123',
  options: {
    returnFieldsByFieldId: false,
  },
});
```

### Get one page of records

```ts
import { getRecordsPage } from 'easy-airtable-api';
import type { ProjectsRecordFields } from './airtable.generated';

const page = await getRecordsPage<ProjectsRecordFields>({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  tableId: process.env.AIRTABLE_PROJECTS_TABLE_ID!,
  options: {
    pageSize: 25,
  },
});
```

### Iterate through record pages

```ts
import { iterateRecordsPages } from 'easy-airtable-api';
import type { ProjectsRecordFields } from './airtable.generated';

for await (const page of iterateRecordsPages<ProjectsRecordFields>({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  tableId: process.env.AIRTABLE_PROJECTS_TABLE_ID!,
  options: {
    pageSize: 100,
  },
})) {
  console.log(page.records.length, page.offset);
}
```

### Create multiple records

```ts
import { createRecords } from 'easy-airtable-api';
import type { ProjectsCreateFields } from './airtable.generated';

const result = await createRecords<ProjectsCreateFields>({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  tableId: process.env.AIRTABLE_PROJECTS_TABLE_ID!,
  records: [
    {
      fields: {
        Name: 'Project A',
        Status: 'Todo',
      },
    },
    {
      fields: {
        Name: 'Project B',
        Status: 'In Progress',
      },
    },
  ],
  options: {
    typecast: true,
  },
});
```

### Replace a single record

```ts
import { replaceRecord } from 'easy-airtable-api';
import type { ProjectsCreateFields } from './airtable.generated';

const result = await replaceRecord<ProjectsCreateFields>({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  tableId: process.env.AIRTABLE_PROJECTS_TABLE_ID!,
  recordId: 'rec123',
  fields: {
    Name: 'Project A',
    Status: 'Done',
  },
});
```

### Upsert records

```ts
import { updateRecordsUpsert } from 'easy-airtable-api';
import type { ProjectsCreateFields } from './airtable.generated';

const result = await updateRecordsUpsert<ProjectsCreateFields>({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  tableId: process.env.AIRTABLE_PROJECTS_TABLE_ID!,
  records: [
    {
      fields: {
        Name: 'Project A',
        Status: 'Done',
      },
    },
  ],
  options: {
    fieldsToMergeOn: ['Name'],
    typecast: true,
  },
});
```

### Delete a single record

```ts
import { deleteRecord } from 'easy-airtable-api';

await deleteRecord({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  tableId: process.env.AIRTABLE_PROJECTS_TABLE_ID!,
  recordId: 'rec123',
});
```

### Delete records

```ts
import { deleteRecords } from 'easy-airtable-api';

await deleteRecords({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN!,
  baseId: process.env.AIRTABLE_BASE_ID!,
  tableId: process.env.AIRTABLE_PROJECTS_TABLE_ID!,
  recordIds: ['rec123', 'rec456'],
});
```

## Exports

Runtime package:

```ts
import {
  airtableRequestRaw,
  createBase,
  createRecord,
  createRecords,
  deleteRecord,
  deleteRecords,
  getBaseSchema,
  getRecord,
  getRecords,
  getRecordsPage,
  iterateRecordsPages,
  listBases,
  replaceRecord,
  replaceRecords,
  updateRecord,
  updateRecords,
  updateRecordsUpsert,
} from 'easy-airtable-api';
```

Codegen package:

```ts
import {
  buildAirtableTypes,
  generateAirtableTypes,
} from 'easy-airtable-api/codegen';
```

## Testing

Codegen coverage lives in focused fixtures under `tests/fixtures/` and runs as part of the normal Vitest suite.

The fixture matrix also includes compile checks for generated output and type-level guardrail tests for response modes that are incompatible with field-name-keyed generated types.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
