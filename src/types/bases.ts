import type { AirtableBaseSchema } from './metadata.js';

type BaseList = {
  id: string;
  name: string;
  permissionLevel: 'none' | 'read' | 'comment' | 'edit' | 'create';
};

export type ListBasesResponse = {
  bases: BaseList[];
  offset?: string;
};

export type CreateBaseFieldConfig = {
  name: string;
  type: string;
  description?: string;
  options?: Record<string, unknown>;
};

export type CreateBaseTableConfig = {
  name: string;
  description?: string;
  fields: CreateBaseFieldConfig[];
};

export type CreateBaseRequestBody = {
  workspaceId: string;
  name: string;
  tables: CreateBaseTableConfig[];
};

export type CreateBaseResponse = {
  id: string;
  tables: AirtableBaseSchema['tables'];
};

