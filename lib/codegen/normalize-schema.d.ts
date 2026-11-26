import type { AirtableBaseSchema } from '../types/metadata.js';
import type { EnumMode, NormalizedBase, SchemaMode, UnknownFieldBehavior } from './types.js';
export declare function normalizeSchema({ schema, tableNameOrId, enumMode, unknownFieldBehavior, schemaMode, }: {
    schema: AirtableBaseSchema;
    tableNameOrId?: string | string[];
    enumMode: EnumMode;
    unknownFieldBehavior: UnknownFieldBehavior;
    schemaMode: SchemaMode;
}): {
    normalizedBase: NormalizedBase;
    warnings: string[];
};
