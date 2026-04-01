const NON_IDENTIFIER = /[^a-zA-Z0-9_$]+/g;
const MULTIPLE_UNDERSCORES = /_+/g;

function suffixFromId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'Id';
}

export function toPascalCase(value: string): string {
  const normalized = value
    .replace(NON_IDENTIFIER, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  if (!normalized) return 'Generated';
  if (/^[0-9]/.test(normalized)) return `T${normalized}`;
  return normalized;
}

export function toSafeConstKey(value: string): string {
  const normalized = value
    .replace(NON_IDENTIFIER, '_')
    .replace(MULTIPLE_UNDERSCORES, '_')
    .replace(/^_+|_+$/g, '');

  if (!normalized) return 'generated';
  if (/^[0-9]/.test(normalized)) return `_${normalized}`;
  return normalized;
}

export function makeUniquePascalNames<T extends { id: string; name: string }>(
  items: T[]
): Map<string, string> {
  const result = new Map<string, string>();
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const base = toPascalCase(item.name);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
  });

  items.forEach((item) => {
    const base = toPascalCase(item.name);
    if ((counts.get(base) ?? 0) === 1) {
      result.set(item.id, base);
      return;
    }

    result.set(item.id, `${base}_${suffixFromId(item.id)}`);
  });

  return result;
}

export function quotePropertyKey(value: string): string {
  return JSON.stringify(value);
}
