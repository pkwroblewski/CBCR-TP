/**
 * Summary Validator
 *
 * Validates Summary (Table 1) data according to OECD CbC XML Schema v2.0
 * requirements including revenue validation, data quality checks, and
 * cross-field validation.
 *
 * @module lib/validators/oecd/summary-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { Summary, CbcReport, MonetaryAmount } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Tolerance for revenue sum validation (percentage-based)
 * Using 0.01% of the larger value to handle floating point issues
 * while still catching genuine discrepancies
 */
const REVENUE_SUM_TOLERANCE_PERCENT = 0.0001; // 0.01%

/** Maximum reasonable value for monetary amounts (quadrillion) */
const MAX_REASONABLE_AMOUNT = 1e15;

/** Threshold for warning about high tax ratio */
const HIGH_TAX_RATIO_THRESHOLD = 0.5;

/** Threshold for warning about very low tax ratio with profit */
const LOW_TAX_RATIO_THRESHOLD = 0.001;

/** Minimum expected employees for large revenue */
const MIN_EMPLOYEES_FOR_LARGE_REVENUE = 1;

/** Large revenue threshold */
const LARGE_REVENUE_THRESHOLD = 10_000_000;

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates Summary (Table 1) data
 */
export class SummaryValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'oecd-summary',
    name: 'Summary Validator',
    description: 'Validates Summary (Table 1) data including revenue and tax validation',
    category: ValidationCategory.DATA_QUALITY,
    order: 50,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate each CbcReport's Summary
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const summary = report.summary;
      const xpath = this.xpathSummary(reportIndex);
      const jurisdiction = report.resCountryCode;

      // SUM-001: Summary required (already enforced by schema)
      if (!summary) {
        results.push(
          this.result('SUM-001')
            .critical()
            .schemaCompliance()
            .message(`Summary is missing for jurisdiction ${jurisdiction}`)
            .xpath(xpath)
            .build()
        );
        continue;
      }

      // Validate summary fields
      results.push(...this.validateSummaryFields(summary, xpath, jurisdiction, report));
    }

    // Cross-jurisdiction validation
    results.push(...this.validateCrossJurisdiction(ctx));

    return results;
  }

  /**
   * Validate individual summary fields
   */
  private validateSummaryFields(
    summary: Summary,
    basePath: string,
    jurisdiction: string,
    report: CbcReport
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // SUM-002: Revenue sum validation
    if (summary.unrelatedRevenues && summary.relatedRevenues) {
      const calculatedTotal =
        summary.unrelatedRevenues.value + summary.relatedRevenues.value;
      const diff = Math.abs(calculatedTotal - summary.totalRevenues.value);

      // Use percentage-based tolerance (0.01% of the larger value)
      const largerValue = Math.max(
        Math.abs(summary.totalRevenues.value),
        Math.abs(calculatedTotal),
        1 // Minimum of 1 to avoid division by zero
      );
      const tolerance = largerValue * REVENUE_SUM_TOLERANCE_PERCENT;

      if (diff > tolerance) {
        results.push(
          this.result('SUM-002')
            .error()
            .message(
              `Total revenues (${this.formatNumber(summary.totalRevenues.value)}) does not equal ` +
              `Unrelated (${this.formatNumber(summary.unrelatedRevenues.value)}) + ` +
              `Related (${this.formatNumber(summary.relatedRevenues.value)}) = ${this.formatNumber(calculatedTotal)}`
            )
            .xpath(`${basePath}/Revenues`)
            .details({
              jurisdiction,
              totalRevenues: summary.totalRevenues.value,
              unrelatedRevenues: summary.unrelatedRevenues.value,
              relatedRevenues: summary.relatedRevenues.value,
              calculatedTotal,
              difference: diff,
              toleranceUsed: tolerance,
            })
            .build()
        );
      }
    } else if (summary.totalRevenues.value > 0) {
      // Both related and unrelated should be present if there are revenues
      if (!summary.unrelatedRevenues || summary.unrelatedRevenues.value === 0) {
        if (!summary.relatedRevenues || summary.relatedRevenues.value === 0) {
          results.push(
            this.result('SUM-002')
              .warning()
              .message(
                `Total revenues present but neither Unrelated nor Related revenues specified for ${jurisdiction}`
              )
              .xpath(`${basePath}/Revenues`)
              .build()
          );
        }
      }
    }

    // SUM-003: Employee count validation
    if (summary.numberOfEmployees < 0) {
      results.push(
        this.result('SUM-003')
          .error()
          .message(`Number of employees cannot be negative for ${jurisdiction}`)
          .xpath(`${basePath}/NbEmployees`)
          .values(String(summary.numberOfEmployees), '>= 0')
          .build()
      );
    }

    // Check for fractional employee count
    if (summary.numberOfEmployees !== Math.floor(summary.numberOfEmployees)) {
      results.push(
        this.result('SUM-003')
          .warning()
          .message(
            `Number of employees should be a whole number for ${jurisdiction}`
          )
          .xpath(`${basePath}/NbEmployees`)
          .build()
      );
    }

    // SUM-004: Monetary amount validation
    results.push(...this.validateMonetaryAmounts(summary, basePath, jurisdiction));

    // SUM-005: Tax paid reasonableness
    results.push(...this.validateTaxReasonableness(summary, basePath, jurisdiction));

    // SUM-006: Zero revenue with employees
    if (
      summary.totalRevenues.value === 0 &&
      summary.numberOfEmployees > MIN_EMPLOYEES_FOR_LARGE_REVENUE
    ) {
      results.push(
        this.result('SUM-006')
          .warning()
          .message(
            `${jurisdiction}: ${summary.numberOfEmployees} employees but zero revenue - verify this is correct`
          )
          .xpath(basePath)
          .build()
      );
    }

    // Check for large revenue with zero employees
    if (
      summary.totalRevenues.value > LARGE_REVENUE_THRESHOLD &&
      summary.numberOfEmployees === 0
    ) {
      results.push(
        this.result('SUM-006')
          .warning()
          .message(
            `${jurisdiction}: Revenue of ${this.formatCurrency(summary.totalRevenues.value)} but zero employees reported`
          )
          .xpath(basePath)
          .suggestion('Verify employee count includes independent contractors if applicable')
          .build()
      );
    }

    // SUM-008: Tangible assets validation
    if (summary.tangibleAssets.value < 0) {
      results.push(
        this.result('SUM-008')
          .error()
          .message(`Tangible assets cannot be negative for ${jurisdiction}`)
          .xpath(`${basePath}/Assets`)
          .build()
      );
    }

    // SUM-009: Capital validation
    if (summary.capital.value < 0) {
      // Negative capital is possible but unusual
      results.push(
        this.result('SUM-009')
          .info()
          .message(
            `${jurisdiction}: Negative stated capital (${this.formatCurrency(summary.capital.value)}) - verify this is correct`
          )
          .xpath(`${basePath}/Capital`)
          .build()
      );
    }

    // Check for zero values across the board (dormant check)
    const allZero =
      summary.totalRevenues.value === 0 &&
      summary.profitOrLoss.value === 0 &&
      summary.taxPaid.value === 0 &&
      summary.taxAccrued.value === 0 &&
      summary.numberOfEmployees === 0 &&
      summary.tangibleAssets.value === 0;

    if (allZero && report.constEntities.constituentEntity.length > 0) {
      const hasDormant = report.constEntities.bizActivities?.includes('CBC512');
      if (!hasDormant) {
        results.push(
          this.result('BIZ-003')
            .info()
            .message(
              `${jurisdiction}: All Summary values are zero but entities are not marked as Dormant (CBC512)`
            )
            .xpath(basePath)
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Validate monetary amounts for format and reasonableness
   */
  private validateMonetaryAmounts(
    summary: Summary,
    basePath: string,
    jurisdiction: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const amountsToCheck: { field: string; amount: MonetaryAmount; allowNegative: boolean }[] = [
      { field: 'TotalRevenues', amount: summary.totalRevenues, allowNegative: false },
      { field: 'ProfitOrLoss', amount: summary.profitOrLoss, allowNegative: true },
      { field: 'TaxPaid', amount: summary.taxPaid, allowNegative: true },
      { field: 'TaxAccrued', amount: summary.taxAccrued, allowNegative: true },
      { field: 'Capital', amount: summary.capital, allowNegative: true },
      { field: 'AccumulatedEarnings', amount: summary.accumulatedEarnings, allowNegative: true },
      { field: 'Assets', amount: summary.tangibleAssets, allowNegative: false },
    ];

    for (const { field, amount, allowNegative } of amountsToCheck) {
      // Check for unreasonable values
      if (Math.abs(amount.value) > MAX_REASONABLE_AMOUNT) {
        results.push(
          this.result('SUM-004')
            .warning()
            .message(
              `${jurisdiction} ${field}: Value ${this.formatNumber(amount.value)} seems unusually large`
            )
            .xpath(`${basePath}/${field}`)
            .build()
        );
      }

      // Check for NaN or Infinity
      if (!isFinite(amount.value)) {
        results.push(
          this.result('SUM-004')
            .error()
            .message(`${jurisdiction} ${field}: Invalid numeric value`)
            .xpath(`${basePath}/${field}`)
            .build()
        );
      }

      // Check for unexpected negative values
      if (!allowNegative && amount.value < 0) {
        results.push(
          this.result('SUM-004')
            .error()
            .message(`${jurisdiction} ${field}: Value cannot be negative`)
            .xpath(`${basePath}/${field}`)
            .build()
        );
      }

      // Check for excessive decimals (amounts should typically be whole numbers)
      const decimals = this.getDecimalPlaces(amount.value);
      if (decimals > 2) {
        results.push(
          this.result('SUM-004')
            .info()
            .message(
              `${jurisdiction} ${field}: Value has ${decimals} decimal places - consider rounding`
            )
            .xpath(`${basePath}/${field}`)
            .build()
        );
      }
    }

    // SUM-010: Currency consistency
    const currencies = new Set<string>();
    for (const { amount } of amountsToCheck) {
      if (amount.currCode) {
        currencies.add(amount.currCode);
      }
    }

    if (currencies.size > 1) {
      results.push(
        this.result('SUM-010')
          .warning()
          .message(
            `${jurisdiction}: Multiple currencies used in Summary: ${Array.from(currencies).join(', ')}`
          )
          .xpath(basePath)
          .suggestion('All amounts in a CbC Report should use the same currency')
          .build()
      );
    }

    return results;
  }

  /**
   * Validate tax amounts for reasonableness
   */
  private validateTaxReasonableness(
    summary: Summary,
    basePath: string,
    jurisdiction: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    const profit = summary.profitOrLoss.value;
    const taxPaid = summary.taxPaid.value;
    const taxAccrued = summary.taxAccrued.value;

    // SUM-005: Tax paid reasonableness
    if (profit > 0) {
      // Check for unusually high tax ratio
      const taxRatio = Math.max(taxPaid, taxAccrued) / profit;
      if (taxRatio > HIGH_TAX_RATIO_THRESHOLD) {
        results.push(
          this.result('SUM-005')
            .info()
            .message(
              `${jurisdiction}: Tax ratio (${(taxRatio * 100).toFixed(1)}%) is unusually high relative to profit`
            )
            .xpath(basePath)
            .details({
              profit,
              taxPaid,
              taxAccrued,
              taxRatio,
            })
            .build()
        );
      }

      // SUM-007: Profit but no tax
      if (taxPaid === 0 && taxAccrued === 0) {
        results.push(
          this.result('SUM-007')
            .info()
            .message(
              `${jurisdiction}: Profit of ${this.formatCurrency(profit)} but no tax paid or accrued`
            )
            .xpath(basePath)
            .suggestion('Consider adding explanation in AdditionalInfo if due to tax incentives')
            .build()
        );
      } else if (taxRatio < LOW_TAX_RATIO_THRESHOLD) {
        results.push(
          this.result('SUM-007')
            .info()
            .message(
              `${jurisdiction}: Very low effective tax rate (${(taxRatio * 100).toFixed(3)}%) on profit`
            )
            .xpath(basePath)
            .build()
        );
      }
    }

    // Large discrepancy between tax paid and tax accrued
    if (taxPaid > 0 && taxAccrued > 0) {
      const discrepancyRatio = Math.abs(taxPaid - taxAccrued) / Math.max(taxPaid, taxAccrued);
      if (discrepancyRatio > 0.5) {
        results.push(
          this.result('SUM-005')
            .info()
            .message(
              `${jurisdiction}: Large difference between TaxPaid (${this.formatCurrency(taxPaid)}) and TaxAccrued (${this.formatCurrency(taxAccrued)})`
            )
            .xpath(basePath)
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Cross-jurisdiction validation
   */
  private validateCrossJurisdiction(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const globalTotals = ctx.getGlobalTotals();

    // Check global revenue reasonableness (MNE threshold is 750M EUR)
    if (globalTotals.totalRevenues < 750_000_000) {
      results.push(
        this.result('XFV-006')
          .info()
          .message(
            `Global total revenues (${this.formatCurrency(globalTotals.totalRevenues)}) below EUR 750M CbCR threshold`
          )
          .suggestion('Verify all jurisdictions are included if MNE group exceeds threshold')
          .build()
      );
    }

    // Check for unusual distribution
    const jurisdictions = ctx.getJurisdictionReferences();
    if (jurisdictions.length > 1) {
      // Find jurisdictions with very high profit concentration
      const totalProfit = Math.max(globalTotals.profitOrLoss, 1);
      for (const j of jurisdictions) {
        const profitShare = j.profitOrLoss / totalProfit;
        if (profitShare > 0.9 && jurisdictions.length > 3) {
          results.push(
            this.result('XFV-008')
              .info()
              .message(
                `${j.code} accounts for ${(profitShare * 100).toFixed(1)}% of global profit`
              )
              .build()
          );
        }
      }
    }

    return results;
  }

  /**
   * Get number of decimal places in a number
   */
  private getDecimalPlaces(value: number): number {
    if (Math.floor(value) === value) return 0;
    const str = Math.abs(value).toString();
    const decimalIndex = str.indexOf('.');
    if (decimalIndex === -1) return 0;
    return str.length - decimalIndex - 1;
  }
}

