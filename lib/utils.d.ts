import { UpdateRecords } from './types/fields.js';
export declare function getArrayInChunks(records: UpdateRecords): Promise<import("./types/fields.js").UpdateRecord[][]>;
export declare function getErrorMessage(error: Error | unknown): string;
export declare function delay(ms?: number): Promise<unknown>;
