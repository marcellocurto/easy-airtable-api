import { makeUniquePascalNames, toPascalCase } from './identifiers.js';
import { mapFieldToNormalizedField } from './map-field.js';
import { compareByNameThenId, ensureArray } from './utils.js';
export function normalizeSchema({ schema, tableNameOrId, enumMode, unknownFieldBehavior, }) {
    const filters = new Set(ensureArray(tableNameOrId));
    const selectedTables = [...schema.tables]
        .filter((table) => {
        if (!filters.size)
            return true;
        return filters.has(table.id) || filters.has(table.name);
    })
        .sort(compareByNameThenId);
    if (!selectedTables.length) {
        throw new Error('No Airtable tables matched the requested tableNameOrId filter.');
    }
    const warnings = [];
    const tableNames = makeUniquePascalNames(selectedTables);
    const sanitizedTableNameCounts = new Map();
    selectedTables.forEach((table) => {
        const baseName = toPascalCase(table.name);
        sanitizedTableNameCounts.set(baseName, (sanitizedTableNameCounts.get(baseName) ?? 0) + 1);
    });
    const tables = selectedTables.map((table) => {
        const tsName = tableNames.get(table.id) ?? table.name;
        if ((sanitizedTableNameCounts.get(toPascalCase(table.name)) ?? 0) > 1) {
            warnings.push(`Table name collision detected for ${table.name}. Generated type name ${tsName} includes a stable suffix.`);
        }
        const fieldNames = makeUniquePascalNames(table.fields);
        const sanitizedFieldNameCounts = new Map();
        table.fields.forEach((field) => {
            const baseName = toPascalCase(field.name);
            sanitizedFieldNameCounts.set(baseName, (sanitizedFieldNameCounts.get(baseName) ?? 0) + 1);
        });
        const fields = table.fields.map((field) => {
            const fieldTsName = fieldNames.get(field.id) ?? field.name;
            const normalizedField = mapFieldToNormalizedField({
                field,
                enumMode,
                unknownFieldBehavior,
                tsKey: field.name,
                tsTypeName: `${tsName}${fieldTsName}`,
            });
            if ((sanitizedFieldNameCounts.get(toPascalCase(field.name)) ?? 0) > 1) {
                warnings.push(`Field name collision detected for ${table.name}.${field.name}. Generated helper type name ${normalizedField.tsTypeName} includes a stable suffix.`);
            }
            warnings.push(...normalizedField.warnings.map((warning) => `${table.name}.${warning}`));
            return normalizedField;
        });
        return {
            id: table.id,
            name: table.name,
            tsName,
            primaryFieldId: table.primaryFieldId,
            fields,
        };
    });
    return {
        normalizedBase: { tables },
        warnings: [...new Set(warnings)],
    };
}
