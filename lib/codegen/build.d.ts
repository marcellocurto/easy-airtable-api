import type { AirtableCodegenResult, GenerateAirtableTypesOptions } from './types.js';
export declare function buildAirtableTypes(options: Omit<GenerateAirtableTypesOptions, 'output'>): Promise<AirtableCodegenResult>;
