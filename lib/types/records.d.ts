export type AirtableRecord<Fields = DefaultFieldsType> = {
    id: string;
    createdTime: string;
    fields: Fields;
};
type DefaultFieldsType = {
    [key: string]: unknown;
};
type BaseId = string;
type TableIdOrName = string;
type SortDirection = 'asc' | 'desc';
type CellFormat = 'json' | 'string';
type RecordMetadataOptions = 'commentCount';
interface SortObject {
    field: string;
    direction?: SortDirection;
}
export interface GetRecordsQueryParameters {
    timeZone?: Timezones;
    userLocale?: UserLocales;
    pageSize?: number;
    maxRecords?: number;
    offset?: string;
    view?: string;
    sort?: SortObject[];
    filterByFormula?: string;
    cellFormat?: CellFormat;
    fields?: string[];
    returnFieldsByFieldId?: boolean;
    recordMetadata?: RecordMetadataOptions[];
}
type RecordField = {
    [key: string]: unknown;
};
export interface AirtableBaseRecord {
    id: string;
    createdTime: string;
    fields: RecordField;
}
export interface ListRecordsResponse {
    offset?: string;
    records: AirtableBaseRecord[];
}
export interface GetRecordQueryParameters {
    cellFormat?: CellFormat;
    returnFieldsByFieldId?: boolean;
}
export interface GetRecordPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
    recordId: string;
}
export interface UpdatePathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
}
export interface PerformUpsert {
    fieldsToMergeOn: string[];
}
export interface UpdateRecordsRequestBody {
    performUpsert?: PerformUpsert;
    returnFieldsByFieldId?: boolean;
    typecast?: boolean;
    records: AirtableBaseRecord[];
}
export interface UpsertResponse {
    createdRecords: string[];
    updatedRecords: string[];
    records: AirtableBaseRecord[];
}
export interface UpdateRecordPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
    recordId: string;
}
export interface UpdateRecordRequestBody {
    typecast?: boolean;
    fields: RecordField;
}
export interface UpdateRecordResponse {
    id: string;
    createdTime: string;
    fields: RecordField;
}
export interface CreateRecordsPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
}
export interface CreateRecordsRequestBody {
    fields?: RecordField;
    records?: AirtableBaseRecord[];
    returnFieldsByFieldId?: boolean;
    typecast?: boolean;
}
export type UpdateRecordsRequestOptions = {
    typecast?: boolean;
    returnFieldsByFieldId?: boolean;
};
export interface CreateRecordResponse {
    id: string;
    createdTime: string;
    fields: RecordField;
}
export interface CreateRecordsResponse {
    records: CreateRecordResponse[];
}
export interface DeleteRecordsPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
}
export interface DeleteRecordsQueryParameters {
    records: string[];
}
export interface DeleteRecordResponse {
    id: string;
    deleted: true;
}
export interface DeleteRecordsResponse {
    records: DeleteRecordResponse[];
}
export interface DeleteRecordPathParameters {
    baseId: BaseId;
    tableIdOrName: TableIdOrName;
    recordId: string;
}
export interface SingleDeleteRecordResponse {
    id: string;
    deleted: true;
}
export type Timezones = 'Africa/Abidjan' | 'Africa/Accra' | 'Africa/Algiers' | 'Africa/Bissau' | 'Africa/Cairo' | 'Africa/Casablanca' | 'Africa/Ceuta' | 'Africa/El_Aaiun' | 'Africa/Johannesburg' | 'Africa/Khartoum' | 'Africa/Lagos' | 'Africa/Maputo' | 'Africa/Monrovia' | 'Africa/Nairobi' | 'Africa/Ndjamena' | 'Africa/Tripoli' | 'Africa/Tunis' | 'Africa/Windhoek' | 'America/Adak' | 'America/Anchorage' | 'America/Araguaina' | 'America/Argentina/Buenos_Aires' | 'America/Argentina/Catamarca' | 'America/Argentina/Cordoba' | 'America/Argentina/Jujuy' | 'America/Argentina/La_Rioja' | 'America/Argentina/Mendoza' | 'America/Argentina/Rio_Gallegos' | 'America/Argentina/Salta' | 'America/Argentina/San_Juan' | 'America/Argentina/San_Luis' | 'America/Argentina/Tucuman' | 'America/Argentina/Ushuaia' | 'America/Asuncion' | 'America/Atikokan' | 'America/Bahia' | 'America/Bahia_Banderas' | 'America/Barbados' | 'America/Belem' | 'America/Belize' | 'America/Blanc-Sablon' | 'America/Boa_Vista' | 'America/Bogota' | 'America/Boise' | 'America/Cambridge_Bay' | 'America/Campo_Grande' | 'America/Cancun' | 'America/Caracas' | 'America/Cayenne' | 'America/Chicago' | 'America/Chihuahua' | 'America/Costa_Rica' | 'America/Creston' | 'America/Cuiaba' | 'America/Curacao' | 'America/Danmarkshavn' | 'America/Dawson' | 'America/Dawson_Creek' | 'America/Denver' | 'America/Detroit' | 'America/Edmonton' | 'America/Eirunepe' | 'America/El_Salvador' | 'America/Fort_Nelson' | 'America/Fortaleza' | 'America/Glace_Bay' | 'America/Godthab' | 'America/Goose_Bay' | 'America/Grand_Turk' | 'America/Guatemala' | 'America/Guayaquil' | 'America/Guyana' | 'America/Halifax' | 'America/Havana' | 'America/Hermosillo' | 'America/Indiana/Indianapolis' | 'America/Indiana/Knox' | 'America/Indiana/Marengo' | 'America/Indiana/Petersburg' | 'America/Indiana/Tell_City' | 'America/Indiana/Vevay' | 'America/Indiana/Vincennes' | 'America/Indiana/Winamac' | 'America/Inuvik' | 'America/Iqaluit' | 'America/Jamaica' | 'America/Juneau' | 'America/Kentucky/Louisville' | 'America/Kentucky/Monticello' | 'America/La_Paz' | 'America/Lima' | 'America/Los_Angeles' | 'America/Maceio' | 'America/Managua' | 'America/Manaus' | 'America/Martinique' | 'America/Matamoros' | 'America/Mazatlan' | 'America/Menominee' | 'America/Merida' | 'America/Metlakatla' | 'America/Mexico_City' | 'America/Miquelon' | 'America/Moncton' | 'America/Monterrey' | 'America/Montevideo' | 'America/Nassau' | 'America/New_York' | 'America/Nipigon' | 'America/Nome' | 'America/Noronha' | 'America/North_Dakota/Beulah' | 'America/North_Dakota/Center' | 'America/North_Dakota/New_Salem' | 'America/Ojinaga' | 'America/Panama' | 'America/Pangnirtung' | 'America/Paramaribo' | 'America/Phoenix' | 'America/Port-au-Prince' | 'America/Port_of_Spain' | 'America/Porto_Velho' | 'America/Puerto_Rico' | 'America/Rainy_River' | 'America/Rankin_Inlet' | 'America/Recife' | 'America/Regina' | 'America/Resolute' | 'America/Rio_Branco' | 'America/Santarem' | 'America/Santiago' | 'America/Santo_Domingo' | 'America/Sao_Paulo' | 'America/Scoresbysund' | 'America/Sitka' | 'America/St_Johns' | 'America/Swift_Current' | 'America/Tegucigalpa' | 'America/Thule' | 'America/Thunder_Bay' | 'America/Tijuana' | 'America/Toronto' | 'America/Vancouver' | 'America/Whitehorse' | 'America/Winnipeg' | 'America/Yakutat' | 'America/Yellowknife' | 'Antarctica/Casey' | 'Antarctica/Davis' | 'Antarctica/DumontDUrville' | 'Antarctica/Macquarie' | 'Antarctica/Mawson' | 'Antarctica/Palmer' | 'Antarctica/Rothera' | 'Antarctica/Syowa' | 'Antarctica/Troll' | 'Antarctica/Vostok' | 'Asia/Almaty' | 'Asia/Amman' | 'Asia/Anadyr' | 'Asia/Aqtau' | 'Asia/Aqtobe' | 'Asia/Ashgabat' | 'Asia/Baghdad' | 'Asia/Baku' | 'Asia/Bangkok' | 'Asia/Barnaul' | 'Asia/Beirut' | 'Asia/Bishkek' | 'Asia/Brunei' | 'Asia/Chita' | 'Asia/Choibalsan' | 'Asia/Colombo' | 'Asia/Damascus' | 'Asia/Dhaka' | 'Asia/Dili' | 'Asia/Dubai' | 'Asia/Dushanbe' | 'Asia/Gaza' | 'Asia/Hebron' | 'Asia/Ho_Chi_Minh' | 'Asia/Hong_Kong' | 'Asia/Hovd' | 'Asia/Irkutsk' | 'Asia/Jakarta' | 'Asia/Jayapura' | 'Asia/Jerusalem' | 'Asia/Kabul' | 'Asia/Kamchatka' | 'Asia/Karachi' | 'Asia/Kathmandu' | 'Asia/Khandyga' | 'Asia/Kolkata' | 'Asia/Krasnoyarsk' | 'Asia/Kuala_Lumpur' | 'Asia/Kuching' | 'Asia/Macau' | 'Asia/Magadan' | 'Asia/Makassar' | 'Asia/Manila' | 'Asia/Nicosia' | 'Asia/Novokuznetsk' | 'Asia/Novosibirsk' | 'Asia/Omsk' | 'Asia/Oral' | 'Asia/Pontianak' | 'Asia/Pyongyang' | 'Asia/Qatar' | 'Asia/Qyzylorda' | 'Asia/Rangoon' | 'Asia/Riyadh' | 'Asia/Sakhalin' | 'Asia/Samarkand' | 'Asia/Seoul' | 'Asia/Shanghai' | 'Asia/Singapore' | 'Asia/Srednekolymsk' | 'Asia/Taipei' | 'Asia/Tashkent' | 'Asia/Tbilisi' | 'Asia/Tehran' | 'Asia/Thimphu' | 'Asia/Tokyo' | 'Asia/Tomsk' | 'Asia/Ulaanbaatar' | 'Asia/Urumqi' | 'Asia/Ust-Nera' | 'Asia/Vladivostok' | 'Asia/Yakutsk' | 'Asia/Yekaterinburg' | 'Asia/Yerevan' | 'Atlantic/Azores' | 'Atlantic/Bermuda' | 'Atlantic/Canary' | 'Atlantic/Cape_Verde' | 'Atlantic/Faroe' | 'Atlantic/Madeira' | 'Atlantic/Reykjavik' | 'Atlantic/South_Georgia' | 'Atlantic/Stanley' | 'Australia/Adelaide' | 'Australia/Brisbane' | 'Australia/Broken_Hill' | 'Australia/Currie' | 'Australia/Darwin' | 'Australia/Eucla' | 'Australia/Hobart' | 'Australia/Lindeman' | 'Australia/Lord_Howe' | 'Australia/Melbourne' | 'Australia/Perth' | 'Australia/Sydney' | 'GMT' | 'Europe/Amsterdam' | 'Europe/Andorra' | 'Europe/Astrakhan' | 'Europe/Athens' | 'Europe/Belgrade' | 'Europe/Berlin' | 'Europe/Brussels' | 'Europe/Bucharest' | 'Europe/Budapest' | 'Europe/Chisinau' | 'Europe/Copenhagen' | 'Europe/Dublin' | 'Europe/Gibraltar' | 'Europe/Helsinki' | 'Europe/Istanbul' | 'Europe/Kaliningrad' | 'Europe/Kiev' | 'Europe/Kirov' | 'Europe/Lisbon' | 'Europe/London' | 'Europe/Luxembourg' | 'Europe/Madrid' | 'Europe/Malta' | 'Europe/Minsk' | 'Europe/Monaco' | 'Europe/Moscow' | 'Europe/Oslo' | 'Europe/Paris' | 'Europe/Prague' | 'Europe/Riga' | 'Europe/Rome' | 'Europe/Samara' | 'Europe/Simferopol' | 'Europe/Sofia' | 'Europe/Stockholm' | 'Europe/Tallinn' | 'Europe/Tirane' | 'Europe/Ulyanovsk' | 'Europe/Uzhgorod' | 'Europe/Vienna' | 'Europe/Vilnius' | 'Europe/Volgograd' | 'Europe/Warsaw' | 'Europe/Zaporozhye' | 'Europe/Zurich' | 'Indian/Chagos' | 'Indian/Christmas' | 'Indian/Cocos' | 'Indian/Kerguelen' | 'Indian/Mahe' | 'Indian/Maldives' | 'Indian/Mauritius' | 'Indian/Reunion' | 'Pacific/Apia' | 'Pacific/Auckland' | 'Pacific/Bougainville' | 'Pacific/Chatham' | 'Pacific/Chuuk' | 'Pacific/Easter' | 'Pacific/Efate' | 'Pacific/Enderbury' | 'Pacific/Fakaofo' | 'Pacific/Fiji' | 'Pacific/Funafuti' | 'Pacific/Galapagos' | 'Pacific/Gambier' | 'Pacific/Guadalcanal' | 'Pacific/Guam' | 'Pacific/Honolulu' | 'Pacific/Kiritimati' | 'Pacific/Kosrae' | 'Pacific/Kwajalein' | 'Pacific/Majuro' | 'Pacific/Marquesas' | 'Pacific/Nauru' | 'Pacific/Niue' | 'Pacific/Norfolk' | 'Pacific/Noumea' | 'Pacific/Pago_Pago' | 'Pacific/Palau' | 'Pacific/Pitcairn' | 'Pacific/Pohnpei' | 'Pacific/Port_Moresby' | 'Pacific/Rarotonga' | 'Pacific/Tahiti' | 'Pacific/Tarawa' | 'Pacific/Tongatapu' | 'Pacific/Wake' | 'Pacific/Wallis';
type UserLocales = 'af' | 'ar-ma' | 'ar-sa' | 'ar-tn' | 'ar' | 'az' | 'be' | 'bg' | 'bn' | 'bo' | 'br' | 'bs' | 'ca' | 'cs' | 'cv' | 'cy' | 'da' | 'de-at' | 'de' | 'el' | 'en-au' | 'en-ca' | 'en-gb' | 'en-ie' | 'en-nz' | 'eo' | 'es' | 'et' | 'eu' | 'fa' | 'fi' | 'fo' | 'fr-ca' | 'fr-ch' | 'fr' | 'fy' | 'gl' | 'he' | 'hi' | 'hr' | 'hu' | 'hy-am' | 'id' | 'is' | 'it' | 'ja' | 'jv' | 'ka' | 'km' | 'ko' | 'lb' | 'lt' | 'lv' | 'me' | 'mk' | 'ml' | 'mr' | 'ms' | 'my' | 'nb' | 'ne' | 'nl' | 'nn' | 'pl' | 'pt-br' | 'pt' | 'ro' | 'ru' | 'si' | 'sk' | 'sl' | 'sq' | 'sr-cyrl' | 'sr' | 'sv' | 'ta' | 'th' | 'tl-ph' | 'tr' | 'tzl' | 'tzm-latn' | 'tzm' | 'uk' | 'uz' | 'vi' | 'zh-cn' | 'zh-tw';
export {};
