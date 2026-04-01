import type { AirtableBaseSchema } from '../types/metadata.js';
import type { EnumMode, NormalizedBase, UnknownFieldBehavior } from './types.js';
export declare function normalizeSchema({ schema, tableNameOrId, enumMode, unknownFieldBehavior, }: {
    schema: AirtableBaseSchema;
    tableNameOrId?: string | string[];
    enumMode: EnumMode;
    unknownFieldBehavior: UnknownFieldBehavior;
}): {
    normalizedBase: NormalizedBase;
    warnings: string[];
};
