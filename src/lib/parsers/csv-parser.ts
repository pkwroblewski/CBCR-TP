/**
 * CSV Parser for CbCR Files
 *
 * Parses ZIP archives containing multiple CSV files with CbCR data.
 * Expected structure:
 * - header.csv: Key-value pairs for MessageSpec
 * - table1.csv: Summary data per jurisdiction
 * - table2.csv: Constituent entity data
 * - additional.csv (optional): Additional information
 *
 * @module lib/parsers/csv-parser
 */

import JSZip from 'jszip';
import {
  type CsvParsedData,
  type CsvFileSet,
  type ExcelSummaryRow,
  type ExcelEntityRow,
  type ExcelAdditionalInfoRow,
  type FileParseError,
  COLUMN_HEADER_MAPPINGS,
} from '@/types/file-upload';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of CSV ZIP parsing operation
 */
export type CsvParseResult =
  | { success: true; data: CsvParsedData; warnings: string[] }
  | { success: false; errors: FileParseError[] };

/**
 * Parsed CSV row
 */
type CsvRow = Record<string, string>;

// =============================================================================
// CONSTANTS
// =============================================================================

/** Expected CSV file names */
const CSV_FILE_NAMES = {
  HEADER: ['header.csv', 'messagespec.csv', 'metadata.csv'],
  TABLE1: ['table1.csv', 'summary.csv', 'jurisdictions.csv'],
  TABLE2: ['table2.csv', 'entities.csv', 'constituententities.csv'],
  ADDITIONAL: ['additional.csv', 'additionalinfo.csv', 'notes.csv'],
};

/** Header field mappings for CSV header file */
const HEADER_FIELD_MAPPINGS: Record<string, string> = {
  'sending_authority': 'sendingAuthority',
  'sending authority': 'sendingAuthority',
  'sendingauthority': 'sendingAuthority',
  'receiving_authority': 'receivingAuthority',
  'receiving authority': 'receivingAuthority',
  'receivingauthority': 'receivingAuthority',
  'message_type': 'messageType',
  'message type': 'messageType',
  'messagetype': 'messageType',
  'message_ref_id': 'messageRefId',
  'message ref id': 'messageRefId',
  'messagerefid': 'messageRefId',
  'message_type_indic': 'messageTypeIndic',
  'message type indic': 'messageTypeIndic',
  'messagetypeindic': 'messageTypeIndic',
  'reporting_period': 'reportingPeriod',
  'reporting period': 'reportingPeriod',
  'reportingperiod': 'reportingPeriod',
  'upe_name': 'upeName',
  'upe name': 'upeName',
  'upename': 'upeName',
  'upe_tin': 'upeTin',
  'upe tin': 'upeTin',
  'upetin': 'upeTin',
  'upe_tin_country': 'upeTinCountry',
  'upe tin country': 'upeTinCountry',
  'upetincountry': 'upeTinCountry',
  'currency': 'currency',
  'language': 'language',
  'contact_name': 'contactName',
  'contact name': 'contactName',
  'contactname': 'contactName',
  'contact_phone': 'contactPhone',
  'contact phone': 'contactPhone',
  'contactphone': 'contactPhone',
  'contact_email': 'contactEmail',
  'contact email': 'contactEmail',
  'contactemail': 'contactEmail',
};

// =============================================================================
// CSV PARSING UTILITIES
// =============================================================================

/**
 * Parse a CSV string into rows
 * Handles quoted fields with commas and newlines
 */
function parseCsvString(content: string): CsvRow[] {
  const rows: CsvRow[] = [];
  const lines: string[] = [];

  // Split by newlines, handling quoted fields
  let currentLine = '';
  let inQuotes = false;

  for (const char of content) {
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else if (char !== '\r') {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return rows;

  // Parse header row
  const headers = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/[_\-\s]+/g, '_')
  );

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: CsvRow = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || '';
    });

    // Skip empty rows
    if (Object.values(row).some((v) => v !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parse a single CSV line into values
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Normalize a header string for field matching
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_\-\s]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Find the best matching field name for a column header
 */
function findFieldMatch(header: string): string | null {
  const normalized = normalizeHeader(header);

  for (const [fieldName, variations] of Object.entries(COLUMN_HEADER_MAPPINGS)) {
    for (const variation of variations) {
      if (normalizeHeader(variation) === normalized) {
        return fieldName;
      }
    }
  }

  return null;
}

/**
 * Parse a cell value to a number
 */
function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;

  const cleaned = value
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .replace(/[()]/g, (m) => (m === '(' ? '-' : ''));

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse a cell value, returning null for empty strings
 */
function parseString(value: string): string | null {
  const trimmed = value?.trim();
  return trimmed === '' ? null : trimmed;
}

// =============================================================================
// FILE EXTRACTION
// =============================================================================

/**
 * Extract CSV files from a ZIP archive
 */
async function extractCsvFiles(buffer: ArrayBuffer): Promise<CsvFileSet> {
  const zip = await JSZip.loadAsync(buffer);
  const files: CsvFileSet = {};

  // Get all CSV files
  const csvFiles = Object.keys(zip.files).filter(
    (name) => name.toLowerCase().endsWith('.csv') && !zip.files[name].dir
  );

  for (const fileName of csvFiles) {
    const baseName = fileName.toLowerCase().split('/').pop() || '';
    const content = await zip.files[fileName].async('string');

    // Match to expected file types
    if (CSV_FILE_NAMES.HEADER.some((n) => baseName === n || baseName.includes('header'))) {
      files.header = content;
    } else if (CSV_FILE_NAMES.TABLE1.some((n) => baseName === n || baseName.includes('summary') || baseName.includes('table1'))) {
      files.table1 = content;
    } else if (CSV_FILE_NAMES.TABLE2.some((n) => baseName === n || baseName.includes('entit') || baseName.includes('table2'))) {
      files.table2 = content;
    } else if (CSV_FILE_NAMES.ADDITIONAL.some((n) => baseName === n || baseName.includes('additional'))) {
      files.additional = content;
    }
  }

  return files;
}

// =============================================================================
// DATA PARSING
// =============================================================================

/**
 * Parse header CSV content to key-value pairs
 */
function parseHeaderCsv(content: string): Record<string, string | number | null> {
  const headerData: Record<string, string | number | null> = {};
  const rows = parseCsvString(content);

  // Check if it's key-value format (two columns: field, value)
  if (rows.length > 0 && Object.keys(rows[0]).length === 2) {
    const keys = Object.keys(rows[0]);
    const fieldKey = keys.find((k) => k.includes('field') || k === keys[0]) || keys[0];
    const valueKey = keys.find((k) => k.includes('value') || k !== fieldKey) || keys[1];

    for (const row of rows) {
      const field = row[fieldKey]?.toLowerCase().trim();
      const value = row[valueKey];

      if (field) {
        const mappedField = HEADER_FIELD_MAPPINGS[field];
        if (mappedField) {
          headerData[mappedField] = parseString(value);
        }
      }
    }
  } else {
    // Try horizontal format (headers in first row, values in subsequent rows)
    for (const row of rows) {
      for (const [key, value] of Object.entries(row)) {
        const mappedField = HEADER_FIELD_MAPPINGS[key];
        if (mappedField && value) {
          headerData[mappedField] = parseString(value);
        }
      }
    }
  }

  return headerData;
}

/**
 * Parse summary CSV content to ExcelSummaryRow array
 */
function parseSummaryCsv(content: string): ExcelSummaryRow[] {
  const rows = parseCsvString(content);
  const summaryRows: ExcelSummaryRow[] = [];

  // Build column mapping
  if (rows.length === 0) return summaryRows;

  const columnKeys = Object.keys(rows[0]);
  const columnMapping: Record<string, string> = {};

  for (const key of columnKeys) {
    const fieldName = findFieldMatch(key);
    if (fieldName) {
      columnMapping[key] = fieldName;
    }
  }

  // Parse data rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Find jurisdiction
    const jurisdictionKey = columnKeys.find(
      (k) => columnMapping[k] === 'jurisdiction' || k.includes('jurisdiction') || k.includes('country')
    );

    const jurisdiction = jurisdictionKey ? parseString(row[jurisdictionKey]) : null;
    if (!jurisdiction) continue;

    const summaryRow: ExcelSummaryRow = {
      jurisdiction,
      unrelatedRevenue: null,
      relatedRevenue: null,
      totalRevenue: null,
      profitOrLoss: null,
      taxPaid: null,
      taxAccrued: null,
      capital: null,
      accumulatedEarnings: null,
      numberOfEmployees: null,
      tangibleAssets: null,
      sourceRow: i + 2, // 1-indexed, +1 for header
    };

    // Map values
    for (const [key, value] of Object.entries(row)) {
      const fieldName = columnMapping[key] || findFieldMatch(key);
      if (!fieldName || fieldName === 'jurisdiction') continue;

      const numValue = parseNumber(value);
      if (fieldName in summaryRow) {
        (summaryRow as unknown as Record<string, unknown>)[fieldName] = numValue;
      }
    }

    summaryRows.push(summaryRow);
  }

  return summaryRows;
}

/**
 * Parse entities CSV content to ExcelEntityRow array
 */
function parseEntitiesCsv(content: string): ExcelEntityRow[] {
  const rows = parseCsvString(content);
  const entityRows: ExcelEntityRow[] = [];

  if (rows.length === 0) return entityRows;

  const columnKeys = Object.keys(rows[0]);
  const columnMapping: Record<string, string> = {};

  for (const key of columnKeys) {
    const fieldName = findFieldMatch(key);
    if (fieldName) {
      columnMapping[key] = fieldName;
    }
  }

  // Parse data rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Find entity name
    const nameKey = columnKeys.find(
      (k) => columnMapping[k] === 'entityName' || k.includes('name') || k.includes('entity')
    );

    const entityName = nameKey ? parseString(row[nameKey]) : null;
    if (!entityName) continue;

    // Find jurisdiction
    const jurisdictionKey = columnKeys.find(
      (k) => columnMapping[k] === 'jurisdiction' || k.includes('jurisdiction') || k.includes('residence')
    );

    const entityRow: ExcelEntityRow = {
      entityName,
      tin: null,
      tinIssuedBy: null,
      jurisdiction: jurisdictionKey ? parseString(row[jurisdictionKey]) || '' : '',
      incorporationCountry: null,
      address: null,
      activities: null,
      role: null,
      otherInfo: null,
      sourceRow: i + 2,
    };

    // Map values
    for (const [key, value] of Object.entries(row)) {
      const fieldName = columnMapping[key] || findFieldMatch(key);
      if (!fieldName || fieldName === 'entityName' || fieldName === 'jurisdiction') continue;

      const strValue = parseString(value);
      if (fieldName in entityRow) {
        (entityRow as unknown as Record<string, unknown>)[fieldName] = strValue;
      }
    }

    entityRows.push(entityRow);
  }

  return entityRows;
}

/**
 * Parse additional info CSV content
 */
function parseAdditionalInfoCsv(content: string): ExcelAdditionalInfoRow[] {
  const rows = parseCsvString(content);
  const additionalRows: ExcelAdditionalInfoRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Find notes/text field
    const notesKey = Object.keys(row).find(
      (k) => k.includes('note') || k.includes('text') || k.includes('info')
    );

    const notes = notesKey ? parseString(row[notesKey]) : null;
    if (!notes) continue;

    // Find country codes
    const countryKey = Object.keys(row).find(
      (k) => k.includes('country') || k.includes('code')
    );

    // Find language
    const langKey = Object.keys(row).find(
      (k) => k.includes('lang')
    );

    additionalRows.push({
      countryCodes: countryKey ? parseString(row[countryKey]) : null,
      language: langKey ? parseString(row[langKey]) : null,
      notes,
      sourceRow: i + 2,
    });
  }

  return additionalRows;
}

// =============================================================================
// MAIN PARSER
// =============================================================================

/**
 * Parse a CSV ZIP file and extract CbCR data
 *
 * @param buffer - ArrayBuffer containing the ZIP file
 * @param fileName - Original file name (for error messages)
 * @returns CsvParseResult with parsed data or errors
 */
export async function parseCsvZip(
  buffer: ArrayBuffer,
  fileName: string
): Promise<CsvParseResult> {
  const errors: FileParseError[] = [];
  const warnings: string[] = [];

  try {
    // Extract CSV files from ZIP
    const files = await extractCsvFiles(buffer);

    // Check for required files
    if (!files.table1) {
      errors.push({
        code: 'CSV_NO_SUMMARY',
        message: 'ZIP file must contain a summary CSV (table1.csv, summary.csv, or similar)',
        suggestion: 'Include a CSV file with jurisdiction-level financial data',
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Parse header data
    let headerData: Record<string, string | number | null> = {};
    if (files.header) {
      headerData = parseHeaderCsv(files.header);
    } else {
      warnings.push('No header CSV found. Message metadata will use default values.');
    }

    // Parse summary rows
    const summaryRows = files.table1 ? parseSummaryCsv(files.table1) : [];

    if (summaryRows.length === 0) {
      errors.push({
        code: 'CSV_EMPTY_SUMMARY',
        message: 'Summary CSV contains no valid data rows',
        location: 'table1.csv',
      });
      return { success: false, errors };
    }

    // Parse entity rows
    let entityRows: ExcelEntityRow[] = [];
    if (files.table2) {
      entityRows = parseEntitiesCsv(files.table2);
      if (entityRows.length === 0) {
        warnings.push('Entities CSV contains no valid data rows.');
      }
    } else {
      warnings.push('No entities CSV found. Entity details will be empty.');
    }

    // Parse additional info
    let additionalInfoRows: ExcelAdditionalInfoRow[] | undefined;
    if (files.additional) {
      additionalInfoRows = parseAdditionalInfoCsv(files.additional);
    }

    // Get currency from header
    const currency = (headerData.currency as string) || 'EUR';

    // Return parsed data
    const parsedData: CsvParsedData = {
      files,
      headerData,
      summaryRows,
      entityRows,
      additionalInfoRows,
      currency,
    };

    return { success: true, data: parsedData, warnings };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a ZIP error
    if (errorMessage.includes('not a valid zip file') || errorMessage.includes('End of data')) {
      return {
        success: false,
        errors: [
          {
            code: 'CSV_INVALID_ZIP',
            message: 'File is not a valid ZIP archive',
            suggestion: 'Ensure you are uploading a .zip file containing CSV files',
          },
        ],
      };
    }

    return {
      success: false,
      errors: [
        {
          code: 'CSV_PARSE_ERROR',
          message: `Failed to parse CSV ZIP file: ${errorMessage}`,
        },
      ],
    };
  }
}

/**
 * Validate CSV ZIP structure before full parsing
 */
export async function validateCsvStructure(
  buffer: ArrayBuffer
): Promise<{ valid: boolean; fileNames: string[]; errors: string[] }> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const csvFiles = Object.keys(zip.files).filter(
      (name) => name.toLowerCase().endsWith('.csv') && !zip.files[name].dir
    );

    const errors: string[] = [];

    if (csvFiles.length === 0) {
      errors.push('ZIP file contains no CSV files');
    }

    const hasTable1 = csvFiles.some(
      (f) => CSV_FILE_NAMES.TABLE1.some((n) => f.toLowerCase().includes(n.replace('.csv', '')))
    );

    if (!hasTable1) {
      errors.push('No summary/table1 CSV found');
    }

    return {
      valid: errors.length === 0,
      fileNames: csvFiles,
      errors,
    };
  } catch {
    return {
      valid: false,
      fileNames: [],
      errors: ['Failed to read ZIP file'],
    };
  }
}
