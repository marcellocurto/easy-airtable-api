/** Shared field/value types every generated file imports from the package. */
export declare const SHARED_TYPE_IMPORTS: readonly ["AICell", "AirtableRecord", "Attachment", "AttachmentWrite", "BarcodeCell", "BarcodeWrite", "ButtonCell", "Collaborator", "CollaboratorWrite"];
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
 */
export declare function createTypeNameRegistry(): (name: string, ownerId: string) => string;
