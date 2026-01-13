/**
 * File Upload Types for CbCR Review Web App
 * Supports XML, Excel (.xlsx), and CSV (via ZIP) file formats
 *
 * @module types/file-upload
 */

import type { ParsedCbcReport } from './cbcr';

// =============================================================================
// FILE TYPE DEFINITIONS
// =============================================================================

/**
 * Supported file types for CbCR data upload
 * - xml: Standard OECD CbC XML format
 * - xlsx: Excel workbook with structured sheets
 * - csv-zip: ZIP archive containing multiple CSV files
 */
export type SupportedFileType = 'xml' | 'xlsx' | 'csv-zip';

/**
 * MIME types accepted for file upload
 */
export const ACCEPTED_MIME_TYPES: Record<SupportedFileType, string[]> = {
  xml: ['text/xml', 'application/xml'],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],
  'csv-zip': ['application/zip', 'application/x-zip-compressed'],
};

/**
 * File extensions accepted for upload
 */
export const ACCEPTED_EXTENSIONS: Record<SupportedFileType, string[]> = {
  xml: ['.xml'],
  xlsx: ['.xlsx'],
  'csv-zip': ['.zip'],
};

// =============================================================================
// PARSE RESULT TYPES
// =============================================================================

/**
 * Error that occurred during file parsing
 */
export interface FileParseError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Location in the file where the error occurred (e.g., "Sheet1!A5", "table1.csv:row 10") */
  location?: string;
  /** Suggested fix for the error */
  suggestion?: string;
}

/**
 * Result of parsing a file (any format)
 */
export interface FileParseResult {
  /** Whether parsing was successful */
  success: boolean;
  /** Detected file type */
  fileType: SupportedFileType;
  /** Parsed CbCR report (only present if success is true) */
  report?: ParsedCbcReport;
  /** Errors that occurred during parsing */
  errors?: FileParseError[];
  /** Non-critical warnings from parsing */
  warnings?: string[];
}

// =============================================================================
// EXCEL-SPECIFIC TYPES
// =============================================================================

/**
 * Layout type detected in an Excel file
 * - template: Matches our provided template structure
 * - auto-detected: Common CbCR layout detected by column headers
 * - unknown: Could not determine layout
 */
export type ExcelLayoutType = 'template' | 'auto-detected' | 'unknown';

/**
 * Information about detected Excel structure
 */
export interface ExcelLayoutInfo {
  /** Detected layout type */
  layoutType: ExcelLayoutType;
  /** Sheet names found in the workbook */
  sheetNames: string[];
  /** Mapping of detected sheets to their purpose */
  sheetMapping: {
    header?: string;
    summary?: string;
    entities?: string;
    additionalInfo?: string;
  };
  /** Confidence score (0-100) for auto-detection */
  confidence?: number;
}

/**
 * Intermediate parsed Excel data before transformation
 */
export interface ExcelParsedData {
  /** Layout information */
  layout: ExcelLayoutInfo;
  /** Header/MessageSpec data (key-value pairs) */
  headerData: Record<string, string | number | null>;
  /** Summary rows (one per jurisdiction) */
  summaryRows: ExcelSummaryRow[];
  /** Entity rows */
  entityRows: ExcelEntityRow[];
  /** Additional info rows */
  additionalInfoRows?: ExcelAdditionalInfoRow[];
  /** Currency code (if detected from header) */
  currency?: string;
}

/**
 * Row from the Summary (Table 1) sheet
 */
export interface ExcelSummaryRow {
  /** Jurisdiction country code */
  jurisdiction: string;
  /** Revenue from unrelated parties */
  unrelatedRevenue?: number | null;
  /** Revenue from related parties */
  relatedRevenue?: number | null;
  /** Total revenue */
  totalRevenue?: number | null;
  /** Profit or loss before tax */
  profitOrLoss?: number | null;
  /** Tax paid (cash basis) */
  taxPaid?: number | null;
  /** Tax accrued (current year) */
  taxAccrued?: number | null;
  /** Stated capital */
  capital?: number | null;
  /** Accumulated earnings */
  accumulatedEarnings?: number | null;
  /** Number of employees */
  numberOfEmployees?: number | null;
  /** Tangible assets */
  tangibleAssets?: number | null;
  /** Source row number for error reporting */
  sourceRow?: number;
}

/**
 * Row from the Entities (Table 2) sheet
 */
export interface ExcelEntityRow {
  /** Entity name */
  entityName: string;
  /** Tax identification number */
  tin?: string | null;
  /** Country that issued the TIN */
  tinIssuedBy?: string | null;
  /** Jurisdiction (tax residence) */
  jurisdiction: string;
  /** Country of incorporation (if different from residence) */
  incorporationCountry?: string | null;
  /** Address (free text) */
  address?: string | null;
  /** Business activities (comma-separated codes like "CBC501,CBC505") */
  activities?: string | null;
  /** Additional entity information */
  otherInfo?: string | null;
  /** Role of entity (UPE, SPE, etc.) */
  role?: string | null;
  /** Source row number for error reporting */
  sourceRow?: number;
}

/**
 * Row from the Additional Info sheet
 */
export interface ExcelAdditionalInfoRow {
  /** Country codes this info applies to (comma-separated) */
  countryCodes?: string | null;
  /** Language of the text */
  language?: string | null;
  /** Additional information text */
  notes: string;
  /** Source row number for error reporting */
  sourceRow?: number;
}

// =============================================================================
// CSV-SPECIFIC TYPES
// =============================================================================

/**
 * Expected CSV files in a ZIP archive
 */
export interface CsvFileSet {
  /** header.csv content */
  header?: string;
  /** table1.csv content */
  table1?: string;
  /** table2.csv content */
  table2?: string;
  /** additional.csv content (optional) */
  additional?: string;
}

/**
 * Intermediate parsed CSV data before transformation
 */
export interface CsvParsedData {
  /** Files extracted from ZIP */
  files: CsvFileSet;
  /** Header/MessageSpec data (key-value pairs) */
  headerData: Record<string, string | number | null>;
  /** Summary rows (one per jurisdiction) */
  summaryRows: ExcelSummaryRow[];
  /** Entity rows */
  entityRows: ExcelEntityRow[];
  /** Additional info rows */
  additionalInfoRows?: ExcelAdditionalInfoRow[];
  /** Currency code (if detected from header) */
  currency?: string;
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

/**
 * Excel template sheet configuration
 */
export interface TemplateSheetConfig {
  /** Sheet name */
  name: string;
  /** Column headers */
  headers: string[];
  /** Column descriptions (for header row 2) */
  descriptions?: string[];
  /** Sample data rows */
  sampleData?: (string | number | null)[][];
  /** Column widths */
  columnWidths?: number[];
  /** Data validation rules */
  validations?: TemplateValidation[];
}

/**
 * Data validation rule for Excel template
 */
export interface TemplateValidation {
  /** Column index (0-based) */
  column: number;
  /** Validation type */
  type: 'list' | 'date' | 'number';
  /** Allowed values (for list type) */
  values?: string[];
  /** Minimum value (for number type) */
  min?: number;
  /** Maximum value (for number type) */
  max?: number;
  /** Error message */
  errorMessage?: string;
}

// =============================================================================
// FILE PREVIEW TYPES
// =============================================================================

/**
 * Preview information extracted from a file before full parsing
 */
export interface FilePreviewInfo {
  /** Detected file type */
  fileType: SupportedFileType;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;

  // XML-specific
  /** Root XML element name */
  rootElement?: string;
  /** XML namespace */
  namespace?: string;

  // Excel-specific
  /** Number of sheets */
  sheetCount?: number;
  /** Sheet names */
  sheetNames?: string[];
  /** Detected layout type */
  excelLayout?: ExcelLayoutType;

  // CSV-specific
  /** Number of CSV files in ZIP */
  csvFileCount?: number;
  /** CSV file names in ZIP */
  csvFileNames?: string[];

  // Common
  /** Estimated number of records/jurisdictions */
  estimatedRecords?: number;
}

// =============================================================================
// COLUMN HEADER MAPPINGS
// =============================================================================

/**
 * Mapping of common column header variations to canonical field names
 * Used for auto-detecting Excel layouts
 */
export const COLUMN_HEADER_MAPPINGS: Record<string, string[]> = {
  currency: [
    'currency',
    'currency code',
    'currency iso code',
    'ccy',
    'reporting currency',
  ],
  jurisdiction: [
    'jurisdiction',
    'country',
    'country code',
    'tax jurisdiction',
    'tax jurisdiction residence',
    'tax jurisdiction (residence)',
    'residence country',
    'residence',
    'res country',
    'rescountrycode',
    'jur',
    'countrycode',
    'tax jurisdiction iso code',
    'tax residence jurisdiction iso code',
    'tax residence jurisdiction',
    'iso code',
  ],
  unrelatedRevenue: [
    'unrelated revenue',
    'unrelated revenues',
    'unrelated party revenue',
    'unrelated party revenues',
    'revenues unrelated party',
    'third party revenue',
    'third party revenues',
    'third parties',
    'external revenue',
    'revenues unrelated',
    'rev unrelated',
    'with third parties',
    'with third parties no decimal',
    'revenues with third parties',
    'revenues third parties',
    'revenue third parties',
    'rev 3rd party',
    'revenue 3rd parties',
    'revenues 3rd parties',
    'unrelated',
    'third party',
  ],
  relatedRevenue: [
    'related revenue',
    'related revenues',
    'related party revenue',
    'related party revenues',
    'revenues related party',
    'intercompany revenue',
    'intercompany revenues',
    'revenues related',
    'rev related',
    'with related parties',
    'with related parties no decimal',
    'revenues with related parties',
    'revenues related parties',
    'revenue related parties',
    'related parties',
    'related party',
    'intercompany',
    'ic revenue',
  ],
  totalRevenue: [
    'total revenue',
    'total revenues',
    'revenue total',
    'revenues',
    'total',
    'rev total',
    'total no decimal',
  ],
  profitOrLoss: [
    'profit or loss',
    'profit/loss',
    'profit (loss)',
    'profit loss',
    'profitloss',
    'p&l',
    'pnl',
    'profit before tax',
    'income before tax',
    'pbt',
    'profit loss before income tax',
    'profit  loss before income tax',
  ],
  taxPaid: [
    'tax paid',
    'income tax paid',
    'income tax paid cash basis',
    'taxes paid',
    'cash tax',
    'tax paid cash',
    'tax cash',
    'income tax paid cash basis',
  ],
  taxAccrued: [
    'tax accrued',
    'income tax accrued',
    'income tax accrued current year',
    'taxes accrued',
    'current tax',
    'tax accrued current year',
    'tax current year',
  ],
  capital: [
    'capital',
    'stated capital',
    'share capital',
    'equity',
    'cap',
  ],
  accumulatedEarnings: [
    'accumulated earnings',
    'retained earnings',
    'earnings',
    'accumulated profit',
    'acc earnings',
  ],
  numberOfEmployees: [
    'employees',
    'number of employees',
    'no of employees',
    'employee count',
    'headcount',
    'fte',
    'full time employees',
    'nbemployees',
  ],
  tangibleAssets: [
    'tangible assets',
    'tangible assets other than cash',
    'tangible assets other than cash and equivalents',
    'tangible assets other than cash and cash equivalents',
    'fixed assets',
    'pp&e',
    'ppe',
    'property plant equipment',
    'tang assets',
  ],
  entityName: [
    'entity name',
    'name',
    'company name',
    'constituent entity',
    'constituent entity name',
    'legal name',
    'entity',
    'ce name',
    'constituent entities name',
    'constituent entities name group by jurisdiction',
    'constituent entities',
  ],
  tin: [
    'tin',
    'tax id',
    'tax identification number',
    'tax identification number if not available indicate notin',
    'tax number',
    'vat number',
    'tax id number',
    'identification number',
  ],
  tinIssuedBy: [
    'tin issued by',
    'tin issuedby',
    'tin country',
    'issuing country',
    'issued by',
    'issuedby',
    'country tin issued',
    'country of issuance iso code',
    'country of issuance',
  ],
  incorporationCountry: [
    'incorporation country',
    'inc country',
    'country of incorporation',
    'incorporated in',
    'incorporation',
    'inc jurisdiction',
    'country inc',
    'incorporation organisation jurisdiction',
    'jurisdiction of incorporation iso code',
    'jurisdiction of incorporation iso code if different from residence',
    'jurisdiction of incorporation',
  ],
  address: [
    'address',
    'registered address',
    'business address',
    'addr',
    'location',
  ],
  activities: [
    'activities',
    'business activities',
    'activity codes',
    'main activities',
    'main business activity',
    'business activity',
    'activity',
  ],
  role: [
    'role',
    'entity role',
    'reporting role',
    'ce role',
  ],
};

// =============================================================================
// BUSINESS ACTIVITY CODES
// =============================================================================

/**
 * OECD Business Activity Codes for Table 2
 */
export const BUSINESS_ACTIVITY_CODES = {
  CBC501: 'Research and Development',
  CBC502: 'Holding or Managing Intellectual Property',
  CBC503: 'Purchasing or Procurement',
  CBC504: 'Manufacturing or Production',
  CBC505: 'Sales, Marketing or Distribution',
  CBC506: 'Administrative, Management or Support Services',
  CBC507: 'Provision of Services to Unrelated Parties',
  CBC508: 'Internal Group Finance',
  CBC509: 'Regulated Financial Services',
  CBC510: 'Insurance',
  CBC511: 'Holding Shares or Other Equity Instruments',
  CBC512: 'Dormant',
  CBC513: 'Other',
} as const;

export type BusinessActivityCode = keyof typeof BUSINESS_ACTIVITY_CODES;
