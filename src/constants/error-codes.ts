/**
 * OECD and Application Error Codes
 *
 * OECD Error Codes are defined in the CbC XML Schema User Guide:
 * - File-level errors: 50000-59999
 * - Record-level errors: 80000-89999
 *
 * Application-specific codes use APP- prefix for internal errors
 *
 * @module constants/error-codes
 */

import { ValidationSeverity } from '@/types/validation';

/**
 * Error code definition with description and suggested action
 */
export interface ErrorCodeDefinition {
  /** Numeric or string error code */
  code: number | string;
  /** Short name for the error */
  name: string;
  /** Detailed description of the error */
  description: string;
  /** Suggested action to resolve the error */
  suggestedAction: string;
  /** Default severity level */
  severity: ValidationSeverity;
  /** Reference to OECD documentation */
  reference?: string;
}

// =============================================================================
// OECD FILE-LEVEL ERROR CODES (50000-59999)
// =============================================================================

export const OECD_FILE_ERROR_CODES: Record<number, ErrorCodeDefinition> = {
  50000: {
    code: 50000,
    name: 'FILE_CORRUPT',
    description: 'The file is corrupt or unreadable',
    suggestedAction: 'Regenerate the CbC report file and ensure it is a valid XML document',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 4.1',
  },
  50001: {
    code: 50001,
    name: 'FILE_NOT_XML',
    description: 'The file is not a valid XML document',
    suggestedAction: 'Ensure the file is saved as a valid XML with proper encoding (UTF-8)',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 4.1',
  },
  50002: {
    code: 50002,
    name: 'SCHEMA_VALIDATION_FAILED',
    description: 'The XML does not conform to the CbC XML Schema',
    suggestedAction: 'Validate your file against CbcXML_v2.0.xsd and fix schema violations',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 4.2',
  },
  50003: {
    code: 50003,
    name: 'INVALID_MESSAGE_TYPE',
    description: 'Invalid message type specified',
    suggestedAction: 'Use CBC401 for primary filing or CBC402 for exchange filing',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 5.1',
  },
  50004: {
    code: 50004,
    name: 'INVALID_MESSAGE_TYPE_INDIC',
    description: 'Invalid MessageTypeIndic value',
    suggestedAction: 'Use CBC701 for new data or CBC702 for corrected data',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 5.2',
  },
  50005: {
    code: 50005,
    name: 'MISSING_MESSAGE_REF_ID',
    description: 'MessageRefId is missing or empty',
    suggestedAction: 'Provide a unique MessageRefId in the format [CountryCode][Year][UniqueId]',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 5.3',
  },
  50006: {
    code: 50006,
    name: 'DUPLICATE_MESSAGE_REF_ID',
    description: 'MessageRefId has already been used in a previous submission',
    suggestedAction: 'Generate a new unique MessageRefId for this submission',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 5.3',
  },
  50007: {
    code: 50007,
    name: 'INVALID_SENDING_AUTHORITY',
    description: 'Invalid SendingCompetentAuthority country code',
    suggestedAction: 'Use a valid ISO 3166-1 Alpha-2 country code',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 5.4',
  },
  50008: {
    code: 50008,
    name: 'INVALID_RECEIVING_AUTHORITY',
    description: 'Invalid ReceivingCompetentAuthority country code',
    suggestedAction: 'Use a valid ISO 3166-1 Alpha-2 country code',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 5.4',
  },
  50009: {
    code: 50009,
    name: 'INVALID_REPORTING_PERIOD',
    description: 'Invalid ReportingPeriod format',
    suggestedAction: 'Use YYYY-MM-DD format for the fiscal year end date',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 5.5',
  },
  50010: {
    code: 50010,
    name: 'MISSING_REPORTING_ENTITY',
    description: 'ReportingEntity is missing',
    suggestedAction: 'Include the ReportingEntity element with complete information',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 6.1',
  },
  50011: {
    code: 50011,
    name: 'MISSING_CBC_REPORTS',
    description: 'No CbcReports elements found',
    suggestedAction: 'Include at least one CbcReports element for each jurisdiction',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 6.2',
  },
  50012: {
    code: 50012,
    name: 'INVALID_TIMESTAMP',
    description: 'Invalid Timestamp format',
    suggestedAction: 'Use ISO 8601 format: YYYY-MM-DDTHH:MM:SS',
    severity: ValidationSeverity.ERROR,
    reference: 'CbC XML Schema User Guide Section 5.6',
  },
  50013: {
    code: 50013,
    name: 'ENCODING_NOT_UTF8',
    description: 'File encoding is not UTF-8',
    suggestedAction: 'Save the file with UTF-8 encoding without BOM',
    severity: ValidationSeverity.ERROR,
    reference: 'CbC XML Schema User Guide Section 4.1',
  },
  50014: {
    code: 50014,
    name: 'FILE_TOO_LARGE',
    description: 'File size exceeds maximum allowed limit',
    suggestedAction: 'Split the report or contact your tax authority for guidance',
    severity: ValidationSeverity.ERROR,
  },
  50015: {
    code: 50015,
    name: 'MISSING_XML_DECLARATION',
    description: 'XML declaration is missing',
    suggestedAction: 'Add <?xml version="1.0" encoding="UTF-8"?> at the start of the file',
    severity: ValidationSeverity.WARNING,
    reference: 'CbC XML Schema User Guide Section 4.1',
  },
};

// =============================================================================
// OECD RECORD-LEVEL ERROR CODES (80000-89999)
// =============================================================================

export const OECD_RECORD_ERROR_CODES: Record<number, ErrorCodeDefinition> = {
  80000: {
    code: 80000,
    name: 'INVALID_DOC_TYPE_INDIC',
    description: 'Invalid DocTypeIndic value',
    suggestedAction: 'Use OECD1 for new, OECD2 for correction, OECD3 for deletion',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 7.1',
  },
  80001: {
    code: 80001,
    name: 'MISSING_DOC_REF_ID',
    description: 'DocRefId is missing or empty',
    suggestedAction: 'Provide a unique DocRefId for this record',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 7.2',
  },
  80002: {
    code: 80002,
    name: 'DUPLICATE_DOC_REF_ID',
    description: 'DocRefId is duplicated within the file',
    suggestedAction: 'Ensure each DocRefId is unique across all records',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 7.2',
  },
  80003: {
    code: 80003,
    name: 'DOC_TYPE_MESSAGE_TYPE_MISMATCH',
    description: 'DocTypeIndic does not match MessageTypeIndic',
    suggestedAction: 'For CBC701 use OECD1; for CBC702 use OECD2 or OECD3',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 7.3',
  },
  80004: {
    code: 80004,
    name: 'MISSING_CORR_DOC_REF_ID',
    description: 'CorrDocRefId is required for corrections but missing',
    suggestedAction: 'Provide the DocRefId of the record being corrected',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 7.4',
  },
  80005: {
    code: 80005,
    name: 'INVALID_CORR_DOC_REF_ID',
    description: 'CorrDocRefId references a non-existent or invalid record',
    suggestedAction: 'Verify the CorrDocRefId matches an existing record',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 7.4',
  },
  80006: {
    code: 80006,
    name: 'MISSING_CORR_MESSAGE_REF_ID',
    description: 'CorrMessageRefId is required for corrections but missing',
    suggestedAction: 'Provide the MessageRefId of the message being corrected',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 7.4',
  },
  80010: {
    code: 80010,
    name: 'INVALID_TIN',
    description: 'Tax Identification Number format is invalid',
    suggestedAction: 'Verify TIN format matches the issuing jurisdiction requirements',
    severity: ValidationSeverity.ERROR,
    reference: 'CbC XML Schema User Guide Section 8.1',
  },
  80011: {
    code: 80011,
    name: 'MISSING_TIN',
    description: 'TIN is missing for reporting entity',
    suggestedAction: 'Provide the Tax Identification Number for the entity',
    severity: ValidationSeverity.ERROR,
    reference: 'CbC XML Schema User Guide Section 8.1',
  },
  80012: {
    code: 80012,
    name: 'MISSING_TIN_ISSUED_BY',
    description: 'TIN issuedBy attribute is missing',
    suggestedAction: 'Specify the jurisdiction that issued the TIN',
    severity: ValidationSeverity.WARNING,
    reference: 'CbC XML Schema User Guide Section 8.1',
  },
  80020: {
    code: 80020,
    name: 'INVALID_COUNTRY_CODE',
    description: 'Invalid ISO 3166-1 Alpha-2 country code',
    suggestedAction: 'Use a valid two-letter country code',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 8.2',
  },
  80021: {
    code: 80021,
    name: 'MISSING_RES_COUNTRY_CODE',
    description: 'ResCountryCode is missing in CbcReports',
    suggestedAction: 'Specify the tax jurisdiction for this report',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 8.2',
  },
  80022: {
    code: 80022,
    name: 'DUPLICATE_JURISDICTION',
    description: 'Duplicate jurisdiction in CbcReports',
    suggestedAction: 'Combine all entities from the same jurisdiction into one report',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 6.2',
  },
  80030: {
    code: 80030,
    name: 'INVALID_BIZ_ACTIVITY',
    description: 'Invalid business activity code',
    suggestedAction: 'Use valid codes CBC501-CBC513',
    severity: ValidationSeverity.ERROR,
    reference: 'CbC XML Schema User Guide Section 8.3',
  },
  80031: {
    code: 80031,
    name: 'MISSING_BIZ_ACTIVITY',
    description: 'No business activity specified for entity',
    suggestedAction: 'Specify at least one business activity code',
    severity: ValidationSeverity.WARNING,
    reference: 'CbC XML Schema User Guide Section 8.3',
  },
  80040: {
    code: 80040,
    name: 'NEGATIVE_EMPLOYEE_COUNT',
    description: 'Number of employees cannot be negative',
    suggestedAction: 'Provide a non-negative integer for employees',
    severity: ValidationSeverity.ERROR,
    reference: 'CbC XML Schema User Guide Section 9.1',
  },
  80041: {
    code: 80041,
    name: 'INVALID_MONETARY_AMOUNT',
    description: 'Invalid monetary amount format',
    suggestedAction: 'Use numeric values with up to 2 decimal places',
    severity: ValidationSeverity.ERROR,
    reference: 'CbC XML Schema User Guide Section 9.2',
  },
  80042: {
    code: 80042,
    name: 'REVENUE_SUM_MISMATCH',
    description: 'Total revenues does not equal sum of related and unrelated revenues',
    suggestedAction: 'Verify that TotalRevenues = UnrelatedRevenues + RelatedRevenues',
    severity: ValidationSeverity.ERROR,
    reference: 'CbC XML Schema User Guide Section 9.3',
  },
  80043: {
    code: 80043,
    name: 'MISSING_SUMMARY',
    description: 'Summary element is missing in CbcReports',
    suggestedAction: 'Include Summary with all required Table 1 fields',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 6.2',
  },
  80044: {
    code: 80044,
    name: 'MISSING_CONST_ENTITIES',
    description: 'ConstEntities element is missing in CbcReports',
    suggestedAction: 'Include at least one constituent entity per jurisdiction',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 6.2',
  },
  80050: {
    code: 80050,
    name: 'MISSING_ENTITY_NAME',
    description: 'Entity name is missing',
    suggestedAction: 'Provide the legal name for each constituent entity',
    severity: ValidationSeverity.CRITICAL,
    reference: 'CbC XML Schema User Guide Section 8.4',
  },
  80051: {
    code: 80051,
    name: 'MISSING_ADDRESS',
    description: 'Address is missing for entity',
    suggestedAction: 'Provide address information for the entity',
    severity: ValidationSeverity.WARNING,
    reference: 'CbC XML Schema User Guide Section 8.5',
  },
  80060: {
    code: 80060,
    name: 'INVALID_REPORTING_ROLE',
    description: 'Invalid ReportingRole value',
    suggestedAction: 'Use CBC801 (UPE), CBC802 (Surrogate), or CBC803 (Other)',
    severity: ValidationSeverity.ERROR,
    reference: 'CbC XML Schema User Guide Section 6.1',
  },
  80070: {
    code: 80070,
    name: 'INVALID_ADDITIONAL_INFO',
    description: 'AdditionalInfo content is invalid',
    suggestedAction: 'Ensure additional information is in the correct format',
    severity: ValidationSeverity.WARNING,
    reference: 'CbC XML Schema User Guide Section 6.3',
  },
};

// =============================================================================
// APPLICATION-SPECIFIC ERROR CODES
// =============================================================================

export const APP_ERROR_CODES: Record<string, ErrorCodeDefinition> = {
  'APP-001': {
    code: 'APP-001',
    name: 'PARSE_ERROR',
    description: 'Failed to parse XML file',
    suggestedAction: 'Check that the file is valid XML and not corrupted',
    severity: ValidationSeverity.CRITICAL,
  },
  'APP-002': {
    code: 'APP-002',
    name: 'FILE_EMPTY',
    description: 'The uploaded file is empty',
    suggestedAction: 'Upload a valid CbC XML file with content',
    severity: ValidationSeverity.CRITICAL,
  },
  'APP-003': {
    code: 'APP-003',
    name: 'UNSUPPORTED_VERSION',
    description: 'The CbC schema version is not supported',
    suggestedAction: 'Use CbC XML Schema v2.0',
    severity: ValidationSeverity.CRITICAL,
  },
  'APP-004': {
    code: 'APP-004',
    name: 'VALIDATION_TIMEOUT',
    description: 'Validation process timed out',
    suggestedAction: 'Try again or split the file into smaller parts',
    severity: ValidationSeverity.ERROR,
  },
  'APP-005': {
    code: 'APP-005',
    name: 'INTERNAL_ERROR',
    description: 'An internal validation error occurred',
    suggestedAction: 'Contact support if the issue persists',
    severity: ValidationSeverity.ERROR,
  },
  'APP-006': {
    code: 'APP-006',
    name: 'XXE_DETECTED',
    description: 'Potential XML External Entity (XXE) attack detected',
    suggestedAction: 'Remove external entity references from the XML',
    severity: ValidationSeverity.CRITICAL,
  },
  'APP-007': {
    code: 'APP-007',
    name: 'FUTURE_REPORTING_PERIOD',
    description: 'Reporting period is in the future',
    suggestedAction: 'Verify the fiscal year end date is correct',
    severity: ValidationSeverity.WARNING,
  },
  'APP-008': {
    code: 'APP-008',
    name: 'VERY_OLD_REPORTING_PERIOD',
    description: 'Reporting period is more than 5 years old',
    suggestedAction: 'Verify this is the intended reporting period',
    severity: ValidationSeverity.INFO,
  },
  'APP-009': {
    code: 'APP-009',
    name: 'EXCESSIVE_ENTITIES',
    description: 'Unusually high number of constituent entities',
    suggestedAction: 'Verify that all entities are correctly included',
    severity: ValidationSeverity.INFO,
  },
  'APP-010': {
    code: 'APP-010',
    name: 'NO_ENTITIES_IN_JURISDICTION',
    description: 'Jurisdiction has summary data but no constituent entities',
    suggestedAction: 'Add constituent entities or remove the jurisdiction',
    severity: ValidationSeverity.ERROR,
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get error definition by OECD code
 */
export function getOecdErrorCode(code: number): ErrorCodeDefinition | undefined {
  return OECD_FILE_ERROR_CODES[code] ?? OECD_RECORD_ERROR_CODES[code];
}

/**
 * Get error definition by app code
 */
export function getAppErrorCode(code: string): ErrorCodeDefinition | undefined {
  return APP_ERROR_CODES[code];
}

/**
 * Get all error codes as a flat map
 */
export function getAllErrorCodes(): Record<string | number, ErrorCodeDefinition> {
  return {
    ...OECD_FILE_ERROR_CODES,
    ...OECD_RECORD_ERROR_CODES,
    ...APP_ERROR_CODES,
  };
}

