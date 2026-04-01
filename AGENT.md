## Project context

This repository is an **npm library**, not an application.

When making changes, optimize for:

- published package correctness
- stable ESM output in `lib/`
- good consumer ergonomics for people installing from npm

## ESM import rule

This package uses ESM and is published for npm, so **relative imports in TypeScript source should use `.js` extensions**.

Example:

```ts
import { airtableRequest } from './requests.js';
```

Even though the source file is `requests.ts`, the emitted runtime file is `requests.js`, and Node ESM resolution expects the runtime extension.

Do **not** switch relative imports back to extensionless paths like:

```ts
import { airtableRequest } from './requests';
```

That may type-check in some setups but can break the built package for consumers.
