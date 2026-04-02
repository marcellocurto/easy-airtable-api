import type { AirtableFieldSchema } from '../types/metadata.js';
import type { EnumMode, NormalizedField, UnknownFieldBehavior } from './types.js';
type CollectionKind = 'scalar' | 'array';
type MappedFieldType = {
    type: string;
    warning?: string;
    collection: CollectionKind;
};
export declare function mapFieldTypes({ field, enumMode, unknownFieldBehavior, }: {
    field: AirtableFieldSchema;
    enumMode: EnumMode;
    unknownFieldBehavior: UnknownFieldBehavior;
}): {
    read: MappedFieldType;
    create?: MappedFieldType;
    update?: MappedFieldType;
    readonly: boolean;
    computed: boolean;
    linkedTableId?: string;
    enumTypeAlias?: string;
};
export declare function mapFieldToNormalizedField({ field, enumMode, unknownFieldBehavior, tsKey, tsConstKey, tsTypeName, }: {
    field: AirtableFieldSchema;
    enumMode: EnumMode;
    unknownFieldBehavior: UnknownFieldBehavior;
    tsKey: string;
    tsConstKey: string;
    tsTypeName: string;
}): NormalizedField;
export {};
