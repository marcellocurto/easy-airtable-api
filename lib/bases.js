import { airtableApiRequest } from './requests.js';
export async function listBases({ apiKey, offset, }) {
    return airtableApiRequest({
        apiKey,
        method: 'GET',
        path: '/meta/bases',
        query: { offset },
    });
}
export async function getBaseSchema({ apiKey, baseId, }) {
    if (!baseId) {
        throw new Error('Base ID is not set. Please provide a valid Airtable base ID.');
    }
    const path = `/meta/bases/${encodeURIComponent(baseId)}/tables`;
    return airtableApiRequest({
        apiKey,
        method: 'GET',
        path,
        requestContext: {
            method: 'GET',
            baseId,
            path,
        },
    });
}
