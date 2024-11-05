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
    case 'aiText':
    case 'singleLineText':
    case 'multilineText':
    case 'richText':
    case 'email':
    case 'url':
    case 'phoneNumber':
    case 'singleSelect':
    case 'button':
    case 'barcode':
    case 'date':
    case 'dateTime':
    case 'syncSource':
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
    case 'multipleSelects':
      return { type: 'string[]', readonly: false };
    case 'attachment':
    case 'multipleAttachments':
      return {
        type: '{ readonly id: string; url: string; filename: string; type: string; size: number; width?: number; height?: number; thumbnails?: { small?: { url: string; width: number; height: number; }; large?: { url: string; width: number; height: number; }; full?: { url: string; width: number; height: number; }; }; }[]',
        readonly: false,
      };
    case 'singleCollaborator':
      return {
        type: '{ id: string; email?: string; name?: string; permissionLevel?: "none" | "read" | "comment" | "edit" | "create"; profilePicUrl?: string; }',
        readonly: false,
      };
    case 'multipleCollaborators':
      return {
        type: '{ id: string; email?: string; name?: string; permissionLevel?: "none" | "read" | "comment" | "edit" | "create"; profilePicUrl?: string; }[]',
        readonly: false,
      };
    case 'linkToAnotherRecord':
    case 'multipleRecordLinks':
      return { type: 'string[]', readonly: false };
    case 'lookup':
      return { type: 'any', readonly: false };
    case 'rollup':
      return { type: 'string | number | boolean', readonly: true };
    case 'formula':
      return {
        type: 'string | number | boolean | (string | number)[]',
        readonly: true,
      };
    case 'createdBy':
      return {
        type: '{ id: string; email?: string; name?: string; permissionLevel?: "none" | "read" | "comment" | "edit" | "create"; profilePicUrl?: string; }',
        readonly: true,
      };
    case 'lastModifiedBy':
      return {
        type: '{ id: string; email?: string; name?: string; permissionLevel?: "none" | "read" | "comment" | "edit" | "create"; profilePicUrl?: string; }',
        readonly: true,
      };
    default:
      return { type: 'any', readonly: false };
  }
}
