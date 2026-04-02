import { airtableApiRequest } from './requests.js';
export async function listBases({ apiKey, offset, retry, }) {
    return airtableApiRequest({
        apiKey,
        method: 'GET',
        path: '/meta/bases',
        query: { offset },
        retry,
    });
}
export async function getBaseSchema({ apiKey, baseId, retry, }) {
    if (!baseId) {
        throw new Error('Base ID is not set. Please provide a valid Airtable base ID.');
    }
    const path = `/meta/bases/${encodeURIComponent(baseId)}/tables`;
    return airtableApiRequest({
        apiKey,
        method: 'GET',
        path,
        retry,
        requestContext: {
            method: 'GET',
            baseId,
            path,
        },
    });
}
