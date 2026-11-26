import { suffixFromId } from './identifiers.js';
/** Shared field/value types every generated file imports from the package. */
export const SHARED_TYPE_IMPORTS = [
    'AICell',
    'AirtableRecord',
    'Attachment',
    'AttachmentWrite',
    'BarcodeCell',
    'BarcodeWrite',
    'ButtonCell',
    'Collaborator',
    'CollaboratorWrite',
];
/**
 * Hands out the exported type names of one generated file. The imported shared
 * types are taken from the start, and a name that is already taken gets a
 * stable suffix from the owning table or field ID, so the file always compiles.
 * `alwaysSuffix` suffixes the name even when it is free, for owners that share
 * a wanted name and so must not depend on who claims first.
 */
export function createTypeNameRegistry() {
    const taken = new Set(SHARED_TYPE_IMPORTS);
    return function claim(name, ownerId, { alwaysSuffix = false } = {}) {
        const suffixed = `${name}_${suffixFromId(ownerId)}`;
        let candidate = alwaysSuffix || taken.has(name) ? suffixed : name;
        for (let counter = 2; taken.has(candidate); counter += 1) {
            candidate = `${suffixed}${counter}`;
        }
        taken.add(candidate);
        return candidate;
    };
}
