/**
 * Excel Template Generator for CbCR Reports
 * Generates a structured Excel workbook template for CbCR data input
 *
 * @module lib/templates/excel-template
 */

import * as XLSX from 'xlsx';
import {
  BUSINESS_ACTIVITY_CODES,
  type TemplateSheetConfig,
} from '@/types/file-upload';
import { COUNTRY_CODES } from '@/constants/countries';

// =============================================================================
// TEMPLATE CONFIGURATION
// =============================================================================

/**
 * Configuration for the Header sheet
 */
const HEADER_SHEET_CONFIG: TemplateSheetConfig = {
  name: 'Header',
  headers: ['Field', 'Value', 'Description', 'Required'],
  columnWidths: [30, 30, 50, 10],
  sampleData: [
    ['Sending Authority', 'LU', 'ISO 3166-1 Alpha-2 country code of the sending jurisdiction', 'Yes'],
    ['Receiving Authority', 'LU', 'ISO 3166-1 Alpha-2 country code of the receiving jurisdiction', 'Yes'],
    ['Message Type', 'CBC401', 'CBC401 (primary filing) or CBC402 (exchange filing)', 'Yes'],
    ['Message Ref ID', '', 'Unique identifier for this submission (e.g., LU2024CBC001)', 'Yes'],
    ['Message Type Indic', 'CBC701', 'CBC701 (new submission) or CBC702 (correction)', 'Yes'],
    ['Reporting Period', '2023-12-31', 'Fiscal year end date (YYYY-MM-DD format)', 'Yes'],
    ['UPE Name', '', 'Name of the Ultimate Parent Entity', 'Yes'],
    ['UPE TIN', '', 'Tax Identification Number of the UPE', 'No'],
    ['UPE TIN Country', '', 'Country that issued the UPE TIN (ISO 3166-1 Alpha-2)', 'No'],
    ['Currency', 'EUR', 'ISO 4217 currency code for all monetary amounts', 'Yes'],
    ['Language', 'EN', 'ISO 639-1 language code (e.g., EN, FR, DE)', 'No'],
    ['Contact Name', '', 'Name of contact person for queries', 'No'],
    ['Contact Phone', '', 'Phone number of contact person', 'No'],
    ['Contact Email', '', 'Email address of contact person', 'No'],
  ],
};

/**
 * Configuration for the Table 1 Summary sheet
 */
const SUMMARY_SHEET_CONFIG: TemplateSheetConfig = {
  name: 'Table1_Summary',
  headers: [
    'Jurisdiction',
    'Unrelated Revenue',
    'Related Revenue',
    'Total Revenue',
    'Profit/Loss',
    'Tax Paid',
    'Tax Accrued',
    'Capital',
    'Accumulated Earnings',
    'Employees',
    'Tangible Assets',
  ],
  descriptions: [
    'ISO 3166-1 Alpha-2',
    'Revenue from unrelated parties',
    'Revenue from related parties',
    'Sum of revenues',
    'Profit or loss before tax',
    'Income tax paid (cash)',
    'Income tax accrued (current year)',
    'Stated capital',
    'Accumulated earnings',
    'Number of employees (FTE)',
    'Tangible assets (PP&E)',
  ],
  columnWidths: [15, 18, 18, 18, 18, 18, 18, 18, 20, 12, 18],
  sampleData: [
    ['LU', 50000000, 5000000, 55000000, 8000000, 2000000, 2100000, 25000000, 15000000, 150, 100000000],
    ['DE', 120000000, 15000000, 135000000, 18000000, 5400000, 5500000, 45000000, 30000000, 450, 200000000],
  ],
};

/**
 * Configuration for the Table 2 Entities sheet
 */
const ENTITIES_SHEET_CONFIG: TemplateSheetConfig = {
  name: 'Table2_Entities',
  headers: [
    'Entity Name',
    'TIN',
    'TIN Issued By',
    'Jurisdiction',
    'Inc. Country',
    'Address',
    'Activities',
    'Role',
    'Other Info',
  ],
  descriptions: [
    'Legal name of the entity',
    'Tax identification number',
    'Country that issued TIN',
    'Tax residence country',
    'Country of incorporation (if different)',
    'Entity address',
    'Activity codes (comma-separated)',
    'CBC801=UPE, CBC802=SPE, CBC803=Other, CBC804=None',
    'Additional information',
  ],
  columnWidths: [35, 20, 15, 15, 15, 40, 25, 10, 30],
  sampleData: [
    ['Acme Holdings S.à r.l.', '12345678901234567', 'LU', 'LU', 'LU', '42 Boulevard Royal, L-2449 Luxembourg', 'CBC501,CBC505', 'CBC801', ''],
    ['Acme GmbH', 'DE123456789', 'DE', 'DE', 'DE', 'Hauptstraße 1, 10115 Berlin', 'CBC504,CBC505', '', ''],
  ],
};

/**
 * Configuration for the Additional Info sheet
 */
const ADDITIONAL_INFO_SHEET_CONFIG: TemplateSheetConfig = {
  name: 'AdditionalInfo',
  headers: ['Country Codes', 'Language', 'Notes'],
  descriptions: [
    'Comma-separated country codes this info applies to (leave blank for all)',
    'ISO 639-1 language code',
    'Additional explanatory information',
  ],
  columnWidths: [20, 15, 80],
  sampleData: [
    ['', 'EN', 'This CbCR report covers the fiscal year ended December 31, 2023.'],
  ],
};

/**
 * Configuration for the Reference sheet (codes and valid values)
 */
const REFERENCE_SHEET_CONFIG: TemplateSheetConfig = {
  name: 'Reference',
  headers: ['Category', 'Code', 'Description'],
  columnWidths: [25, 15, 50],
  sampleData: [
    ['Message Type', 'CBC401', 'Primary filing to jurisdiction of tax residence'],
    ['Message Type', 'CBC402', 'Filing to other jurisdictions'],
    ['Message Type Indic', 'CBC701', 'New data (original submission)'],
    ['Message Type Indic', 'CBC702', 'Corrected data (amendments)'],
    ['Entity Role', 'CBC801', 'Ultimate Parent Entity'],
    ['Entity Role', 'CBC802', 'Surrogate Parent Entity'],
    ['Entity Role', 'CBC803', 'Other (local filing)'],
    ['Entity Role', 'CBC804', 'None specified'],
    ['', '', ''],
    ['Business Activities', '', ''],
    ...Object.entries(BUSINESS_ACTIVITY_CODES).map(([code, desc]) => ['Activity', code, desc]),
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a worksheet from configuration
 */
function createSheet(config: TemplateSheetConfig): XLSX.WorkSheet {
  const data: (string | number | null)[][] = [];

  // Add headers row
  data.push(config.headers);

  // Add descriptions row if present
  if (config.descriptions) {
    data.push(config.descriptions);
  }

  // Add sample data
  if (config.sampleData) {
    data.push(...config.sampleData);
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  if (config.columnWidths) {
    ws['!cols'] = config.columnWidths.map((w) => ({ wch: w }));
  }

  return ws;
}

/**
 * Create a worksheet with country codes reference
 */
function createCountryCodesSheet(): XLSX.WorkSheet {
  const data: (string | null)[][] = [
    ['Code', 'Country Name'],
  ];

  // Add all country codes
  Object.entries(COUNTRY_CODES).forEach(([code, name]) => {
    data.push([code, name]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 10 }, { wch: 40 }];

  return ws;
}

/**
 * Apply styling to header rows (best effort - xlsx library has limited styling support)
 */
function applyHeaderStyle(ws: XLSX.WorkSheet, headerRow: number = 0): void {
  // Note: Full styling requires xlsx-style or similar library
  // For now, we set basic properties that some Excel readers respect
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: col });
    if (ws[cellRef]) {
      // Mark as header (some readers use this)
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E0E0E0' } },
      };
    }
  }
}

// =============================================================================
// MAIN TEMPLATE GENERATOR
// =============================================================================

/**
 * Generate a complete CbCR Excel template workbook
 *
 * @returns XLSX WorkBook object ready for export
 */
export function generateCbcrTemplate(): XLSX.WorkBook {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create and add sheets in order
  const headerSheet = createSheet(HEADER_SHEET_CONFIG);
  applyHeaderStyle(headerSheet);
  XLSX.utils.book_append_sheet(wb, headerSheet, HEADER_SHEET_CONFIG.name);

  const summarySheet = createSheet(SUMMARY_SHEET_CONFIG);
  applyHeaderStyle(summarySheet);
  XLSX.utils.book_append_sheet(wb, summarySheet, SUMMARY_SHEET_CONFIG.name);

  const entitiesSheet = createSheet(ENTITIES_SHEET_CONFIG);
  applyHeaderStyle(entitiesSheet);
  XLSX.utils.book_append_sheet(wb, entitiesSheet, ENTITIES_SHEET_CONFIG.name);

  const additionalInfoSheet = createSheet(ADDITIONAL_INFO_SHEET_CONFIG);
  applyHeaderStyle(additionalInfoSheet);
  XLSX.utils.book_append_sheet(wb, additionalInfoSheet, ADDITIONAL_INFO_SHEET_CONFIG.name);

  const referenceSheet = createSheet(REFERENCE_SHEET_CONFIG);
  applyHeaderStyle(referenceSheet);
  XLSX.utils.book_append_sheet(wb, referenceSheet, REFERENCE_SHEET_CONFIG.name);

  const countryCodesSheet = createCountryCodesSheet();
  applyHeaderStyle(countryCodesSheet);
  XLSX.utils.book_append_sheet(wb, countryCodesSheet, 'CountryCodes');

  return wb;
}

/**
 * Generate Excel template and return as Buffer
 *
 * @returns Buffer containing the Excel file
 */
export function generateCbcrTemplateBuffer(): Buffer {
  const wb = generateCbcrTemplate();
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

/**
 * Generate Excel template and return as Uint8Array (for browser)
 *
 * @returns Uint8Array containing the Excel file
 */
export function generateCbcrTemplateArray(): Uint8Array {
  const wb = generateCbcrTemplate();
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

// =============================================================================
// TEMPLATE METADATA
// =============================================================================

/**
 * Metadata about the template for display purposes
 */
export const TEMPLATE_METADATA = {
  name: 'CbCR Report Template',
  version: '1.0',
  sheets: [
    { name: 'Header', description: 'Message envelope and UPE information' },
    { name: 'Table1_Summary', description: 'Aggregate financial data per jurisdiction' },
    { name: 'Table2_Entities', description: 'Constituent entity details' },
    { name: 'AdditionalInfo', description: 'Optional explanatory notes' },
    { name: 'Reference', description: 'Valid codes and their meanings' },
    { name: 'CountryCodes', description: 'ISO 3166-1 Alpha-2 country codes' },
  ],
  instructions: [
    'Fill in the Header sheet with submission metadata and UPE information',
    'Add one row per jurisdiction in Table1_Summary with aggregate financial data',
    'Add one row per constituent entity in Table2_Entities',
    'Use the Reference and CountryCodes sheets for valid code values',
    'Delete the sample data rows before uploading',
    'All monetary amounts should be in the currency specified in the Header',
  ],
};
