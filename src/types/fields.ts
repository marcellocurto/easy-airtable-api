type AIState = 'empty' | 'loading' | 'generated' | 'error';

interface AICell {
  state: AIState;
  isStale: boolean;
  value: string | null;
  errorType?: string;
}

interface AIFieldTypeAndOptions {
  type: 'aiText';
  options: {
    prompt?: (
      | string
      | {
          field: {
            fieldId: string;
            referencedFieldIds?: string[];
          };
        }
    )[];
  };
}

interface Attachment {
  id: string;
  type: string;
  filename: string;
  height?: number;
  width?: number;
  size: number;
  url: string;
  thumbnails?: {
    full?: {
      url: string;
      height: number;
      width: number;
    };
    large?: {
      url: string;
      height: number;
      width: number;
    };
    small?: {
      url: string;
      height: number;
      width: number;
    };
  };
}

interface AttachmentWrite {
  url: string;
  filename?: string;
  id?: string;
}

interface AttachmentFieldTypeAndOptions {
  type: 'multipleAttachments';
  options: {
    isReversed: boolean;
  };
}

type AutoNumberCell = number;

interface AutoNumberFieldTypeAndOptions {
  type: 'autoNumber';
}

interface BarcodeCell {
  type?: string;
  text: string;
}

interface BarcodeFieldTypeAndOptions {
  type: 'barcode';
}

interface ButtonCell {
  label: string;
  url: string | null;
}

interface ButtonFieldTypeAndOptions {
  type: 'button';
}

type CheckboxCellV1 = true | 'empty';
type CheckboxCellV2 = true | null;

interface CheckboxFieldTypeAndOptions {
  type: 'checkbox';
  options: {
    color:
      | 'yellowBright'
      | 'orangeBright'
      | 'redBright'
      | 'pinkBright'
      | 'purpleBright'
      | 'blueBright'
      | 'cyanBright'
      | 'tealBright'
      | 'greenBright'
      | 'grayBright';
    icon:
      | 'check'
      | 'xCheckbox'
      | 'star'
      | 'heart'
      | 'thumbsUp'
      | 'flag'
      | 'dot';
  };
}

interface CollaboratorCell {
  id: string;
  email?: string;
  name?: string;
  profilePicUrl?: string;
}

interface SingleCollaboratorFieldTypeAndOptions {
  type: 'singleCollaborator';
  options: {};
}

type CountCell = number;

interface CountFieldTypeAndOptions {
  type: 'count';
  options: {
    isValid: boolean;
    recordLinkFieldId?: string | null;
  };
}

type CreatedByCell = CollaboratorCell;

interface CreatedByFieldTypeAndOptions {
  type: 'createdBy';
}

type CreatedTimeCell = string;

interface CreatedTimeFieldTypeAndOptions {
  type: 'createdTime';
  options: {
    result?: any;
  };
}

type CurrencyCell = number;

interface CurrencyFieldTypeAndOptions {
  type: 'currency';
  options: {
    precision: number;
    symbol: string;
  };
}

type DateCell = string;

interface DateFormatOptions {
  format: 'l' | 'LL' | 'M/D/YYYY' | 'D/M/YYYY' | 'YYYY-MM-DD';
  name: 'local' | 'friendly' | 'us' | 'european' | 'iso';
}

interface DateFieldTypeAndOptions {
  type: 'date';
  options: {
    dateFormat: DateFormatOptions;
  };
}

type DateTimeCell = string;

interface TimeFormatOptions {
  format: 'h:mma' | 'HH:mm' | undefined;
  name: '12hour' | '24hour';
}

interface DateTimeFieldTypeAndOptions {
  type: 'dateTime';
  options: {
    timeZone: string;
    dateFormat: DateFormatOptions;
    timeFormat: TimeFormatOptions;
  };
}

type DurationCell = number;

interface DurationFieldTypeAndOptions {
  type: 'duration';
  options: {
    durationFormat:
      | 'h:mm'
      | 'h:mm:ss'
      | 'h:mm:ss.S'
      | 'h:mm:ss.SS'
      | 'h:mm:ss.SSS';
  };
}

type EmailCell = string;

interface EmailFieldTypeAndOptions {
  type: 'email';
}

type FormulaCell = string | number;

interface FormulaFieldTypeAndOptions {
  type: 'formula';
  options: {
    formula: string;
    isValid: boolean;
    referencedFieldIds: string[] | null;
    result: any;
  };
}

type LastModifiedByCell = {
  id: string;
  email?: string;
  name?: string;
  profilePicUrl?: string;
};

interface LastModifiedByFieldTypeAndOptions {
  type: 'lastModifiedBy';
}

type LastModifiedTimeCell = string;

interface LastModifiedTimeFieldTypeAndOptions {
  type: 'lastModifiedTime';
  options: {
    isValid: boolean;
    referencedFieldIds: string[] | null;
    result: any;
  };
}

type LinkToAnotherRecordCellV1 = string[];
type LinkToAnotherRecordCellV2 = { id: string; name: string }[];

interface LinkToAnotherRecordFieldTypeAndOptions {
  type: 'multipleRecordLinks';
  options: {
    isReversed: boolean;
    linkedTableId: string;
    prefersSingleRecordLink: boolean;
    inverseLinkFieldId?: string;
    viewIdForRecordSelection?: string;
  };
}

type LongTextCell = string;

interface LongTextFieldTypeAndOptions {
  type: 'multilineText';
}

type LookupCellV1 = (number | string | boolean | any)[];
type LookupCellV2 = {
  valuesByLinkedRecordId: { [key: string]: any[] };
  linkedRecordIds: string[];
};

interface LookupFieldTypeAndOptions {
  type: 'lookup';
  options: {
    fieldIdInLinkedTable: string | null;
    isValid: boolean;
    recordLinkFieldId: string | null;
    result: any;
  };
}

type Collaborator = {
  id: string;
  email?: string;
  name?: string;
  profilePicUrl?: string;
};

type Collaborators = Collaborator[];

type ChoiceColor =
  | 'blueLight2'
  | 'cyanLight2'
  | 'tealLight2'
  | 'greenLight2'
  | 'yellowLight2'
  | 'orangeLight2'
  | 'redLight2'
  | 'pinkLight2'
  | 'purpleLight2'
  | 'grayLight2'
  | 'blueLight1'
  | 'cyanLight1'
  | 'tealLight1'
  | 'greenLight1'
  | 'yellowLight1'
  | 'orangeLight1'
  | 'redLight1'
  | 'pinkLight1'
  | 'purpleLight1'
  | 'grayLight1'
  | 'blueBright'
  | 'cyanBright'
  | 'tealBright'
  | 'greenBright'
  | 'yellowBright'
  | 'orangeBright'
  | 'redBright'
  | 'pinkBright'
  | 'purpleBright'
  | 'grayBright'
  | 'blueDark1'
  | 'cyanDark1'
  | 'tealDark1'
  | 'greenDark1'
  | 'yellowDark1'
  | 'orangeDark1'
  | 'redDark1'
  | 'pinkDark1'
  | 'purpleDark1'
  | 'grayDark1';

type Choice = {
  id: string;
  color?: ChoiceColor;
  name: string;
};

type SelectOptions = {
  choices: Choice[];
};

type RatingColor =
  | 'yellowBright'
  | 'orangeBright'
  | 'redBright'
  | 'pinkBright'
  | 'purpleBright'
  | 'blueBright'
  | 'cyanBright'
  | 'tealBright'
  | 'greenBright'
  | 'grayBright';
type RatingIcon = 'star' | 'heart' | 'thumbsUp' | 'flag' | 'dot';

type RatingOptions = {
  color: RatingColor;
  icon: RatingIcon;
  max: number;
};

type RollupOptions = {
  fieldIdInLinkedTable?: string;
  recordLinkFieldId?: string;
  result?: any;
  isValid?: boolean;
  referencedFieldIds?: string[];
};

type ExternalSyncChoice = {
  id: string;
  color?: ChoiceColor;
  name: string;
};

type ExternalSyncOptions = {
  choices: ExternalSyncChoice[];
};

type AirtableUrl = string;
