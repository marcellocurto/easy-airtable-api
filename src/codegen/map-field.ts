import type { AirtableFieldSchema } from '../types/metadata.js';
import type {
  EnumMode,
  NormalizedField,
  UnknownFieldBehavior,
} from './types.js';
import { getChoices, getRecordValue, stringifyUnion } from './utils.js';

const READONLY_FIELD_TYPES = new Set([
  'aiText',
  'autoNumber',
  'button',
  'count',
  'createdBy',
  'createdTime',
  'formula',
  'lastModifiedBy',
  'lastModifiedTime',
  'lookup',
  'rollup',
  'syncSource',
]);

const COMPUTED_FIELD_TYPES = new Set([
  'aiText',
  'autoNumber',
  'button',
  'count',
  'formula',
  'lookup',
  'rollup',
  'syncSource',
]);

function resolveUnknown(
  field: AirtableFieldSchema,
  unknownFieldBehavior: UnknownFieldBehavior,
  reason?: string
): { type: string; warning?: string } {
  const warning = reason
    ? `${field.name}: ${reason}`
    : `${field.name}: unsupported Airtable field type ${field.type}`;

  if (unknownFieldBehavior === 'error') {
    throw new Error(warning);
  }

  return { type: 'unknown', warning };
}

function resolveUnknownArray(
  field: AirtableFieldSchema,
  unknownFieldBehavior: UnknownFieldBehavior,
  reason?: string
): { type: string; warning?: string } {
  const resolved = resolveUnknown(field, unknownFieldBehavior, reason);
  return {
    type: 'unknown[]',
    warning: resolved.warning,
  };
}

function buildEnumType(
  field: AirtableFieldSchema,
  enumMode: EnumMode
): string | undefined {
  const choices = getChoices(field.options);
  if (!choices?.length) return undefined;

  const literals = stringifyUnion(choices.map((choice) => choice.name));

  if (enumMode === 'literal') return literals;
  if (enumMode === 'broad') return 'string';
  return `${literals} | (string & {})`;
}

function mapResultDescriptor(
  descriptor: unknown,
  field: AirtableFieldSchema,
  enumMode: EnumMode,
  unknownFieldBehavior: UnknownFieldBehavior
): { type: string; warning?: string } {
  const resultType = getRecordValue<string>(descriptor, 'type');
  if (!resultType) {
    return resolveUnknown(field, unknownFieldBehavior, 'metadata result type is missing');
  }

  const nestedField: AirtableFieldSchema = {
    ...field,
    type: resultType,
    options: getRecordValue<Record<string, unknown>>(descriptor, 'options'),
  };

  return mapFieldTypes({
    field: nestedField,
    enumMode,
    unknownFieldBehavior,
  }).read;
}

export function mapFieldTypes({
  field,
  enumMode,
  unknownFieldBehavior,
}: {
  field: AirtableFieldSchema;
  enumMode: EnumMode;
  unknownFieldBehavior: UnknownFieldBehavior;
}): {
  read: { type: string; warning?: string };
  create?: { type: string; warning?: string };
  update?: { type: string; warning?: string };
  readonly: boolean;
  computed: boolean;
  linkedTableId?: string;
  enumTypeAlias?: string;
} {
  const readonly = READONLY_FIELD_TYPES.has(field.type);
  const computed = COMPUTED_FIELD_TYPES.has(field.type);
  const linkedTableId = getRecordValue<string>(field.options, 'linkedTableId');

  switch (field.type) {
    case 'singleLineText':
    case 'multilineText':
    case 'richText':
    case 'email':
    case 'url':
    case 'phoneNumber':
    case 'date':
    case 'dateTime':
      return {
        read: { type: 'string' },
        create: { type: 'string' },
        update: { type: 'string' },
        readonly,
        computed,
      };
    case 'aiText':
      return {
        read: { type: 'string' },
        readonly,
        computed,
      };
    case 'number':
    case 'currency':
    case 'percent':
    case 'rating':
    case 'duration':
      return {
        read: { type: 'number' },
        create: { type: 'number' },
        update: { type: 'number' },
        readonly,
        computed,
      };
    case 'checkbox':
      return {
        read: { type: 'boolean' },
        create: { type: 'boolean' },
        update: { type: 'boolean' },
        readonly,
        computed,
      };
    case 'singleSelect': {
      const enumType = buildEnumType(field, enumMode) ?? 'string';
      return {
        read: { type: enumType },
        create: { type: enumType },
        update: { type: enumType },
        readonly,
        computed,
        enumTypeAlias: enumType,
      };
    }
    case 'multipleSelects': {
      const enumType = buildEnumType(field, enumMode) ?? 'string';
      return {
        read: { type: `Array<${enumType}>` },
        create: { type: `Array<${enumType}>` },
        update: { type: `Array<${enumType}>` },
        readonly,
        computed,
        enumTypeAlias: enumType,
      };
    }
    case 'multipleAttachments':
    case 'attachment':
      return {
        read: { type: 'Attachment[]' },
        create: { type: 'AttachmentWrite[]' },
        update: { type: 'AttachmentWrite[]' },
        readonly,
        computed,
      };
    case 'singleCollaborator':
      return {
        read: { type: 'Collaborator' },
        create: { type: 'Collaborator' },
        update: { type: 'Collaborator' },
        readonly,
        computed,
      };
    case 'multipleCollaborators':
      return {
        read: { type: 'Collaborator[]' },
        create: { type: 'Collaborator[]' },
        update: { type: 'Collaborator[]' },
        readonly,
        computed,
      };
    case 'multipleRecordLinks':
    case 'linkToAnotherRecord':
      return {
        read: { type: 'string[]' },
        create: { type: 'string[]' },
        update: { type: 'string[]' },
        readonly,
        computed,
        linkedTableId,
      };
    case 'barcode':
      return {
        read: { type: 'Barcode' },
        create: { type: 'Barcode' },
        update: { type: 'Barcode' },
        readonly,
        computed,
      };
    case 'createdTime':
    case 'lastModifiedTime':
      return {
        read: { type: 'string' },
        readonly,
        computed,
      };
    case 'createdBy':
    case 'lastModifiedBy':
      return {
        read: { type: 'Collaborator' },
        readonly,
        computed,
      };
    case 'button':
      return {
        read: { type: 'ButtonFieldValue' },
        readonly,
        computed,
      };
    case 'count':
    case 'autoNumber':
      return {
        read: { type: 'number' },
        readonly,
        computed,
      };
    case 'formula': {
      const result = mapResultDescriptor(
        getRecordValue(field.options, 'result'),
        field,
        enumMode,
        unknownFieldBehavior
      );
      return {
        read: result,
        readonly,
        computed,
      };
    }
    case 'rollup': {
      const result = getRecordValue(field.options, 'result');
      const mapped = result
        ? mapResultDescriptor(result, field, enumMode, unknownFieldBehavior)
        : resolveUnknown(field, unknownFieldBehavior, 'rollup result metadata is missing');

      return {
        read: mapped,
        readonly,
        computed,
      };
    }
    case 'lookup': {
      const result = getRecordValue(field.options, 'result');
      const mapped = result
        ? mapResultDescriptor(result, field, enumMode, unknownFieldBehavior)
        : resolveUnknownArray(field, unknownFieldBehavior, 'lookup result metadata is missing');

      return {
        read:
          mapped.type === 'unknown'
            ? { ...mapped, type: 'unknown[]' }
            : { ...mapped, type: `Array<${mapped.type}>` },
        readonly,
        computed,
      };
    }
    default: {
      const unknown = resolveUnknown(field, unknownFieldBehavior);
      return {
        read: unknown,
        create: readonly ? undefined : unknown,
        update: readonly ? undefined : unknown,
        readonly,
        computed,
      };
    }
  }
}

export function mapFieldToNormalizedField({
  field,
  enumMode,
  unknownFieldBehavior,
  tsKey,
  tsTypeName,
}: {
  field: AirtableFieldSchema;
  enumMode: EnumMode;
  unknownFieldBehavior: UnknownFieldBehavior;
  tsKey: string;
  tsTypeName: string;
}): NormalizedField {
  const mapped = mapFieldTypes({
    field,
    enumMode,
    unknownFieldBehavior,
  });

  const warnings = [
    mapped.read.warning,
    mapped.create?.warning,
    mapped.update?.warning,
  ].filter((warning): warning is string => Boolean(warning));

  return {
    id: field.id,
    name: field.name,
    tsKey,
    tsTypeName,
    airtableType: field.type,
    readonly: mapped.readonly,
    computed: mapped.computed,
    readType: mapped.read.type,
    createType: mapped.create?.type,
    updateType: mapped.update?.type,
    linkedTableId: mapped.linkedTableId,
    enumTypeAlias: mapped.enumTypeAlias,
    warnings,
    options: field.options,
  };
}
