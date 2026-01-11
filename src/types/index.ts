/**
 * Type definitions index
 * Re-exports all types for convenient importing
 *
 * @example
 * import { CbcMessage, ValidationResult, ValidationSeverity } from '@/types';
 */

// CbCR XML Schema types
export * from './cbcr';

// Validation types
export * from './validation';

// Status Message types (selectively exported to avoid conflicts)
export {
  type FileErrorCode,
  type RecordErrorCode,
  type ValidationStatus as StatusMessageValidationStatus,
  type FileMetaData,
  type FileError,
  type RecordError,
  type ValidationErrors,
  type StatusMessageSpec,
  type StatusValidationResult,
  type CbcStatusMessage,
  type StatusMessageParseResult,
  type ErrorCodeDescription,
  getFileErrorDescription,
  isAccepted,
  isRejected,
  getTotalErrorCount,
  getFileErrorCount,
  getRecordErrorCount,
} from './status-message';