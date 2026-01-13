/**
 * CSV to TypeScript Transformer
 *
 * Transforms parsed CSV data into strongly-typed CbC Report interfaces.
 * Reuses the Excel transformer since CSV parsing produces the same
 * intermediate data structures.
 *
 * @module lib/parsers/csv-transformer
 */

import type { ParsedCbcReport } from '@/types/cbcr';
import { ValidationResult } from '@/types/validation';
import type { CsvParsedData, ExcelParsedData } from '@/types/file-upload';
import { transformExcelToCbcReport, type TransformResult } from './excel-transformer';

// =============================================================================
// MAIN TRANSFORMER
// =============================================================================

/**
 * Transform CSV parsed data to ParsedCbcReport
 *
 * Since the CSV parser produces the same intermediate format as the Excel parser
 * (ExcelSummaryRow, ExcelEntityRow, etc.), we convert to ExcelParsedData and
 * reuse the Excel transformer.
 *
 * @param csvData - Parsed CSV data from csv-parser
 * @param fileName - Original file name
 * @param fileSize - File size in bytes
 * @returns TransformResult with ParsedCbcReport or errors
 */
export function transformCsvToCbcReport(
  csvData: CsvParsedData,
  fileName: string,
  fileSize: number = 0
): TransformResult {
  // Convert CsvParsedData to ExcelParsedData format
  // The structures are compatible since CSV parser reuses the same row types
  const excelData: ExcelParsedData = {
    layout: {
      layoutType: 'template', // CSV is always considered a known layout
      sheetNames: Object.keys(csvData.files).filter((k) => csvData.files[k as keyof typeof csvData.files]),
      sheetMapping: {
        header: csvData.files.header ? 'header.csv' : undefined,
        summary: csvData.files.table1 ? 'table1.csv' : undefined,
        entities: csvData.files.table2 ? 'table2.csv' : undefined,
        additionalInfo: csvData.files.additional ? 'additional.csv' : undefined,
      },
      confidence: 100,
    },
    headerData: csvData.headerData,
    summaryRows: csvData.summaryRows,
    entityRows: csvData.entityRows,
    additionalInfoRows: csvData.additionalInfoRows,
    currency: csvData.currency,
  };

  // Use Excel transformer
  return transformExcelToCbcReport(excelData, fileName, fileSize);
}

// Re-export types for convenience
export type { TransformResult };
