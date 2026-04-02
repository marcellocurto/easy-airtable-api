import type { AirtableBaseSchema } from '../types/metadata.js';
import {
  makeUniqueConstKeys,
  makeUniquePascalNames,
  toPascalCase,
  toSafeConstKey,
} from './identifiers.js';
import { mapFieldToNormalizedField } from './map-field.js';
import type {
  EnumMode,
  NormalizedBase,
  NormalizedTable,
  UnknownFieldBehavior,
} from './types.js';
import { compareByNameThenId, ensureArray } from './utils.js';

function countBy<T>(items: T[], getKey: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return counts;
}

export function normalizeSchema({
  schema,
  tableNameOrId,
  enumMode,
  unknownFieldBehavior,
}: {
  schema: AirtableBaseSchema;
  tableNameOrId?: string | string[];
  enumMode: EnumMode;
  unknownFieldBehavior: UnknownFieldBehavior;
}): { normalizedBase: NormalizedBase; warnings: string[] } {
  const filters = new Set(ensureArray(tableNameOrId));
  const selectedTables = [...schema.tables]
    .filter((table) => {
      if (!filters.size) return true;
      return filters.has(table.id) || filters.has(table.name);
    })
    .sort(compareByNameThenId);

  if (!selectedTables.length) {
    throw new Error('No Airtable tables matched the requested tableNameOrId filter.');
  }

  const warnings: string[] = [];
  const tableNames = makeUniquePascalNames(selectedTables);
  const tableConstKeys = makeUniqueConstKeys(selectedTables);
  const tableTypeNameCounts = countBy(selectedTables, (table) => toPascalCase(table.name));
  const tableConstKeyCounts = countBy(selectedTables, (table) => toSafeConstKey(table.name));

  const tables: NormalizedTable[] = selectedTables.map((table) => {
    const tsName = tableNames.get(table.id) ?? table.name;
    const tsConstKey = tableConstKeys.get(table.id) ?? table.name;

    if ((tableTypeNameCounts.get(toPascalCase(table.name)) ?? 0) > 1) {
      warnings.push(
        `Table name collision detected for ${table.name}. Generated type name ${tsName} includes a stable suffix.`
      );
    }

    if ((tableConstKeyCounts.get(toSafeConstKey(table.name)) ?? 0) > 1) {
      warnings.push(
        `Table const key collision detected for ${table.name}. Generated tables key ${tsConstKey} includes a stable suffix.`
      );
    }

    const fieldNames = makeUniquePascalNames(table.fields);
    const fieldConstKeys = makeUniqueConstKeys(table.fields);
    const exactFieldNameCounts = countBy(table.fields, (field) => field.name);
    const fieldTypeNameCounts = countBy(table.fields, (field) => toPascalCase(field.name));
    const fieldConstKeyCounts = countBy(table.fields, (field) => toSafeConstKey(field.name));

    const fields = table.fields.map((field) => {
      const fieldTsName = fieldNames.get(field.id) ?? field.name;
      const fieldTsConstKey = fieldConstKeys.get(field.id) ?? field.name;
      const normalizedField = mapFieldToNormalizedField({
        field,
        enumMode,
        unknownFieldBehavior,
        tsKey: field.name,
        tsConstKey: fieldTsConstKey,
        tsTypeName: `${tsName}${fieldTsName}`,
      });

      if ((exactFieldNameCounts.get(field.name) ?? 0) > 1) {
        warnings.push(
          `Duplicate field name detected for ${table.name}.${field.name}. Generated interfaces merge the colliding fields into a union.`
        );
      }

      if ((fieldTypeNameCounts.get(toPascalCase(field.name)) ?? 0) > 1) {
        warnings.push(
          `Field name collision detected for ${table.name}.${field.name}. Generated helper type name ${normalizedField.tsTypeName} includes a stable suffix.`
        );
      }

      if ((fieldConstKeyCounts.get(toSafeConstKey(field.name)) ?? 0) > 1) {
        warnings.push(
          `Field const key collision detected for ${table.name}.${field.name}. Generated fields key ${normalizedField.tsConstKey} includes a stable suffix.`
        );
      }

      warnings.push(...normalizedField.warnings.map((warning) => `${table.name}.${warning}`));
      return normalizedField;
    });

    return {
      id: table.id,
      name: table.name,
      tsName,
      tsConstKey,
      primaryFieldId: table.primaryFieldId,
      fields,
    };
  });

  return {
    normalizedBase: { tables },
    warnings: [...new Set(warnings)],
  };
}
