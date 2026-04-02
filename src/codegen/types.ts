import type { AirtableBaseSchema } from '../types/metadata.js';

export type AirtableSchemaSource =
  | {
      baseId: string;
      accessToken?: string;
      apiKey?: string;
    }
  | {
      schemaPath: string;
    }
  | {
      schema: AirtableBaseSchema;
    };

export type EnumMode = 'literal' | 'hybrid' | 'broad';
export type CreateRequiredMode = 'allOptional' | 'primaryField';
export type UnknownFieldBehavior = 'unknown' | 'error';
export type SchemaMode = 'read' | 'write' | 'full';

export interface GenerateAirtableTypesOptions {
  source: AirtableSchemaSource;
  output?: string;
  tableNameOrId?: string | string[];
  enumMode?: EnumMode;
  createRequiredMode?: CreateRequiredMode;
  unknownFieldBehavior?: UnknownFieldBehavior;
  includeTableIds?: boolean;
  includeFieldIds?: boolean;
  schemaMode?: SchemaMode;
  format?: boolean;
}

export interface AirtableCodegenResult {
  content: string;
  tablesGenerated: number;
  warnings: string[];
}

export interface GenerateAirtableTypesResult {
  outputPath: string;
  tablesGenerated: number;
  warnings: string[];
}

export interface NormalizedBase {
  tables: NormalizedTable[];
}

export interface NormalizedTable {
  id: string;
  name: string;
  tsName: string;
  tsConstKey: string;
  primaryFieldId: string;
  fields: NormalizedField[];
}

export interface NormalizedField {
  id: string;
  name: string;
  tsKey: string;
  tsConstKey: string;
  tsTypeName: string;
  airtableType: string;
  readonly: boolean;
  computed: boolean;
  readType: string;
  createType?: string;
  updateType?: string;
  enumTypeAlias?: string;
  linkedTableId?: string;
  warnings: string[];
  options?: Record<string, unknown>;
}
