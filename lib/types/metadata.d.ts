export type AirtableFieldOptions = Record<string, unknown>;
export interface AirtableFieldSchema {
    id: string;
    name: string;
    type: string;
    description?: string;
    options?: AirtableFieldOptions;
}
export interface AirtableViewSchema {
    id: string;
    name: string;
    type: string;
}
export interface AirtableTableSchema {
    id: string;
    name: string;
    description?: string;
    primaryFieldId: string;
    fields: AirtableFieldSchema[];
    views?: AirtableViewSchema[];
}
export interface AirtableBaseSchema {
    tables: AirtableTableSchema[];
}
