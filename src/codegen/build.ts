import type { AirtableCodegenResult, GenerateAirtableTypesOptions } from './types.js';
import { emitTypeScript } from './emit-typescript.js';
import { loadSchema } from './load-schema.js';
import { normalizeSchema } from './normalize-schema.js';

export async function buildAirtableTypes(
  options: Omit<GenerateAirtableTypesOptions, 'output'>
): Promise<AirtableCodegenResult> {
  const {
    source,
    tableNameOrId,
    enumMode = 'hybrid',
    createRequiredMode = 'allOptional',
    unknownFieldBehavior = 'unknown',
    includeTableIds = true,
    includeFieldIds = true,
    schemaMode = 'full',
  } = options;

  const schema = await loadSchema(source);
  const { normalizedBase, warnings } = normalizeSchema({
    schema,
    tableNameOrId,
    enumMode,
    unknownFieldBehavior,
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
