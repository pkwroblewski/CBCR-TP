/**
 * XML Parsers Module
 *
 * Provides secure XML parsing and transformation utilities for CbCR files.
 *
 * @module lib/parsers
 *
 * @example
 * ```typescript
 * import { parseAndTransform, validateXmlWellformedness } from '@/lib/parsers';
 *
 * // Validate XML first
 * const validationResults = validateXmlWellformedness(xmlContent);
 * if (validationResults.some(r => r.severity === 'critical')) {
 *   // Handle errors
 * }
 *
 * // Parse and transform to typed structure
 * const result = parseAndTransform(xmlContent, 'report.xml', fileSize);
 * if (result.success) {
 *   console.log(result.data.message.messageSpec.messageRefId);
 * }
 * ```
 */

// XML Parser exports
export {
  parseXmlString,
  parseXmlToObject,
  validateXmlWellformedness,
  extractNamespaces,
  detectEncoding,
  getXPathValue,
  createSecureParser,
  type ParseResult,
  type ParseError,
  type NamespaceInfo,
  type EncodingInfo,
} from './xml-parser';

// XML Transformer exports
export {
  transformXmlToCbcReport,
  transformToCbcMessage,
  extractReportMetadata,
  type TransformResult,
} from './xml-transformer';

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import { parseXmlString, validateXmlWellformedness, type ParseResult } from './xml-parser';
import { transformXmlToCbcReport, type TransformResult } from './xml-transformer';
import type { ParsedCbcReport } from '@/types/cbcr';
import { ValidationResult, ValidationSeverity } from '@/types/validation';

/**
 * Combined result type for full parsing pipeline
 */
export type FullParseResult =
  | {
      success: true;
      data: ParsedCbcReport;
      validationResults: ValidationResult[];
    }
  | {
      success: false;
      validationResults: ValidationResult[];
    };

/**
 * Parse and transform XML in one step
 *
 * This is a convenience function that:
 * 1. Validates XML well-formedness
 * 2. Parses the XML with XXE protection
 * 3. Transforms to typed CbcReport structure
 * 4. Returns all validation findings
 *
 * @param xmlContent - Raw XML string content
 * @param fileName - Original file name (for metadata)
 * @param fileSize - File size in bytes (for metadata)
 * @returns FullParseResult with typed data and all validation results
 */
export function parseAndTransform(
  xmlContent: string,
  fileName: string = 'unknown.xml',
  fileSize?: number
): FullParseResult {
  // Validate XML well-formedness
  const wellformednessResults = validateXmlWellformedness(xmlContent);
  
  // Check for critical well-formedness errors
  const criticalWellformedness = wellformednessResults.filter(
    (r) => r.severity === ValidationSeverity.CRITICAL
  );
  
  if (criticalWellformedness.length > 0) {
    return {
      success: false,
      validationResults: wellformednessResults,
    };
  }
  
  // Transform to typed structure
  const transformResult = transformXmlToCbcReport(xmlContent, fileName, fileSize);
  
  if (!transformResult.success) {
    return {
      success: false,
      validationResults: [...wellformednessResults, ...transformResult.errors],
    };
  }
  
  return {
    success: true,
    data: transformResult.data,
    validationResults: [...wellformednessResults, ...transformResult.warnings],
  };
}

/**
 * Quick validation check without full parsing
 *
 * Use this for rapid feedback during file upload
 *
 * @param xmlContent - Raw XML string content
 * @returns Object with validity status and critical errors
 */
export function quickValidate(xmlContent: string): {
  isValid: boolean;
  criticalErrors: ValidationResult[];
  warningCount: number;
} {
  const results = validateXmlWellformedness(xmlContent);
  const criticalErrors = results.filter((r) => r.severity === ValidationSeverity.CRITICAL);
  const warnings = results.filter((r) => r.severity === ValidationSeverity.WARNING);
  
  return {
    isValid: criticalErrors.length === 0,
    criticalErrors,
    warningCount: warnings.length,
  };
}

/**
 * Extract basic info from XML without full parsing
 *
 * Useful for displaying file info before full validation
 *
 * @param xmlContent - Raw XML string content
 * @returns Basic file information or null if extraction fails
 */
export function extractBasicInfo(xmlContent: string): {
  messageRefId?: string;
  reportingPeriod?: string;
  sendingAuthority?: string;
  receivingAuthority?: string;
  messageType?: string;
} | null {
  try {
    // Simple regex extraction for speed
    const messageRefIdMatch = xmlContent.match(/<MessageRefId>([^<]+)<\/MessageRefId>/);
    const reportingPeriodMatch = xmlContent.match(/<ReportingPeriod>([^<]+)<\/ReportingPeriod>/);
    const sendingMatch = xmlContent.match(/<SendingCompetentAuthority>([^<]+)<\/SendingCompetentAuthority>/);
    const receivingMatch = xmlContent.match(/<ReceivingCompetentAuthority>([^<]+)<\/ReceivingCompetentAuthority>/);
    const messageTypeMatch = xmlContent.match(/<MessageType>([^<]+)<\/MessageType>/);
    
    return {
      messageRefId: messageRefIdMatch?.[1]?.trim(),
      reportingPeriod: reportingPeriodMatch?.[1]?.trim(),
      sendingAuthority: sendingMatch?.[1]?.trim(),
      receivingAuthority: receivingMatch?.[1]?.trim(),
      messageType: messageTypeMatch?.[1]?.trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Count jurisdictions and entities in XML without full parsing
 *
 * @param xmlContent - Raw XML string content
 * @returns Counts of jurisdictions and entities
 */
export function countElements(xmlContent: string): {
  jurisdictionCount: number;
  entityCount: number;
  additionalInfoCount: number;
} {
  const jurisdictionMatches = xmlContent.match(/<CbcReports[^>]*>/g);
  const entityMatches = xmlContent.match(/<ConstituentEntity[^>]*>/g);
  const additionalInfoMatches = xmlContent.match(/<AdditionalInfo[^>]*>/g);
  
  return {
    jurisdictionCount: jurisdictionMatches?.length ?? 0,
    entityCount: entityMatches?.length ?? 0,
    additionalInfoCount: additionalInfoMatches?.length ?? 0,
  };
}

