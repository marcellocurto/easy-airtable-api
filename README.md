# Easy Airtable API

This is meant as an easier/better-to-use alternative to the official Airtable node app.

My focus is on delivering a better experience using types and making it easier to get and modify records with some helper functions.

Currently, this project is super early and still needs a lot of work. However, most methods have been implemented to at least get and update records.

More to come soon.

## Install

```
npm install easy-airtable-api
```

## Changelog

### 0.0.5

- Drop CJS build and only support ESM for now.
- Helper to get all records and not just 100 max.

### 0.0.4

- Export all available methods.
- Restucture lib folder to not have duplicate types.

### 0.0.3

- ESM & CJS builds.
- Server error handling.
- Generic field types.

### 0.0.2

- Basic request functions to get or update records.
- Added type definitions for requests and fields.
- Basic tests to check the core functionality of the library.

### 0.0.1

- Basic project setup - no real functionality.