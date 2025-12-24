/**
 * Validation Engine
 *
 * Main orchestrator for CbCR validation. Runs validators in the correct
 * order, aggregates results, and generates summary statistics.
 *
 * @module lib/validators/core/validator
 */

import type { ParsedCbcReport } from '@/types/cbcr';
import {
  ValidationReport,
  ValidationResult,
  ValidationSummary,
  ValidationCategory,
  ValidationSeverity,
  ValidationProgress,
} from '@/types/validation';
import {
  ValidationContext,
  ExtendedValidationOptions,
  DEFAULT_VALIDATION_OPTIONS,
} from './validation-context';
import { BaseValidator, ValidatorRegistry, validatorRegistry } from './base-validator';
import { countBySeverity, countByCategory, sortBySeverity } from './result-builder';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Validation engine configuration
 */
export interface ValidationEngineConfig {
  /** Custom validator registry (default: global registry) */
  registry?: ValidatorRegistry;
  
  /** Progress callback for real-time updates */
  onProgress?: (progress: ValidationProgress) => void;
  
  /** Enable parallel validator execution where possible */
  parallel?: boolean;
  
  /** Maximum parallel validators */
  maxParallel?: number;
}

/**
 * Validation phase definition
 */
interface ValidationPhase {
  name: string;
  category: ValidationCategory;
  order: number;
}

// =============================================================================
// VALIDATION PHASES
// =============================================================================

const VALIDATION_PHASES: ValidationPhase[] = [
  { name: 'parsing', category: ValidationCategory.XML_WELLFORMEDNESS, order: 1 },
  { name: 'schema', category: ValidationCategory.SCHEMA_COMPLIANCE, order: 2 },
  { name: 'business_rules', category: ValidationCategory.BUSINESS_RULES, order: 3 },
  { name: 'country_rules', category: ValidationCategory.COUNTRY_RULES, order: 4 },
  { name: 'data_quality', category: ValidationCategory.DATA_QUALITY, order: 5 },
  { name: 'pillar2', category: ValidationCategory.PILLAR2_READINESS, order: 6 },
];

// =============================================================================
// VALIDATION ENGINE
// =============================================================================

/**
 * Main validation engine for CbCR reports
 *
 * @example
 * ```typescript
 * const engine = new ValidationEngine();
 *
 * // Register custom validators
 * engine.registerValidator(new MyCustomValidator());
 *
 * // Run validation
 * const report = await engine.validate(parsedReport, {
 *   country: 'LU',
 *   checkPillar2: true,
 * });
 *
 * console.log(`Valid: ${report.isValid}`);
 * console.log(`Critical: ${report.summary.critical}`);
 * ```
 */
export class ValidationEngine {
  private registry: ValidatorRegistry;
  private config: ValidationEngineConfig;
  
  constructor(config: ValidationEngineConfig = {}) {
    this.registry = config.registry ?? validatorRegistry;
    this.config = {
      parallel: false,
      maxParallel: 4,
      ...config,
    };
  }
  
  // ===========================================================================
  // VALIDATOR REGISTRATION
  // ===========================================================================
  
  /**
   * Register a validator with the engine
   */
  registerValidator(validator: BaseValidator): this {
    this.registry.register(validator);
    return this;
  }
  
  /**
   * Register multiple validators
   */
  registerValidators(validators: BaseValidator[]): this {
    for (const validator of validators) {
      this.registry.register(validator);
    }
    return this;
  }
  
  /**
   * Get all registered validators
   */
  getValidators(): BaseValidator[] {
    return this.registry.getAll();
  }
  
  // ===========================================================================
  // MAIN VALIDATION METHOD
  // ===========================================================================
  
  /**
   * Validate a parsed CbC report
   *
   * @param report - The parsed CbC report to validate
   * @param options - Validation options
   * @returns Comprehensive validation report
   */
  async validate(
    report: ParsedCbcReport,
    options?: Partial<ExtendedValidationOptions>
  ): Promise<ValidationReport> {
    const startTime = Date.now();
    const validationId = this.generateValidationId();
    
    // Merge options with defaults
    const mergedOptions: ExtendedValidationOptions = {
      ...DEFAULT_VALIDATION_OPTIONS,
      ...options,
    };
    
    // Create validation context
    const ctx = new ValidationContext(report, mergedOptions);
    
    // Report progress: starting
    this.reportProgress({
      phase: 'parsing',
      percentage: 0,
      message: 'Starting validation...',
      issuesFound: 0,
    });
    
    // Run validators by phase
    const allResults: ValidationResult[] = [];
    let phaseIndex = 0;
    
    for (const phase of VALIDATION_PHASES) {
      // Skip Pillar 2 if not requested
      if (phase.category === ValidationCategory.PILLAR2_READINESS && !mergedOptions.checkPillar2) {
        continue;
      }
      
      // Start phase timing
      ctx.startPhase(phase.name);
      
      // Report progress
      const percentage = Math.round((phaseIndex / VALIDATION_PHASES.length) * 100);
      this.reportProgress({
        phase: phase.name as ValidationProgress['phase'],
        percentage,
        message: `Running ${phase.name.replace('_', ' ')} checks...`,
        issuesFound: allResults.length,
      });
      
      // Get validators for this phase
      const validators = this.registry.getByCategory(phase.category);
      
      // Execute validators
      const phaseResults = await this.executePhase(validators, ctx);
      allResults.push(...phaseResults);
      
      // End phase timing
      ctx.endPhase();
      
      // Check if we should stop (failFast)
      if (ctx.shouldStopValidation()) {
        break;
      }
      
      phaseIndex++;
    }
    
    // Add any results from context (collected during validation)
    allResults.push(...ctx.getResults());
    
    // Deduplicate results
    const uniqueResults = this.deduplicateResults(allResults);
    
    // Sort results by severity
    const sortedResults = sortBySeverity(uniqueResults);
    
    // Calculate summary
    const summary = this.calculateSummary(sortedResults);
    const byCategory = countByCategory(sortedResults);
    
    // Determine validity
    const isValid = summary.critical === 0;
    
    // Report progress: complete
    this.reportProgress({
      phase: 'complete',
      percentage: 100,
      message: isValid ? 'Validation passed' : 'Validation found issues',
      issuesFound: sortedResults.length,
    });
    
    // Build validation report
    const validationReport: ValidationReport = {
      id: validationId,
      filename: report.fileName,
      fileSize: report.fileSize,
      uploadedAt: new Date().toISOString(),
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'completed',
      isValid,
      fiscalYear: report.message.messageSpec.reportingPeriod,
      upeJurisdiction: report.message.messageSpec.sendingCompetentAuthority,
      upeName: report.message.cbcBody.reportingEntity.name[0]?.value,
      messageRefId: report.message.messageSpec.messageRefId,
      jurisdictionCount: ctx.getJurisdictionCount(),
      entityCount: ctx.getTotalEntityCount(),
      summary,
      byCategory,
      results: sortedResults,
    };
    
    return validationReport;
  }
  
  // ===========================================================================
  // PHASE EXECUTION
  // ===========================================================================
  
  /**
   * Execute all validators for a phase
   */
  private async executePhase(
    validators: BaseValidator[],
    ctx: ValidationContext
  ): Promise<ValidationResult[]> {
    if (validators.length === 0) {
      return [];
    }
    
    const results: ValidationResult[] = [];
    
    if (this.config.parallel && validators.length > 1) {
      // Parallel execution
      const chunks = this.chunkArray(validators, this.config.maxParallel ?? 4);
      
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map((v) => v.execute(ctx))
        );
        
        for (const result of chunkResults) {
          results.push(...result.results);
        }
        
        if (ctx.shouldStopValidation()) break;
      }
    } else {
      // Sequential execution
      for (const validator of validators) {
        const result = await validator.execute(ctx);
        results.push(...result.results);
        
        if (ctx.shouldStopValidation()) break;
      }
    }
    
    return results;
  }
  
  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================
  
  /**
   * Generate a unique validation ID
   */
  private generateValidationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `val_${timestamp}_${random}`;
  }
  
  /**
   * Report progress if callback is configured
   */
  private reportProgress(progress: ValidationProgress): void {
    if (this.config.onProgress) {
      this.config.onProgress(progress);
    }
  }
  
  /**
   * Calculate validation summary from results
   */
  private calculateSummary(results: ValidationResult[]): ValidationSummary {
    const severityCounts = countBySeverity(results);
    
    // Count passed rules (would need to track evaluated rules)
    // For now, we'll use total - issues as an approximation
    const totalRulesEvaluated = results.length + 50; // Approximation
    
    return {
      critical: severityCounts[ValidationSeverity.CRITICAL],
      errors: severityCounts[ValidationSeverity.ERROR],
      warnings: severityCounts[ValidationSeverity.WARNING],
      info: severityCounts[ValidationSeverity.INFO],
      passed: Math.max(0, totalRulesEvaluated - results.length),
      total: totalRulesEvaluated,
    };
  }
  
  /**
   * Deduplicate results by ruleId + xpath
   */
  private deduplicateResults(results: ValidationResult[]): ValidationResult[] {
    const seen = new Set<string>();
    const unique: ValidationResult[] = [];
    
    for (const result of results) {
      const key = `${result.ruleId}|${result.xpath ?? ''}|${result.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }
    
    return unique;
  }
  
  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  // ===========================================================================
  // QUICK VALIDATION METHODS
  // ===========================================================================
  
  /**
   * Quick validation - only critical checks
   */
  async quickValidate(report: ParsedCbcReport): Promise<{
    isValid: boolean;
    criticalIssues: ValidationResult[];
  }> {
    const result = await this.validate(report, {
      failFast: true,
      minSeverity: ValidationSeverity.CRITICAL,
      checkPillar2: false,
    });
    
    return {
      isValid: result.isValid,
      criticalIssues: result.results.filter(
        (r) => r.severity === ValidationSeverity.CRITICAL
      ),
    };
  }
  
  /**
   * Validate specific category only
   */
  async validateCategory(
    report: ParsedCbcReport,
    category: ValidationCategory,
    options?: Partial<ExtendedValidationOptions>
  ): Promise<ValidationResult[]> {
    const result = await this.validate(report, {
      ...options,
      categories: [category],
    });
    
    return result.results;
  }
  
  /**
   * Check if report meets minimum requirements
   */
  async meetsMinimumRequirements(report: ParsedCbcReport): Promise<boolean> {
    const result = await this.validate(report, {
      categories: [
        ValidationCategory.XML_WELLFORMEDNESS,
        ValidationCategory.SCHEMA_COMPLIANCE,
      ],
      failFast: true,
    });
    
    return result.isValid;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Default validation engine instance
 */
let defaultEngine: ValidationEngine | null = null;

/**
 * Get the default validation engine instance
 */
export function getValidationEngine(): ValidationEngine {
  if (!defaultEngine) {
    defaultEngine = new ValidationEngine();
  }
  return defaultEngine;
}

/**
 * Create a new validation engine with custom config
 */
export function createValidationEngine(config?: ValidationEngineConfig): ValidationEngine {
  return new ValidationEngine(config);
}

/**
 * Validate a report using the default engine
 */
export async function validateReport(
  report: ParsedCbcReport,
  options?: Partial<ExtendedValidationOptions>
): Promise<ValidationReport> {
  return getValidationEngine().validate(report, options);
}

