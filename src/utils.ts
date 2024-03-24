import { UpdateRecords } from './types/fields';

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
