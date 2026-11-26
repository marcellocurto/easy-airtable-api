import { emitTypeScript } from './emit-typescript.js';
import { loadSchema } from './load-schema.js';
import { normalizeSchema } from './normalize-schema.js';
import { parseCodegenMode } from './options.js';
export async function buildAirtableTypes(options) {
    const { source, tableNameOrId, includeTableIds = true, includeFieldIds = true, } = options;
    const enumMode = parseCodegenMode('enumMode', options.enumMode) ?? 'hybrid';
    const createRequiredMode = parseCodegenMode('createRequiredMode', options.createRequiredMode) ??
        'allOptional';
    const unknownFieldBehavior = parseCodegenMode('unknownFieldBehavior', options.unknownFieldBehavior) ??
        'unknown';
    const schemaMode = parseCodegenMode('schemaMode', options.schemaMode) ?? 'full';
    const schema = await loadSchema(source);
    const { normalizedBase, warnings } = normalizeSchema({
        schema,
        tableNameOrId,
        enumMode,
        unknownFieldBehavior,
        schemaMode,
    });
    const content = emitTypeScript({
        normalizedBase,
        includeTableIds,
        includeFieldIds,
        schemaMode,
        createRequiredMode,
    });
    return {
        content,
        tablesGenerated: normalizedBase.tables.length,
        warnings,
    };
}
