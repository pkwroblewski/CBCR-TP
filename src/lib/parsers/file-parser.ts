/**
 * Unified File Parser
 *
 * Orchestrates parsing of CbCR files based on file type.
 * Supports XML, Excel (.xlsx), and CSV (via ZIP) formats.
 *
 * @module lib/parsers/file-parser
 */

import type { ParsedCbcReport } from '@/types/cbcr';
import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import {
  type SupportedFileType,
  type FileParseResult,
  type FileParseError,
  type FilePreviewInfo,
  ACCEPTED_MIME_TYPES,
  ACCEPTED_EXTENSIONS,
} from '@/types/file-upload';

// Import parsers
import { parseXmlString, parseXmlToObject } from './xml-parser';
import { transformXmlToCbcReport } from './xml-transformer';
import { parseExcelFile, detectExcelLayout } from './excel-parser';
import { transformExcelToCbcReport } from './excel-transformer';
import { parseCsvZip } from './csv-parser';
import { transformCsvToCbcReport } from './csv-transformer';

// =============================================================================
// FILE TYPE DETECTION
// =============================================================================

/**
 * Detect file type from file name and MIME type
 *
 * @param fileName - Original file name
 * @param mimeType - MIME type (if available)
 * @returns Detected file type or null if unsupported
 */
export function detectFileType(
  fileName: string,
  mimeType?: string
): SupportedFileType | null {
  const extension = fileName.toLowerCase().split('.').pop() || '';

  // Check by extension first
  if (extension === 'xml') {
    return 'xml';
  }

  if (extension === 'xlsx') {
    return 'xlsx';
  }

  if (extension === 'zip') {
    return 'csv-zip';
  }

  // Fallback to MIME type
  if (mimeType) {
    if (ACCEPTED_MIME_TYPES.xml.includes(mimeType)) {
      return 'xml';
    }

    if (ACCEPTED_MIME_TYPES.xlsx.includes(mimeType)) {
      return 'xlsx';
    }

    if (ACCEPTED_MIME_TYPES['csv-zip'].includes(mimeType)) {
      return 'csv-zip';
    }
  }

  return null;
}

/**
 * Check if a file type is supported
 */
export function isFileTypeSupported(fileName: string, mimeType?: string): boolean {
  return detectFileType(fileName, mimeType) !== null;
}

/**
 * Get accepted file extensions as a string for input accept attribute
 */
export function getAcceptedFileTypes(): string {
  const extensions = [
    ...ACCEPTED_EXTENSIONS.xml,
    ...ACCEPTED_EXTENSIONS.xlsx,
    ...ACCEPTED_EXTENSIONS['csv-zip'],
  ];

  const mimeTypes = [
    ...ACCEPTED_MIME_TYPES.xml,
    ...ACCEPTED_MIME_TYPES.xlsx,
    ...ACCEPTED_MIME_TYPES['csv-zip'],
  ];

  return [...extensions, ...mimeTypes].join(',');
}

// =============================================================================
// FILE PREVIEW
// =============================================================================

/**
 * Get preview information from a file without full parsing
 */
export async function getFilePreview(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType?: string
): Promise<FilePreviewInfo | null> {
  const fileType = detectFileType(fileName, mimeType);

  if (!fileType) {
    return null;
  }

  const preview: FilePreviewInfo = {
    fileType,
    fileName,
    fileSize: buffer.byteLength,
  };

  try {
    switch (fileType) {
      case 'xml': {
        // Quick peek at XML structure
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer.slice(0, 2000));
        const rootMatch = text.match(/<([a-zA-Z_][\w\-.:]*)[>\s]/);
        if (rootMatch) {
          preview.rootElement = rootMatch[1];
        }
        const nsMatch = text.match(/xmlns(?::[a-z]+)?="([^"]+)"/);
        if (nsMatch) {
          preview.namespace = nsMatch[1];
        }
        break;
      }

      case 'xlsx': {
        // Read Excel structure
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(buffer, { type: 'array' });
        preview.sheetCount = workbook.SheetNames.length;
        preview.sheetNames = workbook.SheetNames;
        const layout = detectExcelLayout(workbook);
        preview.excelLayout = layout.layoutType;
        break;
      }

      case 'csv-zip': {
        // List CSV files in ZIP
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(buffer);
        const csvFiles = Object.keys(zip.files).filter(
          (name) => name.toLowerCase().endsWith('.csv') && !zip.files[name].dir
        );
        preview.csvFileCount = csvFiles.length;
        preview.csvFileNames = csvFiles;
        break;
      }
    }
  } catch {
    // Ignore errors in preview - just return basic info
  }

  return preview;
}

// =============================================================================
// MAIN PARSER
// =============================================================================

/**
 * Parse a file and return a ParsedCbcReport
 *
 * This is the main entry point for file parsing. It:
 * 1. Detects the file type
 * 2. Routes to the appropriate parser
 * 3. Transforms the parsed data to ParsedCbcReport
 *
 * @param buffer - File content as ArrayBuffer
 * @param fileName - Original file name
 * @param fileSize - File size in bytes
 * @param mimeType - MIME type (optional, used for detection)
 * @returns FileParseResult with ParsedCbcReport or errors
 */
export async function parseFile(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize?: number,
  mimeType?: string
): Promise<FileParseResult> {
  const actualFileSize = fileSize ?? buffer.byteLength;
  const fileType = detectFileType(fileName, mimeType);

  if (!fileType) {
    const extension = fileName.split('.').pop() || 'unknown';
    return {
      success: false,
      fileType: 'xml', // Default for error case
      errors: [
        {
          code: 'UNSUPPORTED_FILE_TYPE',
          message: `Unsupported file type: .${extension}`,
          suggestion: 'Please upload an XML (.xml), Excel (.xlsx), or CSV ZIP (.zip) file',
        },
      ],
    };
  }

  try {
    switch (fileType) {
      case 'xml':
        return await parseXmlFile(buffer, fileName, actualFileSize);

      case 'xlsx':
        return parseExcelFileToReport(buffer, fileName, actualFileSize);

      case 'csv-zip':
        return await parseCsvFileToReport(buffer, fileName, actualFileSize);

      default:
        return {
          success: false,
          fileType,
          errors: [
            {
              code: 'UNKNOWN_FILE_TYPE',
              message: `Unknown file type: ${fileType}`,
            },
          ],
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      fileType,
      errors: [
        {
          code: 'PARSE_ERROR',
          message: `Failed to parse file: ${errorMessage}`,
        },
      ],
    };
  }
}

// =============================================================================
// FILE TYPE SPECIFIC PARSERS
// =============================================================================

/**
 * Parse an XML file
 */
async function parseXmlFile(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<FileParseResult> {
  // Decode buffer to string
  const decoder = new TextDecoder('utf-8');
  const xmlContent = decoder.decode(buffer);

  // Parse XML string
  const parseResult = parseXmlString(xmlContent, fileName, fileSize);

  if (!parseResult.success) {
    return {
      success: false,
      fileType: 'xml',
      errors: [
        {
          code: parseResult.error.code,
          message: parseResult.error.message,
          location: parseResult.error.line
            ? `Line ${parseResult.error.line}, Column ${parseResult.error.column}`
            : undefined,
        },
      ],
    };
  }

  return {
    success: true,
    fileType: 'xml',
    report: parseResult.data,
    warnings: parseResult.data.parsingWarnings,
  };
}

/**
 * Parse an Excel file and transform to ParsedCbcReport
 */
function parseExcelFileToReport(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): FileParseResult {
  // Parse Excel file
  const parseResult = parseExcelFile(buffer, fileName);

  if (!parseResult.success) {
    return {
      success: false,
      fileType: 'xlsx',
      errors: parseResult.errors,
    };
  }

  // Transform to ParsedCbcReport
  const transformResult = transformExcelToCbcReport(
    parseResult.data,
    fileName,
    fileSize
  );

  if (!transformResult.success) {
    return {
      success: false,
      fileType: 'xlsx',
      errors: transformResult.errors.map((e) => ({
        code: e.ruleId,
        message: e.message,
        location: e.xpath,
      })),
    };
  }

  return {
    success: true,
    fileType: 'xlsx',
    report: transformResult.data,
    warnings: [
      ...parseResult.warnings,
      ...transformResult.warnings.map((w) => w.message),
    ],
  };
}

/**
 * Parse a CSV ZIP file and transform to ParsedCbcReport
 */
async function parseCsvFileToReport(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<FileParseResult> {
  // Parse CSV ZIP file
  const parseResult = await parseCsvZip(buffer, fileName);

  if (!parseResult.success) {
    return {
      success: false,
      fileType: 'csv-zip',
      errors: parseResult.errors,
    };
  }

  // Transform to ParsedCbcReport
  const transformResult = transformCsvToCbcReport(
    parseResult.data,
    fileName,
    fileSize
  );

  if (!transformResult.success) {
    return {
      success: false,
      fileType: 'csv-zip',
      errors: transformResult.errors.map((e) => ({
        code: e.ruleId,
        message: e.message,
        location: e.xpath,
      })),
    };
  }

  return {
    success: true,
    fileType: 'csv-zip',
    report: transformResult.data,
    warnings: [
      ...parseResult.warnings,
      ...transformResult.warnings.map((w) => w.message),
    ],
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Re-export types
  type SupportedFileType,
  type FileParseResult,
  type FileParseError,
  type FilePreviewInfo,
};
