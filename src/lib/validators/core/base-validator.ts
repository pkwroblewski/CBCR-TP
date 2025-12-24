/**
 * Base Validator
 *
 * Abstract base class for all validators. Provides common utilities
 * for validation, result creation, and XPath navigation.
 *
 * @module lib/validators/core/base-validator
 */

import type { ParsedCbcReport, CbcReport, ConstituentEntity, Summary } from '@/types/cbcr';
import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import { ValidationContext } from './validation-context';
import {
  ResultBuilder,
  result,
  criticalResult,
  errorResult,
  warningResult,
  infoResult,
} from './result-builder';
import { isValidCountryCode, getCountryByCode, validateTinFormat } from '@/constants/countries';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Validator metadata
 */
export interface ValidatorMetadata {
  /** Unique identifier for this validator */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this validator checks */
  description: string;
  /** Validation category */
  category: ValidationCategory;
  /** Order in which this validator should run (lower = earlier) */
  order: number;
  /** Countries this validator applies to (empty = all) */
  applicableCountries?: string[];
  /** Whether this validator is enabled by default */
  enabled: boolean;
}

/**
 * Validator execution result
 */
export interface ValidatorExecutionResult {
  /** Validator ID */
  validatorId: string;
  /** Results produced by this validator */
  results: ValidationResult[];
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Whether execution completed successfully */
  success: boolean;
  /** Error message if execution failed */
  error?: string;
}

// =============================================================================
// ABSTRACT BASE VALIDATOR
// =============================================================================

/**
 * Abstract base class for all validators
 *
 * Extend this class to create new validators:
 *
 * @example
 * ```typescript
 * export class MyValidator extends BaseValidator {
 *   static metadata: ValidatorMetadata = {
 *     id: 'my-validator',
 *     name: 'My Custom Validator',
 *     description: 'Validates something specific',
 *     category: ValidationCategory.BUSINESS_RULES,
 *     order: 100,
 *     enabled: true,
 *   };
 *
 *   async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
 *     const results: ValidationResult[] = [];
 *     // ... validation logic
 *     return results;
 *   }
 * }
 * ```
 */
export abstract class BaseValidator {
  /**
   * Validator metadata - must be defined by subclasses
   */
  static metadata: ValidatorMetadata;
  
  /**
   * Main validation method - must be implemented by subclasses
   *
   * @param ctx - Validation context with report and options
   * @returns Array of validation results
   */
  abstract validate(ctx: ValidationContext): Promise<ValidationResult[]>;
  
  /**
   * Get the metadata for this validator
   */
  getMetadata(): ValidatorMetadata {
    return (this.constructor as typeof BaseValidator).metadata;
  }
  
  /**
   * Execute the validator with timing and error handling
   */
  async execute(ctx: ValidationContext): Promise<ValidatorExecutionResult> {
    const metadata = this.getMetadata();
    const startTime = Date.now();
    
    try {
      // Check if validator should run for this country
      if (!this.shouldRun(ctx)) {
        return {
          validatorId: metadata.id,
          results: [],
          executionTimeMs: 0,
          success: true,
        };
      }
      
      // Run validation
      const results = await this.validate(ctx);
      
      return {
        validatorId: metadata.id,
        results,
        executionTimeMs: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        validatorId: metadata.id,
        results: [
          criticalResult(
            'APP-005',
            `Validator ${metadata.id} failed: ${errorMessage}`,
            undefined
          ),
        ],
        executionTimeMs: Date.now() - startTime,
        success: false,
        error: errorMessage,
      };
    }
  }
  
  /**
   * Check if this validator should run based on context
   */
  protected shouldRun(ctx: ValidationContext): boolean {
    const metadata = this.getMetadata();
    
    // Check if validator is enabled
    if (!metadata.enabled) return false;
    
    // Check country applicability
    if (metadata.applicableCountries && metadata.applicableCountries.length > 0) {
      const country = ctx.options.country;
      if (!metadata.applicableCountries.includes(country)) {
        return false;
      }
    }
    
    // Check if category is in filter (if filter is set)
    if (ctx.options.categories.length > 0) {
      if (!ctx.options.categories.includes(metadata.category)) {
        return false;
      }
    }
    
    return true;
  }
  
  // ===========================================================================
  // RESULT BUILDER HELPERS
  // ===========================================================================
  
  /**
   * Create a new result builder
   */
  protected result(ruleId: string): ResultBuilder {
    return result(ruleId);
  }
  
  /**
   * Create a critical result
   */
  protected critical(ruleId: string, message: string, xpath?: string): ValidationResult {
    return criticalResult(ruleId, message, xpath);
  }
  
  /**
   * Create an error result
   */
  protected error(ruleId: string, message: string, xpath?: string): ValidationResult {
    return errorResult(ruleId, message, xpath);
  }
  
  /**
   * Create a warning result
   */
  protected warning(ruleId: string, message: string, xpath?: string): ValidationResult {
    return warningResult(ruleId, message, xpath);
  }
  
  /**
   * Create an info result
   */
  protected info(ruleId: string, message: string, xpath?: string): ValidationResult {
    return infoResult(ruleId, message, xpath);
  }
  
  // ===========================================================================
  // XPATH HELPERS
  // ===========================================================================
  
  /**
   * Build XPath for MessageSpec element
   */
  protected xpathMessageSpec(element?: string): string {
    const base = '/CBC_OECD/MessageSpec';
    return element ? `${base}/${element}` : base;
  }
  
  /**
   * Build XPath for ReportingEntity element
   */
  protected xpathReportingEntity(element?: string): string {
    const base = '/CBC_OECD/CbcBody/ReportingEntity';
    return element ? `${base}/${element}` : base;
  }
  
  /**
   * Build XPath for CbcReports element
   */
  protected xpathCbcReport(index: number, element?: string): string {
    const base = `/CBC_OECD/CbcBody/CbcReports[${index}]`;
    return element ? `${base}/${element}` : base;
  }
  
  /**
   * Build XPath for Summary element within a report
   */
  protected xpathSummary(reportIndex: number, element?: string): string {
    const base = `/CBC_OECD/CbcBody/CbcReports[${reportIndex}]/Summary`;
    return element ? `${base}/${element}` : base;
  }
  
  /**
   * Build XPath for ConstituentEntity within a report
   */
  protected xpathEntity(reportIndex: number, entityIndex: number, element?: string): string {
    const base = `/CBC_OECD/CbcBody/CbcReports[${reportIndex}]/ConstEntities/ConstituentEntity[${entityIndex}]`;
    return element ? `${base}/${element}` : base;
  }
  
  /**
   * Build XPath for AdditionalInfo element
   */
  protected xpathAdditionalInfo(index: number, element?: string): string {
    const base = `/CBC_OECD/CbcBody/AdditionalInfo[${index}]`;
    return element ? `${base}/${element}` : base;
  }
  
  // ===========================================================================
  // VALIDATION UTILITIES
  // ===========================================================================
  
  /**
   * Check if a country code is valid
   */
  protected isValidCountry(code: string): boolean {
    return isValidCountryCode(code);
  }
  
  /**
   * Get country info
   */
  protected getCountry(code: string) {
    return getCountryByCode(code);
  }
  
  /**
   * Validate TIN format for a country
   */
  protected validateTin(tin: string, countryCode: string): { valid: boolean; error?: string } {
    return validateTinFormat(tin, countryCode);
  }
  
  /**
   * Check if a string is empty or whitespace only
   */
  protected isEmpty(value: string | undefined | null): boolean {
    return !value || value.trim().length === 0;
  }
  
  /**
   * Check if a value is a valid date string (YYYY-MM-DD)
   */
  protected isValidDate(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
  
  /**
   * Check if a date is in the future
   */
  protected isFutureDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date > new Date();
  }
  
  /**
   * Check if a number is within a reasonable range
   */
  protected isReasonableAmount(value: number, min: number = -1e15, max: number = 1e15): boolean {
    return value >= min && value <= max && isFinite(value);
  }
  
  /**
   * Format a number for display in messages
   */
  protected formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value);
  }
  
  /**
   * Format a currency amount for display
   */
  protected formatCurrency(value: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  // ===========================================================================
  // REPORT ACCESS HELPERS
  // ===========================================================================
  
  /**
   * Get the message spec from context
   */
  protected getMessageSpec(ctx: ValidationContext) {
    return ctx.report.message.messageSpec;
  }
  
  /**
   * Get the CBC body from context
   */
  protected getCbcBody(ctx: ValidationContext) {
    return ctx.report.message.cbcBody;
  }
  
  /**
   * Get the reporting entity from context
   */
  protected getReportingEntity(ctx: ValidationContext) {
    return ctx.report.message.cbcBody.reportingEntity;
  }
  
  /**
   * Get all CBC reports from context
   */
  protected getCbcReports(ctx: ValidationContext) {
    return ctx.report.message.cbcBody.cbcReports;
  }
  
  /**
   * Get additional info elements from context
   */
  protected getAdditionalInfo(ctx: ValidationContext) {
    return ctx.report.message.cbcBody.additionalInfo ?? [];
  }
  
  /**
   * Iterate over all CBC reports with index
   */
  protected *iterateReports(ctx: ValidationContext): Generator<[CbcReport, number]> {
    const reports = this.getCbcReports(ctx);
    for (let i = 0; i < reports.length; i++) {
      yield [reports[i], i];
    }
  }
  
  /**
   * Iterate over all entities in all reports
   */
  protected *iterateEntities(
    ctx: ValidationContext
  ): Generator<[ConstituentEntity, number, CbcReport, number]> {
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const entities = report.constEntities.constituentEntity;
      for (let entityIndex = 0; entityIndex < entities.length; entityIndex++) {
        yield [entities[entityIndex], entityIndex, report, reportIndex];
      }
    }
  }
  
  /**
   * Get unique jurisdictions from reports
   */
  protected getJurisdictions(ctx: ValidationContext): string[] {
    return this.getCbcReports(ctx).map((r) => r.resCountryCode);
  }
}

// =============================================================================
// VALIDATOR REGISTRY
// =============================================================================

/**
 * Registry for all validators
 */
export class ValidatorRegistry {
  private validators: Map<string, BaseValidator> = new Map();
  
  /**
   * Register a validator
   */
  register(validator: BaseValidator): void {
    const metadata = validator.getMetadata();
    this.validators.set(metadata.id, validator);
  }
  
  /**
   * Get a validator by ID
   */
  get(id: string): BaseValidator | undefined {
    return this.validators.get(id);
  }
  
  /**
   * Get all validators sorted by order
   */
  getAll(): BaseValidator[] {
    return Array.from(this.validators.values()).sort(
      (a, b) => a.getMetadata().order - b.getMetadata().order
    );
  }
  
  /**
   * Get validators for a specific category
   */
  getByCategory(category: ValidationCategory): BaseValidator[] {
    return this.getAll().filter((v) => v.getMetadata().category === category);
  }
  
  /**
   * Get validators for a specific country
   */
  getForCountry(country: string): BaseValidator[] {
    return this.getAll().filter((v) => {
      const meta = v.getMetadata();
      return (
        !meta.applicableCountries ||
        meta.applicableCountries.length === 0 ||
        meta.applicableCountries.includes(country)
      );
    });
  }
  
  /**
   * Get all enabled validators
   */
  getEnabled(): BaseValidator[] {
    return this.getAll().filter((v) => v.getMetadata().enabled);
  }
}

/**
 * Global validator registry instance
 */
export const validatorRegistry = new ValidatorRegistry();

