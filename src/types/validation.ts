/**
 * Validation-related type definitions
 * Used by the validation engine to report issues
 *
 * @module types/validation
 */

/**
 * Validation severity levels as defined in project guidelines
 * Maps to color coding: Red (critical), Orange (error), Yellow (warning), Blue (info)
 */
export enum ValidationSeverity {
  /** Filing will be rejected by tax authority */
  CRITICAL = 'critical',
  /** May cause processing issues */
  ERROR = 'error',
  /** Data quality concern */
  WARNING = 'warning',
  /** Best practice suggestion */
  INFO = 'info',
}

/**
 * Validation category types
 * Groups validation rules by their functional area
 */
export enum ValidationCategory {
  /** Valid XML structure, UTF-8 encoding, well-formedness */
  XML_WELLFORMEDNESS = 'xml_wellformedness',
  /** OECD CbC-Schema-v2.0 compliance */
  SCHEMA_COMPLIANCE = 'schema_compliance',
  /** DocRefId uniqueness, MessageTypeIndic matching */
  BUSINESS_RULES = 'business_rules',
  /** Luxembourg TIN format, deadlines, country-specific requirements */
  COUNTRY_RULES = 'country_rules',
  /** Cross-field validation, reasonableness checks */
  DATA_QUALITY = 'data_quality',
  /** GloBE safe harbour eligibility assessment */
  PILLAR2_READINESS = 'pillar2_readiness',
}

/**
 * Validation status for a report
 */
export type ValidationStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Individual validation result/finding
 * Represents a single issue or observation from validation
 */
export interface ValidationResult {
  /**
   * Unique identifier for the validation rule
   * @example "MSG-001", "DOC-003", "TIN-002"
   */
  ruleId: string;

  /**
   * Category of the validation rule
   */
  category: ValidationCategory;

  /**
   * Severity level of the finding
   */
  severity: ValidationSeverity;

  /**
   * Human-readable description of the issue
   */
  message: string;

  /**
   * XPath location in the XML where the issue was found
   * @example "/CBC_OECD/CbcBody/CbcReports[1]/Summary/TaxPaid"
   */
  xpath?: string;

  /**
   * Additional context about the finding
   */
  details?: Record<string, unknown>;

  /**
   * Suggested fix or recommendation
   */
  suggestion?: string;

  /**
   * Reference to OECD guidance or documentation
   */
  reference?: string;

  /**
   * OECD error code if applicable (50000-59999, 80000-89999)
   */
  oecdErrorCode?: number;

  /**
   * Field or element name that triggered the issue
   */
  fieldName?: string;

  /**
   * Actual value that caused the issue
   */
  actualValue?: string;

  /**
   * Expected value or format
   */
  expectedValue?: string;
}

/**
 * Summary of validation findings by severity
 */
export interface ValidationSummary {
  /** Count of critical issues (filing rejected) */
  critical: number;
  /** Count of error issues (may cause problems) */
  errors: number;
  /** Count of warning issues (data quality) */
  warnings: number;
  /** Count of info issues (best practices) */
  info: number;
  /** Count of rules that passed without issues */
  passed: number;
  /** Total number of rules evaluated */
  total: number;
}

/**
 * Complete validation report for a CbC file
 */
export interface ValidationReport {
  /**
   * Unique identifier for this validation run
   */
  id: string;

  /**
   * Original file name that was validated
   */
  filename: string;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * Timestamp when the file was uploaded
   */
  uploadedAt: string;

  /**
   * Timestamp when validation started
   */
  startedAt?: string;

  /**
   * Timestamp when validation completed
   */
  completedAt?: string;

  /**
   * Duration of validation in milliseconds
   */
  durationMs?: number;

  /**
   * Current status of validation
   */
  status: ValidationStatus;

  /**
   * Whether the report passed all critical validations
   */
  isValid: boolean;

  /**
   * Fiscal year end date from the report
   * @example "2023-12-31"
   */
  fiscalYear?: string;

  /**
   * Ultimate Parent Entity jurisdiction (ISO 3166-1 Alpha-2)
   * @example "LU"
   */
  upeJurisdiction?: string;

  /**
   * Ultimate Parent Entity name
   */
  upeName?: string;

  /**
   * MessageRefId from the validated report
   */
  messageRefId?: string;

  /**
   * Number of jurisdictions in the report
   */
  jurisdictionCount?: number;

  /**
   * Number of constituent entities in the report
   */
  entityCount?: number;

  /**
   * Summary counts by severity
   */
  summary: ValidationSummary;

  /**
   * Summary counts by category
   */
  byCategory: Record<ValidationCategory, number>;

  /**
   * All validation findings
   */
  results: ValidationResult[];

  /**
   * User ID who uploaded the file (for audit trail)
   */
  userId?: string;

  /**
   * Any parsing errors encountered
   */
  parsingErrors?: string[];
}

/**
 * Validation rule definition
 * Used to define individual validation rules in the engine
 */
export interface ValidationRule {
  /**
   * Unique identifier for this rule
   * @example "MSG-001", "DOC-003", "TIN-002"
   */
  ruleId: string;

  /**
   * Short name for the rule
   */
  name: string;

  /**
   * Rule category
   */
  category: ValidationCategory;

  /**
   * Default severity (can be overridden by country rules)
   */
  defaultSeverity: ValidationSeverity;

  /**
   * Human-readable description of what the rule checks
   */
  description: string;

  /**
   * Reference to OECD guidance or specification
   */
  reference?: string;

  /**
   * OECD error code if this rule maps to one
   */
  oecdErrorCode?: number;

  /**
   * Whether this rule is enabled by default
   */
  enabled: boolean;

  /**
   * Jurisdictions where this rule applies (empty = all)
   */
  applicableJurisdictions?: string[];

  /**
   * XPath pattern where this rule applies
   */
  xpathPattern?: string;
}

/**
 * Validation configuration options
 */
export interface ValidationOptions {
  /**
   * Jurisdiction-specific rules to apply
   * @example ["LU"] for Luxembourg-specific checks
   */
  jurisdictions?: string[];

  /**
   * Include Pillar 2 readiness checks
   */
  includePillar2?: boolean;

  /**
   * Stop validation on first critical error
   */
  failFast?: boolean;

  /**
   * Maximum number of issues to report (0 = unlimited)
   */
  maxIssues?: number;

  /**
   * Minimum severity level to report
   */
  minSeverity?: ValidationSeverity;

  /**
   * Categories to validate (empty = all)
   */
  categories?: ValidationCategory[];

  /**
   * Specific rules to skip by ruleId
   */
  skipRules?: string[];

  /**
   * Include passed rules in the report
   */
  includePassedRules?: boolean;

  /**
   * Validate against test environment (OECD10-13 indicators)
   */
  testMode?: boolean;
}

/**
 * Validation progress update (for real-time UI updates)
 */
export interface ValidationProgress {
  /** Current phase of validation */
  phase: 'parsing' | 'schema' | 'business_rules' | 'country_rules' | 'data_quality' | 'pillar2' | 'complete' | 'error';
  /** Percentage complete (0-100) */
  percentage: number;
  /** Current operation description */
  message: string;
  /** Issues found so far */
  issuesFound: number;
}
