type FieldType = 'singleLineText' | 'checkbox';
type TableFieldOptions = {
    color?: string;
    icon?: string;
};
type FieldConfig = {
    id?: string;
    name: string;
    description?: string;
    type: FieldType;
    options?: TableFieldOptions;
};
type BaseTableDetails = {
    name: string;
    description?: string;
};
type TableConfig = {
    name: string;
    description?: string;
    fields: FieldConfig[];
};
type ViewType = 'grid' | 'form' | 'calendar' | 'gallery' | 'kanban' | 'timeline' | 'block';
type View = {
    id: string;
    name: string;
    type: ViewType;
    visibleFieldIds?: string[];
};
type TableModel = {
    id: string;
    primaryFieldId: string;
    name: string;
    description?: string;
    fields: FieldConfig[];
    views: View[];
};
type UpdateTableRequestBody = {
    name?: string;
    description?: string;
};
type CreateTableRequestBody = {
    name: string;
    description?: string;
    fields: FieldConfig[];
};
