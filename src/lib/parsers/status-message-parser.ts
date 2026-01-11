/**
 * CbCR Status Message Parser
 *
 * Parses CbC Status Message XML files received from tax authorities
 * after CbCR file submission. Based on OECD CbcStatusMessageXML_v2.0.xsd schema.
 *
 * @module lib/parsers/status-message-parser
 */

import { XMLParser } from 'fast-xml-parser';
import type {
  CbcStatusMessage,
  StatusMessageSpec,
  FileError,
  RecordError,
  ValidationErrors,
  StatusValidationResult,
  StatusMessageParseResult,
  FileErrorCode,
  RecordErrorCode,
} from '@/types/status-message';

// =============================================================================
// PARSER CONFIGURATION
// =============================================================================

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  removeNSPrefix: true, // Remove namespace prefixes
};

// =============================================================================
// STATUS MESSAGE PARSER CLASS
// =============================================================================

/**
 * Parser for CbC Status Message XML files
 *
 * @example
 * ```typescript
 * const parser = new StatusMessageParser();
 * const result = parser.parse(xmlContent);
 *
 * if (result.success && result.statusMessage) {
 *   if (result.statusMessage.validationResult.status === 'Rejected') {
 *     console.log('Submission rejected with errors:');
 *     for (const error of result.statusMessage.validationErrors.fileErrors) {
 *       console.log(`  - ${error.errorCode}: ${error.message}`);
 *     }
 *   }
 * }
 * ```
 */
export class StatusMessageParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser(parserOptions);
  }

  /**
   * Parse a status message XML string
   *
   * @param xmlContent - Raw XML content of the status message
   * @returns Parsed status message or error
   */
  parse(xmlContent: string): StatusMessageParseResult {
    try {
      const parsed = this.parser.parse(xmlContent);

      // Find the root element (might be prefixed)
      const root = parsed.CbCStatusMessage_OECD || parsed['stm:CbCStatusMessage_OECD'];

      if (!root) {
        return {
          success: false,
          error: 'Invalid status message: missing root element CbCStatusMessage_OECD',
          rawXml: xmlContent,
        };
      }

      // Parse MessageSpec
      const messageSpec = this.parseMessageSpec(root.MessageSpec);

      // Parse original message reference
      const originalMessage = this.parseOriginalMessage(root.CbCStatusMessage);

      // Parse validation errors
      const validationErrors = this.parseValidationErrors(root.CbCStatusMessage?.ValidationErrors);

      // Parse validation result
      const validationResult = this.parseValidationResult(root.CbCStatusMessage?.ValidationResult);

      const statusMessage: CbcStatusMessage = {
        messageSpec,
        originalMessage,
        validationErrors,
        validationResult,
      };

      return {
        success: true,
        statusMessage,
        rawXml: xmlContent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        rawXml: xmlContent,
      };
    }
  }

  /**
   * Parse the MessageSpec element
   */
  private parseMessageSpec(messageSpec: Record<string, unknown>): StatusMessageSpec {
    return {
      messageRefId: String(messageSpec?.MessageRefId ?? ''),
      messageType: 'CbC',
      sendingCompetentAuthority: String(messageSpec?.SendingCompetentAuthority ?? ''),
      receivingCompetentAuthority: String(messageSpec?.ReceivingCompetentAuthority ?? ''),
      timestamp: String(messageSpec?.Timestamp ?? ''),
    };
  }

  /**
   * Parse the original message reference
   */
  private parseOriginalMessage(cbcStatusMessage: Record<string, unknown>): {
    originalMessageRefId: string;
    fileMetaData?: Record<string, unknown>;
  } {
    const originalMessage = cbcStatusMessage?.OriginalMessage as Record<string, unknown>;

    return {
      originalMessageRefId: String(originalMessage?.OriginalMessageRefId ?? ''),
      fileMetaData: originalMessage?.FileMetaData as Record<string, unknown> | undefined,
    };
  }

  /**
   * Parse validation errors
   */
  private parseValidationErrors(validationErrors: Record<string, unknown> | undefined): ValidationErrors {
    const result: ValidationErrors = {
      fileErrors: [],
      recordErrors: [],
    };

    if (!validationErrors) {
      return result;
    }

    // Parse file errors
    const fileErrors = validationErrors.FileError;
    if (fileErrors) {
      const errorArray = Array.isArray(fileErrors) ? fileErrors : [fileErrors];
      for (const error of errorArray) {
        result.fileErrors.push(this.parseFileError(error));
      }
    }

    // Parse record errors
    const recordErrors = validationErrors.RecordError;
    if (recordErrors) {
      const errorArray = Array.isArray(recordErrors) ? recordErrors : [recordErrors];
      for (const error of errorArray) {
        result.recordErrors.push(this.parseRecordError(error));
      }
    }

    return result;
  }

  /**
   * Parse a single file error
   */
  private parseFileError(error: Record<string, unknown>): FileError {
    return {
      errorCode: (error.Code ?? error['@_code'] ?? 50000) as FileErrorCode,
      message: String(error.Message ?? error.Details ?? 'Unknown error'),
      details: error.Details ? String(error.Details) : undefined,
      xpath: error.XPath ? String(error.XPath) : undefined,
    };
  }

  /**
   * Parse a single record error
   */
  private parseRecordError(error: Record<string, unknown>): RecordError {
    return {
      errorCode: (error.Code ?? error['@_code'] ?? 80000) as RecordErrorCode,
      message: String(error.Message ?? error.Details ?? 'Unknown error'),
      docRefId: error.DocRefId ? String(error.DocRefId) : undefined,
      details: error.Details ? String(error.Details) : undefined,
      xpath: error.XPath ? String(error.XPath) : undefined,
    };
  }

  /**
   * Parse validation result
   */
  private parseValidationResult(validationResult: Record<string, unknown> | undefined): StatusValidationResult {
    if (!validationResult) {
      return {
        status: 'Rejected',
        validatedBy: [],
      };
    }

    let status = validationResult.Status ?? validationResult['@_status'];
    if (typeof status === 'string') {
      status = status as 'Accepted' | 'Rejected' | 'PartiallyAccepted';
    } else {
      status = 'Rejected';
    }

    let validatedBy: string[] = [];
    const validators = validationResult.ValidatedBy;
    if (validators) {
      validatedBy = Array.isArray(validators) ? validators.map(String) : [String(validators)];
    }

    return {
      status: status as 'Accepted' | 'Rejected' | 'PartiallyAccepted',
      validatedBy,
      validationTimestamp: validationResult.Timestamp ? String(validationResult.Timestamp) : undefined,
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Parse a status message XML string
 *
 * @param xmlContent - Raw XML content
 * @returns Parsed status message result
 */
export function parseStatusMessage(xmlContent: string): StatusMessageParseResult {
  const parser = new StatusMessageParser();
  return parser.parse(xmlContent);
}

/**
 * Check if XML content is a status message
 *
 * @param xmlContent - Raw XML content
 * @returns True if the content appears to be a CbC status message
 */
export function isStatusMessage(xmlContent: string): boolean {
  return xmlContent.includes('CbCStatusMessage_OECD') || xmlContent.includes('CbCStatusMessage');
}

/**
 * Create a summary string from a status message
 *
 * @param statusMessage - The parsed status message
 * @returns Human-readable summary
 */
export function formatStatusMessageSummary(statusMessage: CbcStatusMessage): string {
  const { validationResult, validationErrors } = statusMessage;
  const fileErrorCount = validationErrors.fileErrors.length;
  const recordErrorCount = validationErrors.recordErrors.length;
  const totalErrors = fileErrorCount + recordErrorCount;

  const lines: string[] = [];

  lines.push(`Status: ${validationResult.status}`);
  lines.push(`Original Message: ${statusMessage.originalMessage.originalMessageRefId}`);

  if (totalErrors > 0) {
    lines.push(`Errors: ${totalErrors} (${fileErrorCount} file-level, ${recordErrorCount} record-level)`);

    if (fileErrorCount > 0) {
      lines.push('\nFile Errors:');
      for (const error of validationErrors.fileErrors) {
        lines.push(`  - [${error.errorCode}] ${error.message}`);
      }
    }

    if (recordErrorCount > 0) {
      lines.push('\nRecord Errors:');
      for (const error of validationErrors.recordErrors) {
        const docRef = error.docRefId ? ` (${error.docRefId})` : '';
        lines.push(`  - [${error.errorCode}]${docRef} ${error.message}`);
      }
    }
  } else {
    lines.push('No errors found');
  }

  if (validationResult.validatedBy.length > 0) {
    lines.push(`\nValidated by: ${validationResult.validatedBy.join(', ')}`);
  }

  return lines.join('\n');
}
