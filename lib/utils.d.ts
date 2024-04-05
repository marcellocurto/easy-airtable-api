import { UpdateRecords } from './types/fields';
export declare function getArrayInChunks(records: UpdateRecords): Promise<import("./types/fields").UpdateRecord[][]>;
export declare function getErrorMessage(error: Error | unknown): string;
export declare function delay(ms?: number): Promise<unknown>;
