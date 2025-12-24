/**
 * Validation Context
 *
 * Maintains state during validation process, including:
 * - Seen DocRefIds for uniqueness checking
 * - Parsed entities for cross-referencing
 * - Configuration options
 * - Accumulated results
 *
 * @module lib/validators/core/validation-context
 */

import type { ParsedCbcReport, CbcReport, ConstituentEntity } from '@/types/cbcr';
import type {
  ValidationResult,
  ValidationOptions,
  ValidationCategory,
  ValidationSeverity,
} from '@/types/validation';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Extended validation options with all configurable parameters
 */
export interface ExtendedValidationOptions extends ValidationOptions {
  /** Primary country for country-specific rules (default: 'LU') */
  country?: string;

  /** Fiscal year for deadline calculations */
  fiscalYear?: string;

  /** Check Pillar 2 safe harbour eligibility */
  checkPillar2?: boolean;

  /** Check DocRefId uniqueness against global database */
  checkGlobalDocRefIds?: boolean;

  /** Enable strict mode (treat warnings as errors) */
  strictMode?: boolean;

  /** Stop on first critical error */
  failFast?: boolean;

  /** Maximum number of issues to report (0 = unlimited) */
  maxIssues?: number;

  /** Track validation timing */
  trackTiming?: boolean;
}

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: Required<ExtendedValidationOptions> = {
  country: 'LU',
  fiscalYear: new Date().getFullYear().toString(),
  checkPillar2: true,
  checkGlobalDocRefIds: true,
  strictMode: false,
  failFast: false,
  maxIssues: 0,
  trackTiming: false,
  jurisdictions: [],
  includePillar2: true,
  minSeverity: 'info' as ValidationSeverity,
  categories: [],
  skipRules: [],
  includePassedRules: false,
  testMode: false,
};

/**
 * Entity reference for cross-validation
 */
export interface EntityReference {
  /** DocRefId of the entity's parent report */
  reportDocRefId: string;
  /** Jurisdiction code */
  jurisdiction: string;
  /** Entity name */
  name: string;
  /** Entity TINs */
  tins: string[];
  /** Entity index in the report */
  index: number;
}

/**
 * Jurisdiction reference for cross-validation
 */
export interface JurisdictionReference {
  /** Country code */
  code: string;
  /** DocRefId of the CbcReport */
  docRefId: string;
  /** Number of entities */
  entityCount: number;
  /** Total revenues */
  totalRevenues: number;
  /** Unrelated party revenues */
  unrelatedRevenues: number;
  /** Related party revenues */
  relatedRevenues: number;
  /** Profit or loss */
  profitOrLoss: number;
  /** Tax paid */
  taxPaid: number;
  /** Tax accrued */
  taxAccrued: number;
  /** Number of employees */
  employees: number;
  /** Tangible assets (property, plant, equipment) */
  tangibleAssets: number;
  /** Stated capital */
  capital: number;
  /** Accumulated earnings */
  accumulatedEarnings: number;
  /** Currency code for the amounts */
  currencyCode?: string;
}

/**
 * Timing information for validation phases
 */
export interface ValidationTiming {
  phase: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
}

// =============================================================================
// VALIDATION CONTEXT CLASS
// =============================================================================

/**
 * ValidationContext maintains state during the validation process
 *
 * It provides:
 * - DocRefId tracking for uniqueness validation
 * - Entity and jurisdiction cross-referencing
 * - Result accumulation
 * - Configuration access
 */
export class ValidationContext {
  /** The report being validated */
  public readonly report: ParsedCbcReport;
  
  /** Merged validation options */
  public readonly options: Required<ExtendedValidationOptions>;
  
  /** Accumulated validation results */
  private results: ValidationResult[] = [];
  
  /** Set of seen DocRefIds for uniqueness checking */
  private seenDocRefIds: Map<string, string> = new Map(); // docRefId -> xpath
  
  /** Set of seen MessageRefIds */
  private seenMessageRefIds: Set<string> = new Set();
  
  /** Entity references for cross-validation */
  private entityReferences: EntityReference[] = [];
  
  /** Jurisdiction references for cross-validation */
  private jurisdictionReferences: Map<string, JurisdictionReference> = new Map();
  
  /** Validation timing information */
  private timings: ValidationTiming[] = [];
  
  /** Current validation phase */
  private currentPhase: string = 'initialization';
  
  /** Whether validation should stop (failFast triggered) */
  private shouldStop: boolean = false;
  
  constructor(report: ParsedCbcReport, options?: Partial<ExtendedValidationOptions>) {
    this.report = report;
    this.options = {
      ...DEFAULT_VALIDATION_OPTIONS,
      ...options,
    };
    
    // Build entity and jurisdiction references
    this.buildReferences();
  }
  
  // ===========================================================================
  // RESULT MANAGEMENT
  // ===========================================================================
  
  /**
   * Add a validation result
   */
  addResult(result: ValidationResult): void {
    // Check if we should skip this result
    if (this.shouldStop) return;
    
    // Check if rule is in skip list
    if (this.options.skipRules.includes(result.ruleId)) return;
    
    // Check minimum severity
    if (this.options.minSeverity) {
      const severityOrder = ['info', 'warning', 'error', 'critical'];
      const minIndex = severityOrder.indexOf(this.options.minSeverity);
      const resultIndex = severityOrder.indexOf(result.severity);
      if (resultIndex < minIndex) return;
    }
    
    // Check category filter
    if (this.options.categories.length > 0 && !this.options.categories.includes(result.category)) {
      return;
    }
    
    // In strict mode, upgrade warnings to errors
    if (this.options.strictMode && result.severity === 'warning') {
      result = { ...result, severity: 'error' as ValidationSeverity };
    }
    
    this.results.push(result);
    
    // Check failFast
    if (this.options.failFast && result.severity === 'critical') {
      this.shouldStop = true;
    }
    
    // Check maxIssues
    if (this.options.maxIssues > 0 && this.results.length >= this.options.maxIssues) {
      this.shouldStop = true;
    }
  }
  
  /**
   * Add multiple validation results
   */
  addResults(results: ValidationResult[]): void {
    for (const result of results) {
      this.addResult(result);
      if (this.shouldStop) break;
    }
  }
  
  /**
   * Get all accumulated results
   */
  getResults(): ValidationResult[] {
    return [...this.results];
  }
  
  /**
   * Check if validation should stop
   */
  shouldStopValidation(): boolean {
    return this.shouldStop;
  }
  
  /**
   * Get results by severity
   */
  getResultsBySeverity(severity: ValidationSeverity): ValidationResult[] {
    return this.results.filter((r) => r.severity === severity);
  }
  
  /**
   * Get results by category
   */
  getResultsByCategory(category: ValidationCategory): ValidationResult[] {
    return this.results.filter((r) => r.category === category);
  }
  
  /**
   * Check if there are any critical errors
   */
  hasCriticalErrors(): boolean {
    return this.results.some((r) => r.severity === 'critical');
  }
  
  // ===========================================================================
  // DOC REF ID TRACKING
  // ===========================================================================
  
  /**
   * Register a DocRefId and check for duplicates
   * @returns true if unique, false if duplicate
   */
  registerDocRefId(docRefId: string, xpath: string): boolean {
    if (this.seenDocRefIds.has(docRefId)) {
      return false;
    }
    this.seenDocRefIds.set(docRefId, xpath);
    return true;
  }
  
  /**
   * Check if a DocRefId has been seen
   */
  hasDocRefId(docRefId: string): boolean {
    return this.seenDocRefIds.has(docRefId);
  }
  
  /**
   * Get the xpath where a DocRefId was first seen
   */
  getDocRefIdLocation(docRefId: string): string | undefined {
    return this.seenDocRefIds.get(docRefId);
  }
  
  /**
   * Get all registered DocRefIds
   */
  getAllDocRefIds(): string[] {
    return Array.from(this.seenDocRefIds.keys());
  }
  
  // ===========================================================================
  // MESSAGE REF ID TRACKING
  // ===========================================================================
  
  /**
   * Register a MessageRefId
   */
  registerMessageRefId(messageRefId: string): void {
    this.seenMessageRefIds.add(messageRefId);
  }
  
  /**
   * Check if a MessageRefId has been seen
   */
  hasMessageRefId(messageRefId: string): boolean {
    return this.seenMessageRefIds.has(messageRefId);
  }
  
  // ===========================================================================
  // ENTITY REFERENCES
  // ===========================================================================
  
  /**
   * Build entity and jurisdiction references from the report
   */
  private buildReferences(): void {
    const cbcReports = this.report.message.cbcBody.cbcReports;

    for (const report of cbcReports) {
      // Build jurisdiction reference with all available Table 1 data
      const jurisdictionRef: JurisdictionReference = {
        code: report.resCountryCode,
        docRefId: report.docSpec.docRefId,
        entityCount: report.constEntities.constituentEntity.length,
        totalRevenues: report.summary.totalRevenues.value,
        unrelatedRevenues: report.summary.unrelatedRevenues?.value ?? 0,
        relatedRevenues: report.summary.relatedRevenues?.value ?? 0,
        profitOrLoss: report.summary.profitOrLoss.value,
        taxPaid: report.summary.taxPaid.value,
        taxAccrued: report.summary.taxAccrued.value,
        employees: report.summary.numberOfEmployees,
        tangibleAssets: report.summary.tangibleAssets.value,
        capital: report.summary.capital.value,
        accumulatedEarnings: report.summary.accumulatedEarnings.value,
        currencyCode: report.summary.totalRevenues.currCode,
      };
      this.jurisdictionReferences.set(report.resCountryCode, jurisdictionRef);
      
      // Build entity references
      report.constEntities.constituentEntity.forEach((entity, index) => {
        const entityRef: EntityReference = {
          reportDocRefId: report.docSpec.docRefId,
          jurisdiction: report.resCountryCode,
          name: entity.name[0]?.value ?? 'Unknown',
          tins: entity.tin?.map((t) => t.value) ?? [],
          index,
        };
        this.entityReferences.push(entityRef);
      });
    }
  }
  
  /**
   * Get all entity references
   */
  getEntityReferences(): EntityReference[] {
    return [...this.entityReferences];
  }
  
  /**
   * Get entity references by jurisdiction
   */
  getEntitiesByJurisdiction(jurisdiction: string): EntityReference[] {
    return this.entityReferences.filter((e) => e.jurisdiction === jurisdiction);
  }
  
  /**
   * Find entity by TIN
   */
  findEntityByTin(tin: string): EntityReference | undefined {
    return this.entityReferences.find((e) => e.tins.includes(tin));
  }
  
  /**
   * Find entity by name (partial match)
   */
  findEntitiesByName(name: string): EntityReference[] {
    const lowerName = name.toLowerCase();
    return this.entityReferences.filter((e) => 
      e.name.toLowerCase().includes(lowerName)
    );
  }
  
  // ===========================================================================
  // JURISDICTION REFERENCES
  // ===========================================================================
  
  /**
   * Get all jurisdiction references
   */
  getJurisdictionReferences(): JurisdictionReference[] {
    return Array.from(this.jurisdictionReferences.values());
  }
  
  /**
   * Get jurisdiction reference by country code
   */
  getJurisdiction(countryCode: string): JurisdictionReference | undefined {
    return this.jurisdictionReferences.get(countryCode);
  }
  
  /**
   * Check if a jurisdiction exists in the report
   */
  hasJurisdiction(countryCode: string): boolean {
    return this.jurisdictionReferences.has(countryCode);
  }
  
  /**
   * Get total count of jurisdictions
   */
  getJurisdictionCount(): number {
    return this.jurisdictionReferences.size;
  }
  
  /**
   * Get total count of entities across all jurisdictions
   */
  getTotalEntityCount(): number {
    return this.entityReferences.length;
  }
  
  // ===========================================================================
  // TIMING
  // ===========================================================================
  
  /**
   * Start timing a validation phase
   */
  startPhase(phase: string): void {
    this.currentPhase = phase;
    if (this.options.trackTiming) {
      this.timings.push({
        phase,
        startTime: Date.now(),
      });
    }
  }
  
  /**
   * End timing the current phase
   */
  endPhase(): void {
    if (this.options.trackTiming && this.timings.length > 0) {
      const current = this.timings[this.timings.length - 1];
      if (!current.endTime) {
        current.endTime = Date.now();
        current.durationMs = current.endTime - current.startTime;
      }
    }
  }
  
  /**
   * Get current phase
   */
  getCurrentPhase(): string {
    return this.currentPhase;
  }
  
  /**
   * Get all timing information
   */
  getTimings(): ValidationTiming[] {
    return [...this.timings];
  }
  
  /**
   * Get total validation duration
   */
  getTotalDuration(): number {
    return this.timings.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  }
  
  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================
  
  /**
   * Get the reporting entity's jurisdiction
   */
  getReportingJurisdiction(): string {
    return this.report.message.messageSpec.sendingCompetentAuthority;
  }
  
  /**
   * Get the reporting period
   */
  getReportingPeriod(): string {
    return this.report.message.messageSpec.reportingPeriod;
  }
  
  /**
   * Get the message type indicator
   */
  getMessageTypeIndic(): string {
    return this.report.message.messageSpec.messageTypeIndic;
  }
  
  /**
   * Check if this is a correction message
   */
  isCorrection(): boolean {
    return this.report.message.messageSpec.messageTypeIndic === 'CBC702';
  }
  
  /**
   * Check if this is a test submission
   */
  isTestSubmission(): boolean {
    const docTypeIndic = this.report.message.cbcBody.reportingEntity.docSpec.docTypeIndic;
    return ['OECD10', 'OECD11', 'OECD12', 'OECD13'].includes(docTypeIndic);
  }
  
  /**
   * Calculate global totals across all jurisdictions
   */
  getGlobalTotals(): {
    totalRevenues: number;
    profitOrLoss: number;
    taxPaid: number;
    taxAccrued: number;
    employees: number;
    tangibleAssets: number;
  } {
    const jurisdictions = this.getJurisdictionReferences();
    const cbcReports = this.report.message.cbcBody.cbcReports;
    
    return {
      totalRevenues: jurisdictions.reduce((sum, j) => sum + j.totalRevenues, 0),
      profitOrLoss: jurisdictions.reduce((sum, j) => sum + j.profitOrLoss, 0),
      taxPaid: jurisdictions.reduce((sum, j) => sum + j.taxPaid, 0),
      taxAccrued: jurisdictions.reduce((sum, j) => sum + j.taxAccrued, 0),
      employees: jurisdictions.reduce((sum, j) => sum + j.employees, 0),
      tangibleAssets: cbcReports.reduce((sum, r) => sum + r.summary.tangibleAssets.value, 0),
    };
  }
}

