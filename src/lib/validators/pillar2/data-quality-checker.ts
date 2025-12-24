/**
 * Pillar 2 Data Quality Checker
 *
 * Validates whether CbCR data is of sufficient quality to use for
 * Pillar 2 safe harbour analysis. Identifies data gaps and issues
 * that may require additional information or full GloBE calculations.
 *
 * @module lib/validators/pillar2/data-quality-checker
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { Summary, CbcReport } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext, JurisdictionReference } from '../core/validation-context';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Data quality thresholds
 */
const DATA_QUALITY_THRESHOLDS = {
  /** Minimum number of monetary fields required */
  MIN_MONETARY_FIELDS: 5,

  /** Fields required for safe harbour analysis */
  REQUIRED_FOR_SAFE_HARBOUR: [
    'totalRevenues',
    'profitOrLoss',
    'taxAccrued',
    'numberOfEmployees',
    'tangibleAssets',
  ],

  /** Fields required for simplified ETR */
  REQUIRED_FOR_ETR: ['taxAccrued', 'profitOrLoss'],

  /** Fields required for SBIE calculation */
  REQUIRED_FOR_SBIE: ['numberOfEmployees', 'tangibleAssets'],
};

/**
 * Data quality issue severity
 */
type DataQualityIssue = {
  jurisdiction: string;
  issue: string;
  severity: 'blocking' | 'warning' | 'info';
  affectedTests: string[];
};

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Checks CbCR data quality for Pillar 2 safe harbour analysis
 */
export class Pillar2DataQualityChecker extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'pillar2-data-quality',
    name: 'Pillar 2 Data Quality Checker',
    description: 'Validates CbCR data quality for Pillar 2 safe harbour',
    category: ValidationCategory.PILLAR2_READINESS,
    order: 410,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Skip if Pillar 2 checks not requested
    if (!ctx.options.checkPillar2) {
      return results;
    }

    // Check global data quality
    results.push(...this.checkGlobalDataQuality(ctx));

    // Check per-jurisdiction data quality
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const basePath = this.xpathCbcReport(reportIndex);
      results.push(...this.checkJurisdictionDataQuality(report, basePath));
    }

    // Check for jurisdictions needing full GloBE calculation
    results.push(...this.identifyGlobeRequirements(ctx));

    return results;
  }

  /**
   * Check global data quality
   */
  private checkGlobalDataQuality(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const jurisdictions = ctx.getJurisdictionReferences();

    // Check currency consistency
    const currencies = this.collectCurrencies(ctx);
    if (currencies.size > 1) {
      results.push(
        this.result('P2-DQ-001')
          .warning()
          .message(
            `Multiple currencies used (${[...currencies].join(', ')}) - may affect Pillar 2 calculations`
          )
          .suggestion('GloBE calculations should use consolidated reporting currency')
          .build()
      );
    }

    // Check for jurisdictions with incomplete data
    const incompleteJurisdictions = this.findIncompleteJurisdictions(ctx);
    if (incompleteJurisdictions.length > 0) {
      results.push(
        this.result('P2-DQ-002')
          .warning()
          .message(
            `${incompleteJurisdictions.length} jurisdiction(s) have incomplete data for safe harbour: ` +
            `${incompleteJurisdictions.join(', ')}`
          )
          .suggestion('Complete missing fields or use full GloBE calculation for these jurisdictions')
          .build()
      );
    }

    // Check for unusual patterns
    results.push(...this.checkUnusualPatterns(jurisdictions));

    return results;
  }

  /**
   * Check jurisdiction-specific data quality
   */
  private checkJurisdictionDataQuality(
    report: CbcReport,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const jurisdiction = report.resCountryCode;
    const summary = report.summary;

    // Check required fields for safe harbour
    const missingFields = this.checkRequiredFields(summary);
    if (missingFields.length > 0) {
      results.push(
        this.result('P2-DQ-010')
          .warning()
          .message(
            `${jurisdiction}: Missing fields for safe harbour analysis: ${missingFields.join(', ')}`
          )
          .xpath(`${basePath}/Summary`)
          .details({ missingFields })
          .build()
      );
    }

    // Check for zero employees with positive payroll-dependent tests
    if (summary.numberOfEmployees === 0 && summary.profitOrLoss.value > 0) {
      results.push(
        this.result('P2-DQ-011')
          .info()
          .message(
            `${jurisdiction}: Zero employees reported - SBIE payroll carve-out will be zero`
          )
          .xpath(`${basePath}/Summary/NbEmployees`)
          .suggestion('Verify employee count is accurate; missing employees affects SBIE calculation')
          .build()
      );
    }

    // Check for zero tangible assets with profit
    if (summary.tangibleAssets.value === 0 && summary.profitOrLoss.value > 0) {
      results.push(
        this.result('P2-DQ-012')
          .info()
          .message(
            `${jurisdiction}: Zero tangible assets reported - SBIE asset carve-out will be zero`
          )
          .xpath(`${basePath}/Summary/Assets`)
          .suggestion('Verify tangible asset value is accurate; missing assets affects SBIE calculation')
          .build()
      );
    }

    // Check tax data consistency
    results.push(...this.checkTaxDataQuality(summary, jurisdiction, basePath));

    // Check profit/revenue consistency
    results.push(...this.checkProfitRevenueConsistency(summary, jurisdiction, basePath));

    return results;
  }

  /**
   * Check required fields for safe harbour
   */
  private checkRequiredFields(summary: Summary): string[] {
    const missing: string[] = [];

    // Check each required field
    if (summary.totalRevenues?.value === undefined) {
      missing.push('Revenues');
    }
    if (summary.profitOrLoss?.value === undefined) {
      missing.push('ProfitOrLoss');
    }
    if (summary.taxAccrued?.value === undefined) {
      missing.push('TaxAccrued');
    }
    if (summary.numberOfEmployees === undefined) {
      missing.push('NbEmployees');
    }
    if (summary.tangibleAssets?.value === undefined) {
      missing.push('Assets');
    }

    return missing;
  }

  /**
   * Check tax data quality for ETR calculation
   */
  private checkTaxDataQuality(
    summary: Summary,
    jurisdiction: string,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const taxPaid = summary.taxPaid.value;
    const taxAccrued = summary.taxAccrued.value;
    const profit = summary.profitOrLoss.value;

    // Check for negative tax with positive profit (unusual)
    if (profit > 1_000_000 && taxAccrued < 0) {
      results.push(
        this.result('P2-DQ-020')
          .warning()
          .message(
            `${jurisdiction}: Negative tax accrued (€${this.formatNumber(taxAccrued)}) ` +
            `with positive profit (€${this.formatNumber(profit)})`
          )
          .xpath(`${basePath}/Summary/TaxAccrued`)
          .suggestion('Verify tax data; negative accrued tax affects ETR calculation')
          .build()
      );
    }

    // Check for very high effective tax rate (may indicate data issues)
    if (profit > 0) {
      const etr = taxAccrued / profit;
      if (etr > 0.5) {
        results.push(
          this.result('P2-DQ-021')
            .info()
            .message(
              `${jurisdiction}: Very high ETR (${(etr * 100).toFixed(0)}%) - verify tax data accuracy`
            )
            .xpath(`${basePath}/Summary`)
            .build()
        );
      }
    }

    // Large discrepancy between tax paid and accrued
    if (taxPaid !== 0 || taxAccrued !== 0) {
      const maxTax = Math.max(Math.abs(taxPaid), Math.abs(taxAccrued));
      const discrepancy = Math.abs(taxPaid - taxAccrued) / (maxTax || 1);
      
      if (discrepancy > 0.5 && maxTax > 100_000) {
        results.push(
          this.result('P2-DQ-022')
            .info()
            .message(
              `${jurisdiction}: Large discrepancy between TaxPaid and TaxAccrued (${(discrepancy * 100).toFixed(0)}%)`
            )
            .xpath(`${basePath}/Summary`)
            .suggestion('For GloBE, covered taxes are calculated differently than CbCR tax figures')
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Check profit/revenue consistency
   */
  private checkProfitRevenueConsistency(
    summary: Summary,
    jurisdiction: string,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const revenue = summary.totalRevenues.value;
    const profit = summary.profitOrLoss.value;

    // Profit exceeds revenue (unusual, may indicate dividend income)
    if (profit > revenue && revenue > 0) {
      results.push(
        this.result('P2-DQ-030')
          .info()
          .message(
            `${jurisdiction}: Profit (€${this.formatNumber(profit)}) exceeds revenue (€${this.formatNumber(revenue)})`
          )
          .xpath(`${basePath}/Summary`)
          .suggestion(
            'May indicate significant non-operating income (dividends, FX gains). ' +
            'GloBE income may differ from CbCR profit.'
          )
          .build()
      );
    }

    // Very high loss relative to revenue
    if (profit < 0 && revenue > 0) {
      const lossRatio = Math.abs(profit) / revenue;
      if (lossRatio > 0.5) {
        results.push(
          this.result('P2-DQ-031')
            .info()
            .message(
              `${jurisdiction}: Large loss relative to revenue (${(lossRatio * 100).toFixed(0)}%)`
            )
            .xpath(`${basePath}/Summary`)
            .suggestion('Loss jurisdictions generally have no top-up tax but verify GloBE treatment')
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Find jurisdictions with incomplete data
   */
  private findIncompleteJurisdictions(ctx: ValidationContext): string[] {
    const incomplete: string[] = [];

    for (const [report] of this.iterateReports(ctx)) {
      const missingFields = this.checkRequiredFields(report.summary);
      if (missingFields.length > 0) {
        incomplete.push(report.resCountryCode);
      }
    }

    return incomplete;
  }

  /**
   * Check for unusual patterns that may indicate data issues
   */
  private checkUnusualPatterns(
    jurisdictions: JurisdictionReference[]
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Count jurisdictions with losses
    const lossJurisdictions = jurisdictions.filter((j) => j.profitOrLoss < 0);
    if (lossJurisdictions.length > jurisdictions.length * 0.5) {
      results.push(
        this.result('P2-DQ-040')
          .info()
          .message(
            `More than half of jurisdictions (${lossJurisdictions.length}/${jurisdictions.length}) ` +
            `report losses - verify data accuracy`
          )
          .build()
      );
    }

    // Check for jurisdictions with zero tax
    const zeroTaxJurisdictions = jurisdictions.filter(
      (j) => j.profitOrLoss > 1_000_000 && j.taxAccrued === 0
    );
    if (zeroTaxJurisdictions.length > 0) {
      results.push(
        this.result('P2-DQ-041')
          .warning()
          .message(
            `${zeroTaxJurisdictions.length} profitable jurisdiction(s) have zero tax accrued: ` +
            `${zeroTaxJurisdictions.map((j) => j.code).join(', ')}`
          )
          .suggestion('Zero tax with profit may indicate low-tax jurisdiction or missing tax data')
          .build()
      );
    }

    return results;
  }

  /**
   * Collect currencies used across all jurisdictions
   */
  private collectCurrencies(ctx: ValidationContext): Set<string> {
    const currencies = new Set<string>();

    for (const [report] of this.iterateReports(ctx)) {
      const summary = report.summary;
      [
        summary.totalRevenues?.currCode,
        summary.profitOrLoss?.currCode,
        summary.taxAccrued?.currCode,
      ].forEach((c) => {
        if (c) currencies.add(c);
      });
    }

    return currencies;
  }

  /**
   * Identify jurisdictions requiring full GloBE calculation
   */
  private identifyGlobeRequirements(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const jurisdictions = ctx.getJurisdictionReferences();

    const requiresGlobe: { code: string; reasons: string[] }[] = [];

    for (const j of jurisdictions) {
      const reasons: string[] = [];

      // Profitable with low ETR
      if (j.profitOrLoss > 1_000_000) {
        const etr = j.taxAccrued / j.profitOrLoss;
        if (etr < 0.15) {
          reasons.push(`Low ETR (${(etr * 100).toFixed(1)}%)`);
        }
      }

      // Large revenue/profit exceeds de minimis
      if (j.totalRevenues >= 10_000_000 && j.profitOrLoss >= 1_000_000) {
        // Check if simplified ETR test also fails
        const etr = j.profitOrLoss > 0 ? j.taxAccrued / j.profitOrLoss : 0;
        if (etr < 0.15) {
          reasons.push('Exceeds de minimis and fails simplified ETR');
        }
      }

      if (reasons.length > 0) {
        requiresGlobe.push({ code: j.code, reasons });
      }
    }

    if (requiresGlobe.length > 0) {
      results.push(
        this.result('P2-DQ-050')
          .warning()
          .message(
            `${requiresGlobe.length} jurisdiction(s) likely require full GloBE calculation`
          )
          .details({
            jurisdictions: requiresGlobe,
          })
          .suggestion(
            'These jurisdictions may not qualify for safe harbour. ' +
            'Prepare detailed GloBE income and covered tax calculations.'
          )
          .build()
      );

      for (const j of requiresGlobe) {
        results.push(
          this.result('P2-DQ-051')
            .info()
            .message(`${j.code}: ${j.reasons.join(', ')}`)
            .build()
        );
      }
    }

    return results;
  }
}

