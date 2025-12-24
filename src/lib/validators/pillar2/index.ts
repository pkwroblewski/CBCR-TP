/**
 * Pillar 2 Validators Index
 *
 * Exports all Pillar 2 (GloBE) validators and provides a combined
 * Pillar2Validator class for comprehensive Pillar 2 analysis.
 *
 * Pillar 2 / GloBE Overview:
 * - Minimum 15% effective tax rate on MNE profits
 * - Three charging mechanisms: IIR, UTPR, QDMTT
 * - Transitional CbCR Safe Harbour (2024-2026)
 * - Permanent safe harbour rules thereafter
 *
 * @module lib/validators/pillar2
 */

import { ValidationResult, ValidationCategory } from '@/types/validation';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';

// Individual validators
import { SafeHarbourValidator } from './safe-harbour-validator';
import { Pillar2DataQualityChecker } from './data-quality-checker';
import { JurisdictionAnalyzer } from './jurisdiction-analyzer';

// =============================================================================
// EXPORTS
// =============================================================================

// Validators
export { SafeHarbourValidator } from './safe-harbour-validator';
export { Pillar2DataQualityChecker } from './data-quality-checker';
export { JurisdictionAnalyzer } from './jurisdiction-analyzer';

// Constants and utilities from safe-harbour-validator
export {
  DE_MINIMIS,
  SIMPLIFIED_ETR_RATES,
  SBIE_RATES,
  SAFE_HARBOUR_PERIOD,
  getSimplifiedEtrThreshold,
  getSbieRatesForYear,
  isDeMinimisEligible,
  calculateSimplifiedEtr,
  type SafeHarbourResult,
} from './safe-harbour-validator';

// Constants and utilities from jurisdiction-analyzer
export {
  QUALIFIED_GLOBE_JURISDICTIONS,
  LOW_TAX_JURISDICTIONS,
  MINIMUM_TAX_RATE,
  hasQualifiedGlobeRules,
  getQualifiedRules,
  isLowTaxJurisdiction,
  type JurisdictionPillar2Analysis,
} from './jurisdiction-analyzer';

// =============================================================================
// PILLAR 2 METADATA
// =============================================================================

/**
 * Pillar 2 / GloBE implementation details
 */
export const PILLAR2_METADATA = {
  /** Minimum effective tax rate */
  minimumTaxRate: 0.15,

  /** Revenue threshold for Pillar 2 applicability (EUR) */
  revenueThreshold: 750_000_000,

  /** Transitional safe harbour period */
  transitionalSafeHarbour: {
    startYear: 2024,
    endYear: 2026,
  },

  /** Effective dates for charging mechanisms */
  effectiveDates: {
    iir: '2024-01-01', // Most jurisdictions
    utpr: '2025-01-01', // One year delayed
    qdmtt: '2024-01-01', // Varies by jurisdiction
  },

  /** Key thresholds */
  thresholds: {
    deMinimisRevenue: 10_000_000,
    deMinimisProfit: 1_000_000,
  },

  /** OECD guidance references */
  references: {
    modelRules: 'OECD GloBE Model Rules (December 2021)',
    commentary: 'OECD Commentary on Model Rules (March 2022)',
    adminGuidance: 'OECD Administrative Guidance (February 2023, July 2023)',
    safeHarbours: 'OECD Safe Harbours and Penalty Relief (December 2022)',
  },
};

// =============================================================================
// COMBINED VALIDATOR
// =============================================================================

/**
 * Combined Pillar 2 validator that runs all Pillar 2 checks
 */
export class Pillar2Validator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'pillar2-combined',
    name: 'Pillar 2 Validator',
    description: 'Combined validator for comprehensive Pillar 2 / GloBE analysis',
    category: ValidationCategory.PILLAR2_READINESS,
    order: 400,
    enabled: true,
  };

  private subValidators: BaseValidator[];

  constructor() {
    super();
    this.subValidators = [
      new SafeHarbourValidator(),
      new Pillar2DataQualityChecker(),
      new JurisdictionAnalyzer(),
    ];
  }

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    // Skip if Pillar 2 checks not requested
    if (!ctx.options.checkPillar2) {
      return [];
    }

    const results: ValidationResult[] = [];

    // Add header result
    results.push(
      this.result('P2-START')
        .info()
        .message('Starting Pillar 2 / GloBE analysis...')
        .details({
          minimumRate: PILLAR2_METADATA.minimumTaxRate,
          revenueThreshold: PILLAR2_METADATA.revenueThreshold,
        })
        .build()
    );

    // Check applicability
    results.push(...this.checkApplicability(ctx));

    // Run all sub-validators
    for (const validator of this.subValidators) {
      const validatorResults = await validator.validate(ctx);
      results.push(...validatorResults);
    }

    return results;
  }

  /**
   * Check Pillar 2 applicability
   */
  private checkApplicability(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const globalTotals = ctx.getGlobalTotals();

    const meetsThreshold = globalTotals.totalRevenues >= PILLAR2_METADATA.revenueThreshold;

    if (meetsThreshold) {
      results.push(
        this.result('P2-APPLICABLE')
          .info()
          .message(
            `Group meets Pillar 2 revenue threshold ` +
            `(€${(globalTotals.totalRevenues / 1_000_000).toFixed(0)}M >= €750M)`
          )
          .build()
      );
    } else {
      results.push(
        this.result('P2-NOT-APPLICABLE')
          .info()
          .message(
            `Group below Pillar 2 threshold ` +
            `(€${(globalTotals.totalRevenues / 1_000_000).toFixed(0)}M < €750M) - rules may not apply`
          )
          .suggestion(
            'Pillar 2 applies if consolidated revenue exceeds €750M in at least 2 of the 4 preceding years'
          )
          .build()
      );
    }

    return results;
  }

  /**
   * Get list of all sub-validators
   */
  getSubValidators(): BaseValidator[] {
    return [...this.subValidators];
  }

  /**
   * Get Pillar 2 metadata
   */
  static getMetadata() {
    return PILLAR2_METADATA;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all Pillar 2 validator metadata
 */
export function getPillar2ValidatorMetadata(): ValidatorMetadata[] {
  return [
    SafeHarbourValidator.metadata,
    Pillar2DataQualityChecker.metadata,
    JurisdictionAnalyzer.metadata,
  ];
}

/**
 * Create instances of all Pillar 2 validators
 */
export function createPillar2Validators(): BaseValidator[] {
  return [
    new SafeHarbourValidator(),
    new Pillar2DataQualityChecker(),
    new JurisdictionAnalyzer(),
  ];
}

/**
 * Quick check if Pillar 2 may apply based on revenue
 */
export function mayPillar2Apply(consolidatedRevenue: number): boolean {
  return consolidatedRevenue >= PILLAR2_METADATA.revenueThreshold;
}

/**
 * Calculate estimated top-up tax for a jurisdiction
 *
 * This is a rough estimate based on CbCR data. Actual GloBE calculation
 * requires detailed adjustments to income and covered taxes.
 */
export function estimateTopUpTax(
  profitBeforeTax: number,
  taxAccrued: number,
  minimumRate: number = 0.15
): number {
  if (profitBeforeTax <= 0) return 0;
  
  const etr = taxAccrued / profitBeforeTax;
  if (etr >= minimumRate) return 0;
  
  const taxGap = minimumRate - etr;
  return profitBeforeTax * taxGap;
}

