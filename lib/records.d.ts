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
