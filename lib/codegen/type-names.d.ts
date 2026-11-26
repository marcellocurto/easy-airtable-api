import type { SchemaMode } from './types.js';
/** Shared field/value types every generated file imports from the package. */
export declare const SHARED_TYPE_IMPORTS: readonly ["AICell", "AirtableRecord", "Attachment", "AttachmentWrite", "BarcodeCell", "BarcodeWrite", "ButtonCell", "Collaborator", "CollaboratorWrite"];
/** Which of a table's interfaces a schema mode emits. */
export declare function emittedInterfaces(schemaMode: SchemaMode): {
    read: boolean;
    write: boolean;
};
/**
 * The shared types that the given generated declarations refer to, in import
 * order, so a generated file imports only what it uses.
 */
export declare function usedSharedTypes(declarations: string[]): string[];
export interface TableTypeNames {
    recordFields: string;
    record: string;
    createFields: string;
    updateFields: string;
}
/**
 * Hands out the exported type names of one generated file. The imported shared
 * types are taken from the start, and a name that is already taken gets a
 * stable suffix from the owning table or field ID, so the file always compiles.
 * `alwaysSuffix` suffixes the name even when it is free, for owners that share
 * a wanted name and so must not depend on who claims first.
 */
export declare function createTypeNameRegistry(): (name: string, ownerId: string, { alwaysSuffix }?: {
    alwaysSuffix?: boolean | undefined;
}) => string;
