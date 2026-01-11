/**
 * CbCR Status Message Types
 *
 * Types for parsing and handling CbC Status Messages received from
 * tax authorities after CbCR file submission. Based on OECD
 * CbcStatusMessageXML_v2.0.xsd schema.
 *
 * @module types/status-message
 */

// =============================================================================
// ENUMERATIONS
// =============================================================================

/**
 * File-level error codes (50000 series)
 *
 * Based on OECD CbC Status Message schema file error types.
 */
export type FileErrorCode =
  | 50000  // General file error
  | 50001  // XML not well-formed
  | 50002  // XML not valid against schema
  | 50003  // Duplicate MessageRefId
  | 50004  // Unknown sender
  | 50005  // Missing MessageRefId
  | 50006  // Missing SendingCompetentAuthority
  | 50007  // Missing ReceivingCompetentAuthority
  | 50008  // Missing MessageType
  | 50009  // Invalid MessageType
  | 50010  // Missing ReportingPeriod
  | 50011  // Invalid ReportingPeriod
  | 50012  // Missing Timestamp
  | 50013  // Invalid encoding
  | 50014  // Invalid namespace
  | 50015; // Unmatched CorrMessageRefId

/**
 * Record-level error codes (80000 series)
 *
 * Based on OECD CbC Status Message schema record error types.
 */
export type RecordErrorCode =
  | 80000  // General record error
  | 80001  // Missing DocRefId
  | 80002  // Duplicate DocRefId
  | 80003  // Invalid DocTypeIndic
  | 80004  // Missing CorrDocRefId
  | 80005  // Missing CorrMessageRefId
  | 80006  // Unmatched CorrDocRefId
  | 80007  // Invalid DocRefId format
  | 80010  // Missing ReportingEntity
  | 80011  // Invalid ReportingRole
  | 80020  // Invalid CountryCode
  | 80021  // Invalid ResCountryCode
  | 80030  // Invalid BizActivityType
  | 80040  // Invalid NbEmployees
  | 80041  // Missing NbEmployees
  | 80042  // Invalid Revenue format
  | 80043  // Invalid Summary data
  | 80044  // Invalid ConstEntities
  | 80050  // Missing Name
  | 80051  // Missing Address
  | 80052  // Invalid TIN format
  | 80053  // Missing TIN
  | 80060  // Missing ReportingRole
  | 80061  // Invalid ReportingRole combination
  | 80070; // Missing mandatory element

/**
 * Validation status types
 */
export type ValidationStatus = 'Accepted' | 'Rejected' | 'PartiallyAccepted';

// =============================================================================
// FILE METADATA
// =============================================================================

/**
 * Metadata about the original submitted file
 */
export interface FileMetaData {
  /** Original filename (if available) */
  fileName?: string;
  /** File size in bytes */
  fileSize?: number;
  /** File hash/checksum */
  fileHash?: string;
  /** Hash algorithm used */
  hashAlgorithm?: 'MD5' | 'SHA256' | 'SHA1';
  /** Submission timestamp */
  submittedAt?: string;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * A file-level error from the status message
 */
export interface FileError {
  /** OECD error code (50000 series) */
  errorCode: FileErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional details */
  details?: string;
  /** XPath to the problematic element (if available) */
  xpath?: string;
}

/**
 * A record-level error from the status message
 */
export interface RecordError {
  /** OECD error code (80000 series) */
  errorCode: RecordErrorCode;
  /** Human-readable error message */
  message: string;
  /** DocRefId of the affected record */
  docRefId?: string;
  /** Additional details */
  details?: string;
  /** XPath to the problematic element (if available) */
  xpath?: string;
  /** The element type that caused the error */
  elementType?: 'ReportingEntity' | 'CbcReports' | 'AdditionalInfo';
}

/**
 * Collection of validation errors
 */
export interface ValidationErrors {
  /** File-level errors */
  fileErrors: FileError[];
  /** Record-level errors */
  recordErrors: RecordError[];
}

// =============================================================================
// MESSAGE SPEC
// =============================================================================

/**
 * MessageSpec element of the status message
 */
export interface StatusMessageSpec {
  /** Unique identifier for this status message */
  messageRefId: string;
  /** Message type (always 'CbC' for CbC status messages) */
  messageType: 'CbC';
  /** Sending tax authority */
  sendingCompetentAuthority: string;
  /** Receiving tax authority */
  receivingCompetentAuthority: string;
  /** Timestamp when status message was generated */
  timestamp: string;
}

// =============================================================================
// VALIDATION RESULT
// =============================================================================

/**
 * The validation result section of the status message
 */
export interface StatusValidationResult {
  /** Overall status: Accepted, Rejected, or PartiallyAccepted */
  status: ValidationStatus;
  /** List of authorities that validated the file */
  validatedBy: string[];
  /** Timestamp when validation completed */
  validationTimestamp?: string;
}

// =============================================================================
// MAIN STATUS MESSAGE TYPE
// =============================================================================

/**
 * Complete CbC Status Message structure
 *
 * Represents the feedback received from a tax authority after
 * submitting a CbCR XML file.
 *
 * @example
 * ```typescript
 * const statusMessage: CbcStatusMessage = {
 *   messageSpec: {
 *     messageRefId: 'LU2024-STATUS-001',
 *     messageType: 'CbC',
 *     sendingCompetentAuthority: 'LU',
 *     receivingCompetentAuthority: 'LU',
 *     timestamp: '2024-03-15T10:00:00Z',
 *   },
 *   originalMessage: {
 *     originalMessageRefId: 'LU2024CBC001',
 *     fileMetaData: {
 *       fileName: 'cbcr-2024.xml',
 *       fileSize: 15000,
 *     },
 *   },
 *   validationErrors: {
 *     fileErrors: [],
 *     recordErrors: [
 *       {
 *         errorCode: 80052,
 *         message: 'Invalid TIN format',
 *         docRefId: 'LU2024-DOC-001',
 *       },
 *     ],
 *   },
 *   validationResult: {
 *     status: 'Rejected',
 *     validatedBy: ['LU Tax Authority'],
 *   },
 * };
 * ```
 */
export interface CbcStatusMessage {
  /** Message specification */
  messageSpec: StatusMessageSpec;

  /** Reference to the original submitted message */
  originalMessage: {
    /** MessageRefId of the original CbCR submission */
    originalMessageRefId: string;
    /** File metadata (if available) */
    fileMetaData?: FileMetaData;
  };

  /** Validation errors found */
  validationErrors: ValidationErrors;

  /** Overall validation result */
  validationResult: StatusValidationResult;
}

// =============================================================================
// PARSING RESULT TYPE
// =============================================================================

/**
 * Result of parsing a status message XML file
 */
export interface StatusMessageParseResult {
  /** Whether parsing was successful */
  success: boolean;
  /** The parsed status message (if successful) */
  statusMessage?: CbcStatusMessage;
  /** Parse error (if unsuccessful) */
  error?: string;
  /** Raw XML content */
  rawXml?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Error code descriptions for display
 */
export interface ErrorCodeDescription {
  code: number;
  name: string;
  description: string;
  suggestedAction: string;
}

/**
 * Get error description by code
 */
export function getFileErrorDescription(code: FileErrorCode): ErrorCodeDescription {
  const descriptions: Record<FileErrorCode, ErrorCodeDescription> = {
    50000: {
      code: 50000,
      name: 'GENERAL_FILE_ERROR',
      description: 'General file-level error',
      suggestedAction: 'Review the entire file for issues',
    },
    50001: {
      code: 50001,
      name: 'XML_NOT_WELL_FORMED',
      description: 'The XML file is not well-formed',
      suggestedAction: 'Check for missing closing tags, invalid characters, or encoding issues',
    },
    50002: {
      code: 50002,
      name: 'XML_NOT_VALID',
      description: 'The XML file does not conform to the CbC schema',
      suggestedAction: 'Validate against CbcXML_v2.0.xsd schema',
    },
    50003: {
      code: 50003,
      name: 'DUPLICATE_MESSAGE_REF_ID',
      description: 'The MessageRefId has already been used',
      suggestedAction: 'Generate a new unique MessageRefId',
    },
    50004: {
      code: 50004,
      name: 'UNKNOWN_SENDER',
      description: 'The sending authority is not recognized',
      suggestedAction: 'Verify SendingCompetentAuthority is correct',
    },
    50005: {
      code: 50005,
      name: 'MISSING_MESSAGE_REF_ID',
      description: 'MessageRefId is missing or empty',
      suggestedAction: 'Add a unique MessageRefId',
    },
    50006: {
      code: 50006,
      name: 'MISSING_SENDING_AUTHORITY',
      description: 'SendingCompetentAuthority is missing',
      suggestedAction: 'Add SendingCompetentAuthority element',
    },
    50007: {
      code: 50007,
      name: 'MISSING_RECEIVING_AUTHORITY',
      description: 'ReceivingCompetentAuthority is missing',
      suggestedAction: 'Add ReceivingCompetentAuthority element',
    },
    50008: {
      code: 50008,
      name: 'MISSING_MESSAGE_TYPE',
      description: 'MessageType is missing',
      suggestedAction: 'Add MessageType element with value "CBC"',
    },
    50009: {
      code: 50009,
      name: 'INVALID_MESSAGE_TYPE',
      description: 'MessageType is invalid',
      suggestedAction: 'Set MessageType to "CBC"',
    },
    50010: {
      code: 50010,
      name: 'MISSING_REPORTING_PERIOD',
      description: 'ReportingPeriod is missing',
      suggestedAction: 'Add ReportingPeriod in YYYY-MM-DD format',
    },
    50011: {
      code: 50011,
      name: 'INVALID_REPORTING_PERIOD',
      description: 'ReportingPeriod format is invalid',
      suggestedAction: 'Use YYYY-MM-DD format for ReportingPeriod',
    },
    50012: {
      code: 50012,
      name: 'MISSING_TIMESTAMP',
      description: 'Timestamp is missing',
      suggestedAction: 'Add Timestamp in ISO 8601 format',
    },
    50013: {
      code: 50013,
      name: 'INVALID_ENCODING',
      description: 'File encoding is not UTF-8',
      suggestedAction: 'Save the file with UTF-8 encoding',
    },
    50014: {
      code: 50014,
      name: 'INVALID_NAMESPACE',
      description: 'XML namespace is incorrect',
      suggestedAction: 'Use namespace urn:oecd:ties:cbc:v2',
    },
    50015: {
      code: 50015,
      name: 'UNMATCHED_CORR_MESSAGE_REF_ID',
      description: 'CorrMessageRefId does not match any previous submission',
      suggestedAction: 'Verify CorrMessageRefId references an existing message',
    },
  };

  return descriptions[code] || {
    code,
    name: 'UNKNOWN_ERROR',
    description: `Unknown file error (code ${code})`,
    suggestedAction: 'Contact technical support',
  };
}

/**
 * Check if a message was accepted
 */
export function isAccepted(statusMessage: CbcStatusMessage): boolean {
  return statusMessage.validationResult.status === 'Accepted';
}

/**
 * Check if a message was rejected
 */
export function isRejected(statusMessage: CbcStatusMessage): boolean {
  return statusMessage.validationResult.status === 'Rejected';
}

/**
 * Get total error count
 */
export function getTotalErrorCount(statusMessage: CbcStatusMessage): number {
  return (
    statusMessage.validationErrors.fileErrors.length +
    statusMessage.validationErrors.recordErrors.length
  );
}

/**
 * Get file error count
 */
export function getFileErrorCount(statusMessage: CbcStatusMessage): number {
  return statusMessage.validationErrors.fileErrors.length;
}

/**
 * Get record error count
 */
export function getRecordErrorCount(statusMessage: CbcStatusMessage): number {
  return statusMessage.validationErrors.recordErrors.length;
}
