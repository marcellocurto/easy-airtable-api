type BaseList = {
  id: string;
  name: string;
  permissionLevel: 'none' | 'read' | 'comment' | 'edit' | 'create';
};

export type ListBasesResponse = {
  bases: BaseList[];
  offset?: string;
};

type BasesFieldOptions = {
  inverseLinkFieldId?: string;
  isReversed?: boolean;
  linkedTableId?: string;
  prefersSingleRecordLink?: boolean;
};

type Field = {
  description?: string;
  id: string;
  name: string;
  type: string;
  options?: BasesFieldOptions;
};

type TableView = {
  id: string;
  name: string;
  type: string;
};

type Table = {
  description?: string;
  fields: Field[];
  id: string;
  name: string;
  primaryFieldId: string;
  views: TableView[];
};

export type GetBaseSchemaResponse = {
  tables: Table[];
};

type TableConfigFieldOptions = {
  color?: string;
  icon?: string;
};

type TableConfigField = {
  description?: string;
  name: string;
  type: string;
  options?: TableConfigFieldOptions;
};

type BasesTableConfig = {
  description?: string;
  fields: TableConfigField[];
  name: string;
};

export type CreateBaseRequestBody = {
  name: string;
  tables: BasesTableConfig[];
  workspaceId: string;
};

export type CreateBaseResponse = {
  id: string;
  tables: Table[];
};
