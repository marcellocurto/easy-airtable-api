export declare function toPascalCase(value: string): string;
export declare function toSafeConstKey(value: string): string;
export declare function makeUniquePascalNames<T extends {
    id: string;
    name: string;
}>(items: T[]): Map<string, string>;
export declare function makeUniqueConstKeys<T extends {
    id: string;
    name: string;
}>(items: T[]): Map<string, string>;
export declare function quotePropertyKey(value: string): string;
