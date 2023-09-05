export declare const getAirtableRecords: ({ recordId, baseId, tableName, options, }: {
    recordId?: string | string[] | undefined;
    baseId: string;
    tableName: string;
    options?: string | undefined;
}) => Promise<any>;
export declare const getAllAirtableRecords: ({ baseId, tableName, options, }: {
    baseId: string;
    tableName: string;
    options: string;
}) => Promise<unknown[]>;
import { UpdateRecords } from './types';
export interface Attachment {
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string;
    thumbnails?: {
        small: Thumbnail;
        large: Thumbnail;
        full: Thumbnail;
    };
}
export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}
export type WriteJsonFile = {
    content: string;
    path: string;
    filename: string;
};
export declare const getArrayInChunks: (records: UpdateRecords) => Promise<import("./types").UpdateRecord[][]>;
export declare const getErrorMessage: (error: Error | unknown) => string;
export declare const delay: (ms?: number) => Promise<unknown>;
