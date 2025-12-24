/**
 * Luxembourg Pillar 2 Validator
 *
 * Validates Pillar 2 (GloBE) compliance for Luxembourg entities.
 *
 * Luxembourg implementation:
 * - Law of 22 December 2023 implementing Pillar 2
 * - IIR effective: FY starting on or after 31 December 2023
 * - UTPR effective: FY starting on or after 31 December 2024
 * - QDMTT: Implemented from same date as IIR
 *
 * @module lib/validators/countries/luxembourg/pillar2-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import { BaseValidator, ValidatorMetadata } from '../../core/base-validator';
import { ValidationContext } from '../../core/validation-context';
import { parse, isValid, isAfter, isBefore, startOfDay, format } from 'date-fns';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Luxembourg Pillar 2 implementation dates
 */
const LU_PILLAR2_DATES = {
  /** IIR (Income Inclusion Rule) effective date */
  IIR_EFFECTIVE: new Date('2023-12-31'),

  /** UTPR (Undertaxed Profits Rule) effective date */
  UTPR_EFFECTIVE: new Date('2024-12-31'),

  /** QDMTT (Qualified Domestic Minimum Top-up Tax) effective date */
  QDMTT_EFFECTIVE: new Date('2023-12-31'),
};

/**
 * Pillar 2 thresholds
 */
const PILLAR2_THRESHOLDS = {
  /** Revenue threshold for Pillar 2 (in EUR) */
  REVENUE_THRESHOLD: 750_000_000,

  /** Minimum tax rate for GloBE */
  MINIMUM_TAX_RATE: 0.15,

  /** Substance-based income exclusion percentages (transitional) */
  SBIE_PAYROLL_2024: 0.10,
  SBIE_ASSETS_2024: 0.08,
};

/**
 * Safe harbour thresholds (CbCR-based)
 */
const SAFE_HARBOUR = {
  /** De minimis revenue threshold */
  DE_MINIMIS_REVENUE: 10_000_000,

  /** De minimis profit threshold */
  DE_MINIMIS_PROFIT: 1_000_000,

  /** Simplified ETR threshold */
  SIMPLIFIED_ETR: 0.15, // Will increase to 0.17 over transition period

  /** Routine profits test - return on tangible assets */
  ROUTINE_PROFITS_ASSET_RETURN: 0.08,

  /** Routine profits test - return on payroll */
  ROUTINE_PROFITS_PAYROLL_RETURN: 0.10,
};

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates Pillar 2 compliance for Luxembourg
 */
export class LuxembourgPillar2Validator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'lu-pillar2',
    name: 'Luxembourg Pillar 2 Validator',
    description: 'Validates Pillar 2 (GloBE) applicability and safe harbour eligibility',
    category: ValidationCategory.PILLAR2_READINESS,
    order: 300,
    applicableCountries: ['LU'],
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Skip if Pillar 2 checks not requested
    if (!ctx.options.checkPillar2) {
      return results;
    }

    // Check Pillar 2 applicability
    results.push(...this.checkPillar2Applicability(ctx));

    // Check effective dates for IIR/UTPR/QDMTT
    results.push(...this.checkEffectiveDates(ctx));

    // Analyze jurisdictions for safe harbour eligibility
    results.push(...this.analyzeSafeHarbourEligibility(ctx));

    // Check for low-tax jurisdictions
    results.push(...this.identifyLowTaxJurisdictions(ctx));

    return results;
  }

  /**
   * Check if Pillar 2 applies to this group
   */
  private checkPillar2Applicability(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const globalTotals = ctx.getGlobalTotals();

    const meetsThreshold = globalTotals.totalRevenues >= PILLAR2_THRESHOLDS.REVENUE_THRESHOLD;

    if (meetsThreshold) {
      results.push(
        this.result('LU-P2-001')
          .info()
          .message(
            `Group meets Pillar 2 revenue threshold (€${(globalTotals.totalRevenues / 1_000_000).toFixed(0)}M >= €750M)`
          )
          .details({
            totalRevenue: globalTotals.totalRevenues,
            threshold: PILLAR2_THRESHOLDS.REVENUE_THRESHOLD,
            currency: 'EUR',
          })
          .build()
      );
    } else {
      results.push(
        this.result('LU-P2-001')
          .info()
          .message(
            `Group below Pillar 2 revenue threshold (€${(globalTotals.totalRevenues / 1_000_000).toFixed(0)}M < €750M) - ` +
            `Pillar 2 may not apply`
          )
          .details({
            totalRevenue: globalTotals.totalRevenues,
            threshold: PILLAR2_THRESHOLDS.REVENUE_THRESHOLD,
          })
          .suggestion(
            'Verify revenue against consolidated financial statements. ' +
            'Threshold must be met in at least 2 of 4 preceding fiscal years.'
          )
          .build()
      );
    }

    return results;
  }

  /**
   * Check IIR/UTPR/QDMTT effective dates
   */
  private checkEffectiveDates(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const reportingPeriod = ctx.getReportingPeriod();

    if (!reportingPeriod) return results;

    const fyEnd = parse(reportingPeriod, 'yyyy-MM-dd', new Date());
    if (!isValid(fyEnd)) return results;

    // Determine fiscal year start (approximately)
    const fyYear = fyEnd.getFullYear();
    const assumedFyStart = new Date(fyYear - 1, fyEnd.getMonth(), fyEnd.getDate() + 1);

    // IIR applicability
    const iirApplies = isAfter(assumedFyStart, LU_PILLAR2_DATES.IIR_EFFECTIVE) ||
      assumedFyStart.getTime() === LU_PILLAR2_DATES.IIR_EFFECTIVE.getTime();

    if (iirApplies) {
      results.push(
        this.result('LU-P2-002')
          .info()
          .message(
            `Income Inclusion Rule (IIR) applies for FY ending ${reportingPeriod}`
          )
          .details({
            fyEnd: reportingPeriod,
            iirEffectiveDate: format(LU_PILLAR2_DATES.IIR_EFFECTIVE, 'yyyy-MM-dd'),
          })
          .suggestion(
            'Luxembourg UPE must apply IIR to ensure minimum 15% effective tax rate on group profits'
          )
          .build()
      );
    } else {
      results.push(
        this.result('LU-P2-002')
          .info()
          .message(
            `IIR not yet applicable for FY ending ${reportingPeriod} ` +
            `(applies from FY starting on or after 31 Dec 2023)`
          )
          .build()
      );
    }

    // UTPR applicability
    const utprApplies = isAfter(assumedFyStart, LU_PILLAR2_DATES.UTPR_EFFECTIVE) ||
      assumedFyStart.getTime() === LU_PILLAR2_DATES.UTPR_EFFECTIVE.getTime();

    if (utprApplies) {
      results.push(
        this.result('LU-P2-003')
          .info()
          .message(
            `Undertaxed Profits Rule (UTPR) applies for FY ending ${reportingPeriod}`
          )
          .details({
            fyEnd: reportingPeriod,
            utprEffectiveDate: format(LU_PILLAR2_DATES.UTPR_EFFECTIVE, 'yyyy-MM-dd'),
          })
          .build()
      );
    }

    // QDMTT applicability
    if (iirApplies) {
      results.push(
        this.result('LU-P2-004')
          .info()
          .message(
            `Luxembourg QDMTT applies for FY ending ${reportingPeriod}`
          )
          .suggestion(
            'Luxembourg entities may be subject to top-up tax under the QDMTT if ETR < 15%'
          )
          .build()
      );
    }

    return results;
  }

  /**
   * Analyze safe harbour eligibility by jurisdiction
   */
  private analyzeSafeHarbourEligibility(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const jurisdictions = ctx.getJurisdictionReferences();

    for (const jurisdiction of jurisdictions) {
      const safeHarbourResults = this.checkJurisdictionSafeHarbour(jurisdiction);
      results.push(...safeHarbourResults);
    }

    // Summary
    const eligibleCount = jurisdictions.filter((j) => 
      this.isDeMinimisEligible(j) || this.isSimplifiedEtrEligible(j)
    ).length;

    if (eligibleCount > 0) {
      results.push(
        this.result('LU-P2-SH')
          .info()
          .message(
            `${eligibleCount} of ${jurisdictions.length} jurisdictions may qualify for CbCR safe harbour`
          )
          .suggestion(
            'Safe harbour reduces Pillar 2 compliance burden. Verify eligibility with detailed analysis.'
          )
          .build()
      );
    }

    return results;
  }

  /**
   * Check safe harbour eligibility for a jurisdiction
   */
  private checkJurisdictionSafeHarbour(
    jurisdiction: { code: string; totalRevenues: number; profitOrLoss: number; taxPaid: number; taxAccrued: number; employees: number }
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // De minimis test
    if (this.isDeMinimisEligible(jurisdiction)) {
      results.push(
        this.result('LU-P2-SH-DM')
          .info()
          .message(
            `${jurisdiction.code}: Potentially eligible for de minimis safe harbour ` +
            `(Revenue: ${this.formatCurrency(jurisdiction.totalRevenues)}, ` +
            `Profit: ${this.formatCurrency(jurisdiction.profitOrLoss)})`
          )
          .details({
            jurisdiction: jurisdiction.code,
            revenue: jurisdiction.totalRevenues,
            profit: jurisdiction.profitOrLoss,
            deMinimisRevenue: SAFE_HARBOUR.DE_MINIMIS_REVENUE,
            deMinimisProfit: SAFE_HARBOUR.DE_MINIMIS_PROFIT,
          })
          .build()
      );
    }

    // Simplified ETR test
    if (this.isSimplifiedEtrEligible(jurisdiction)) {
      const simplifiedEtr = this.calculateSimplifiedEtr(jurisdiction);
      results.push(
        this.result('LU-P2-SH-ETR')
          .info()
          .message(
            `${jurisdiction.code}: Potentially eligible for simplified ETR safe harbour ` +
            `(ETR: ${(simplifiedEtr * 100).toFixed(1)}% >= 15%)`
          )
          .details({
            jurisdiction: jurisdiction.code,
            simplifiedEtr: (simplifiedEtr * 100).toFixed(2),
            threshold: (SAFE_HARBOUR.SIMPLIFIED_ETR * 100).toFixed(0),
          })
          .build()
      );
    }

    return results;
  }

  /**
   * Check de minimis eligibility
   */
  private isDeMinimisEligible(
    j: { totalRevenues: number; profitOrLoss: number }
  ): boolean {
    return (
      j.totalRevenues < SAFE_HARBOUR.DE_MINIMIS_REVENUE &&
      j.profitOrLoss < SAFE_HARBOUR.DE_MINIMIS_PROFIT
    );
  }

  /**
   * Check simplified ETR eligibility
   */
  private isSimplifiedEtrEligible(
    j: { profitOrLoss: number; taxPaid: number; taxAccrued: number }
  ): boolean {
    if (j.profitOrLoss <= 0) return false;
    const etr = this.calculateSimplifiedEtr(j);
    return etr >= SAFE_HARBOUR.SIMPLIFIED_ETR;
  }

  /**
   * Calculate simplified ETR from CbCR data
   */
  private calculateSimplifiedEtr(
    j: { profitOrLoss: number; taxPaid: number; taxAccrued: number }
  ): number {
    if (j.profitOrLoss <= 0) return 0;
    // Use tax accrued for simplified ETR (current year focus)
    return j.taxAccrued / j.profitOrLoss;
  }

  /**
   * Identify potentially low-tax jurisdictions
   */
  private identifyLowTaxJurisdictions(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const jurisdictions = ctx.getJurisdictionReferences();

    const lowTaxJurisdictions: string[] = [];

    for (const j of jurisdictions) {
      if (j.profitOrLoss > 0) {
        const etr = this.calculateSimplifiedEtr(j);

        if (etr < PILLAR2_THRESHOLDS.MINIMUM_TAX_RATE && etr >= 0) {
          lowTaxJurisdictions.push(`${j.code} (${(etr * 100).toFixed(1)}%)`);

          results.push(
            this.result('LU-P2-LTJ')
              .warning()
              .message(
                `${j.code}: Simplified ETR (${(etr * 100).toFixed(1)}%) below 15% minimum tax rate`
              )
              .details({
                jurisdiction: j.code,
                profit: j.profitOrLoss,
                taxAccrued: j.taxAccrued,
                simplifiedEtr: (etr * 100).toFixed(2),
                minimumRate: (PILLAR2_THRESHOLDS.MINIMUM_TAX_RATE * 100).toFixed(0),
              })
              .suggestion(
                'Jurisdiction may be subject to top-up tax under Pillar 2. ' +
                'Detailed GloBE ETR calculation required.'
              )
              .build()
          );
        }
      }
    }

    if (lowTaxJurisdictions.length > 0) {
      results.push(
        this.result('LU-P2-SUMMARY')
          .warning()
          .message(
            `${lowTaxJurisdictions.length} jurisdiction(s) with ETR below 15%: ${lowTaxJurisdictions.join(', ')}`
          )
          .suggestion(
            'These jurisdictions require detailed Pillar 2 analysis for potential top-up tax liability'
          )
          .build()
      );
    }

    return results;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if Pillar 2 IIR applies for a given fiscal year
 */
export function isIirApplicable(fyStartDate: Date): boolean {
  return isAfter(fyStartDate, LU_PILLAR2_DATES.IIR_EFFECTIVE) ||
    fyStartDate.getTime() === LU_PILLAR2_DATES.IIR_EFFECTIVE.getTime();
}

/**
 * Check if Pillar 2 UTPR applies for a given fiscal year
 */
export function isUtprApplicable(fyStartDate: Date): boolean {
  return isAfter(fyStartDate, LU_PILLAR2_DATES.UTPR_EFFECTIVE) ||
    fyStartDate.getTime() === LU_PILLAR2_DATES.UTPR_EFFECTIVE.getTime();
}

/**
 * Calculate simple ETR from CbCR data
 */
export function calculateCbcrEtr(profit: number, taxAccrued: number): number {
  if (profit <= 0) return 0;
  return taxAccrued / profit;
}

