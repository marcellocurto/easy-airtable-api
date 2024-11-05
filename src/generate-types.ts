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

    typeDefinitions += `  ${fieldName}?: ${mapAirtableTypeToTypeScript(
      field.type
    )};\n`;
  });

  typeDefinitions += '};\n';

  return typeDefinitions;
}

function mapAirtableTypeToTypeScript(airtableType: string): string {
  switch (airtableType) {
    case 'aiText':
    case 'singleLineText':
    case 'email':
    case 'url':
    case 'phoneNumber':
    case 'multilineText':
    case 'richText':
    case 'button':
    case 'barcode':
    case 'createdTime':
    case 'lastModifiedTime':
      return 'string';
    case 'number':
    case 'currency':
    case 'percent':
    case 'rating':
    case 'duration':
    case 'autoNumber':
    case 'count':
      return 'number';
    case 'checkbox':
      return 'boolean';
    case 'date':
    case 'dateTime':
      return 'Date';
    case 'singleSelect':
    case 'multipleSelects':
      return 'string[]';
    case 'attachment':
      return 'any[]';
    case 'collaborator':
    case 'multipleCollaborators':
      return '{ id: string; email?: string; name?: string; permissionLevel?: string; profilePicUrl?: string; }[]';
    case 'linkToAnotherRecord':
    case 'multipleRecordLinks':
      return 'string[]';
    case 'lookup':
    case 'rollup':
      return 'any';
    case 'formula':
      return 'string | number | boolean | any[]';
    case 'syncSource':
      return 'string';
    default:
      return 'any';
  }
}
