# Easy Airtable API

I created this as a simpler alternative to the official Airtable Node.js library.

This library makes it easier to work with Airtable by providing TypeScript support and straightforward functions for reading and writing records.

While this is still an early project and needs more work, you can already use it to fetch and update records in your Airtable bases.

I'm already using it in production for many projects.

It also supports generating TypeScript definitions for your Airtable tables which is super useful.

## Install

```bash
npm install easy-airtable-api
```

```bash
bun add easy-airtable-api
```

## How to Use

### Get a Single Record

```ts
import { getRecord } from 'easy-airtable-api';

type Fields = {
  Name?: string;
  Notes?: string;
  Status?: string;
};

const record = await getRecord<Fields>({
  apiKey: 'apiKey',
  baseId: 'baseId',
  tableNameOrId: 'tableNameOrId',
  recordId: 'recordId',
});
```

### Get Multiple Records

```ts
import { getRecords } from 'easy-airtable-api';

type Fields = {
  Name?: string;
  Notes?: string;
  Status?: string;
};

const records = await getRecords<Fields>({
  apiKey: 'apiKey',
  baseId: 'baseId',
  tableNameOrId: 'tableNameOrId',
  options: {
    maxRecords: 500,
  },
});
```

### Update a Single Record

```ts
import { updateRecord } from 'easy-airtable-api';

type Fields = {
  Name?: string;
  Status?: string;
};

const record = await updateRecord<Fields>({
  apiKey: 'apiKey',
  baseId: 'baseId',
  tableNameOrId: 'tableNameOrId',
  recordId: 'recordId',
  options: {
    typecast: true,
  },
  fields: {
    Name: 'New Name',
    Status: 'Active',
  },
});
```

### Update Multiple Records

```ts
import { updateRecords } from 'easy-airtable-api';

type Fields = {
  Name?: string;
  Status?: string;
};

const records = await updateRecords<Fields>({
  apiKey: 'apiKey',
  baseId: 'baseId',
  tableNameOrId: 'tableNameOrId',
  records: [
    {
      id: 'recordId1',
      fields: {
        Name: 'New Name 1',
        Status: 'Active',
      }
    },
    {
      id: 'recordId2',
      fields: {
        Name: 'New Name 2',
        Status: 'Inactive',
      }
    }
  ],
  options: {
    typecast: true,
  }
});
```

### Generate TypeScript Definitions

```ts
import { generateTypeScriptDefinitions } from 'easy-airtable-api';

const types = await generateTypeScriptDefinitions({
  apiKey: 'apiKey',
  baseId: 'baseId',
  tableNameOrId: 'tableNameOrId',
});
```

## Changelog

### 0.0.16

- Improved type generation to support more Airtable field types.

### 0.0.15

- Type generation wraps type keys in quotations
- Fix various type generation issues
- added createRecords and createRecord methods

### 0.0.14

- Exported generateTypeScriptDefinitions function.

### 0.0.13

- Added generateTypeScriptDefinitions function to generate TypeScript definitions for Airtable tables.

### 0.0.12

- Reverted making apiKey, baseId, tableId default to undefined
- Added option to customize delay between requests via options.requestInterval

### 0.0.11

- Make apiKey, baseId, tableId default to undefined #12
- Missing .js in utils import #13

### 0.0.10

- Fixed deleteRecords implementation errors.

### 0.0.9

- Implemented the deleteRecords method.

### 0.0.8

- Implemented the updateRecords method.
- Implemented the updateRecordsUpsert method.
- Added a delay when executing many requests in succession.
- Fixed the updateRecord and updateRecords methods to return correct field types.

### 0.0.7

- Added all available options for updateRecords.
- Modified the getRecords function to automatically retrieve all records.

### 0.0.6

- Added all available options for updateRecord.
- Corrected the path to index.d.ts.

### 0.0.5

- Discontinued CJS build, supporting only ESM for now.

### 0.0.4

- Exported all available methods.
- Restructured the lib folder to eliminate duplicate types.

### 0.0.3

- Supported both ESM & CJS builds.
- Enhanced server error handling.
- Introduced generic field types.

### 0.0.2

- Developed basic request functions to retrieve or update records.
- Added type definitions for requests and fields.
- Conducted basic tests to verify the core functionality of the library.

### 0.0.1

- Initial project setup with no real functionality implemented.
