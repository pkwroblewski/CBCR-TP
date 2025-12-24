/**
 * Validation Result Builder
 *
 * Fluent builder for creating ValidationResult objects with
 * automatic suggestion generation based on rule type.
 *
 * @module lib/validators/core/result-builder
 */

import {
  ValidationResult,
  ValidationCategory,
  ValidationSeverity,
} from '@/types/validation';
import { getValidationRule } from '@/constants/validation-rules';
import { getOecdErrorCode, getAppErrorCode } from '@/constants/error-codes';

// =============================================================================
// SUGGESTION TEMPLATES
// =============================================================================

/**
 * Suggestion templates based on rule ID prefix
 */
const SUGGESTION_TEMPLATES: Record<string, (details?: Record<string, unknown>) => string> = {
  'MSG-': () => 'Review the MessageSpec section and ensure all required fields are present and valid.',
  'DOC-': () => 'Check the DocSpec element and ensure DocRefId is unique and DocTypeIndic matches MessageTypeIndic.',
  'TIN-': (details) => details?.jurisdiction
    ? `Verify the TIN format matches ${details.jurisdiction} requirements.`
    : 'Verify the TIN format matches the requirements of the issuing jurisdiction.',
  'BIZ-': () => 'Select appropriate business activity codes (CBC501-CBC513) for each entity.',
  'SUM-': () => 'Review the Summary data and ensure all values are accurate and consistent.',
  'XFV-': () => 'Check cross-field relationships and ensure data consistency across the report.',
  'ENC-': () => 'Save the file with UTF-8 encoding without BOM.',
  'CC-': () => 'Use valid ISO 3166-1 Alpha-2 country codes.',
  'P2-': () => 'Review Pillar 2 implications and safe harbour eligibility.',
  'LU-': () => 'Review Luxembourg-specific requirements from the Administration des Contributions Directes.',
  'APP-': () => 'Review the file structure and try re-uploading.',
};

/**
 * Get suggestion based on rule ID
 */
function getSuggestionForRule(ruleId: string, details?: Record<string, unknown>): string | undefined {
  // Check for exact rule match first
  const rule = getValidationRule(ruleId);
  if (rule?.reference) {
    return `See ${rule.reference} for guidance.`;
  }
  
  // Check prefix-based templates
  for (const [prefix, template] of Object.entries(SUGGESTION_TEMPLATES)) {
    if (ruleId.startsWith(prefix)) {
      return template(details);
    }
  }
  
  // Check OECD error codes
  const oecdCode = parseInt(ruleId.replace(/\D/g, ''), 10);
  if (!isNaN(oecdCode)) {
    const errorDef = getOecdErrorCode(oecdCode);
    if (errorDef) {
      return errorDef.suggestedAction;
    }
  }
  
  // Check app error codes
  const appError = getAppErrorCode(ruleId);
  if (appError) {
    return appError.suggestedAction;
  }
  
  return undefined;
}

/**
 * Get reference based on rule ID
 */
function getReferenceForRule(ruleId: string): string | undefined {
  const rule = getValidationRule(ruleId);
  return rule?.reference;
}

// =============================================================================
// RESULT BUILDER CLASS
// =============================================================================

/**
 * Fluent builder for creating ValidationResult objects
 *
 * @example
 * ```typescript
 * const result = new ResultBuilder('MSG-001')
 *   .critical()
 *   .message('MessageRefId is missing')
 *   .xpath('/CBC_OECD/MessageSpec/MessageRefId')
 *   .build();
 * ```
 */
export class ResultBuilder {
  private result: Partial<ValidationResult>;
  
  constructor(ruleId: string) {
    this.result = {
      ruleId,
      // Default to data quality and warning
      category: ValidationCategory.DATA_QUALITY,
      severity: ValidationSeverity.WARNING,
    };
    
    // Try to auto-fill from known rules
    const rule = getValidationRule(ruleId);
    if (rule) {
      this.result.category = rule.category;
      this.result.severity = rule.defaultSeverity;
      this.result.reference = rule.reference;
    }
  }
  
  // ===========================================================================
  // SEVERITY METHODS
  // ===========================================================================
  
  /**
   * Set severity to CRITICAL
   */
  critical(): this {
    this.result.severity = ValidationSeverity.CRITICAL;
    return this;
  }
  
  /**
   * Set severity to ERROR
   */
  error(): this {
    this.result.severity = ValidationSeverity.ERROR;
    return this;
  }
  
  /**
   * Set severity to WARNING
   */
  warning(): this {
    this.result.severity = ValidationSeverity.WARNING;
    return this;
  }
  
  /**
   * Set severity to INFO
   */
  info(): this {
    this.result.severity = ValidationSeverity.INFO;
    return this;
  }
  
  /**
   * Set severity directly
   */
  severity(severity: ValidationSeverity): this {
    this.result.severity = severity;
    return this;
  }
  
  // ===========================================================================
  // CATEGORY METHODS
  // ===========================================================================
  
  /**
   * Set category to XML_WELLFORMEDNESS
   */
  xmlWellformedness(): this {
    this.result.category = ValidationCategory.XML_WELLFORMEDNESS;
    return this;
  }
  
  /**
   * Set category to SCHEMA_COMPLIANCE
   */
  schemaCompliance(): this {
    this.result.category = ValidationCategory.SCHEMA_COMPLIANCE;
    return this;
  }
  
  /**
   * Set category to BUSINESS_RULES
   */
  businessRules(): this {
    this.result.category = ValidationCategory.BUSINESS_RULES;
    return this;
  }
  
  /**
   * Set category to COUNTRY_RULES
   */
  countryRules(): this {
    this.result.category = ValidationCategory.COUNTRY_RULES;
    return this;
  }
  
  /**
   * Set category to DATA_QUALITY
   */
  dataQuality(): this {
    this.result.category = ValidationCategory.DATA_QUALITY;
    return this;
  }
  
  /**
   * Set category to PILLAR2_READINESS
   */
  pillar2(): this {
    this.result.category = ValidationCategory.PILLAR2_READINESS;
    return this;
  }
  
  /**
   * Set category directly
   */
  category(category: ValidationCategory): this {
    this.result.category = category;
    return this;
  }
  
  // ===========================================================================
  // CONTENT METHODS
  // ===========================================================================
  
  /**
   * Set the error message
   */
  message(msg: string): this {
    this.result.message = msg;
    return this;
  }
  
  /**
   * Set the XPath location
   */
  xpath(path: string): this {
    this.result.xpath = path;
    return this;
  }
  
  /**
   * Set additional details
   */
  details(details: Record<string, unknown>): this {
    this.result.details = details;
    return this;
  }
  
  /**
   * Add a detail entry
   */
  addDetail(key: string, value: unknown): this {
    if (!this.result.details) {
      this.result.details = {};
    }
    this.result.details[key] = value;
    return this;
  }
  
  /**
   * Set the suggestion
   */
  suggestion(text: string): this {
    this.result.suggestion = text;
    return this;
  }
  
  /**
   * Set the reference
   */
  reference(ref: string): this {
    this.result.reference = ref;
    return this;
  }
  
  /**
   * Set the OECD error code
   */
  oecdCode(code: number): this {
    this.result.oecdErrorCode = code;
    return this;
  }
  
  /**
   * Set the field name
   */
  field(name: string): this {
    this.result.fieldName = name;
    return this;
  }
  
  /**
   * Set actual and expected values
   */
  values(actual: string, expected?: string): this {
    this.result.actualValue = actual;
    if (expected) {
      this.result.expectedValue = expected;
    }
    return this;
  }
  
  // ===========================================================================
  // BUILD METHOD
  // ===========================================================================
  
  /**
   * Build the final ValidationResult
   *
   * Automatically generates suggestion and reference if not provided
   */
  build(): ValidationResult {
    // Ensure required fields
    if (!this.result.message) {
      this.result.message = 'Validation issue detected';
    }
    
    // Auto-generate suggestion if not provided
    if (!this.result.suggestion && this.result.ruleId) {
      this.result.suggestion = getSuggestionForRule(
        this.result.ruleId,
        this.result.details
      );
    }
    
    // Auto-generate reference if not provided
    if (!this.result.reference && this.result.ruleId) {
      this.result.reference = getReferenceForRule(this.result.ruleId);
    }
    
    return this.result as ValidationResult;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a new ResultBuilder
 */
export function result(ruleId: string): ResultBuilder {
  return new ResultBuilder(ruleId);
}

/**
 * Create a critical result
 */
export function criticalResult(
  ruleId: string,
  message: string,
  xpath?: string
): ValidationResult {
  const builder = new ResultBuilder(ruleId).critical().message(message);
  if (xpath) builder.xpath(xpath);
  return builder.build();
}

/**
 * Create an error result
 */
export function errorResult(
  ruleId: string,
  message: string,
  xpath?: string
): ValidationResult {
  const builder = new ResultBuilder(ruleId).error().message(message);
  if (xpath) builder.xpath(xpath);
  return builder.build();
}

/**
 * Create a warning result
 */
export function warningResult(
  ruleId: string,
  message: string,
  xpath?: string
): ValidationResult {
  const builder = new ResultBuilder(ruleId).warning().message(message);
  if (xpath) builder.xpath(xpath);
  return builder.build();
}

/**
 * Create an info result
 */
export function infoResult(
  ruleId: string,
  message: string,
  xpath?: string
): ValidationResult {
  const builder = new ResultBuilder(ruleId).info().message(message);
  if (xpath) builder.xpath(xpath);
  return builder.build();
}

// =============================================================================
// RESULT AGGREGATION
// =============================================================================

/**
 * Count results by severity
 */
export function countBySeverity(results: ValidationResult[]): Record<ValidationSeverity, number> {
  const counts: Record<ValidationSeverity, number> = {
    [ValidationSeverity.CRITICAL]: 0,
    [ValidationSeverity.ERROR]: 0,
    [ValidationSeverity.WARNING]: 0,
    [ValidationSeverity.INFO]: 0,
  };
  
  for (const result of results) {
    counts[result.severity]++;
  }
  
  return counts;
}

/**
 * Count results by category
 */
export function countByCategory(results: ValidationResult[]): Record<ValidationCategory, number> {
  const counts: Record<ValidationCategory, number> = {
    [ValidationCategory.XML_WELLFORMEDNESS]: 0,
    [ValidationCategory.SCHEMA_COMPLIANCE]: 0,
    [ValidationCategory.BUSINESS_RULES]: 0,
    [ValidationCategory.COUNTRY_RULES]: 0,
    [ValidationCategory.DATA_QUALITY]: 0,
    [ValidationCategory.PILLAR2_READINESS]: 0,
  };
  
  for (const result of results) {
    counts[result.category]++;
  }
  
  return counts;
}

/**
 * Sort results by severity (critical first)
 */
export function sortBySeverity(results: ValidationResult[]): ValidationResult[] {
  const severityOrder: ValidationSeverity[] = [
    ValidationSeverity.CRITICAL,
    ValidationSeverity.ERROR,
    ValidationSeverity.WARNING,
    ValidationSeverity.INFO,
  ];
  
  return [...results].sort((a, b) => {
    return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
  });
}

/**
 * Group results by category
 */
export function groupByCategory(
  results: ValidationResult[]
): Map<ValidationCategory, ValidationResult[]> {
  const groups = new Map<ValidationCategory, ValidationResult[]>();
  
  for (const result of results) {
    const existing = groups.get(result.category) ?? [];
    existing.push(result);
    groups.set(result.category, existing);
  }
  
  return groups;
}

/**
 * Filter results to only critical and error
 */
export function getProblems(results: ValidationResult[]): ValidationResult[] {
  return results.filter(
    (r) => r.severity === ValidationSeverity.CRITICAL || r.severity === ValidationSeverity.ERROR
  );
}

