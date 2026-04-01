import type { AirtableBaseSchema } from '../types/metadata.js';
import type { AirtableSchemaSource } from './types.js';
export declare function loadSchema(source: AirtableSchemaSource): Promise<AirtableBaseSchema>;
