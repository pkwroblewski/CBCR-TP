/**
 * Validation Rules Definitions
 *
 * Defines all validation rules organized by category and rule ID.
 * Rule IDs follow a naming convention: [PREFIX]-[NUMBER]
 *
 * Prefixes:
 * - MSG: MessageSpec rules
 * - DOC: DocSpec rules
 * - TIN: Tax Identification Number rules
 * - BIZ: Business Activity rules
 * - SUM: Summary data rules
 * - XFV: Cross-field validation rules
 * - ENC: Encoding rules
 * - CC: Country code rules
 * - LU: Luxembourg-specific rules
 * - P2: Pillar 2 rules
 *
 * @module constants/validation-rules
 */

import { ValidationRule, ValidationCategory, ValidationSeverity } from '@/types/validation';

// =============================================================================
// MESSAGE SPEC RULES (MSG-001 to MSG-010)
// =============================================================================

export const MESSAGE_SPEC_RULES: ValidationRule[] = [
  {
    ruleId: 'MSG-001',
    name: 'MessageRefId Required',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'MessageRefId must be present and non-empty',
    reference: 'CbC XML User Guide Section 5.3',
    oecdErrorCode: 50005,
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/MessageRefId',
  },
  {
    ruleId: 'MSG-002',
    name: 'MessageRefId Uniqueness',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'MessageRefId must be globally unique across all submissions',
    reference: 'CbC XML User Guide Section 5.3',
    oecdErrorCode: 50006,
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/MessageRefId',
  },
  {
    ruleId: 'MSG-003',
    name: 'MessageType Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'MessageType must be CBC401 or CBC402',
    reference: 'CbC XML User Guide Section 5.1',
    oecdErrorCode: 50003,
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/MessageType',
  },
  {
    ruleId: 'MSG-004',
    name: 'MessageTypeIndic Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'MessageTypeIndic must be CBC701 (new) or CBC702 (correction)',
    reference: 'CbC XML User Guide Section 5.2',
    oecdErrorCode: 50004,
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/MessageTypeIndic',
  },
  {
    ruleId: 'MSG-005',
    name: 'ReportingPeriod Format',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'ReportingPeriod must be in YYYY-MM-DD format',
    reference: 'CbC XML User Guide Section 5.5',
    oecdErrorCode: 50009,
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/ReportingPeriod',
  },
  {
    ruleId: 'MSG-006',
    name: 'CorrMessageRefId for Corrections',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'CorrMessageRefId is required when MessageTypeIndic is CBC702',
    reference: 'CbC XML User Guide Section 5.7',
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/CorrMessageRefId',
  },
  {
    ruleId: 'MSG-007',
    name: 'Timestamp Format',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'Timestamp must be in ISO 8601 format',
    reference: 'CbC XML User Guide Section 5.6',
    oecdErrorCode: 50012,
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/Timestamp',
  },
  {
    ruleId: 'MSG-008',
    name: 'SendingCompetentAuthority Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'SendingCompetentAuthority must be a valid ISO 3166-1 Alpha-2 code',
    reference: 'CbC XML User Guide Section 5.4',
    oecdErrorCode: 50007,
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/SendingCompetentAuthority',
  },
  {
    ruleId: 'MSG-009',
    name: 'ReceivingCompetentAuthority Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'ReceivingCompetentAuthority must be a valid ISO 3166-1 Alpha-2 code',
    reference: 'CbC XML User Guide Section 5.4',
    oecdErrorCode: 50008,
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/ReceivingCompetentAuthority',
  },
  {
    ruleId: 'MSG-010',
    name: 'Language Code Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'Language must be a valid ISO 639-1 code',
    reference: 'CbC XML User Guide Section 5.8',
    enabled: true,
    xpathPattern: '/CBC_OECD/MessageSpec/Language',
  },
];

// =============================================================================
// DOC SPEC RULES (DOC-001 to DOC-007)
// =============================================================================

export const DOC_SPEC_RULES: ValidationRule[] = [
  {
    ruleId: 'DOC-001',
    name: 'DocRefId Required',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'DocRefId must be present and non-empty for each record',
    reference: 'CbC XML User Guide Section 7.2',
    oecdErrorCode: 80001,
    enabled: true,
    xpathPattern: '//DocSpec/DocRefId',
  },
  {
    ruleId: 'DOC-002',
    name: 'DocRefId Uniqueness Within File',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'DocRefId must be unique within the XML file',
    reference: 'CbC XML User Guide Section 7.2',
    oecdErrorCode: 80002,
    enabled: true,
    xpathPattern: '//DocSpec/DocRefId',
  },
  {
    ruleId: 'DOC-003',
    name: 'DocTypeIndic Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'DocTypeIndic must be OECD0, OECD1, OECD2, OECD3 (or test equivalents)',
    reference: 'CbC XML User Guide Section 7.1',
    oecdErrorCode: 80000,
    enabled: true,
    xpathPattern: '//DocSpec/DocTypeIndic',
  },
  {
    ruleId: 'DOC-004',
    name: 'DocTypeIndic MessageTypeIndic Consistency',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'DocTypeIndic must be consistent with MessageTypeIndic (OECD1 for CBC701, OECD2/3 for CBC702)',
    reference: 'CbC XML User Guide Section 7.3',
    oecdErrorCode: 80003,
    enabled: true,
    xpathPattern: '//DocSpec/DocTypeIndic',
  },
  {
    ruleId: 'DOC-005',
    name: 'CorrDocRefId for Corrections',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'CorrDocRefId is required when DocTypeIndic is OECD2 or OECD3',
    reference: 'CbC XML User Guide Section 7.4',
    oecdErrorCode: 80004,
    enabled: true,
    xpathPattern: '//DocSpec/CorrDocRefId',
  },
  {
    ruleId: 'DOC-006',
    name: 'CorrMessageRefId for Corrections',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'CorrMessageRefId is required when DocTypeIndic is OECD2 or OECD3',
    reference: 'CbC XML User Guide Section 7.4',
    oecdErrorCode: 80006,
    enabled: true,
    xpathPattern: '//DocSpec/CorrMessageRefId',
  },
  {
    ruleId: 'DOC-007',
    name: 'DocRefId Format',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'DocRefId should follow recommended format: [CountryCode][Year][UniqueId]',
    reference: 'CbC XML User Guide Section 7.2',
    enabled: true,
    xpathPattern: '//DocSpec/DocRefId',
  },
];

// =============================================================================
// TIN RULES (TIN-001 to TIN-006)
// =============================================================================

export const TIN_RULES: ValidationRule[] = [
  {
    ruleId: 'TIN-001',
    name: 'Reporting Entity TIN Required',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'ReportingEntity must have at least one TIN',
    reference: 'CbC XML User Guide Section 8.1',
    oecdErrorCode: 80011,
    enabled: true,
    xpathPattern: '/CBC_OECD/CbcBody/ReportingEntity/TIN',
  },
  {
    ruleId: 'TIN-002',
    name: 'TIN IssuedBy Attribute',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'TIN should include issuedBy attribute specifying the issuing jurisdiction',
    reference: 'CbC XML User Guide Section 8.1',
    oecdErrorCode: 80012,
    enabled: true,
    xpathPattern: '//TIN/@issuedBy',
  },
  {
    ruleId: 'TIN-003',
    name: 'TIN Format Valid',
    category: ValidationCategory.COUNTRY_RULES,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'TIN format must match the requirements of the issuing jurisdiction',
    reference: 'CbC XML User Guide Section 8.1',
    oecdErrorCode: 80010,
    enabled: true,
    xpathPattern: '//TIN',
  },
  {
    ruleId: 'TIN-004',
    name: 'TIN Non-Empty',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'TIN value must not be empty if element is present',
    reference: 'CbC XML User Guide Section 8.1',
    enabled: true,
    xpathPattern: '//TIN',
  },
  {
    ruleId: 'TIN-005',
    name: 'TIN IssuedBy Country Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'TIN issuedBy must be a valid ISO 3166-1 Alpha-2 code',
    reference: 'CbC XML User Guide Section 8.1',
    enabled: true,
    xpathPattern: '//TIN/@issuedBy',
  },
  {
    ruleId: 'TIN-006',
    name: 'Entity TIN Recommended',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'Constituent entities should have TINs when available',
    reference: 'CbC XML User Guide Section 8.1',
    enabled: true,
    xpathPattern: '//ConstituentEntity/TIN',
  },
];

// =============================================================================
// BUSINESS ACTIVITY RULES (BIZ-001 to BIZ-004)
// =============================================================================

export const BUSINESS_ACTIVITY_RULES: ValidationRule[] = [
  {
    ruleId: 'BIZ-001',
    name: 'Business Activity Required',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'At least one business activity should be specified for each entity',
    reference: 'CbC XML User Guide Section 8.3',
    oecdErrorCode: 80031,
    enabled: true,
    xpathPattern: '//ConstEntities/BizActivities',
  },
  {
    ruleId: 'BIZ-002',
    name: 'Business Activity Code Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'Business activity code must be CBC501-CBC513',
    reference: 'CbC XML User Guide Section 8.3',
    oecdErrorCode: 80030,
    enabled: true,
    xpathPattern: '//BizActivities/BizActivity',
  },
  {
    ruleId: 'BIZ-003',
    name: 'Dormant Entity Consistency',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'Entities marked as Dormant (CBC512) should have zero or minimal financial data',
    reference: 'OECD CbC Guidance',
    enabled: true,
    xpathPattern: '//BizActivities/BizActivity',
  },
  {
    ruleId: 'BIZ-004',
    name: 'Other Activity Explanation',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'When CBC513 (Other) is selected, consider adding explanation in AdditionalInfo',
    reference: 'OECD CbC Guidance',
    enabled: true,
    xpathPattern: '//BizActivities/BizActivity',
  },
];

// =============================================================================
// SUMMARY DATA RULES (SUM-001 to SUM-010)
// =============================================================================

export const SUMMARY_RULES: ValidationRule[] = [
  {
    ruleId: 'SUM-001',
    name: 'Summary Required',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'Each CbcReports must contain a Summary element',
    reference: 'CbC XML User Guide Section 6.2',
    oecdErrorCode: 80043,
    enabled: true,
    xpathPattern: '//CbcReports/Summary',
  },
  {
    ruleId: 'SUM-002',
    name: 'Revenue Sum Validation',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'TotalRevenues must equal UnrelatedRevenues + RelatedRevenues',
    reference: 'CbC XML User Guide Section 9.3',
    oecdErrorCode: 80042,
    enabled: true,
    xpathPattern: '//Summary/Revenues',
  },
  {
    ruleId: 'SUM-003',
    name: 'Employee Count Non-Negative',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'Number of employees must be zero or positive',
    reference: 'CbC XML User Guide Section 9.1',
    oecdErrorCode: 80040,
    enabled: true,
    xpathPattern: '//Summary/NbEmployees',
  },
  {
    ruleId: 'SUM-004',
    name: 'Monetary Amount Format',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'All monetary amounts must be valid numbers',
    reference: 'CbC XML User Guide Section 9.2',
    oecdErrorCode: 80041,
    enabled: true,
    xpathPattern: '//Summary/*[contains(local-name(), "Revenues") or contains(local-name(), "Tax")]',
  },
  {
    ruleId: 'SUM-005',
    name: 'Tax Paid Reasonableness',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'Tax paid should be reasonable relative to profit (check for potential errors)',
    reference: 'OECD CbC Guidance',
    enabled: true,
    xpathPattern: '//Summary/TaxPaid',
  },
  {
    ruleId: 'SUM-006',
    name: 'Zero Revenue with Employees',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'Entities with employees typically should have some revenue',
    reference: 'OECD CbC Guidance',
    enabled: true,
    xpathPattern: '//Summary',
  },
  {
    ruleId: 'SUM-007',
    name: 'Profit but No Tax',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'Jurisdictions with profit but no tax accrued may require explanation',
    reference: 'OECD CbC Guidance',
    enabled: true,
    xpathPattern: '//Summary',
  },
  {
    ruleId: 'SUM-008',
    name: 'Tangible Assets Non-Negative',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'Tangible assets value must be zero or positive',
    reference: 'CbC XML User Guide Section 9.4',
    enabled: true,
    xpathPattern: '//Summary/Assets',
  },
  {
    ruleId: 'SUM-009',
    name: 'Capital Non-Negative',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'Stated capital value must be zero or positive',
    reference: 'CbC XML User Guide Section 9.5',
    enabled: true,
    xpathPattern: '//Summary/Capital',
  },
  {
    ruleId: 'SUM-010',
    name: 'Consistent Currency',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'All monetary amounts should use the same currency across the report',
    reference: 'OECD CbC Guidance',
    enabled: true,
    xpathPattern: '//Summary',
  },
];

// =============================================================================
// CROSS-FIELD VALIDATION RULES (XFV-001 to XFV-010)
// =============================================================================

export const CROSS_FIELD_RULES: ValidationRule[] = [
  {
    ruleId: 'XFV-001',
    name: 'Reporting Entity in Constituent Entities',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'The reporting entity should appear in the constituent entities list',
    reference: 'OECD CbC Guidance',
    enabled: true,
  },
  {
    ruleId: 'XFV-002',
    name: 'UPE Jurisdiction Included',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'The UPE jurisdiction should typically be included in CbcReports',
    reference: 'OECD CbC Guidance',
    enabled: true,
  },
  {
    ruleId: 'XFV-003',
    name: 'Entity Count Matches Summary',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'Number of entities in ConstEntities should match summary expectations',
    reference: 'OECD CbC Guidance',
    enabled: true,
  },
  {
    ruleId: 'XFV-004',
    name: 'ResCountryCode Matches Entity Jurisdiction',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'ResCountryCode in CbcReports should match jurisdiction of entities',
    reference: 'CbC XML User Guide Section 6.2',
    enabled: true,
  },
  {
    ruleId: 'XFV-005',
    name: 'Reporting Period Consistency',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'ReportingEntity dates should align with MessageSpec ReportingPeriod',
    reference: 'CbC XML User Guide Section 6.1',
    enabled: true,
  },
  {
    ruleId: 'XFV-006',
    name: 'Total Global Revenues Reasonable',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'Sum of all jurisdiction revenues should be reasonable for MNE size',
    reference: 'OECD CbC Guidance',
    enabled: true,
  },
  {
    ruleId: 'XFV-007',
    name: 'No Duplicate Jurisdictions',
    category: ValidationCategory.BUSINESS_RULES,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'Each jurisdiction should appear only once in CbcReports',
    reference: 'CbC XML User Guide Section 6.2',
    oecdErrorCode: 80022,
    enabled: true,
  },
  {
    ruleId: 'XFV-008',
    name: 'Global Tax Consistency',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'Total taxes across jurisdictions should be reasonable',
    reference: 'OECD CbC Guidance',
    enabled: true,
  },
  {
    ruleId: 'XFV-009',
    name: 'Stateless Entity Handling',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'Stateless entities should be reported consistently',
    reference: 'OECD CbC Guidance',
    enabled: true,
  },
  {
    ruleId: 'XFV-010',
    name: 'PE Included in Host Jurisdiction',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'Permanent establishments should be included in their host jurisdiction',
    reference: 'OECD CbC Guidance',
    enabled: true,
  },
];

// =============================================================================
// ENCODING RULES (ENC-001 to ENC-003)
// =============================================================================

export const ENCODING_RULES: ValidationRule[] = [
  {
    ruleId: 'ENC-001',
    name: 'UTF-8 Encoding',
    category: ValidationCategory.XML_WELLFORMEDNESS,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'XML file must be encoded in UTF-8',
    reference: 'CbC XML User Guide Section 4.1',
    oecdErrorCode: 50013,
    enabled: true,
  },
  {
    ruleId: 'ENC-002',
    name: 'No BOM',
    category: ValidationCategory.XML_WELLFORMEDNESS,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'UTF-8 encoding should not include Byte Order Mark (BOM)',
    reference: 'CbC XML User Guide Section 4.1',
    enabled: true,
  },
  {
    ruleId: 'ENC-003',
    name: 'Valid Characters',
    category: ValidationCategory.XML_WELLFORMEDNESS,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'File must not contain invalid XML characters',
    reference: 'CbC XML User Guide Section 4.1',
    enabled: true,
  },
];

// =============================================================================
// COUNTRY CODE RULES (CC-001 to CC-005)
// =============================================================================

export const COUNTRY_CODE_RULES: ValidationRule[] = [
  {
    ruleId: 'CC-001',
    name: 'Valid Country Code',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'Country codes must be valid ISO 3166-1 Alpha-2 codes',
    reference: 'CbC XML User Guide Section 8.2',
    oecdErrorCode: 80020,
    enabled: true,
  },
  {
    ruleId: 'CC-002',
    name: 'ResCountryCode Required',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.CRITICAL,
    description: 'ResCountryCode is required in each CbcReports element',
    reference: 'CbC XML User Guide Section 8.2',
    oecdErrorCode: 80021,
    enabled: true,
    xpathPattern: '//CbcReports/ResCountryCode',
  },
  {
    ruleId: 'CC-003',
    name: 'Address Country Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'Country code in address must be valid',
    reference: 'CbC XML User Guide Section 8.5',
    enabled: true,
    xpathPattern: '//Address/CountryCode',
  },
  {
    ruleId: 'CC-004',
    name: 'Incorporation Country Valid',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    defaultSeverity: ValidationSeverity.ERROR,
    description: 'IncorpCountryCode must be a valid country code',
    reference: 'CbC XML User Guide Section 8.6',
    enabled: true,
    xpathPattern: '//ConstituentEntity/IncorpCountryCode',
  },
  {
    ruleId: 'CC-005',
    name: 'No Deprecated Codes',
    category: ValidationCategory.DATA_QUALITY,
    defaultSeverity: ValidationSeverity.WARNING,
    description: 'Avoid using deprecated or obsolete country codes',
    reference: 'ISO 3166-1 Standard',
    enabled: true,
  },
];

// =============================================================================
// PILLAR 2 RULES (P2-001 to P2-005)
// =============================================================================

export const PILLAR2_RULES: ValidationRule[] = [
  {
    ruleId: 'P2-001',
    name: 'Revenue Threshold Check',
    category: ValidationCategory.PILLAR2_READINESS,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'Check if MNE group exceeds EUR 750M revenue threshold for Pillar 2',
    reference: 'OECD Pillar 2 Model Rules',
    enabled: true,
  },
  {
    ruleId: 'P2-002',
    name: 'Transitional Safe Harbour - Revenue Test',
    category: ValidationCategory.PILLAR2_READINESS,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'Check if jurisdiction qualifies for transitional safe harbour (revenue < EUR 10M)',
    reference: 'OECD Administrative Guidance',
    enabled: true,
  },
  {
    ruleId: 'P2-003',
    name: 'Transitional Safe Harbour - Profit Test',
    category: ValidationCategory.PILLAR2_READINESS,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'Check if jurisdiction qualifies for transitional safe harbour (loss or low profit)',
    reference: 'OECD Administrative Guidance',
    enabled: true,
  },
  {
    ruleId: 'P2-004',
    name: 'Transitional Safe Harbour - ETR Test',
    category: ValidationCategory.PILLAR2_READINESS,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'Check if jurisdiction qualifies for transitional safe harbour (ETR >= transition rate)',
    reference: 'OECD Administrative Guidance',
    enabled: true,
  },
  {
    ruleId: 'P2-005',
    name: 'QDMTT Jurisdiction',
    category: ValidationCategory.PILLAR2_READINESS,
    defaultSeverity: ValidationSeverity.INFO,
    description: 'Identify jurisdictions that have implemented Qualified Domestic Minimum Top-up Tax',
    reference: 'OECD Pillar 2 Implementation Tracker',
    enabled: true,
  },
];

// =============================================================================
// AGGREGATE EXPORTS
// =============================================================================

/**
 * All validation rules organized by category
 */
export const VALIDATION_RULES_BY_CATEGORY: Record<string, ValidationRule[]> = {
  messageSpec: MESSAGE_SPEC_RULES,
  docSpec: DOC_SPEC_RULES,
  tin: TIN_RULES,
  businessActivity: BUSINESS_ACTIVITY_RULES,
  summary: SUMMARY_RULES,
  crossField: CROSS_FIELD_RULES,
  encoding: ENCODING_RULES,
  countryCode: COUNTRY_CODE_RULES,
  pillar2: PILLAR2_RULES,
};

/**
 * All validation rules as a flat array
 */
export const ALL_VALIDATION_RULES: ValidationRule[] = [
  ...MESSAGE_SPEC_RULES,
  ...DOC_SPEC_RULES,
  ...TIN_RULES,
  ...BUSINESS_ACTIVITY_RULES,
  ...SUMMARY_RULES,
  ...CROSS_FIELD_RULES,
  ...ENCODING_RULES,
  ...COUNTRY_CODE_RULES,
  ...PILLAR2_RULES,
];

/**
 * Get a validation rule by its ID
 */
export function getValidationRule(ruleId: string): ValidationRule | undefined {
  return ALL_VALIDATION_RULES.find((rule) => rule.ruleId === ruleId);
}

/**
 * Get all rules for a specific category
 */
export function getRulesByCategory(category: ValidationCategory): ValidationRule[] {
  return ALL_VALIDATION_RULES.filter((rule) => rule.category === category);
}

/**
 * Get all enabled rules
 */
export function getEnabledRules(): ValidationRule[] {
  return ALL_VALIDATION_RULES.filter((rule) => rule.enabled);
}

/**
 * Get rules applicable to specific jurisdictions
 */
export function getRulesForJurisdiction(jurisdictionCode: string): ValidationRule[] {
  return ALL_VALIDATION_RULES.filter(
    (rule) =>
      !rule.applicableJurisdictions ||
      rule.applicableJurisdictions.length === 0 ||
      rule.applicableJurisdictions.includes(jurisdictionCode)
  );
}

// =============================================================================
// OECD COMMON ERRORS (CE-001 to CE-028)
// Source: OECD "Common errors made by MNE groups in preparing Country-by-Country Reports"
// URL: https://www.oecd.org/content/dam/oecd/en/topics/policy-sub-issues/cbcr/common-errors-mnes-cbc-reports.pdf
// =============================================================================

/**
 * OECD Common Error rule definition
 * Extended structure with OECD-specific metadata
 */
export interface OecdCommonErrorRule {
  id: string;
  category: string;
  severity: string;
  source: string;
  title: string;
  description: string;
  correctTreatment: string;
  reference: string;
}

export const OECD_COMMON_ERROR_RULES: Record<string, OecdCommonErrorRule> = {
  // ─────────────────────────────────────────
  // TIN ERRORS (Most Critical for Data Use)
  // ─────────────────────────────────────────
  
  'CE-001': {
    id: 'CE-001',
    category: 'DATA_QUALITY',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Missing Tax Identification Number',
    description: 'TIN field is blank or contains only spaces. TIN is required for all Constituent Entities.',
    correctTreatment: 'Provide valid TIN for each Constituent Entity. Use "NOTIN" only if no TIN has been issued by the tax administration.',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  'CE-002': {
    id: 'CE-002',
    category: 'DATA_QUALITY',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid NOTIN Usage',
    description: 'NOTIN entered for entity that has been issued a TIN.',
    correctTreatment: 'NOTIN should only be used when no TIN has been issued. If entity has a TIN, it must be provided.',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  'CE-003': {
    id: 'CE-003',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Invalid TIN Format',
    description: 'TIN does not match the expected format for the issuing jurisdiction.',
    correctTreatment: 'Ensure TIN follows the format required by the issuing tax administration.',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  'CE-004': {
    id: 'CE-004',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Duplicate TIN',
    description: 'Same TIN used for multiple different Constituent Entities.',
    correctTreatment: 'Each Constituent Entity should have a unique TIN unless they share one legitimately (rare).',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  'CE-005': {
    id: 'CE-005',
    category: 'DATA_QUALITY',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Missing issuedBy Attribute',
    description: 'TIN provided without the issuedBy jurisdiction attribute.',
    correctTreatment: 'Always include issuedBy attribute with ISO country code indicating which jurisdiction issued the TIN.',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  // ─────────────────────────────────────────
  // TABLE 1/2/3 CONSISTENCY ERRORS
  // ─────────────────────────────────────────

  'CE-006': {
    id: 'CE-006',
    category: 'DATA_QUALITY',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Table 1/Table 2 Jurisdiction Mismatch',
    description: 'Jurisdiction appears in Table 1 but not in Table 2, or vice versa.',
    correctTreatment: 'Every jurisdiction in Table 1 must have corresponding entities in Table 2, and every entity jurisdiction in Table 2 must be reflected in Table 1.',
    reference: 'CbC Report Specific Instructions, page 35'
  },

  'CE-007': {
    id: 'CE-007',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Missing Constituent Entity',
    description: 'Not all Constituent Entities of the MNE Group are included in the CbC Report.',
    correctTreatment: 'Include ALL Constituent Entities, including dormant entities, partnerships, trusts, and permanent establishments.',
    reference: 'CbC Report Specific Instructions, page 35'
  },

  'CE-008': {
    id: 'CE-008',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Reporting Entity Not in Entity List',
    description: 'The Reporting Entity is not included as a Constituent Entity in Table 2.',
    correctTreatment: 'The Reporting Entity must also appear in the list of Constituent Entities for its jurisdiction.',
    reference: 'CbCR XML Schema User Guide, page 21'
  },

  'CE-009': {
    id: 'CE-009',
    category: 'DATA_QUALITY',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Incorrect PE Naming Convention',
    description: 'Permanent Establishment not named using correct format.',
    correctTreatment: 'Name PEs as: "Entity Legal Name – Jurisdiction PE" (e.g., "ACME Corp – Germany PE").',
    reference: 'BEPS Action 13 Report, Part III, Question 7.1'
  },

  // ─────────────────────────────────────────
  // NUMERIC/FORMAT ERRORS
  // ─────────────────────────────────────────

  'CE-010': {
    id: 'CE-010',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Decimals in Table 1 Amounts',
    description: 'Table 1 amounts contain decimal values.',
    correctTreatment: 'Full numbers must be used without decimals. Round to nearest whole unit.',
    reference: 'BEPS Action 13 Report, Part II, Question 8.1'
  },

  'CE-011': {
    id: 'CE-011',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Shortened Numbers (Thousands/Millions)',
    description: 'Amounts appear to be in thousands or millions instead of full units.',
    correctTreatment: 'Report full amounts. Do not abbreviate by dropping final digits. €1,500,000 should not be reported as 1,500 or 1.5.',
    reference: 'BEPS Action 13 Report, Part II, Question 8.1'
  },

  'CE-012': {
    id: 'CE-012',
    category: 'DATA_QUALITY',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Revenue Sum Mismatch',
    description: 'Total Revenues does not equal Related Party Revenues + Unrelated Party Revenues.',
    correctTreatment: 'Total Revenues must always equal the sum of Unrelated Party Revenues and Related Party Revenues.',
    reference: 'BEPS Action 13 Report, Part II, Question 7.1'
  },

  'CE-013': {
    id: 'CE-013',
    category: 'DATA_QUALITY',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Inconsistent Currency',
    description: 'Different currencies used across jurisdictions in the same report.',
    correctTreatment: 'All amounts must be in the same functional currency of the Reporting MNE. Convert using average exchange rate and note in Table 3.',
    reference: 'BEPS Action 13 Report, Part II, Question 7.1'
  },

  'CE-014': {
    id: 'CE-014',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Negative Revenue Values',
    description: 'Revenue figures reported as negative values.',
    correctTreatment: 'Revenue figures should only be provided as positive integers. Negative values are not permitted for revenue fields.',
    reference: 'CbCR XML Schema User Guide'
  },

  // ─────────────────────────────────────────
  // DIVIDEND TREATMENT ERRORS (May 2024 Update)
  // ─────────────────────────────────────────

  'CE-015': {
    id: 'CE-015',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors (May 2024)',
    title: 'Dividends Included in Revenues',
    description: 'Dividends received from other Constituent Entities are included in Revenues.',
    correctTreatment: 'Exclude dividends from Constituent Entities from both Related Party Revenues and Total Revenues.',
    reference: 'OECD Guidance May 2024, BEPS Action 13'
  },

  'CE-016': {
    id: 'CE-016',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors (May 2024)',
    title: 'Dividends Included in Profit/Loss',
    description: 'Dividends received from other Constituent Entities are included in Profit (Loss) before Income Tax.',
    correctTreatment: 'Exclude dividends from Constituent Entities from Profit (Loss) before Income Tax consistently with Revenue treatment.',
    reference: 'OECD Guidance May 2024, BEPS Action 13'
  },

  // ─────────────────────────────────────────
  // XML SCHEMA/CHARACTER ERRORS
  // ─────────────────────────────────────────

  'CE-017': {
    id: 'CE-017',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Ampersand',
    description: 'Unescaped ampersand (&) found in XML content.',
    correctTreatment: 'Replace & with &amp; in all text content.',
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-018': {
    id: 'CE-018',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Less Than',
    description: 'Unescaped less-than sign (<) found in XML content.',
    correctTreatment: 'Replace < with &lt; in all text content.',
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-019': {
    id: 'CE-019',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Greater Than',
    description: 'Unescaped greater-than sign (>) found in XML content.',
    correctTreatment: 'Replace > with &gt; in all text content.',
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-020': {
    id: 'CE-020',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Apostrophe',
    description: "Unescaped apostrophe (') found in XML attribute.",
    correctTreatment: "Replace ' with &apos; in attribute values.",
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-021': {
    id: 'CE-021',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Quote',
    description: 'Unescaped double quote (") found in XML attribute.',
    correctTreatment: 'Replace " with &quot; in attribute values.',
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-022': {
    id: 'CE-022',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Non-UTF-8 Encoding',
    description: 'XML file is not encoded in UTF-8.',
    correctTreatment: 'Ensure XML declaration specifies encoding="UTF-8" and file is actually saved as UTF-8.',
    reference: 'CbCR XML Schema User Guide, HMRC Error CbC-MNE-BR-014'
  },

  'CE-023': {
    id: 'CE-023',
    category: 'XML_WELLFORMEDNESS',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Prohibited Control Characters',
    description: 'XML contains control characters that cannot be represented even with escaping.',
    correctTreatment: 'Remove all control characters (0x00-0x1F except tab, newline, carriage return).',
    reference: 'CbCR XML Schema User Guide'
  },

  // ─────────────────────────────────────────
  // DATE/PERIOD ERRORS
  // ─────────────────────────────────────────

  'CE-024': {
    id: 'CE-024',
    category: 'BUSINESS_RULES',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Incorrect Reporting Period End Date',
    description: "ReportingPeriod does not reflect the last day of the MNE fiscal year.",
    correctTreatment: "ReportingPeriod must be the last day of the MNE Group's fiscal year (e.g., 2024-12-31 for calendar year).",
    reference: 'CbCR XML Schema User Guide, page 11'
  },

  'CE-025': {
    id: 'CE-025',
    category: 'BUSINESS_RULES',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Filing Date Used as Reporting Period',
    description: 'The date the CbC report was filed is incorrectly used as the ReportingPeriod.',
    correctTreatment: 'Use the fiscal year end date, not the filing date.',
    reference: 'CbC Report General Instructions, page 32'
  },

  'CE-026': {
    id: 'CE-026',
    category: 'BUSINESS_RULES',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Long Accounting Period Not Split',
    description: 'Single CbC report covers accounting period longer than 12 months.',
    correctTreatment: 'If fiscal period exceeds 12 months (e.g., 18-month transition), split into separate CbC reports or explain in Table 3.',
    reference: 'BEPS Action 13 Report, Part IV, Question 3.3'
  },

  // ─────────────────────────────────────────
  // BUSINESS ACTIVITY ERRORS
  // ─────────────────────────────────────────

  'CE-027': {
    id: 'CE-027',
    category: 'DATA_QUALITY',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Other (CBC513) Without Explanation',
    description: 'Business activity code CBC513 (Other) selected without explanation in Table 3.',
    correctTreatment: 'When using CBC513, provide detailed explanation in OtherEntityInfo or Table 3 Additional Information.',
    reference: 'CbC Report Specific Instructions'
  },

  'CE-028': {
    id: 'CE-028',
    category: 'DATA_QUALITY',
    severity: 'INFO',
    source: 'OECD Common Errors',
    title: 'Missing Data Source Explanation',
    description: 'Table 3 does not explain the sources of data used to prepare the CbC Report.',
    correctTreatment: 'Include explanation in Table 3 of whether data came from consolidation reporting packages, statutory accounts, regulatory reports, or other sources.',
    reference: 'BEPS Action 13 Report, Part IV, Question 4.1'
  }
};

export type OecdCommonErrorRuleId = keyof typeof OECD_COMMON_ERROR_RULES;

/**
 * Get an OECD Common Error rule by its ID
 */
export function getOecdCommonErrorRule(ruleId: string): OecdCommonErrorRule | undefined {
  return OECD_COMMON_ERROR_RULES[ruleId];
}

/**
 * Get all OECD Common Error rule IDs
 */
export function getOecdCommonErrorRuleIds(): string[] {
  return Object.keys(OECD_COMMON_ERROR_RULES);
}

