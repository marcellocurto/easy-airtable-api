import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getBaseSchema } from '../requests.js';
import { isRecord } from './utils.js';
function isAirtableBaseSchema(value) {
    if (!isRecord(value))
        return false;
    return Array.isArray(value.tables);
}
export async function loadSchema(source) {
    if ('schema' in source) {
        return source.schema;
    }
    if ('schemaPath' in source) {
        const filePath = resolve(source.schemaPath);
        const content = await readFile(filePath, 'utf8');
        const parsed = JSON.parse(content);
        if (!isAirtableBaseSchema(parsed)) {
            throw new Error(`Schema file at ${filePath} is not a valid Airtable base schema.`);
        }
        return parsed;
    }
    const token = source.accessToken || source.apiKey;
    if (!token) {
        throw new Error('An Airtable access token is required when loading schema from the Airtable metadata API.');
    }
    return getBaseSchema({ apiKey: token, baseId: source.baseId });
}
