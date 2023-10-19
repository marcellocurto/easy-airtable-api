import { request, RequestOptions } from 'https';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { ApiRequest } from './types';

export const apiRequest = async ({
  method,
  url,
  body,
  apiKey,
}: ApiRequest): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const { hostname, pathname, search } = parsedUrl;

    const options: RequestOptions = {
      method,
      hostname,
      path: `${pathname}${search}`,
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const req = request(options, (res: IncomingMessage) => {
      let data = '';

      res.on('data', (chunk: Buffer) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error: Error) => {
      reject(
        new Error(`airtableApi: ${error.message} (fn_${apiRequest.name})`)
      );
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};
