import type { CreateRequiredMode, NormalizedBase, SchemaMode } from './types.js';
export declare function emitTypeScript({ normalizedBase, includeTableIds, includeFieldIds, schemaMode, createRequiredMode, }: {
    normalizedBase: NormalizedBase;
    includeTableIds: boolean;
    includeFieldIds: boolean;
    schemaMode: SchemaMode;
    createRequiredMode: CreateRequiredMode;
}): string;
