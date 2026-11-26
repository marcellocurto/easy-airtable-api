/**
 * Thrown by the batch helpers when a request fails after earlier requests in
 * the same call succeeded. Airtable has already applied the earlier chunks, so
 * `completed` holds what it confirmed, in the helper's usual result shape.
 * `pending` holds the inputs it did not confirm, starting with the failed
 * chunk, which Airtable may still have applied after a 5xx or a dropped
 * connection. `cause` is the original error, such as an AirtableApiError with
 * its `statusCode` and `retryable`.
 */
export declare class AirtableBatchError<Completed = unknown, Pending = unknown> extends Error {
    readonly completed: Completed;
    readonly pending: Pending[];
    readonly cause: unknown;
    constructor({ message, completed, pending, cause, }: {
        message: string;
        completed: Completed;
        pending: Pending[];
        cause: unknown;
    });
}
/**
 * Sends `items` in Airtable-sized chunks, one request at a time, waiting
 * `requestInterval` between requests. A failure on the first chunk rethrows the
 * original error, since no earlier chunk succeeded. A failure after that throws
 * an AirtableBatchError with the combined results of the chunks that succeeded.
 */
export declare function sendInChunks<Item, ChunkResult, Result>({ items, requestInterval, send, combine, }: {
    items: Item[];
    requestInterval?: number;
    send: (chunk: Item[]) => Promise<ChunkResult>;
    combine: (results: ChunkResult[]) => Result;
}): Promise<Result>;
