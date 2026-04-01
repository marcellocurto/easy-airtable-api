import type { AirtableFieldSchema } from '../types/metadata.js';
import type { EnumMode, NormalizedField, UnknownFieldBehavior } from './types.js';
export declare function mapFieldTypes({ field, enumMode, unknownFieldBehavior, }: {
    field: AirtableFieldSchema;
    enumMode: EnumMode;
    unknownFieldBehavior: UnknownFieldBehavior;
}): {
    read: {
        type: string;
        warning?: string;
    };
    create?: {
        type: string;
        warning?: string;
    };
    update?: {
        type: string;
        warning?: string;
    };
    readonly: boolean;
    computed: boolean;
    linkedTableId?: string;
    enumTypeAlias?: string;
};
export declare function mapFieldToNormalizedField({ field, enumMode, unknownFieldBehavior, tsKey, tsTypeName, }: {
    field: AirtableFieldSchema;
    enumMode: EnumMode;
    unknownFieldBehavior: UnknownFieldBehavior;
    tsKey: string;
    tsTypeName: string;
}): NormalizedField;
