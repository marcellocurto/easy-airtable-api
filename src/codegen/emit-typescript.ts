import type {
  CreateRequiredMode,
  NormalizedBase,
  NormalizedField,
  SchemaMode,
} from './types.js';
import { quotePropertyKey } from './identifiers.js';
import { emittedInterfaces, usedSharedTypes } from './type-names.js';

function isPrimaryCreateField(
  field: NormalizedField,
  primaryFieldId: string,
  createRequiredMode: CreateRequiredMode
): boolean {
  return (
    createRequiredMode === 'primaryField' &&
    field.id === primaryFieldId &&
    Boolean(field.createType)
  );
}

function getFieldTypeForKind(
  field: NormalizedField,
  kind: 'read' | 'create' | 'update'
): string | undefined {
  if (kind === 'read') return field.readType;
  if (kind === 'create') return field.createType;
  return field.updateType;
}

function groupFieldsByPropertyKey(
  fields: NormalizedField[],
  kind: 'read' | 'create' | 'update'
): Array<{ key: string; fields: NormalizedField[] }> {
  const groups = new Map<string, NormalizedField[]>();

  fields.forEach((field) => {
    const type = getFieldTypeForKind(field, kind);
    if (!type) return;

    const existing = groups.get(field.tsKey);
    if (existing) {
      existing.push(field);
      return;
    }

    groups.set(field.tsKey, [field]);
  });

  return [...groups.entries()].map(([key, groupedFields]) => ({
    key,
    fields: groupedFields,
  }));
}

function unionTypes(types: string[]): string {
  const distinctTypes = [...new Set(types)];
  return distinctTypes.join(' | ');
}

function emitInterface({
  name,
  fields,
  kind,
  primaryFieldId,
  createRequiredMode,
}: {
  name: string;
  fields: NormalizedField[];
  kind: 'read' | 'create' | 'update';
  primaryFieldId: string;
  createRequiredMode: CreateRequiredMode;
}): string {
  const groupedFields = groupFieldsByPropertyKey(fields, kind);

  const lines = groupedFields.map(({ key, fields: grouped }) => {
    const propertyTypes = grouped
      .map((field) => getFieldTypeForKind(field, kind))
      .filter((type): type is string => Boolean(type));

    // Airtable clears a field when an update sends null for it.
    const propertyType =
      kind === 'update'
        ? `${unionTypes(propertyTypes)} | null`
        : unionTypes(propertyTypes);
    const isRequired =
      kind === 'create' &&
      grouped.some((field) =>
        isPrimaryCreateField(field, primaryFieldId, createRequiredMode)
      );

    return `  ${quotePropertyKey(key)}${isRequired ? '' : '?'}: ${propertyType};`;
  });

  if (!lines.length) {
    return `export interface ${name} {}`;
  }

  return [`export interface ${name} {`, ...lines, `}`].join('\n');
}

function emitEnumAliases(table: NormalizedBase['tables'][number]): string[] {
  return table.fields
    .filter((field) => Boolean(field.enumTypeAlias))
    .map((field) => `export type ${field.tsTypeName} = ${field.enumTypeAlias};`);
}

function emitTableIds(normalizedBase: NormalizedBase): string {
  const lines = normalizedBase.tables.map(
    (table) => `  ${table.tsConstKey}: ${JSON.stringify(table.id)},`
  );

  return ['export const tables = {', ...lines, '} as const;'].join('\n');
}

function emitFieldIds(normalizedBase: NormalizedBase): string {
  const lines = normalizedBase.tables.map((table) => {
    const fieldLines = table.fields.map(
      (field) => `    ${field.tsConstKey}: ${JSON.stringify(field.id)},`
    );

    return [`  ${table.tsConstKey}: {`, ...fieldLines, '  },'].join('\n');
  });

  return ['export const fields = {', ...lines, '} as const;'].join('\n');
}

/**
 * The exported aliases and interfaces for one table, as generated lines.
 */
function emitTableDeclarations({
  table,
  emits,
  createRequiredMode,
}: {
  table: NormalizedBase['tables'][number];
  emits: { read: boolean; write: boolean };
  createRequiredMode: CreateRequiredMode;
}): string[] {
  const declarations: string[] = [];

  const enumAliases = emitEnumAliases(table);
  if (enumAliases.length) {
    declarations.push(...enumAliases, '');
  }

  if (emits.read) {
    declarations.push(
      emitInterface({
        name: table.typeNames.recordFields,
        fields: table.fields,
        kind: 'read',
        primaryFieldId: table.primaryFieldId,
        createRequiredMode,
      }),
      `export type ${table.typeNames.record} = AirtableRecord<${table.typeNames.recordFields}>;`
    );
  }

  if (emits.write) {
    declarations.push(
      emitInterface({
        name: table.typeNames.createFields,
        fields: table.fields,
        kind: 'create',
        primaryFieldId: table.primaryFieldId,
        createRequiredMode,
      }),
      emitInterface({
        name: table.typeNames.updateFields,
        fields: table.fields,
        kind: 'update',
        primaryFieldId: table.primaryFieldId,
        createRequiredMode,
      })
    );
  }

  return declarations;
}

export function emitTypeScript({
  normalizedBase,
  includeTableIds,
  includeFieldIds,
  schemaMode,
  createRequiredMode,
}: {
  normalizedBase: NormalizedBase;
  includeTableIds: boolean;
  includeFieldIds: boolean;
  schemaMode: SchemaMode;
  createRequiredMode: CreateRequiredMode;
}): string {
  const emits = emittedInterfaces(schemaMode);
  const tableSections = normalizedBase.tables.map((table) => ({
    // A line break in a table name would end the comment and turn the rest of
    // the name into code.
    comment: `// ${`${table.name} (${table.id})`.replace(/[\r\n\u2028\u2029]+/g, ' ')}`,
    declarations: emitTableDeclarations({ table, emits, createRequiredMode }),
  }));

  // Imports come from the emitted declarations, so they always match what the
  // file uses. The comments and the id constants are left out, because a table
  // or field named like a shared type would otherwise count as a use.
  const sharedTypes = usedSharedTypes(
    tableSections.flatMap((section) => section.declarations)
  );

  const sections: string[] = [
    '/* eslint-disable */',
    '// Generated by easy-airtable-api. Do not edit manually.',
    "// Generated record-field types assume Airtable's default response mode: cellFormat: 'json' and returnFieldsByFieldId: false.",
  ];
  if (sharedTypes.length) {
    sections.push(
      '',
      `import type { ${sharedTypes.join(', ')} } from 'easy-airtable-api';`
    );
  }

  if (includeTableIds) {
    sections.push('', emitTableIds(normalizedBase));
  }

  if (includeFieldIds) {
    sections.push('', emitFieldIds(normalizedBase));
  }

  tableSections.forEach(({ comment, declarations }) => {
    sections.push('', comment, ...declarations);
  });

  return `${sections.join('\n')}\n`;
}
