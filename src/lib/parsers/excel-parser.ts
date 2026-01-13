/**
 * Excel Parser for CbCR Files
 *
 * Parses Excel (.xlsx) files containing CbCR data and extracts structured data
 * for transformation into ParsedCbcReport format.
 *
 * Supports:
 * - Our provided template format
 * - Auto-detection of common CbCR Excel layouts
 *
 * @module lib/parsers/excel-parser
 */

import * as XLSX from 'xlsx';
import {
  type ExcelLayoutInfo,
  type ExcelLayoutType,
  type ExcelParsedData,
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
 * Result of Excel parsing operation
 */
export type ExcelParseResult =
  | { success: true; data: ExcelParsedData; warnings: string[] }
  | { success: false; errors: FileParseError[] };

/**
 * Column mapping for a sheet
 */
interface ColumnMapping {
  [fieldName: string]: number; // Field name to column index
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Template sheet names */
const TEMPLATE_SHEETS = {
  HEADER: 'Header',
  SUMMARY: 'Table1_Summary',
  ENTITIES: 'Table2_Entities',
  ADDITIONAL_INFO: 'AdditionalInfo',
};

/** Header field mappings for template format */
const HEADER_FIELD_MAPPINGS: Record<string, string> = {
  // Sending/Receiving authority
  'sending authority': 'sendingAuthority',
  'sending competent authority': 'sendingAuthority',
  'sendingcompetentauthority': 'sendingAuthority',
  'from': 'sendingAuthority',
  'transmitting country': 'sendingAuthority',
  'receiving authority': 'receivingAuthority',
  'receiving competent authority': 'receivingAuthority',
  'receivingcompetentauthority': 'receivingAuthority',
  'to': 'receivingAuthority',
  'receiving country': 'receivingAuthority',
  // Message info
  'message type': 'messageType',
  'messagetype': 'messageType',
  'message ref id': 'messageRefId',
  'messagerefid': 'messageRefId',
  'message reference': 'messageRefId',
  'message type indic': 'messageTypeIndic',
  'messagetypeindic': 'messageTypeIndic',
  'message indicator': 'messageTypeIndic',
  // Reporting period
  'reporting period': 'reportingPeriod',
  'reportingperiod': 'reportingPeriod',
  'fiscal year': 'reportingPeriod',
  'fiscal year end': 'reportingPeriod',
  'year': 'reportingPeriod',
  'period': 'reportingPeriod',
  'period end': 'reportingPeriod',
  'reporting year': 'reportingPeriod',
  'reporting period end date': 'reportingPeriod',
  'reporting period start date': 'reportingPeriodStart',
  // UPE info
  'upe name': 'upeName',
  'upename': 'upeName',
  'ultimate parent entity': 'upeName',
  'ultimate parent entity name': 'upeName',
  'parent entity': 'upeName',
  'parent name': 'upeName',
  'mne group name': 'upeName',
  'group name': 'upeName',
  'reporting entity name': 'upeName',
  'upe tin': 'upeTin',
  'upetin': 'upeTin',
  'parent tin': 'upeTin',
  'upe tax id': 'upeTin',
  'upe tin country': 'upeTinCountry',
  'upetincountry': 'upeTinCountry',
  'parent country': 'upeTinCountry',
  'upe country': 'upeTinCountry',
  'upe jurisdiction': 'upeTinCountry',
  'residence country iso code': 'upeTinCountry',
  // Currency
  'currency': 'currency',
  'reporting currency': 'currency',
  'ccy': 'currency',
  // Language
  'language': 'language',
  'lang': 'language',
  // Contact
  'contact name': 'contactName',
  'contact': 'contactName',
  'contact phone': 'contactPhone',
  'phone': 'contactPhone',
  'contact email': 'contactEmail',
  'email': 'contactEmail',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Normalize a header string for comparison
 * Handles newlines, special characters, and common typos
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/\r?\n/g, ' ')           // Replace newlines with spaces
    .replace(/[_\-\s]+/g, ' ')        // Normalize whitespace
    .replace(/jurisdisction/g, 'jurisdiction') // Fix common typo
    .replace(/[^a-z0-9 ]/g, '')       // Remove special characters
    .replace(/\s+/g, ' ')             // Collapse multiple spaces (after special chars removed)
    .trim();
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
 * Parse a cell value to a number, handling various formats
 */
function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    // Remove thousand separators and normalize
    const cleaned = value
      .replace(/,/g, '')
      .replace(/\s/g, '')
      .replace(/[()]/g, (m) => (m === '(' ? '-' : ''));

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Parse a cell value to a string
 */
function parseString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  return String(value).trim();
}

/**
 * Parse an Excel date to YYYY-MM-DD string
 */
function parseDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // If it's an Excel serial date number
  if (typeof value === 'number') {
    // Excel serial date (days since 1900-01-01, with a leap year bug)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString().split('T')[0];
  }

  // If it's already a string, try to parse it
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Check if it matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    // Check for DD.MM.YYYY format (European)
    const euroMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (euroMatch) {
      const [, day, month, year] = euroMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Check for DD/MM/YYYY format
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Try to parse other formats
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return null;
}

/**
 * Get sheet data as array of arrays
 */
function getSheetData(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];
}

/**
 * Get a row as an object with column index access
 */
function getRowValues(row: unknown[]): Record<number, unknown> {
  const values: Record<number, unknown> = {};
  row.forEach((val, idx) => {
    values[idx] = val;
  });
  return values;
}

// =============================================================================
// LAYOUT DETECTION
// =============================================================================

/**
 * Detect the layout type of an Excel workbook
 */
export function detectExcelLayout(workbook: XLSX.WorkBook): ExcelLayoutInfo {
  const sheetNames = workbook.SheetNames;

  // Check for template format
  const hasHeaderSheet = sheetNames.some(
    (n) => n.toLowerCase() === TEMPLATE_SHEETS.HEADER.toLowerCase()
  );
  const hasSummarySheet = sheetNames.some(
    (n) => n.toLowerCase() === TEMPLATE_SHEETS.SUMMARY.toLowerCase()
  );
  const hasEntitiesSheet = sheetNames.some(
    (n) => n.toLowerCase() === TEMPLATE_SHEETS.ENTITIES.toLowerCase()
  );

  if (hasHeaderSheet && hasSummarySheet && hasEntitiesSheet) {
    return {
      layoutType: 'template',
      sheetNames,
      sheetMapping: {
        header: sheetNames.find(
          (n) => n.toLowerCase() === TEMPLATE_SHEETS.HEADER.toLowerCase()
        ),
        summary: sheetNames.find(
          (n) => n.toLowerCase() === TEMPLATE_SHEETS.SUMMARY.toLowerCase()
        ),
        entities: sheetNames.find(
          (n) => n.toLowerCase() === TEMPLATE_SHEETS.ENTITIES.toLowerCase()
        ),
        additionalInfo: sheetNames.find(
          (n) => n.toLowerCase() === TEMPLATE_SHEETS.ADDITIONAL_INFO.toLowerCase()
        ),
      },
      confidence: 100,
    };
  }

  // Try to auto-detect by sheet name patterns first
  const mapping: ExcelLayoutInfo['sheetMapping'] = {};
  let confidence = 0;

  // First pass: Match by sheet name patterns
  for (const sheetName of sheetNames) {
    const lowerName = sheetName.toLowerCase();

    // Summary sheet patterns: "summary", "table 1", "table1", "cbc summary", "cbc"
    if (!mapping.summary && (
      lowerName.includes('summary') ||
      lowerName.includes('table 1') ||
      lowerName.includes('table1') ||
      lowerName === 'cbc' ||
      lowerName.includes('cbc ') ||
      lowerName.startsWith('cbc') ||
      lowerName.includes('overview')
    )) {
      mapping.summary = sheetName;
      confidence += 25;
      console.log('[Excel Parser] Matched summary sheet by name:', sheetName);
    }

    // Entities sheet patterns: "entities", "table 2", "table2", "constituent"
    if (!mapping.entities && (
      lowerName.includes('entities') ||
      lowerName.includes('entity') ||
      lowerName.includes('table 2') ||
      lowerName.includes('table2') ||
      lowerName.includes('constituent')
    )) {
      mapping.entities = sheetName;
      confidence += 25;
      console.log('[Excel Parser] Matched entities sheet by name:', sheetName);
    }

    // Header sheet patterns: "header", "info", "metadata"
    if (!mapping.header && (
      lowerName === 'header' ||
      lowerName.includes('metadata') ||
      lowerName.includes('message info')
    )) {
      mapping.header = sheetName;
      confidence += 20;
      console.log('[Excel Parser] Matched header sheet by name:', sheetName);
    }

    // Additional info patterns: "additional", "table 3", "notes"
    if (!mapping.additionalInfo && (
      lowerName.includes('additional') ||
      lowerName.includes('table 3') ||
      lowerName.includes('table3') ||
      lowerName.includes('notes')
    )) {
      mapping.additionalInfo = sheetName;
      confidence += 10;
      console.log('[Excel Parser] Matched additional info sheet by name:', sheetName);
    }
  }

  // Second pass: Look at column headers for sheets not yet matched
  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = getSheetData(sheet);

    if (data.length === 0) continue;

    // Look at the first few rows for headers
    for (let rowIdx = 0; rowIdx < Math.min(5, data.length); rowIdx++) {
      const row = data[rowIdx];
      if (!row) continue;

      const headers = row.map((cell) =>
        cell ? normalizeHeader(String(cell)) : ''
      );

      // Check for summary sheet indicators
      if (!mapping.summary) {
        const hasSummaryHeaders =
          headers.some((h) => h.includes('jurisdiction') || h.includes('country') || h.includes('tax jurisdiction')) &&
          headers.some((h) => h.includes('revenue') || h.includes('turnover') || h.includes('profit'));

        if (hasSummaryHeaders) {
          mapping.summary = sheetName;
          confidence += 30;
          console.log('[Excel Parser] Matched summary sheet by headers:', sheetName);
        }
      }

      // Check for entities sheet indicators
      if (!mapping.entities) {
        const hasEntityHeaders =
          headers.some((h) => h.includes('entity') || h.includes('name') || h.includes('legal name')) &&
          headers.some((h) => h.includes('tin') || h.includes('tax id') || h.includes('identification'));

        if (hasEntityHeaders) {
          mapping.entities = sheetName;
          confidence += 30;
          console.log('[Excel Parser] Matched entities sheet by headers:', sheetName);
        }
      }

      // Check for header sheet indicators
      if (!mapping.header) {
        const hasHeaderIndicators = headers.some(
          (h) =>
            h.includes('message') ||
            h.includes('reporting period') ||
            h.includes('sending') ||
            h.includes('receiving') ||
            h.includes('fiscal year')
        );

        if (hasHeaderIndicators) {
          mapping.header = sheetName;
          confidence += 20;
          console.log('[Excel Parser] Matched header sheet by headers:', sheetName);
        }
      }
    }
  }

  if (mapping.summary || mapping.entities) {
    return {
      layoutType: 'auto-detected',
      sheetNames,
      sheetMapping: mapping,
      confidence: Math.min(confidence, 100),
    };
  }

  return {
    layoutType: 'unknown',
    sheetNames,
    sheetMapping: {},
    confidence: 0,
  };
}

// =============================================================================
// SHEET PARSING
// =============================================================================

/**
 * Extract header data from the Header sheet (template, key-value, or table format)
 */
function extractTemplateHeader(
  sheet: XLSX.WorkSheet
): Record<string, string | number | null> {
  const data = getSheetData(sheet);
  const headerData: Record<string, string | number | null> = {};

  console.log('[Excel Parser] Extracting header data from sheet with', data.length, 'rows');

  // Strategy 1: Table format - find a header row with recognizable fields, then find data row below
  for (let headerRowIdx = 0; headerRowIdx < Math.min(5, data.length); headerRowIdx++) {
    const headerRow = data[headerRowIdx];
    if (!headerRow || headerRow.length < 3) continue;

    // Check if this row has multiple recognizable header fields
    const columnMappings: Array<{ col: number; field: string }> = [];
    for (let col = 0; col < headerRow.length; col++) {
      const cell = parseString(headerRow[col]);
      if (!cell) continue;
      const normalizedLabel = normalizeHeader(cell);
      const mappedField = HEADER_FIELD_MAPPINGS[normalizedLabel];
      if (mappedField) {
        columnMappings.push({ col, field: mappedField });
      }
    }

    // If we found 2+ recognizable headers, treat this as a table header row
    if (columnMappings.length >= 2) {
      console.log(`[Excel Parser] Found table header row at ${headerRowIdx} with ${columnMappings.length} fields`);

      // Find the first data row that has values in at least one of our mapped columns
      for (let dataRowIdx = headerRowIdx + 1; dataRowIdx < Math.min(headerRowIdx + 5, data.length); dataRowIdx++) {
        const dataRow = data[dataRowIdx];
        if (!dataRow) continue;

        // Check if this row has actual data values in any of the mapped columns
        const hasDataInMappedCols = columnMappings.some(({ col }) => {
          const value = dataRow[col];
          return value !== null && value !== undefined && value !== '';
        });
        if (!hasDataInMappedCols) continue;

        console.log(`[Excel Parser] Found data row at ${dataRowIdx}`);

        // Extract values using the column mappings
        for (const mapping of columnMappings) {
          const value = dataRow[mapping.col];
          if (value === null || value === undefined || value === '') continue;

          if (!headerData[mapping.field]) {
            // Check if this is a date field
            const isDateField = mapping.field === 'reportingPeriod' || mapping.field === 'reportingPeriodStart';
            if (isDateField) {
              headerData[mapping.field] = parseDate(value);
            } else {
              headerData[mapping.field] = parseString(value);
            }
            console.log(`[Excel Parser] Header (table): col ${mapping.col} -> ${mapping.field}:`, headerData[mapping.field]);
          }
        }
        break; // Only use the first data row
      }
      break; // Stop after finding table format
    }
  }

  // Strategy 2: Key-value pairs (Label | Value pattern in adjacent cells)
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    for (let j = 0; j < row.length - 1; j++) {
      const potentialKey = parseString(row[j]);
      const potentialValue = row[j + 1];

      if (!potentialKey) continue;

      const normalizedLabel = normalizeHeader(potentialKey);
      const mappedField = HEADER_FIELD_MAPPINGS[normalizedLabel];

      if (mappedField && !headerData[mappedField]) {
        const isDateField = ['reporting period', 'reportingperiod', 'fiscal year', 'fiscal year end',
                            'year', 'period', 'period end', 'reporting year', 'reporting period end date'].includes(normalizedLabel);
        if (isDateField) {
          headerData[mappedField] = parseDate(potentialValue);
        } else {
          headerData[mappedField] = parseString(potentialValue);
        }
        console.log(`[Excel Parser] Header (key-value): "${potentialKey}" -> ${mappedField}:`, headerData[mappedField]);
      }
    }
  }

  // Strategy 3: "Field: Value" pattern in single cells
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    for (const cell of row) {
      if (!cell || typeof cell !== 'string') continue;

      const colonIdx = cell.indexOf(':');
      if (colonIdx > 0 && colonIdx < cell.length - 1) {
        const key = cell.substring(0, colonIdx).trim();
        const value = cell.substring(colonIdx + 1).trim();

        const normalizedLabel = normalizeHeader(key);
        const mappedField = HEADER_FIELD_MAPPINGS[normalizedLabel];

        if (mappedField && !headerData[mappedField] && value) {
          headerData[mappedField] = value;
          console.log(`[Excel Parser] Header (colon format): "${key}" -> ${mappedField}:`, value);
        }
      }
    }
  }

  console.log('[Excel Parser] Final header data:', headerData);
  return headerData;
}

/**
 * Build column mapping from header row
 * Supports hierarchical headers by merging main headers with sub-headers
 * Sub-headers take priority over main headers when they exist (more specific)
 */
function buildColumnMapping(headerRow: unknown[], subHeaderRow?: unknown[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  headerRow.forEach((cell, idx) => {
    let headerStr = ''; // Initialize to avoid TS error
    let useSubHeader = false;

    // If sub-header exists and is a string, try it FIRST (more specific)
    if (subHeaderRow && subHeaderRow[idx] && typeof subHeaderRow[idx] === 'string') {
      const subHeaderStr = String(subHeaderRow[idx]);
      const subFieldName = findFieldMatch(subHeaderStr);
      if (subFieldName) {
        // Sub-header matched a known field - use it
        headerStr = subHeaderStr;
        useSubHeader = true;
        console.log(`[Excel Parser] Column ${idx}: Using sub-header "${headerStr}" (matched ${subFieldName})`);
      }
    }

    // If no sub-header match, use main header
    if (!useSubHeader) {
      if (!cell && subHeaderRow && subHeaderRow[idx]) {
        // Main is null but sub-header exists
        headerStr = String(subHeaderRow[idx]);
        console.log(`[Excel Parser] Column ${idx}: Using sub-header "${headerStr}" (main is null)`);
      } else if (cell) {
        headerStr = String(cell);
      } else {
        return; // Skip if both are empty
      }
    }

    const fieldName = findFieldMatch(headerStr);

    if (fieldName) {
      mapping[fieldName] = idx;
      console.log(`[Excel Parser] Column ${idx}: "${headerStr}" -> ${fieldName}`);
    } else {
      // Store raw column name for reference
      const normalized = normalizeHeader(headerStr);
      mapping[normalized] = idx;
      console.log(`[Excel Parser] Column ${idx}: "${headerStr}" -> (unmapped: ${normalized})`);
    }
  });

  console.log('[Excel Parser] Final column mapping:', mapping);
  return mapping;
}

/**
 * Find the header row in a sheet by looking for recognizable column names
 * Returns the row index (0-based) or -1 if not found
 */
function findHeaderRow(data: unknown[][], sheetType: 'summary' | 'entities'): number {
  // Define keywords to look for based on sheet type
  const summaryKeywords = ['jurisdiction', 'country', 'revenue', 'profit', 'tax', 'employees', 'assets'];
  const entityKeywords = ['entity', 'name', 'tin', 'jurisdiction', 'country', 'incorporation', 'address', 'activities'];
  const keywords = sheetType === 'summary' ? summaryKeywords : entityKeywords;

  // Search first 10 rows for a potential header row
  for (let rowIdx = 0; rowIdx < Math.min(10, data.length); rowIdx++) {
    const row = data[rowIdx];
    if (!row || row.length < 2) continue;

    // Count how many cells contain keywords
    let keywordMatches = 0;
    for (const cell of row) {
      if (!cell) continue;
      const cellStr = normalizeHeader(String(cell));
      for (const keyword of keywords) {
        if (cellStr.includes(keyword)) {
          keywordMatches++;
          break;
        }
      }
    }

    // If we found 2+ keyword matches, this is likely the header row
    if (keywordMatches >= 2) {
      console.log(`[Excel Parser] Found header row at index ${rowIdx} with ${keywordMatches} keyword matches`);
      return rowIdx;
    }
  }

  // Default to row 0 if no header found
  console.log('[Excel Parser] No header row found, defaulting to row 0');
  return 0;
}

/**
 * Check if a number has decimal places and add warning if so
 */
function checkDecimalAndWarn(
  value: number | null,
  fieldName: string,
  jurisdiction: string,
  sourceRow: number,
  warnings: string[]
): number | null {
  if (value !== null && !Number.isInteger(value)) {
    warnings.push(
      `Row ${sourceRow}, ${jurisdiction}: Decimal value found in ${fieldName} (${value}). ` +
      `OECD XML schema requires integers - value will need to be rounded.`
    );
  }
  return value;
}

/**
 * Extract summary rows from Table 1 sheet
 */
function extractSummaryRows(
  sheet: XLSX.WorkSheet,
  isTemplate: boolean,
  warnings: string[] = []
): ExcelSummaryRow[] {
  const data = getSheetData(sheet);
  const rows: ExcelSummaryRow[] = [];

  if (data.length < 2) return rows;

  console.log('[Excel Parser] Extracting summary rows, isTemplate:', isTemplate);
  console.log('[Excel Parser] Summary sheet has', data.length, 'rows');

  // Find header row - for template use row 0, for auto-detect search for it
  let headerRowIdx = 0;
  if (isTemplate) {
    headerRowIdx = 0;
  } else {
    headerRowIdx = findHeaderRow(data, 'summary');
  }

  const headerRow = data[headerRowIdx];
  if (!headerRow) return rows;

  // Check for sub-header row (common in hierarchical headers)
  // Sub-headers are in the next row if main headers have null values with data below
  const potentialSubHeaderRow = data[headerRowIdx + 1];
  const hasSubHeaders = headerRow.some((cell, idx) =>
    !cell && potentialSubHeaderRow?.[idx] && typeof potentialSubHeaderRow[idx] === 'string'
  );
  const subHeaderRow = hasSubHeaders ? potentialSubHeaderRow : undefined;

  console.log('[Excel Parser] Summary header row:', headerRow.slice(0, 15));
  if (subHeaderRow) {
    console.log('[Excel Parser] Summary sub-header row:', subHeaderRow.slice(0, 15));
  }
  const columnMapping = buildColumnMapping(headerRow, subHeaderRow);

  // Enhanced debug logging for revenue column detection
  console.log('[Excel Parser] Revenue column mapping:', {
    unrelatedRevenue: columnMapping.unrelatedRevenue ?? 'NOT FOUND',
    relatedRevenue: columnMapping.relatedRevenue ?? 'NOT FOUND',
    totalRevenue: columnMapping.totalRevenue ?? 'NOT FOUND',
  });

  // Log all column mappings for full visibility
  console.log('[Excel Parser] All column mappings:', Object.entries(columnMapping)
    .filter(([key, val]) => typeof val === 'number')
    .map(([key, val]) => `${key}=${val}`)
    .join(', ')
  );

  // Data starts after headers (and sub-headers/description row)
  // If we have sub-headers, skip that row too
  const dataStartIdx = isTemplate ? 2 : headerRowIdx + (hasSubHeaders ? 2 : 1);
  console.log('[Excel Parser] Summary data starts at row', dataStartIdx);

  for (let i = dataStartIdx; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const rowValues = getRowValues(row);

    // Get jurisdiction - try multiple column names
    const jurisdictionIdx = columnMapping.jurisdiction ?? columnMapping.country ?? columnMapping['tax jurisdiction'] ?? 0;
    const jurisdiction = parseString(rowValues[jurisdictionIdx]);

    if (!jurisdiction) continue; // Skip rows without jurisdiction

    // Skip if jurisdiction looks like a header or total row
    const lowerJurisdiction = jurisdiction.toLowerCase();
    if (lowerJurisdiction === 'total' || lowerJurisdiction === 'totals' ||
        lowerJurisdiction.includes('jurisdiction') || lowerJurisdiction.includes('country')) {
      continue;
    }

    const sourceRow = i + 1; // 1-indexed for Excel

    // Parse all numeric values and check for decimals
    const summaryRow: ExcelSummaryRow = {
      jurisdiction,
      unrelatedRevenue: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.unrelatedRevenue]),
        'Unrelated Revenue', jurisdiction, sourceRow, warnings
      ),
      relatedRevenue: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.relatedRevenue]),
        'Related Revenue', jurisdiction, sourceRow, warnings
      ),
      totalRevenue: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.totalRevenue]),
        'Total Revenue', jurisdiction, sourceRow, warnings
      ),
      profitOrLoss: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.profitOrLoss]),
        'Profit/Loss', jurisdiction, sourceRow, warnings
      ),
      taxPaid: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.taxPaid]),
        'Tax Paid', jurisdiction, sourceRow, warnings
      ),
      taxAccrued: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.taxAccrued]),
        'Tax Accrued', jurisdiction, sourceRow, warnings
      ),
      capital: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.capital]),
        'Stated Capital', jurisdiction, sourceRow, warnings
      ),
      accumulatedEarnings: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.accumulatedEarnings]),
        'Accumulated Earnings', jurisdiction, sourceRow, warnings
      ),
      numberOfEmployees: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.numberOfEmployees]),
        'Number of Employees', jurisdiction, sourceRow, warnings
      ),
      tangibleAssets: checkDecimalAndWarn(
        parseNumber(rowValues[columnMapping.tangibleAssets]),
        'Tangible Assets', jurisdiction, sourceRow, warnings
      ),
      sourceRow,
    };

    // Log first row's data for debugging
    if (rows.length === 0) {
      console.log('[Excel Parser] First summary row:', summaryRow);
    }

    rows.push(summaryRow);
  }

  console.log('[Excel Parser] Extracted', rows.length, 'summary rows');
  return rows;
}

/**
 * Extract entity rows from Table 2 sheet
 */
function extractEntityRows(
  sheet: XLSX.WorkSheet,
  isTemplate: boolean
): ExcelEntityRow[] {
  const data = getSheetData(sheet);
  const rows: ExcelEntityRow[] = [];

  if (data.length < 2) return rows;

  console.log('[Excel Parser] Extracting entity rows, isTemplate:', isTemplate);
  console.log('[Excel Parser] Entity sheet has', data.length, 'rows');

  // Find header row - for template use row 0, for auto-detect search for it
  let headerRowIdx = 0;
  if (isTemplate) {
    headerRowIdx = 0;
  } else {
    headerRowIdx = findHeaderRow(data, 'entities');
  }

  const headerRow = data[headerRowIdx];
  if (!headerRow) return rows;

  // Check for sub-header row (common in hierarchical headers)
  const potentialSubHeaderRow = data[headerRowIdx + 1];
  const hasSubHeaders = headerRow.some((cell, idx) =>
    !cell && potentialSubHeaderRow?.[idx] && typeof potentialSubHeaderRow[idx] === 'string'
  );
  const subHeaderRow = hasSubHeaders ? potentialSubHeaderRow : undefined;

  console.log('[Excel Parser] Entity header row:', headerRow.slice(0, 10));
  if (subHeaderRow) {
    console.log('[Excel Parser] Entity sub-header row:', subHeaderRow.slice(0, 10));
  }
  const columnMapping = buildColumnMapping(headerRow, subHeaderRow);

  const dataStartIdx = isTemplate ? 2 : headerRowIdx + (hasSubHeaders ? 2 : 1);
  console.log('[Excel Parser] Entity data starts at row', dataStartIdx);

  for (let i = dataStartIdx; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const rowValues = getRowValues(row);

    // Get entity name - try multiple column names
    const nameIdx = columnMapping.entityName ?? columnMapping.name ??
                    columnMapping['constituent entity'] ?? columnMapping['legal name'] ?? 0;
    const entityName = parseString(rowValues[nameIdx]);

    if (!entityName) continue; // Skip rows without entity name

    // Skip if entity name looks like a header
    const lowerName = entityName.toLowerCase();
    if (lowerName.includes('constituent entity') || lowerName.includes('entity name') ||
        lowerName.includes('legal name') || lowerName === 'name') {
      continue;
    }

    // Get jurisdiction - try multiple column names
    // Also look for "tax jurisdiction", "residence", etc.
    let jurisdictionIdx = columnMapping.jurisdiction ?? columnMapping.country ??
                         columnMapping['tax jurisdiction'] ?? columnMapping['residence country'] ??
                         columnMapping['tax jurisdiction residence'] ?? columnMapping['residence'];

    // If still no jurisdiction column, look for any column containing "jurisdiction"
    if (jurisdictionIdx === undefined) {
      for (const [key, idx] of Object.entries(columnMapping)) {
        if (key.includes('jurisdiction') && typeof idx === 'number') {
          jurisdictionIdx = idx;
          console.log('[Excel Parser] Found jurisdiction column via pattern match:', key, 'at index', idx);
          break;
        }
      }
    }

    const jurisdiction = parseString(rowValues[jurisdictionIdx ?? 0]) || '';

    // Also try to get TIN issued by as potential jurisdiction fallback
    const tinIssuedBy = parseString(rowValues[columnMapping.tinIssuedBy]);

    const entityRow: ExcelEntityRow = {
      entityName,
      tin: parseString(rowValues[columnMapping.tin]),
      tinIssuedBy,
      // Use jurisdiction if valid country code (2 letters), otherwise try tinIssuedBy
      jurisdiction: (jurisdiction.length === 2 ? jurisdiction : tinIssuedBy) || jurisdiction || '',
      incorporationCountry: parseString(rowValues[columnMapping.incorporationCountry]),
      address: parseString(rowValues[columnMapping.address]),
      activities: parseString(rowValues[columnMapping.activities]),
      role: parseString(rowValues[columnMapping.role]),
      otherInfo: parseString(rowValues[columnMapping.otherInfo]),
      sourceRow: i + 1,
    };

    // Log first row's data for debugging
    if (rows.length === 0) {
      console.log('[Excel Parser] First entity row:', entityRow);
    }

    rows.push(entityRow);
  }

  console.log('[Excel Parser] Extracted', rows.length, 'entity rows');
  return rows;
}

/**
 * Extract additional info rows
 */
function extractAdditionalInfoRows(
  sheet: XLSX.WorkSheet,
  isTemplate: boolean
): ExcelAdditionalInfoRow[] {
  const data = getSheetData(sheet);
  const rows: ExcelAdditionalInfoRow[] = [];

  if (data.length < 2) return rows;

  const dataStartIdx = isTemplate ? 2 : 1;

  for (let i = dataStartIdx; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    const notes = parseString(row[2]);
    if (!notes) continue;

    rows.push({
      countryCodes: parseString(row[0]),
      language: parseString(row[1]),
      notes,
      sourceRow: i + 1,
    });
  }

  return rows;
}

// =============================================================================
// MAIN PARSER
// =============================================================================

/**
 * Parse an Excel file and extract CbCR data
 *
 * @param buffer - ArrayBuffer containing the Excel file
 * @param fileName - Original file name (for error messages)
 * @returns ExcelParseResult with parsed data or errors
 */
export function parseExcelFile(
  buffer: ArrayBuffer,
  fileName: string
): ExcelParseResult {
  const errors: FileParseError[] = [];
  const warnings: string[] = [];

  try {
    // Read the workbook
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      cellNF: true,
    });

    if (!workbook.SheetNames.length) {
      return {
        success: false,
        errors: [
          {
            code: 'EXCEL_EMPTY',
            message: 'Excel file contains no sheets',
          },
        ],
      };
    }

    // Detect layout
    console.log('[Excel Parser] Sheet names in file:', workbook.SheetNames);
    const layout = detectExcelLayout(workbook);
    console.log('[Excel Parser] Detected layout:', layout.layoutType, 'confidence:', layout.confidence);
    console.log('[Excel Parser] Sheet mapping:', layout.sheetMapping);

    if (layout.layoutType === 'unknown') {
      return {
        success: false,
        errors: [
          {
            code: 'EXCEL_UNKNOWN_LAYOUT',
            message:
              'Could not detect CbCR data structure in the Excel file. Please use the provided template or ensure your file has sheets with recognizable column headers.',
            suggestion:
              'Download our Excel template from the upload page and use it to structure your data.',
          },
        ],
      };
    }

    const isTemplate = layout.layoutType === 'template';

    // Extract header data
    let headerData: Record<string, string | number | null> = {};
    if (layout.sheetMapping.header) {
      const headerSheet = workbook.Sheets[layout.sheetMapping.header];
      headerData = extractTemplateHeader(headerSheet);
    } else {
      warnings.push(
        'No header sheet found. Message metadata will use default values.'
      );
    }

    // Extract summary rows
    let summaryRows: ExcelSummaryRow[] = [];
    if (layout.sheetMapping.summary) {
      const summarySheet = workbook.Sheets[layout.sheetMapping.summary];
      summaryRows = extractSummaryRows(summarySheet, isTemplate, warnings);

      if (summaryRows.length === 0) {
        warnings.push(
          `Summary sheet "${layout.sheetMapping.summary}" contains no valid data rows.`
        );
      }
    } else {
      errors.push({
        code: 'EXCEL_NO_SUMMARY',
        message: 'No summary/Table 1 sheet found in the Excel file',
        suggestion:
          'Ensure your file has a sheet with jurisdiction-level financial data.',
      });
    }

    // Extract entity rows
    let entityRows: ExcelEntityRow[] = [];
    if (layout.sheetMapping.entities) {
      const entitiesSheet = workbook.Sheets[layout.sheetMapping.entities];
      entityRows = extractEntityRows(entitiesSheet, isTemplate);

      if (entityRows.length === 0) {
        warnings.push(
          `Entities sheet "${layout.sheetMapping.entities}" contains no valid data rows.`
        );
      }
    } else {
      warnings.push(
        'No entities/Table 2 sheet found. Entity details will be empty.'
      );
    }

    // Extract additional info
    let additionalInfoRows: ExcelAdditionalInfoRow[] | undefined;
    if (layout.sheetMapping.additionalInfo) {
      const additionalInfoSheet =
        workbook.Sheets[layout.sheetMapping.additionalInfo];
      additionalInfoRows = extractAdditionalInfoRows(
        additionalInfoSheet,
        isTemplate
      );
    }

    // Get currency from header or default
    const currency = parseString(headerData.currency) || 'EUR';

    // If we have critical errors, fail
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Return parsed data
    const parsedData: ExcelParsedData = {
      layout,
      headerData,
      summaryRows,
      entityRows,
      additionalInfoRows,
      currency,
    };

    return { success: true, data: parsedData, warnings };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      errors: [
        {
          code: 'EXCEL_PARSE_ERROR',
          message: `Failed to parse Excel file: ${errorMessage}`,
        },
      ],
    };
  }
}

/**
 * Validate Excel structure before full parsing
 * Returns quick validation without extracting all data
 */
export function validateExcelStructure(
  buffer: ArrayBuffer
): { valid: boolean; layout: ExcelLayoutInfo; errors: string[] } {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const layout = detectExcelLayout(workbook);

    const errors: string[] = [];

    if (layout.layoutType === 'unknown') {
      errors.push('Could not detect CbCR data structure');
    }

    if (!layout.sheetMapping.summary) {
      errors.push('No summary/Table 1 sheet detected');
    }

    return {
      valid: errors.length === 0,
      layout,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      layout: {
        layoutType: 'unknown',
        sheetNames: [],
        sheetMapping: {},
      },
      errors: ['Failed to read Excel file'],
    };
  }
}
