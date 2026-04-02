import { getChoices, getRecordValue, stringifyUnion } from './utils.js';
const FIELD_TYPE_ALIASES = {
    attachment: 'multipleAttachments',
    linkToAnotherRecord: 'multipleRecordLinks',
    multipleLookupValues: 'lookup',
};
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
function canonicalizeFieldType(type) {
    return FIELD_TYPE_ALIASES[type] ?? type;
}
function resolveUnknown(field, unknownFieldBehavior, reason) {
    const warning = reason
        ? `${field.name}: ${reason}`
        : `${field.name}: unsupported Airtable field type ${field.type}`;
    if (unknownFieldBehavior === 'error') {
        throw new Error(warning);
    }
    return {
        type: 'unknown',
        warning,
        collection: 'scalar',
    };
}
function resolveUnknownArray(field, unknownFieldBehavior, reason) {
    const resolved = resolveUnknown(field, unknownFieldBehavior, reason);
    return {
        type: 'unknown[]',
        warning: resolved.warning,
        collection: 'array',
    };
}
function buildEnumType(field, enumMode) {
    const choices = getChoices(field.options);
    if (!choices?.length)
        return undefined;
    const literals = stringifyUnion(choices.map((choice) => choice.name));
    if (enumMode === 'literal')
        return literals;
    if (enumMode === 'broad')
        return 'string';
    return `${literals} | (string & {})`;
}
function mapResultDescriptor(descriptor, field, enumMode, unknownFieldBehavior) {
    const resultType = getRecordValue(descriptor, 'type');
    if (!resultType) {
        return resolveUnknown(field, unknownFieldBehavior, 'metadata result type is missing');
    }
    const nestedField = {
        ...field,
        type: resultType,
        options: getRecordValue(descriptor, 'options'),
    };
    return mapFieldTypes({
        field: nestedField,
        enumMode,
        unknownFieldBehavior,
    }).read;
}
export function mapFieldTypes({ field, enumMode, unknownFieldBehavior, }) {
    const canonicalType = canonicalizeFieldType(field.type);
    const normalizedField = canonicalType === field.type ? field : { ...field, type: canonicalType };
    const readonly = READONLY_FIELD_TYPES.has(canonicalType);
    const computed = COMPUTED_FIELD_TYPES.has(canonicalType);
    const linkedTableId = getRecordValue(normalizedField.options, 'linkedTableId');
    switch (canonicalType) {
        case 'singleLineText':
        case 'multilineText':
        case 'richText':
        case 'email':
        case 'url':
        case 'phoneNumber':
        case 'date':
        case 'dateTime':
            return {
                read: { type: 'string', collection: 'scalar' },
                create: { type: 'string', collection: 'scalar' },
                update: { type: 'string', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'aiText':
            return {
                read: { type: 'AICell', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'number':
        case 'currency':
        case 'percent':
        case 'rating':
        case 'duration':
            return {
                read: { type: 'number', collection: 'scalar' },
                create: { type: 'number', collection: 'scalar' },
                update: { type: 'number', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'checkbox':
            return {
                read: { type: 'boolean', collection: 'scalar' },
                create: { type: 'boolean', collection: 'scalar' },
                update: { type: 'boolean', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'singleSelect': {
            const enumType = buildEnumType(normalizedField, enumMode) ?? 'string';
            return {
                read: { type: enumType, collection: 'scalar' },
                create: { type: enumType, collection: 'scalar' },
                update: { type: enumType, collection: 'scalar' },
                readonly,
                computed,
                enumTypeAlias: enumType,
            };
        }
        case 'multipleSelects': {
            const enumType = buildEnumType(normalizedField, enumMode) ?? 'string';
            return {
                read: { type: `Array<${enumType}>`, collection: 'array' },
                create: { type: `Array<${enumType}>`, collection: 'array' },
                update: { type: `Array<${enumType}>`, collection: 'array' },
                readonly,
                computed,
                enumTypeAlias: enumType,
            };
        }
        case 'multipleAttachments':
            return {
                read: { type: 'Attachment[]', collection: 'array' },
                create: { type: 'AttachmentWrite[]', collection: 'array' },
                update: { type: 'AttachmentWrite[]', collection: 'array' },
                readonly,
                computed,
            };
        case 'singleCollaborator':
            return {
                read: { type: 'Collaborator', collection: 'scalar' },
                create: { type: 'CollaboratorWrite', collection: 'scalar' },
                update: { type: 'CollaboratorWrite', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'multipleCollaborators':
            return {
                read: { type: 'Collaborator[]', collection: 'array' },
                create: { type: 'CollaboratorWrite[]', collection: 'array' },
                update: { type: 'CollaboratorWrite[]', collection: 'array' },
                readonly,
                computed,
            };
        case 'multipleRecordLinks':
            return {
                read: { type: 'string[]', collection: 'array' },
                create: { type: 'string[]', collection: 'array' },
                update: { type: 'string[]', collection: 'array' },
                readonly,
                computed,
                linkedTableId,
            };
        case 'barcode':
            return {
                read: { type: 'BarcodeCell', collection: 'scalar' },
                create: { type: 'BarcodeWrite', collection: 'scalar' },
                update: { type: 'BarcodeWrite', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'createdTime':
        case 'lastModifiedTime':
            return {
                read: { type: 'string', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'createdBy':
        case 'lastModifiedBy':
            return {
                read: { type: 'Collaborator', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'button':
            return {
                read: { type: 'ButtonCell', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'count':
        case 'autoNumber':
            return {
                read: { type: 'number', collection: 'scalar' },
                readonly,
                computed,
            };
        case 'formula': {
            const result = mapResultDescriptor(getRecordValue(normalizedField.options, 'result'), normalizedField, enumMode, unknownFieldBehavior);
            return {
                read: result,
                readonly,
                computed,
            };
        }
        case 'rollup': {
            const result = getRecordValue(normalizedField.options, 'result');
            const mapped = result
                ? mapResultDescriptor(result, normalizedField, enumMode, unknownFieldBehavior)
                : resolveUnknown(normalizedField, unknownFieldBehavior, 'rollup result metadata is missing');
            return {
                read: mapped,
                readonly,
                computed,
            };
        }
        case 'lookup': {
            const result = getRecordValue(normalizedField.options, 'result');
            const mapped = result
                ? mapResultDescriptor(result, normalizedField, enumMode, unknownFieldBehavior)
                : resolveUnknownArray(normalizedField, unknownFieldBehavior, 'lookup result metadata is missing');
            return {
                read: mapped.collection === 'array'
                    ? mapped
                    : {
                        ...mapped,
                        type: mapped.type === 'unknown' ? 'unknown[]' : `Array<${mapped.type}>`,
                        collection: 'array',
                    },
                readonly,
                computed,
            };
        }
        default: {
            const unknown = resolveUnknown(normalizedField, unknownFieldBehavior);
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
export function mapFieldToNormalizedField({ field, enumMode, unknownFieldBehavior, tsKey, tsConstKey, tsTypeName, }) {
    const mapped = mapFieldTypes({
        field,
        enumMode,
        unknownFieldBehavior,
    });
    const warnings = [
        mapped.read.warning,
        mapped.create?.warning,
        mapped.update?.warning,
    ].filter((warning) => Boolean(warning));
    return {
        id: field.id,
        name: field.name,
        tsKey,
        tsConstKey,
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
