# Easy Airtable API

Easy Airtable API is a lightweight, TypeScript-first Airtable client for reading, creating, updating, upserting, and deleting records.

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
  createRecord,
  createRecords,
  deleteRecord,
  deleteRecords,
  getRecord,
  getRecords,
  getRecordsPage,
  iterateRecordsPages,
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

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
