# Easy Airtable API

This is intended as a more accessible and user-friendly alternative to the official Airtable Node.js library.

My focus has been on delivering an enhanced experience by utilizing types and simplifying the process of retrieving and modifying records through some helpful functions.

Currently, this project is in its early stages and requires significant development. Nonetheless, most methods to retrieve and update records have already been implemented.

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
import { getRecord } from "easy-airtable-api";

type Fields = {
  Name?: string;
  Notes?: string;
  Status?: string;
};

const record = await getRecord<Fields>({
  apiKey: 'apiKey',
  baseId: 'baseId',
  tableId: 'tableId',
  recordId: 'recordId',
});
```

### Get Multiple Records

```ts
import { getRecords } from "easy-airtable-api";

type Fields = {
  Name?: string;
  Notes?: string;
  Status?: string;
};

const records = await getRecords<Fields>({
  apiKey: 'apiKey',
  baseId: 'baseId',
  tableId: 'tableId',
  options: {
    maxRecords: 500,
  },
});
```

## Changelog

### 0.0.9

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