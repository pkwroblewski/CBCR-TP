/**
 * Safe Harbour Validator
 *
 * Implements the Transitional CbCR Safe Harbour tests as per OECD guidance.
 * These tests allow MNE groups to avoid detailed GloBE calculations for
 * jurisdictions that meet certain thresholds.
 *
 * Three tests available (passing any one qualifies):
 * 1. De Minimis Test - Low revenue and profit jurisdictions
 * 2. Simplified ETR Test - ETR above transition thresholds
 * 3. Routine Profits Test - Profit <= Substance-based exclusion
 *
 * Reference: OECD Administrative Guidance (February 2023, July 2023)
 *
 * @module lib/validators/pillar2/safe-harbour-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext, JurisdictionReference } from '../core/validation-context';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * De Minimis Test thresholds (in EUR)
 */
const DE_MINIMIS = {
  /** Maximum revenue to qualify */
  REVENUE_THRESHOLD: 10_000_000,
  /** Maximum profit before tax to qualify */
  PROFIT_THRESHOLD: 1_000_000,
};

/**
 * Simplified ETR Test transitional rates
 */
const SIMPLIFIED_ETR_RATES: Record<number, number> = {
  2024: 0.15, // 15%
  2025: 0.16, // 16%
  2026: 0.17, // 17%
  // After 2026: standard 15% but safe harbour ends
};

/**
 * Substance-Based Income Exclusion (SBIE) transitional rates
 * Percentage of eligible payroll/assets excluded from GloBE income
 */
const SBIE_RATES: Record<number, { payroll: number; assets: number }> = {
  2024: { payroll: 0.10, assets: 0.08 },
  2025: { payroll: 0.095, assets: 0.076 },
  2026: { payroll: 0.09, assets: 0.072 },
  2027: { payroll: 0.085, assets: 0.068 },
  2028: { payroll: 0.08, assets: 0.064 },
  2029: { payroll: 0.075, assets: 0.06 },
  2030: { payroll: 0.07, assets: 0.056 },
  2031: { payroll: 0.065, assets: 0.052 },
  2032: { payroll: 0.06, assets: 0.048 },
  // Final rates after transition
  2033: { payroll: 0.05, assets: 0.05 },
};

/**
 * Average annual payroll cost per employee by jurisdiction (in EUR)
 * Based on OECD/Eurostat data for 2023-2024 average employer costs
 * These are estimates and should be updated annually
 *
 * Source: OECD Statistics, Eurostat Labour Cost Index
 */
const AVERAGE_PAYROLL_BY_JURISDICTION: Record<string, number> = {
  // Western Europe
  LU: 85_000,  // Luxembourg - high cost of living
  CH: 95_000,  // Switzerland
  BE: 65_000,  // Belgium
  NL: 62_000,  // Netherlands
  DE: 60_000,  // Germany
  FR: 55_000,  // France
  AT: 58_000,  // Austria
  IE: 65_000,  // Ireland
  GB: 55_000,  // United Kingdom
  IT: 45_000,  // Italy
  ES: 40_000,  // Spain
  PT: 28_000,  // Portugal

  // Nordic
  DK: 70_000,  // Denmark
  NO: 75_000,  // Norway
  SE: 60_000,  // Sweden
  FI: 55_000,  // Finland
  IS: 65_000,  // Iceland

  // Eastern Europe
  PL: 22_000,  // Poland
  CZ: 25_000,  // Czech Republic
  HU: 20_000,  // Hungary
  RO: 15_000,  // Romania
  BG: 12_000,  // Bulgaria
  SK: 22_000,  // Slovakia
  SI: 30_000,  // Slovenia
  HR: 18_000,  // Croatia

  // Americas
  US: 70_000,  // United States
  CA: 60_000,  // Canada
  MX: 15_000,  // Mexico
  BR: 18_000,  // Brazil
  AR: 12_000,  // Argentina

  // Asia-Pacific
  JP: 50_000,  // Japan
  KR: 45_000,  // South Korea
  SG: 60_000,  // Singapore
  HK: 55_000,  // Hong Kong
  AU: 65_000,  // Australia
  NZ: 50_000,  // New Zealand
  CN: 20_000,  // China
  IN: 8_000,   // India
  MY: 15_000,  // Malaysia
  TH: 10_000,  // Thailand
  ID: 8_000,   // Indonesia
  VN: 6_000,   // Vietnam
  PH: 7_000,   // Philippines

  // Middle East
  AE: 45_000,  // UAE
  SA: 40_000,  // Saudi Arabia
  IL: 50_000,  // Israel

  // Africa
  ZA: 20_000,  // South Africa
  NG: 8_000,   // Nigeria
  EG: 6_000,   // Egypt
  MA: 10_000,  // Morocco
};

/** Default payroll per employee if jurisdiction not found (EUR) */
const DEFAULT_PAYROLL_PER_EMPLOYEE = 40_000;

/**
 * Safe Harbour validity period
 */
const SAFE_HARBOUR_PERIOD = {
  /** First fiscal year safe harbour applies */
  START_YEAR: 2024,
  /** Last fiscal year for transitional safe harbour */
  END_YEAR: 2026,
};

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of safe harbour analysis for a jurisdiction
 */
export interface SafeHarbourResult {
  /** Jurisdiction code */
  jurisdiction: string;
  /** Whether any safe harbour test passed */
  qualifies: boolean;
  /** Which test(s) passed */
  passedTests: SafeHarbourTest[];
  /** Detailed test results */
  tests: {
    deMinimis: DeMinimisTestResult;
    simplifiedEtr: SimplifiedEtrTestResult;
    routineProfits: RoutineProfitsTestResult;
  };
  /** Recommendations */
  recommendations: string[];
}

type SafeHarbourTest = 'de_minimis' | 'simplified_etr' | 'routine_profits';

interface DeMinimisTestResult {
  passed: boolean;
  revenue: number;
  profit: number;
  revenueThreshold: number;
  profitThreshold: number;
}

interface SimplifiedEtrTestResult {
  passed: boolean;
  etr: number;
  threshold: number;
  taxAccrued: number;
  profitBeforeTax: number;
}

interface RoutineProfitsTestResult {
  passed: boolean;
  sbieAmount: number;
  profitBeforeTax: number;
  payrollCarveOut: number;
  assetCarveOut: number;
  eligiblePayroll: number;
  tangibleAssets: number;
}

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates Pillar 2 Transitional CbCR Safe Harbour eligibility
 */
export class SafeHarbourValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'pillar2-safe-harbour',
    name: 'Safe Harbour Validator',
    description: 'Validates Transitional CbCR Safe Harbour eligibility',
    category: ValidationCategory.PILLAR2_READINESS,
    order: 400,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Skip if Pillar 2 checks not requested
    if (!ctx.options.checkPillar2) {
      return results;
    }

    // Get fiscal year for transitional rates
    const fiscalYear = this.getFiscalYear(ctx);

    // Check if safe harbour is applicable for this fiscal year
    if (fiscalYear < SAFE_HARBOUR_PERIOD.START_YEAR) {
      results.push(
        this.result('P2-SH-000')
          .info()
          .message(
            `Transitional CbCR Safe Harbour not applicable for FY ${fiscalYear} ` +
            `(applies from FY ${SAFE_HARBOUR_PERIOD.START_YEAR})`
          )
          .build()
      );
      return results;
    }

    if (fiscalYear > SAFE_HARBOUR_PERIOD.END_YEAR) {
      results.push(
        this.result('P2-SH-000')
          .warning()
          .message(
            `Transitional CbCR Safe Harbour ends after FY ${SAFE_HARBOUR_PERIOD.END_YEAR}. ` +
            `FY ${fiscalYear} may require permanent safe harbour or full GloBE calculation.`
          )
          .build()
      );
    }

    // Analyze each jurisdiction
    const jurisdictions = ctx.getJurisdictionReferences();
    const safeHarbourResults: SafeHarbourResult[] = [];

    for (const jurisdiction of jurisdictions) {
      const shResult = this.analyzeJurisdiction(jurisdiction, fiscalYear);
      safeHarbourResults.push(shResult);
      results.push(...this.createResultsForJurisdiction(shResult, fiscalYear));
    }

    // Summary results
    results.push(...this.createSummaryResults(safeHarbourResults, fiscalYear));

    return results;
  }

  /**
   * Analyze a jurisdiction for safe harbour eligibility
   */
  private analyzeJurisdiction(
    j: JurisdictionReference,
    fiscalYear: number
  ): SafeHarbourResult {
    const passedTests: SafeHarbourTest[] = [];
    const recommendations: string[] = [];

    // Get rates for fiscal year
    const etrThreshold = this.getEtrThreshold(fiscalYear);
    const sbieRates = this.getSbieRates(fiscalYear);

    // Test 1: De Minimis
    const deMinimis = this.testDeMinimis(j);
    if (deMinimis.passed) passedTests.push('de_minimis');

    // Test 2: Simplified ETR (only if profitable)
    const simplifiedEtr = this.testSimplifiedEtr(j, etrThreshold);
    if (simplifiedEtr.passed) passedTests.push('simplified_etr');

    // Test 3: Routine Profits (SBIE)
    const routineProfits = this.testRoutineProfits(j, sbieRates);
    if (routineProfits.passed) passedTests.push('routine_profits');

    // Generate recommendations
    if (passedTests.length === 0) {
      recommendations.push('Full GloBE calculation required for this jurisdiction');
      
      if (j.profitOrLoss > 0) {
        const gapToDeMinimis = this.calculateDeMinimisGap(j);
        if (gapToDeMinimis.revenueGap < 2_000_000 && gapToDeMinimis.profitGap < 500_000) {
          recommendations.push('Close to de minimis threshold - verify data accuracy');
        }
      }
    } else {
      recommendations.push(`Safe harbour applies via: ${passedTests.join(', ')}`);
    }

    return {
      jurisdiction: j.code,
      qualifies: passedTests.length > 0,
      passedTests,
      tests: {
        deMinimis,
        simplifiedEtr,
        routineProfits,
      },
      recommendations,
    };
  }

  /**
   * Test 1: De Minimis Test
   */
  private testDeMinimis(j: JurisdictionReference): DeMinimisTestResult {
    const passed =
      j.totalRevenues < DE_MINIMIS.REVENUE_THRESHOLD &&
      j.profitOrLoss < DE_MINIMIS.PROFIT_THRESHOLD;

    return {
      passed,
      revenue: j.totalRevenues,
      profit: j.profitOrLoss,
      revenueThreshold: DE_MINIMIS.REVENUE_THRESHOLD,
      profitThreshold: DE_MINIMIS.PROFIT_THRESHOLD,
    };
  }

  /**
   * Test 2: Simplified ETR Test
   */
  private testSimplifiedEtr(
    j: JurisdictionReference,
    threshold: number
  ): SimplifiedEtrTestResult {
    // Cannot pass if loss-making
    if (j.profitOrLoss <= 0) {
      return {
        passed: false,
        etr: 0,
        threshold,
        taxAccrued: j.taxAccrued,
        profitBeforeTax: j.profitOrLoss,
      };
    }

    const etr = j.taxAccrued / j.profitOrLoss;
    const passed = etr >= threshold;

    return {
      passed,
      etr,
      threshold,
      taxAccrued: j.taxAccrued,
      profitBeforeTax: j.profitOrLoss,
    };
  }

  /**
   * Test 3: Routine Profits Test (SBIE)
   *
   * Calculates Substance-Based Income Exclusion using:
   * - Tangible assets from CbCR Table 1 data
   * - Estimated payroll based on employee count and jurisdiction averages
   *
   * Note: This is a simplified calculation using CbCR data.
   * Full GloBE calculation would use more detailed accounting data.
   */
  private testRoutineProfits(
    j: JurisdictionReference,
    rates: { payroll: number; assets: number }
  ): RoutineProfitsTestResult {
    // Estimate eligible payroll from employee count using jurisdiction-specific costs
    const payrollPerEmployee = this.getPayrollPerEmployee(j.code);
    const eligiblePayroll = j.employees * payrollPerEmployee;

    // Tangible assets from CbCR Table 1 (now properly extracted)
    const tangibleAssets = j.tangibleAssets;

    // Calculate carve-outs
    const payrollCarveOut = eligiblePayroll * rates.payroll;
    const assetCarveOut = tangibleAssets * rates.assets;
    const sbieAmount = payrollCarveOut + assetCarveOut;

    // Test: Profit <= SBIE means no top-up tax needed
    const passed = j.profitOrLoss <= sbieAmount;

    return {
      passed,
      sbieAmount,
      profitBeforeTax: j.profitOrLoss,
      payrollCarveOut,
      assetCarveOut,
      eligiblePayroll,
      tangibleAssets,
    };
  }

  /**
   * Get estimated payroll per employee for a jurisdiction
   * Uses OECD/Eurostat average labour costs by country
   */
  private getPayrollPerEmployee(jurisdictionCode: string): number {
    return AVERAGE_PAYROLL_BY_JURISDICTION[jurisdictionCode] ?? DEFAULT_PAYROLL_PER_EMPLOYEE;
  }

  /**
   * Calculate gap to de minimis threshold
   */
  private calculateDeMinimisGap(j: JurisdictionReference): {
    revenueGap: number;
    profitGap: number;
  } {
    return {
      revenueGap: Math.max(0, j.totalRevenues - DE_MINIMIS.REVENUE_THRESHOLD),
      profitGap: Math.max(0, j.profitOrLoss - DE_MINIMIS.PROFIT_THRESHOLD),
    };
  }

  /**
   * Get ETR threshold for fiscal year
   */
  private getEtrThreshold(fiscalYear: number): number {
    return SIMPLIFIED_ETR_RATES[fiscalYear] ?? 0.15;
  }

  /**
   * Get SBIE rates for fiscal year
   */
  private getSbieRates(fiscalYear: number): { payroll: number; assets: number } {
    return SBIE_RATES[fiscalYear] ?? SBIE_RATES[2033]; // Use final rates as default
  }

  /**
   * Get fiscal year from context
   */
  private getFiscalYear(ctx: ValidationContext): number {
    const reportingPeriod = ctx.getReportingPeriod();
    if (reportingPeriod) {
      return parseInt(reportingPeriod.substring(0, 4), 10);
    }
    return new Date().getFullYear();
  }

  /**
   * Create validation results for a jurisdiction
   */
  private createResultsForJurisdiction(
    shResult: SafeHarbourResult,
    fiscalYear: number
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const j = shResult.jurisdiction;

    if (shResult.qualifies) {
      results.push(
        this.result('P2-SH-PASS')
          .info()
          .message(
            `${j}: Qualifies for Transitional CbCR Safe Harbour ` +
            `(${shResult.passedTests.join(', ')})`
          )
          .details({
            jurisdiction: j,
            passedTests: shResult.passedTests,
            fiscalYear,
            tests: shResult.tests,
          })
          .build()
      );
    } else {
      // Check why it failed
      const tests = shResult.tests;

      // De Minimis failure details
      if (!tests.deMinimis.passed) {
        if (tests.deMinimis.revenue >= DE_MINIMIS.REVENUE_THRESHOLD) {
          results.push(
            this.result('P2-SH-DM')
              .info()
              .message(
                `${j}: De minimis test failed - revenue €${(tests.deMinimis.revenue / 1_000_000).toFixed(1)}M ` +
                `exceeds €10M threshold`
              )
              .build()
          );
        }
      }

      // Simplified ETR failure details
      if (!tests.simplifiedEtr.passed && tests.simplifiedEtr.profitBeforeTax > 0) {
        results.push(
          this.result('P2-SH-ETR')
            .warning()
            .message(
              `${j}: Simplified ETR test failed - ETR ${(tests.simplifiedEtr.etr * 100).toFixed(1)}% ` +
              `below ${(tests.simplifiedEtr.threshold * 100).toFixed(0)}% threshold`
            )
            .details({
              etr: (tests.simplifiedEtr.etr * 100).toFixed(2),
              threshold: (tests.simplifiedEtr.threshold * 100).toFixed(0),
              taxAccrued: tests.simplifiedEtr.taxAccrued,
              profit: tests.simplifiedEtr.profitBeforeTax,
            })
            .build()
          );
      }

      // Overall failure message
      results.push(
        this.result('P2-SH-FAIL')
          .warning()
          .message(
            `${j}: Does not qualify for Transitional CbCR Safe Harbour - ` +
            `full GloBE calculation may be required`
          )
          .suggestion(shResult.recommendations.join('. '))
          .build()
      );
    }

    return results;
  }

  /**
   * Create summary results across all jurisdictions
   */
  private createSummaryResults(
    results: SafeHarbourResult[],
    fiscalYear: number
  ): ValidationResult[] {
    const qualifying = results.filter((r) => r.qualifies);
    const notQualifying = results.filter((r) => !r.qualifies);

    const summaryResults: ValidationResult[] = [];

    summaryResults.push(
      this.result('P2-SH-SUMMARY')
        .info()
        .message(
          `Transitional CbCR Safe Harbour (FY ${fiscalYear}): ` +
          `${qualifying.length}/${results.length} jurisdictions qualify`
        )
        .details({
          fiscalYear,
          totalJurisdictions: results.length,
          qualifying: qualifying.length,
          notQualifying: notQualifying.length,
          qualifyingList: qualifying.map((r) => r.jurisdiction),
          notQualifyingList: notQualifying.map((r) => r.jurisdiction),
        })
        .build()
    );

    if (notQualifying.length > 0) {
      summaryResults.push(
        this.result('P2-SH-ACTION')
          .warning()
          .message(
            `${notQualifying.length} jurisdiction(s) require full GloBE calculation: ` +
            `${notQualifying.map((r) => r.jurisdiction).join(', ')}`
          )
          .suggestion(
            'These jurisdictions do not qualify for the transitional safe harbour. ' +
            'Detailed Pillar 2 calculations are needed to determine top-up tax liability.'
          )
          .build()
      );
    }

    return summaryResults;
  }
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export {
  DE_MINIMIS,
  SIMPLIFIED_ETR_RATES,
  SBIE_RATES,
  SAFE_HARBOUR_PERIOD,
  AVERAGE_PAYROLL_BY_JURISDICTION,
  DEFAULT_PAYROLL_PER_EMPLOYEE,
};

/**
 * Get the simplified ETR threshold for a fiscal year
 */
export function getSimplifiedEtrThreshold(fiscalYear: number): number {
  return SIMPLIFIED_ETR_RATES[fiscalYear] ?? 0.15;
}

/**
 * Get SBIE rates for a fiscal year
 */
export function getSbieRatesForYear(fiscalYear: number): { payroll: number; assets: number } {
  return SBIE_RATES[fiscalYear] ?? SBIE_RATES[2033];
}

/**
 * Check if a jurisdiction qualifies for de minimis safe harbour
 */
export function isDeMinimisEligible(revenue: number, profit: number): boolean {
  return revenue < DE_MINIMIS.REVENUE_THRESHOLD && profit < DE_MINIMIS.PROFIT_THRESHOLD;
}

/**
 * Calculate simplified ETR from CbCR data
 */
export function calculateSimplifiedEtr(taxAccrued: number, profitBeforeTax: number): number {
  if (profitBeforeTax <= 0) return 0;
  return taxAccrued / profitBeforeTax;
}

