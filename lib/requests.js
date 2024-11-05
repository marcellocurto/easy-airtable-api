import { request } from 'https';
import { URL } from 'url';
export async function airtableRequest(request) {
    const { apiKey, baseId, tableId, endpoint, method, body, apiURL } = request;
    const url = apiURL || 'https://api.airtable.com/v0';
    if (!apiKey) {
        throw new Error('API key is not set. Please provide a valid Airtable API key.');
    }
    if (!baseId) {
        throw new Error('Base ID is not set. Please provide a valid Airtable base ID.');
    }
    if (!tableId) {
        throw new Error('Table ID/Name is not set. Please provide a valid Airtable table ID or name.');
    }
    const response = await apiRequest({
        url: `${url}/${baseId}/${tableId}${endpoint}`,
        apiKey,
        method,
        body,
    });
    validateResponse(response);
    return response.data;
}
function validateResponse(response) {
    const statusCode = response.statusCode;
    if (statusCode === 200)
        return;
    const isAirtableError = (data) => {
        return (data &&
            typeof data === 'object' &&
            'error' in data &&
            typeof data.error === 'object' &&
            data.error !== null &&
            'message' in data.error &&
            typeof data.error.message === 'string');
    };
    if (response.data && isAirtableError(response.data)) {
        throw new Error(response.data.error.message);
    }
    if (statusCode === 401)
        throw new Error('Incorrect API Key.');
    else if (statusCode === 403)
        throw new Error('Not authorized.');
    else if (statusCode === 404)
        throw new Error('Table or record not found.');
    else if (statusCode === 413)
        throw new Error('Request body is too large.');
    else if (statusCode === 422) {
        throw new Error('Operation cannot be processed. Do the field names match?');
    }
    else if (statusCode === 429) {
        throw new Error('Too many requests to the Airtable server.');
    }
    else if (statusCode === 500)
        throw new Error('Airtable server error.');
    else if (statusCode === 503)
        throw new Error('Airtable service unavailable.');
    throw new Error('Unexpected error.');
}
async function apiRequest({ url, method, apiKey, body, }) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const { hostname, pathname, search } = parsedUrl;
        const options = {
            method,
            hostname,
            path: `${pathname}${search}`,
            timeout: 300000,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
        };
        const req = request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        data: JSON.parse(data),
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                    });
                }
                catch (error) {
                    reject(new Error(`Failed to parse response as JSON: ${data}`));
                }
            });
        });
        req.on('error', (error) => {
            reject(new Error(`airtableApi: ${error.message} (fn_${apiRequest.name})`));
        });
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}
export async function getBaseSchema({ apiKey, baseId, }) {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Error fetching base schema: ${response.statusText}`);
    }
    return response.json();
}
