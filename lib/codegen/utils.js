export function compareByNameThenId(left, right) {
    return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
}
export function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
export function getRecordValue(value, key) {
    if (!isRecord(value) || !(key in value))
        return undefined;
    return value[key];
}
export function getChoices(options) {
    const choices = getRecordValue(options, 'choices');
    if (!choices)
        return undefined;
    const validChoices = choices
        .filter(isRecord)
        .map((choice) => getRecordValue(choice, 'name'))
        .filter((choice) => Boolean(choice))
        .map((name) => ({ name }));
    return validChoices.length ? validChoices : undefined;
}
export function stringifyUnion(values) {
    return values.map((value) => JSON.stringify(value)).join(' | ');
}
export function ensureArray(value) {
    if (value === undefined)
        return [];
    return Array.isArray(value) ? value : [value];
}
