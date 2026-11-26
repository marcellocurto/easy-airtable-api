import { delay, getErrorMessage } from './utils.js';
/** Airtable accepts at most 10 records per create, update, or delete request. */
const BATCH_SIZE = 10;
const DEFAULT_REQUEST_INTERVAL_MS = 500;
/**
 * Thrown by the batch helpers when a request fails after earlier requests in
 * the same call succeeded. Airtable has already applied the earlier chunks, so
 * `completed` holds what it confirmed, in the helper's usual result shape.
 * `pending` holds the inputs it did not confirm, starting with the failed
 * chunk, which Airtable may still have applied after a 5xx or a dropped
 * connection. `cause` is the original error, such as an AirtableApiError with
 * its `statusCode` and `retryable`.
 */
export class AirtableBatchError extends Error {
    completed;
    pending;
    constructor({ message, completed, pending, cause, }) {
        super(message, { cause });
        this.name = 'AirtableBatchError';
        this.completed = completed;
        this.pending = pending;
    }
}
/**
 * Sends `items` in Airtable-sized chunks, one request at a time, waiting
 * `requestInterval` between requests. A failure on the first chunk rethrows the
 * original error, since no earlier chunk succeeded. A failure after that throws
 * an AirtableBatchError with the combined results of the chunks that succeeded.
 */
export async function sendInChunks({ items, requestInterval, send, combine, }) {
    const results = [];
    for (let start = 0; start < items.length; start += BATCH_SIZE) {
        if (start > 0) {
            await delay(requestInterval || DEFAULT_REQUEST_INTERVAL_MS);
        }
        try {
            results.push(await send(items.slice(start, start + BATCH_SIZE)));
        }
        catch (error) {
            if (start === 0)
                throw error;
            throw new AirtableBatchError({
                message: `Batch stopped after ${start} of ${items.length} items: ${getErrorMessage(error)}`,
                completed: combine(results),
                pending: items.slice(start),
                cause: error,
            });
        }
    }
    return combine(results);
}
