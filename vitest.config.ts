import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// The live Airtable tests page through up to 50,000 records with a 500 ms
// pause between pages, so they need a very long timeout. Unit tests keep
// Vitest's 5 s default so a hung test fails quickly; the slowest ones, which
// compile TypeScript, take about 1 s. The tests load .env, so this config
// loads it too; otherwise a flag set only in .env would run the live tests
// with the short timeout.
const runsAirtableIntegrationTests =
  process.env.RUN_AIRTABLE_INTEGRATION_TESTS === 'true';

export default defineConfig({
  test: {
    testTimeout: runsAirtableIntegrationTests ? 1_000_000 : 5_000,
  },
});
