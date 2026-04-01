export function compareByNameThenId(
  left: { name: string; id: string },
  right: { name: string; id: string }
): number {
  return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getRecordValue<T = unknown>(
  value: unknown,
  key: string
): T | undefined {
  if (!isRecord(value) || !(key in value)) return undefined;
  return value[key] as T;
}

export function getChoices(
  options: unknown
): { name: string }[] | undefined {
  const choices = getRecordValue<unknown[]>(options, 'choices');
  if (!choices) return undefined;

  const validChoices = choices
    .filter(isRecord)
    .map((choice) => getRecordValue<string>(choice, 'name'))
    .filter((choice): choice is string => Boolean(choice))
    .map((name) => ({ name }));

  return validChoices.length ? validChoices : undefined;
}

export function stringifyUnion(values: string[]): string {
  return values.map((value) => JSON.stringify(value)).join(' | ');
}

export function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}
