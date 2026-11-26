import { suffixFromId } from './identifiers.js';
import type { SchemaMode } from './types.js';

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
] as const;

/** Which of a table's interfaces a schema mode emits. */
export function emittedInterfaces(schemaMode: SchemaMode): {
  read: boolean;
  write: boolean;
} {
  return { read: schemaMode !== 'write', write: schemaMode !== 'read' };
}

/**
 * The shared types that the given type expressions refer to, in import order,
 * so a generated file imports only what it uses.
 */
export function usedSharedTypes(typeExpressions: string[]): string[] {
  // Choice names appear as string literals, so drop those before matching.
  const code = typeExpressions.join(' ').replace(/"(?:[^"\\]|\\.)*"/g, '""');
  return SHARED_TYPE_IMPORTS.filter((name) =>
    new RegExp(`\\b${name}\\b`).test(code)
  );
}

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
export function createTypeNameRegistry() {
  const taken = new Set<string>(SHARED_TYPE_IMPORTS);

  return function claim(
    name: string,
    ownerId: string,
    { alwaysSuffix = false }: { alwaysSuffix?: boolean } = {}
  ): string {
    const suffixed = `${name}_${suffixFromId(ownerId)}`;
    let candidate = alwaysSuffix || taken.has(name) ? suffixed : name;
    for (let counter = 2; taken.has(candidate); counter += 1) {
      candidate = `${suffixed}${counter}`;
    }

    taken.add(candidate);
    return candidate;
  };
}
