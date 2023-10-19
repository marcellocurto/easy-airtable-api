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
