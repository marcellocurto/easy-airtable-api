import { getBaseSchema } from './requests';

export async function generateTypeScriptDefinitions({
  apiKey,
  baseId,
  tableNameOrId,
}: {
  apiKey: string;
  baseId: string;
  tableNameOrId: string;
}): Promise<string> {
  const schema = await getBaseSchema({ apiKey, baseId });

  const table = schema.tables.find(
    (t) => t.id === tableNameOrId || t.name === tableNameOrId
  );

  if (!table) {
    throw new Error(`Table with name or ID "${tableNameOrId}" not found.`);
  }

  let typeDefinitions = `type ${table.name}Fields = {\n`;

  table.fields.forEach((field) => {
    let fieldName;
    if (field.name.includes('"')) {
      if (field.name.includes("'")) {
        if (field.name.includes('`')) {
          fieldName = field.name;
        } else {
          fieldName = `\`${field.name}\``;
        }
      } else {
        fieldName = `'${field.name}'`;
      }
    } else {
      fieldName = `"${field.name}"`;
    }

    const typeInfo = mapAirtableTypeToTypeScript(field.type);
    const fieldType = typeInfo.readonly
      ? `readonly ${typeInfo.type}`
      : typeInfo.type;
    typeDefinitions += `  ${fieldName}?: ${fieldType};\n`;
  });

  typeDefinitions += '};\n';

  return typeDefinitions;
}

function mapAirtableTypeToTypeScript(airtableType: string): {
  type: string;
  readonly: boolean;
} {
  switch (airtableType) {
    case 'date':
    case 'dateTime':
      return { type: 'string', readonly: false };
    case 'createdTime':
    case 'lastModifiedTime':
      return { type: 'string', readonly: true };
    case 'number':
    case 'currency':
    case 'percent':
    case 'rating':
    case 'duration':
    case 'autoNumber':
    case 'count':
      return { type: 'number', readonly: false };
    case 'checkbox':
      return { type: 'boolean', readonly: false };
    case 'singleSelect':
    case 'multipleSelects':
      return { type: 'string[]', readonly: false };
    case 'attachment':
      return { type: 'any[]', readonly: false };
    case 'collaborator':
    case 'multipleCollaborators':
      return {
        type: '{ id: string; email?: string; name?: string; permissionLevel?: string; profilePicUrl?: string; }[]',
        readonly: false,
      };
    case 'linkToAnotherRecord':
    case 'multipleRecordLinks':
      return { type: 'string[]', readonly: false };
    case 'lookup':
    case 'rollup':
      return { type: 'any', readonly: false };
    case 'formula':
      return { type: 'string | number | boolean | any[]', readonly: true };
    case 'syncSource':
      return { type: 'string', readonly: false };
    default:
      return { type: 'any', readonly: false };
  }
}
