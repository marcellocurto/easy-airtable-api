import { getRequest } from './requests';

export const getAirtableRecords = async ({
  recordId,
  baseId,
  tableName,
  options,
}: {
  recordId?: string | string[];
  baseId: string;
  tableName: string;
  options?: string;
}) => {
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}/${
    recordId ? recordId : ''
  }?cellFormat=json${options ? options : ''}`;
  try {
    return await getRequest({ url });
  } catch (error) {
    console.log(error);
  }
};

export const getAllAirtableRecords = async ({
  baseId,
  tableName,
  options,
}: {
  baseId: string;
  tableName: string;
  options: string;
}): Promise<unknown[]> => {
  let records: unknown[] = [];
  const request = await getAirtableRecords({ baseId, tableName, options });

  if (request?.error?.message) throw new Error(request?.error?.message);

  const requestRecords = request.records as unknown[];

  records = [...records, ...requestRecords];

  let paginationToken = request?.offset;

  if (paginationToken) {
    do {
      const request = await getAirtableRecords({
        baseId,
        tableName,
        options: `${options}&offset=${paginationToken}`,
      });
      const requestRecords = request?.records as unknown[];
      records = [...records, ...requestRecords];
      paginationToken = request?.offset;
    } while (paginationToken);
  }

  return records;
};

import { UpdateRecords } from './types';

type SingleLineText = string;
type MultilineText = string;
type RichText = string;
type SingleSelect = string;
type MultipleSelects = string[];
type MultipleLookupValues = string[];
type Checkbox = boolean;
type AirtableUrl = string;
type Count = number;
type Formula = string | string[] | number;
type MultipleRecordLinks = string[];
type MultipleAttachments = Attachment[];
type Rollup = string | number;
type AirtableInteger = number | null;

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

export const getArrayInChunks = async (records: UpdateRecords) => {
  const chunks = [];
  const chunkSize = 10;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
};

export const getErrorMessage = (error: Error | unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export const delay = async (ms = 0) => {
  return await new Promise((resolve) => setTimeout(resolve, ms));
};
