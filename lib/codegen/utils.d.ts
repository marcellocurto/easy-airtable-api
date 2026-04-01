export declare function compareByNameThenId(left: {
    name: string;
    id: string;
}, right: {
    name: string;
    id: string;
}): number;
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function getRecordValue<T extends unknown = unknown>(value: unknown, key: string): T | undefined;
export declare function getChoices(options: unknown): {
    name: string;
}[] | undefined;
export declare function stringifyUnion(values: string[]): string;
export declare function ensureArray<T>(value: T | T[] | undefined): T[];
