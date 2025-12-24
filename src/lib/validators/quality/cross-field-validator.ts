/**
 * Cross-Field Validator
 *
 * Implements cross-field validation rules that check consistency
 * between related data elements across the CbC report.
 *
 * Includes updates for May 2024 OECD guidance on dividend treatment.
 *
 * @module lib/validators/quality/cross-field-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { Summary, CbcReport, BizActivityCode } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Threshold for tax paid vs accrued discrepancy warning (50%) */
const TAX_DISCREPANCY_THRESHOLD = 0.5;

/** Threshold for considering profit significant */
const SIGNIFICANT_PROFIT_THRESHOLD = 100_000;

/** Activities that typically require tangible assets */
const ASSET_INTENSIVE_ACTIVITIES: BizActivityCode[] = [
  'CBC504', // Manufacturing
  'CBC505', // Sales/Distribution
  'CBC509', // Regulated Financial Services
  'CBC510', // Insurance
];

/** Holding activities (typically low tangible assets) */
const HOLDING_ACTIVITIES: BizActivityCode[] = ['CBC502', 'CBC511'];

/** Activities that may have dividend income */
const DIVIDEND_RECEIVING_ACTIVITIES: BizActivityCode[] = [
  'CBC502', // Holding IP
  'CBC511', // Holding shares
  'CBC508', // Internal Group Finance
];

/** Minimum tangible assets expected for manufacturing */
const MIN_MANUFACTURING_ASSETS = 100_000;

/** Revenue to assets ratio threshold for manufacturing */
const MANUFACTURING_ASSET_RATIO = 10;

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Cross-field validation for data consistency
 */
export class CrossFieldValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'quality-cross-field',
    name: 'Cross-Field Validator',
    description: 'Validates consistency between related data elements',
    category: ValidationCategory.DATA_QUALITY,
    order: 60,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate each jurisdiction
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const summary = report.summary;
      const jurisdiction = report.resCountryCode;
      const basePath = this.xpathCbcReport(reportIndex);
      
      // Collect activities from both jurisdiction level and entity level
      const jurisdictionActivities = report.constEntities.bizActivities ?? [];
      const entityActivities = report.constEntities.constituentEntity
        .flatMap((e) => e.bizActivities ?? []);
      const activities = [...new Set([...jurisdictionActivities, ...entityActivities])];

      // XFV-001: TaxPaid vs TaxAccrued reasonableness
      results.push(...this.validateTaxConsistency(summary, jurisdiction, basePath));

      // XFV-002: Revenue=0 but Employees>0
      results.push(...this.validateRevenueEmployeeConsistency(summary, jurisdiction, basePath));

      // XFV-003: Profit consistency
      results.push(...this.validateProfitConsistency(summary, jurisdiction, basePath));

      // XFV-004: Tangible assets vs business activities
      results.push(...this.validateAssetActivityConsistency(summary, activities, jurisdiction, basePath));

      // XFV-005: Dividend exclusion from Revenues (May 2024 update)
      results.push(...this.validateDividendRevenueExclusion(summary, activities, jurisdiction, basePath, ctx));

      // XFV-006: Dividend exclusion from ProfitOrLoss
      results.push(...this.validateDividendProfitExclusion(summary, activities, jurisdiction, basePath));
    }

    // Global cross-jurisdiction checks
    results.push(...this.validateGlobalConsistency(ctx));

    return results;
  }

  /**
   * XFV-001: Validate TaxPaid vs TaxAccrued reasonableness
   */
  private validateTaxConsistency(
    summary: Summary,
    jurisdiction: string,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const taxPaid = summary.taxPaid.value;
    const taxAccrued = summary.taxAccrued.value;

    // Skip if both are zero
    if (taxPaid === 0 && taxAccrued === 0) {
      return results;
    }

    // Calculate discrepancy
    const maxTax = Math.max(Math.abs(taxPaid), Math.abs(taxAccrued));
    if (maxTax > 0) {
      const discrepancy = Math.abs(taxPaid - taxAccrued) / maxTax;

      if (discrepancy > TAX_DISCREPANCY_THRESHOLD) {
        results.push(
          this.result('XFV-001')
            .warning()
            .message(
              `${jurisdiction}: Large discrepancy between TaxPaid (${this.formatCurrency(taxPaid)}) ` +
              `and TaxAccrued (${this.formatCurrency(taxAccrued)}) - ${(discrepancy * 100).toFixed(0)}% difference`
            )
            .xpath(`${basePath}/Summary`)
            .details({
              taxPaid,
              taxAccrued,
              discrepancyPercent: (discrepancy * 100).toFixed(1),
            })
            .suggestion('Large differences may indicate timing differences or require explanation')
            .build()
        );
      }
    }

    // Check for opposite signs
    if ((taxPaid > 0 && taxAccrued < 0) || (taxPaid < 0 && taxAccrued > 0)) {
      results.push(
        this.result('XFV-001')
          .warning()
          .message(
            `${jurisdiction}: TaxPaid (${this.formatCurrency(taxPaid)}) and TaxAccrued ` +
            `(${this.formatCurrency(taxAccrued)}) have opposite signs`
          )
          .xpath(`${basePath}/Summary`)
          .build()
      );
    }

    return results;
  }

  /**
   * XFV-002: Validate Revenue=0 but Employees>0
   */
  private validateRevenueEmployeeConsistency(
    summary: Summary,
    jurisdiction: string,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const totalRevenue = summary.totalRevenues.value;
    const employees = summary.numberOfEmployees;

    if (totalRevenue === 0 && employees > 0) {
      results.push(
        this.result('XFV-002')
          .warning()
          .message(
            `${jurisdiction}: Zero revenue but ${employees} employees reported`
          )
          .xpath(`${basePath}/Summary`)
          .suggestion(
            'Verify this is correct - entities with employees typically have some revenue or intercompany charges'
          )
          .build()
      );
    }

    // Also check reverse: high revenue but zero employees
    if (totalRevenue > 10_000_000 && employees === 0) {
      results.push(
        this.result('XFV-002')
          .info()
          .message(
            `${jurisdiction}: Revenue of ${this.formatCurrency(totalRevenue)} but zero employees`
          )
          .xpath(`${basePath}/Summary`)
          .suggestion('Verify if independent contractors should be included in employee count')
          .build()
      );
    }

    return results;
  }

  /**
   * XFV-003: Validate profit consistency
   */
  private validateProfitConsistency(
    summary: Summary,
    jurisdiction: string,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const profit = summary.profitOrLoss.value;
    const revenue = summary.totalRevenues.value;
    const taxPaid = summary.taxPaid.value;
    const taxAccrued = summary.taxAccrued.value;

    // Check profit margin reasonableness
    if (revenue > 0) {
      const profitMargin = profit / revenue;

      // Very high profit margin (>100%)
      if (profitMargin > 1) {
        results.push(
          this.result('XFV-003')
            .info()
            .message(
              `${jurisdiction}: Profit margin exceeds 100% (${(profitMargin * 100).toFixed(0)}%) - ` +
              `profit ${this.formatCurrency(profit)} on revenue ${this.formatCurrency(revenue)}`
            )
            .xpath(`${basePath}/Summary`)
            .suggestion('High margins may indicate dividend income or other non-operating items')
            .build()
        );
      }

      // Very low profit margin (<-50%)
      if (profitMargin < -0.5) {
        results.push(
          this.result('XFV-003')
            .info()
            .message(
              `${jurisdiction}: Large loss relative to revenue (${(profitMargin * 100).toFixed(0)}%)`
            )
            .xpath(`${basePath}/Summary`)
            .build()
        );
      }
    }

    // Profit but negative taxes (refunds larger than current year)
    if (profit > SIGNIFICANT_PROFIT_THRESHOLD && taxPaid < 0 && taxAccrued < 0) {
      results.push(
        this.result('XFV-003')
          .info()
          .message(
            `${jurisdiction}: Significant profit (${this.formatCurrency(profit)}) but both ` +
            `TaxPaid and TaxAccrued are negative (refunds)`
          )
          .xpath(`${basePath}/Summary`)
          .build()
      );
    }

    // Loss but positive taxes
    if (profit < -SIGNIFICANT_PROFIT_THRESHOLD && (taxPaid > 0 || taxAccrued > 0)) {
      results.push(
        this.result('XFV-003')
          .info()
          .message(
            `${jurisdiction}: Loss of ${this.formatCurrency(profit)} but taxes paid/accrued ` +
            `(may be due to permanent differences or withholding taxes)`
          )
          .xpath(`${basePath}/Summary`)
          .build()
      );
    }

    return results;
  }

  /**
   * XFV-004: Validate tangible assets vs business activities
   */
  private validateAssetActivityConsistency(
    summary: Summary,
    activities: BizActivityCode[],
    jurisdiction: string,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const tangibleAssets = summary.tangibleAssets.value;
    const revenue = summary.totalRevenues.value;

    // Manufacturing with very low assets
    if (activities.includes('CBC504')) {
      if (tangibleAssets < MIN_MANUFACTURING_ASSETS && revenue > 1_000_000) {
        results.push(
          this.result('XFV-004')
            .info()
            .message(
              `${jurisdiction}: Manufacturing activity (CBC504) but low tangible assets ` +
              `(${this.formatCurrency(tangibleAssets)}) relative to revenue (${this.formatCurrency(revenue)})`
            )
            .xpath(`${basePath}/Summary/Assets`)
            .suggestion('Verify if manufacturing is subcontracted or assets are leased')
            .build()
        );
      }

      // Check revenue to asset ratio
      if (tangibleAssets > 0) {
        const ratio = revenue / tangibleAssets;
        if (ratio > MANUFACTURING_ASSET_RATIO) {
          results.push(
            this.result('XFV-004')
              .info()
              .message(
                `${jurisdiction}: High revenue to tangible assets ratio (${ratio.toFixed(1)}x) for manufacturing`
              )
              .xpath(`${basePath}/Summary`)
              .build()
          );
        }
      }
    }

    // Holding company with high tangible assets
    const isHoldingOnly = activities.length > 0 && 
      activities.every((a) => HOLDING_ACTIVITIES.includes(a));
    
    if (isHoldingOnly && tangibleAssets > 10_000_000) {
      results.push(
        this.result('XFV-004')
          .info()
          .message(
            `${jurisdiction}: Only holding activities but significant tangible assets ` +
            `(${this.formatCurrency(tangibleAssets)})`
          )
          .xpath(`${basePath}/Summary/Assets`)
          .suggestion('Verify if additional activity codes should be selected')
          .build()
      );
    }

    // Asset-intensive activities with zero assets
    const hasAssetIntensiveActivity = activities.some((a) => 
      ASSET_INTENSIVE_ACTIVITIES.includes(a)
    );
    
    if (hasAssetIntensiveActivity && tangibleAssets === 0 && revenue > 0) {
      results.push(
        this.result('XFV-004')
          .warning()
          .message(
            `${jurisdiction}: Asset-intensive activities but zero tangible assets reported`
          )
          .xpath(`${basePath}/Summary/Assets`)
          .build()
      );
    }

    return results;
  }

  /**
   * XFV-005: Dividend exclusion from Revenues (May 2024 OECD update)
   * 
   * Per May 2024 OECD guidance, dividends from other group entities
   * should typically be excluded from revenues.
   */
  private validateDividendRevenueExclusion(
    summary: Summary,
    activities: BizActivityCode[],
    jurisdiction: string,
    basePath: string,
    ctx: ValidationContext
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check if entity has activities that typically receive dividends
    const hasDividendActivity = activities.some((a) => 
      DIVIDEND_RECEIVING_ACTIVITIES.includes(a)
    );

    if (!hasDividendActivity) {
      return results;
    }

    const relatedRevenue = summary.relatedRevenues?.value ?? 0;
    const profit = summary.profitOrLoss.value;

    // If related party revenue significantly exceeds profit, may include dividends
    if (relatedRevenue > 0 && profit > 0 && relatedRevenue > profit * 1.5) {
      results.push(
        this.result('XFV-005')
          .info()
          .message(
            `${jurisdiction}: Holding/finance activities with high related party revenue ` +
            `(${this.formatCurrency(relatedRevenue)}) - verify dividends are excluded per May 2024 OECD guidance`
          )
          .xpath(`${basePath}/Summary/Revenues/Related`)
          .suggestion(
            'Per OECD guidance, dividends from group entities should be excluded from revenues. ' +
            'Consider documenting dividend treatment in AdditionalInfo.'
          )
          .build()
      );
    }

    return results;
  }

  /**
   * XFV-006: Dividend exclusion from ProfitOrLoss
   * 
   * Profits may need adjustment for dividend income that should be excluded
   * from the CbC report profit calculation.
   */
  private validateDividendProfitExclusion(
    summary: Summary,
    activities: BizActivityCode[],
    jurisdiction: string,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Only check for holding activities
    if (!activities.includes('CBC511')) {
      return results;
    }

    const profit = summary.profitOrLoss.value;
    const revenue = summary.totalRevenues.value;
    const employees = summary.numberOfEmployees;

    // High profit with minimal operations may indicate dividend income
    if (profit > 10_000_000 && employees <= 5 && revenue < profit * 0.5) {
      results.push(
        this.result('XFV-006')
          .info()
          .message(
            `${jurisdiction}: High profit (${this.formatCurrency(profit)}) with minimal operations ` +
            `(${employees} employees) - verify dividend treatment in P&L`
          )
          .xpath(`${basePath}/Summary/ProfitOrLoss`)
          .suggestion(
            'If profit includes dividends from group entities, review OECD guidance on appropriate treatment'
          )
          .build()
      );
    }

    return results;
  }

  /**
   * Validate global cross-jurisdiction consistency
   */
  private validateGlobalConsistency(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const jurisdictions = ctx.getJurisdictionReferences();

    // Check for jurisdiction with all negative values
    for (const j of jurisdictions) {
      if (
        j.totalRevenues < 0 &&
        j.profitOrLoss < 0 &&
        j.taxPaid < 0 &&
        j.taxAccrued < 0
      ) {
        results.push(
          this.result('XFV-003')
            .warning()
            .message(`${j.code}: All Summary values are negative - verify sign conventions`)
            .build()
        );
      }
    }

    // Check for extreme concentration
    if (jurisdictions.length > 3) {
      const globalTotals = ctx.getGlobalTotals();
      const maxEmployeePct = Math.max(...jurisdictions.map((j) => 
        globalTotals.employees > 0 ? j.employees / globalTotals.employees : 0
      ));

      if (maxEmployeePct > 0.95) {
        const topJurisdiction = jurisdictions.find((j) => 
          globalTotals.employees > 0 && j.employees / globalTotals.employees === maxEmployeePct
        );
        results.push(
          this.result('XFV-003')
            .info()
            .message(
              `${topJurisdiction?.code ?? 'One jurisdiction'} has ${(maxEmployeePct * 100).toFixed(0)}% of all employees`
            )
            .build()
        );
      }
    }

    return results;
  }
}

