import { UpdateRecords } from './types/fields';
export declare const getArrayInChunks: (records: UpdateRecords) => Promise<import("./types/fields").UpdateRecord[][]>;
export declare const getErrorMessage: (error: Error | unknown) => string;
export declare const delay: (ms?: number) => Promise<unknown>;
