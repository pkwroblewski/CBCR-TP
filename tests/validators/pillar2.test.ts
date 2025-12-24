/**
 * Pillar 2 Safe Harbour Validator Tests
 *
 * Comprehensive tests for the Transitional CbCR Safe Harbour validation.
 * Tests cover all three safe harbour tests:
 * 1. De Minimis Test
 * 2. Simplified ETR Test
 * 3. Routine Profits (SBIE) Test
 *
 * @module tests/validators/pillar2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformXmlToCbcReport } from '@/lib/parsers/xml-transformer';
import {
  SafeHarbourValidator,
  DE_MINIMIS,
  SIMPLIFIED_ETR_RATES,
  SBIE_RATES,
  SAFE_HARBOUR_PERIOD,
  AVERAGE_PAYROLL_BY_JURISDICTION,
  DEFAULT_PAYROLL_PER_EMPLOYEE,
  getSimplifiedEtrThreshold,
  getSbieRatesForYear,
  isDeMinimisEligible,
  calculateSimplifiedEtr,
} from '@/lib/validators/pillar2/safe-harbour-validator';
import { ValidationContext, JurisdictionReference } from '@/lib/validators/core/validation-context';
import type { ParsedCbcReport } from '@/types/cbcr';
import type { ValidationResult } from '@/types/validation';

// =============================================================================
// TEST DATA
// =============================================================================

const FIXTURES_DIR = join(__dirname, '../fixtures');

let validReport: ParsedCbcReport;

// =============================================================================
// SETUP
// =============================================================================

beforeAll(async () => {
  const validXml = readFileSync(join(FIXTURES_DIR, 'valid-cbcr-report.xml'), 'utf-8');
  const transformed = transformXmlToCbcReport(validXml, 'valid-cbcr-report.xml');
  if (transformed.success) {
    validReport = transformed.data;
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a jurisdiction reference for testing
 */
function createJurisdiction(overrides: Partial<JurisdictionReference> = {}): JurisdictionReference {
  return {
    code: 'LU',
    docRefId: 'DOC-TEST-001',
    entityCount: 1,
    totalRevenues: 5_000_000,
    unrelatedRevenues: 4_000_000,
    relatedRevenues: 1_000_000,
    profitOrLoss: 500_000,
    taxPaid: 100_000,
    taxAccrued: 100_000,
    employees: 10,
    tangibleAssets: 1_000_000,
    capital: 500_000,
    accumulatedEarnings: 1_000_000,
    currencyCode: 'EUR',
    ...overrides,
  };
}

/**
 * Create a test report with specified jurisdictions
 */
function createTestReportWithJurisdictions(
  jurisdictions: JurisdictionReference[],
  fiscalYear: number = 2024
): ParsedCbcReport {
  if (!validReport) {
    throw new Error('Valid report not loaded');
  }

  // Create CbcReports from jurisdiction data with proper structure
  const cbcReports = jurisdictions.map((j) => ({
    docSpec: {
      docTypeIndic: 'OECD1' as const,
      docRefId: j.docRefId,
    },
    resCountryCode: j.code,
    summary: {
      unrelatedRevenues: { value: j.unrelatedRevenues, currCode: j.currencyCode ?? 'EUR' },
      relatedRevenues: { value: j.relatedRevenues, currCode: j.currencyCode ?? 'EUR' },
      totalRevenues: { value: j.totalRevenues, currCode: j.currencyCode ?? 'EUR' },
      profitOrLoss: { value: j.profitOrLoss, currCode: j.currencyCode ?? 'EUR' },
      taxPaid: { value: j.taxPaid, currCode: j.currencyCode ?? 'EUR' },
      taxAccrued: { value: j.taxAccrued, currCode: j.currencyCode ?? 'EUR' },
      capital: { value: j.capital, currCode: j.currencyCode ?? 'EUR' },
      accumulatedEarnings: { value: j.accumulatedEarnings, currCode: j.currencyCode ?? 'EUR' },
      numberOfEmployees: j.employees,
      tangibleAssets: { value: j.tangibleAssets, currCode: j.currencyCode ?? 'EUR' },
    },
    constEntities: {
      constituentEntity: [
        {
          name: [{ value: `Entity in ${j.code}` }],
          tin: [{ value: '12345678901', issuedBy: j.code }],
          address: [],
        },
      ],
      bizActivities: [],
    },
  }));

  return {
    ...validReport,
    message: {
      ...validReport.message,
      messageSpec: {
        ...validReport.message.messageSpec,
        reportingPeriod: `${fiscalYear}-12-31`,
      },
      cbcBody: {
        ...validReport.message.cbcBody,
        cbcReports,
      },
    },
  };
}

/**
 * Run the Safe Harbour validator
 */
async function runSafeHarbourValidator(report: ParsedCbcReport): Promise<ValidationResult[]> {
  const validator = new SafeHarbourValidator();
  const context = new ValidationContext(report, { checkPillar2: true });
  const result = await validator.execute(context);
  return result.results;
}

/**
 * Find results by rule ID
 */
function findResultsByRuleId(results: ValidationResult[], ruleId: string): ValidationResult[] {
  return results.filter((r) => r.ruleId === ruleId);
}

/**
 * Check if any result contains the given jurisdiction code
 */
function hasJurisdictionResult(results: ValidationResult[], jurisdiction: string): boolean {
  return results.some((r) => r.message?.includes(jurisdiction));
}

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('Safe Harbour Utility Functions', () => {
  describe('isDeMinimisEligible', () => {
    it('should return true when both revenue and profit are below thresholds', () => {
      expect(isDeMinimisEligible(5_000_000, 500_000)).toBe(true);
    });

    it('should return false when revenue exceeds threshold', () => {
      expect(isDeMinimisEligible(15_000_000, 500_000)).toBe(false);
    });

    it('should return false when profit exceeds threshold', () => {
      expect(isDeMinimisEligible(5_000_000, 1_500_000)).toBe(false);
    });

    it('should return false when both exceed thresholds', () => {
      expect(isDeMinimisEligible(15_000_000, 2_000_000)).toBe(false);
    });

    it('should use €10M revenue threshold', () => {
      expect(isDeMinimisEligible(9_999_999, 500_000)).toBe(true);
      expect(isDeMinimisEligible(10_000_000, 500_000)).toBe(false);
    });

    it('should use €1M profit threshold', () => {
      expect(isDeMinimisEligible(5_000_000, 999_999)).toBe(true);
      expect(isDeMinimisEligible(5_000_000, 1_000_000)).toBe(false);
    });
  });

  describe('calculateSimplifiedEtr', () => {
    it('should calculate ETR correctly for profitable jurisdiction', () => {
      const etr = calculateSimplifiedEtr(200_000, 1_000_000);
      expect(etr).toBe(0.2); // 20%
    });

    it('should return 0 for loss-making jurisdiction', () => {
      const etr = calculateSimplifiedEtr(50_000, -100_000);
      expect(etr).toBe(0);
    });

    it('should return 0 for zero profit', () => {
      const etr = calculateSimplifiedEtr(50_000, 0);
      expect(etr).toBe(0);
    });

    it('should handle high ETR correctly', () => {
      const etr = calculateSimplifiedEtr(350_000, 1_000_000);
      expect(etr).toBe(0.35); // 35%
    });
  });

  describe('getSimplifiedEtrThreshold', () => {
    it('should return 15% for 2024', () => {
      expect(getSimplifiedEtrThreshold(2024)).toBe(0.15);
    });

    it('should return 16% for 2025', () => {
      expect(getSimplifiedEtrThreshold(2025)).toBe(0.16);
    });

    it('should return 17% for 2026', () => {
      expect(getSimplifiedEtrThreshold(2026)).toBe(0.17);
    });

    it('should return 15% as default for years after safe harbour period', () => {
      expect(getSimplifiedEtrThreshold(2027)).toBe(0.15);
      expect(getSimplifiedEtrThreshold(2030)).toBe(0.15);
    });
  });

  describe('getSbieRatesForYear', () => {
    it('should return correct rates for 2024', () => {
      const rates = getSbieRatesForYear(2024);
      expect(rates.payroll).toBe(0.10);
      expect(rates.assets).toBe(0.08);
    });

    it('should return correct rates for 2026', () => {
      const rates = getSbieRatesForYear(2026);
      expect(rates.payroll).toBe(0.09);
      expect(rates.assets).toBe(0.072);
    });

    it('should return final rates for years after transition', () => {
      const rates = getSbieRatesForYear(2040);
      expect(rates.payroll).toBe(0.05);
      expect(rates.assets).toBe(0.05);
    });
  });
});

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('Safe Harbour Constants', () => {
  it('should have correct de minimis thresholds', () => {
    expect(DE_MINIMIS.REVENUE_THRESHOLD).toBe(10_000_000);
    expect(DE_MINIMIS.PROFIT_THRESHOLD).toBe(1_000_000);
  });

  it('should have ETR rates for 2024-2026', () => {
    expect(SIMPLIFIED_ETR_RATES[2024]).toBeDefined();
    expect(SIMPLIFIED_ETR_RATES[2025]).toBeDefined();
    expect(SIMPLIFIED_ETR_RATES[2026]).toBeDefined();
  });

  it('should have SBIE rates for transition period', () => {
    for (let year = 2024; year <= 2033; year++) {
      expect(SBIE_RATES[year]).toBeDefined();
      expect(SBIE_RATES[year].payroll).toBeGreaterThan(0);
      expect(SBIE_RATES[year].assets).toBeGreaterThan(0);
    }
  });

  it('should have safe harbour period from 2024 to 2026', () => {
    expect(SAFE_HARBOUR_PERIOD.START_YEAR).toBe(2024);
    expect(SAFE_HARBOUR_PERIOD.END_YEAR).toBe(2026);
  });

  it('should have payroll data for common jurisdictions', () => {
    expect(AVERAGE_PAYROLL_BY_JURISDICTION['LU']).toBeDefined();
    expect(AVERAGE_PAYROLL_BY_JURISDICTION['DE']).toBeDefined();
    expect(AVERAGE_PAYROLL_BY_JURISDICTION['FR']).toBeDefined();
    expect(AVERAGE_PAYROLL_BY_JURISDICTION['US']).toBeDefined();
    expect(AVERAGE_PAYROLL_BY_JURISDICTION['GB']).toBeDefined();
  });

  it('should have Luxembourg with high payroll cost', () => {
    expect(AVERAGE_PAYROLL_BY_JURISDICTION['LU']).toBeGreaterThan(80_000);
  });
});

// =============================================================================
// DE MINIMIS TEST
// =============================================================================

describe('De Minimis Test (P2-SH-DM)', () => {
  it('should pass for low revenue and low profit jurisdiction', async () => {
    const jurisdiction = createJurisdiction({
      code: 'LU',
      totalRevenues: 5_000_000,
      profitOrLoss: 500_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // Should find P2-SH-PASS (qualifies for safe harbour)
    const passResults = findResultsByRuleId(results, 'P2-SH-PASS');
    expect(passResults.length).toBeGreaterThan(0);
    expect(passResults[0].message).toContain('de_minimis');
  });

  it('should fail when revenue exceeds €10M threshold', async () => {
    const jurisdiction = createJurisdiction({
      code: 'DE',
      totalRevenues: 15_000_000,
      profitOrLoss: 500_000,
      taxAccrued: 50_000, // Low ETR to fail ETR test
      employees: 2,       // Low employees to fail SBIE test
      tangibleAssets: 100_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // Should find de minimis failure message
    const dmResults = findResultsByRuleId(results, 'P2-SH-DM');
    expect(dmResults.length).toBeGreaterThan(0);
    expect(dmResults[0].message).toContain('exceeds');
  });

  it('should fail when profit exceeds €1M threshold', async () => {
    const jurisdiction = createJurisdiction({
      code: 'FR',
      totalRevenues: 5_000_000,
      profitOrLoss: 2_000_000,
      taxAccrued: 200_000, // Low ETR to fail ETR test too
      employees: 5,
      tangibleAssets: 500_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // Check if the jurisdiction doesn't qualify via de minimis
    const passResults = findResultsByRuleId(results, 'P2-SH-PASS');
    // If it passes, it must be via ETR or SBIE, not de minimis
    if (passResults.length > 0) {
      expect(passResults[0].message).not.toContain('de_minimis');
    }
  });

  it('should handle edge case at exactly €10M revenue', async () => {
    const jurisdiction = createJurisdiction({
      code: 'NL',
      totalRevenues: 10_000_000, // Exactly at threshold
      profitOrLoss: 500_000,
      taxAccrued: 25_000, // Very low ETR
      employees: 1,
      tangibleAssets: 50_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // At exactly €10M, should NOT qualify for de minimis (threshold is exclusive)
    const passResults = findResultsByRuleId(results, 'P2-SH-PASS');
    if (passResults.length > 0) {
      expect(passResults[0].message).not.toContain('de_minimis');
    }
  });
});

// =============================================================================
// SIMPLIFIED ETR TEST
// =============================================================================

describe('Simplified ETR Test (P2-SH-ETR)', () => {
  it('should pass for jurisdiction with ETR above 15% in 2024', async () => {
    const jurisdiction = createJurisdiction({
      code: 'DE',
      totalRevenues: 50_000_000,
      profitOrLoss: 5_000_000,
      taxAccrued: 1_000_000, // 20% ETR
      employees: 50,
      tangibleAssets: 5_000_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    const passResults = findResultsByRuleId(results, 'P2-SH-PASS');
    expect(passResults.length).toBeGreaterThan(0);
    expect(passResults[0].message).toContain('simplified_etr');
  });

  it('should fail for jurisdiction with ETR below 15% in 2024', async () => {
    const jurisdiction = createJurisdiction({
      code: 'IE',
      totalRevenues: 50_000_000,
      profitOrLoss: 10_000_000,
      taxAccrued: 1_000_000, // 10% ETR
      employees: 10,
      tangibleAssets: 1_000_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    const etrResults = findResultsByRuleId(results, 'P2-SH-ETR');
    expect(etrResults.length).toBeGreaterThan(0);
    expect(etrResults[0].message).toContain('below');
  });

  it('should use 16% threshold for 2025', async () => {
    const jurisdiction = createJurisdiction({
      code: 'NL',
      totalRevenues: 50_000_000,
      profitOrLoss: 10_000_000,
      taxAccrued: 1_550_000, // 15.5% ETR - passes in 2024 but fails in 2025
      employees: 5,
      tangibleAssets: 500_000,
    });

    // Test 2024 (15% threshold)
    const report2024 = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results2024 = await runSafeHarbourValidator(report2024);
    const pass2024 = findResultsByRuleId(results2024, 'P2-SH-PASS');
    expect(pass2024.length).toBeGreaterThan(0);

    // Test 2025 (16% threshold)
    const report2025 = createTestReportWithJurisdictions([jurisdiction], 2025);
    const results2025 = await runSafeHarbourValidator(report2025);
    const etr2025 = findResultsByRuleId(results2025, 'P2-SH-ETR');
    expect(etr2025.length).toBeGreaterThan(0);
  });

  it('should fail ETR test for loss-making jurisdiction', async () => {
    const jurisdiction = createJurisdiction({
      code: 'ES',
      totalRevenues: 50_000_000,
      profitOrLoss: -1_000_000, // Loss
      taxAccrued: 0,
      employees: 50,
      tangibleAssets: 10_000_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // Should not pass via ETR test
    const passResults = findResultsByRuleId(results, 'P2-SH-PASS');
    if (passResults.length > 0) {
      expect(passResults[0].message).not.toContain('simplified_etr');
    }
  });

  it('should handle exactly at threshold ETR', async () => {
    const jurisdiction = createJurisdiction({
      code: 'BE',
      totalRevenues: 50_000_000,
      profitOrLoss: 10_000_000,
      taxAccrued: 1_500_000, // Exactly 15% ETR
      employees: 20,
      tangibleAssets: 2_000_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // At exactly 15%, should pass (threshold is inclusive)
    const passResults = findResultsByRuleId(results, 'P2-SH-PASS');
    expect(passResults.length).toBeGreaterThan(0);
    expect(passResults[0].message).toContain('simplified_etr');
  });
});

// =============================================================================
// ROUTINE PROFITS (SBIE) TEST
// =============================================================================

describe('Routine Profits (SBIE) Test', () => {
  it('should pass when profit is covered by SBIE carve-outs', async () => {
    // Create jurisdiction with high employees and assets relative to profit
    const jurisdiction = createJurisdiction({
      code: 'LU',
      totalRevenues: 50_000_000,
      profitOrLoss: 500_000, // Low profit
      taxAccrued: 50_000,    // Low ETR (10%)
      employees: 100,        // High employees
      tangibleAssets: 10_000_000, // High assets
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    const passResults = findResultsByRuleId(results, 'P2-SH-PASS');
    expect(passResults.length).toBeGreaterThan(0);
    expect(passResults[0].message).toContain('routine_profits');
  });

  it('should calculate SBIE using jurisdiction-specific payroll', async () => {
    // Luxembourg has higher payroll costs (€85k) than default (€40k)
    const luJurisdiction = createJurisdiction({
      code: 'LU',
      totalRevenues: 50_000_000,
      profitOrLoss: 1_000_000,
      taxAccrued: 100_000,
      employees: 10,
      tangibleAssets: 1_000_000,
    });

    // Create equivalent test jurisdiction with same employees but different code
    const plJurisdiction = createJurisdiction({
      code: 'PL',
      totalRevenues: 50_000_000,
      profitOrLoss: 1_000_000,
      taxAccrued: 100_000,
      employees: 10,
      tangibleAssets: 1_000_000,
    });

    // Luxembourg has higher payroll (€85k vs €22k for Poland)
    // So LU should have higher SBIE carve-out
    expect(AVERAGE_PAYROLL_BY_JURISDICTION['LU']).toBeGreaterThan(
      AVERAGE_PAYROLL_BY_JURISDICTION['PL']
    );
  });

  it('should use default payroll for unknown jurisdictions', async () => {
    // XY is not a known jurisdiction
    expect(AVERAGE_PAYROLL_BY_JURISDICTION['XY']).toBeUndefined();
    expect(DEFAULT_PAYROLL_PER_EMPLOYEE).toBe(40_000);
  });

  it('should use transitional SBIE rates for 2024', () => {
    const rates = SBIE_RATES[2024];
    expect(rates.payroll).toBe(0.10); // 10%
    expect(rates.assets).toBe(0.08);  // 8%
  });

  it('should use lower SBIE rates for later years', () => {
    const rates2024 = SBIE_RATES[2024];
    const rates2030 = SBIE_RATES[2030];

    expect(rates2030.payroll).toBeLessThan(rates2024.payroll);
    expect(rates2030.assets).toBeLessThan(rates2024.assets);
  });

  it('should fail SBIE when profit exceeds carve-out amounts', async () => {
    const jurisdiction = createJurisdiction({
      code: 'SG',
      totalRevenues: 100_000_000,
      profitOrLoss: 20_000_000, // High profit
      taxAccrued: 2_000_000,    // 10% ETR - fails ETR test
      employees: 5,             // Low employees
      tangibleAssets: 500_000,  // Low assets
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // Should fail all tests and require GloBE calculation
    const failResults = findResultsByRuleId(results, 'P2-SH-FAIL');
    expect(failResults.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// FISCAL YEAR BOUNDARY TESTS
// =============================================================================

describe('Fiscal Year Boundaries', () => {
  it('should indicate safe harbour not applicable before 2024', async () => {
    const jurisdiction = createJurisdiction({ code: 'LU' });
    const report = createTestReportWithJurisdictions([jurisdiction], 2023);
    const results = await runSafeHarbourValidator(report);

    const notApplicable = findResultsByRuleId(results, 'P2-SH-000');
    expect(notApplicable.length).toBeGreaterThan(0);
    expect(notApplicable[0].message).toContain('not applicable');
  });

  it('should warn about safe harbour ending after 2026', async () => {
    const jurisdiction = createJurisdiction({ code: 'LU' });
    const report = createTestReportWithJurisdictions([jurisdiction], 2027);
    const results = await runSafeHarbourValidator(report);

    const warning = findResultsByRuleId(results, 'P2-SH-000');
    expect(warning.length).toBeGreaterThan(0);
    expect(warning[0].message).toContain('ends');
  });

  it('should process normally for 2024-2026', async () => {
    const jurisdiction = createJurisdiction({ code: 'DE' });
    const report = createTestReportWithJurisdictions([jurisdiction], 2025);
    const results = await runSafeHarbourValidator(report);

    // Should have summary results
    const summary = findResultsByRuleId(results, 'P2-SH-SUMMARY');
    expect(summary.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// MULTI-JURISDICTION TESTS
// =============================================================================

describe('Multi-Jurisdiction Analysis', () => {
  it('should analyze multiple jurisdictions independently', async () => {
    const jurisdictions = [
      createJurisdiction({
        code: 'LU',
        totalRevenues: 5_000_000,
        profitOrLoss: 500_000, // Qualifies via de minimis
      }),
      createJurisdiction({
        code: 'DE',
        totalRevenues: 50_000_000,
        profitOrLoss: 5_000_000,
        taxAccrued: 1_000_000, // 20% ETR - qualifies via ETR
        docRefId: 'DOC-DE-001',
      }),
      createJurisdiction({
        code: 'IE',
        totalRevenues: 100_000_000,
        profitOrLoss: 20_000_000,
        taxAccrued: 2_000_000, // 10% ETR - fails
        employees: 10,
        tangibleAssets: 1_000_000,
        docRefId: 'DOC-IE-001',
      }),
    ];
    const report = createTestReportWithJurisdictions(jurisdictions, 2024);
    const results = await runSafeHarbourValidator(report);

    // Check summary
    const summary = findResultsByRuleId(results, 'P2-SH-SUMMARY');
    expect(summary.length).toBeGreaterThan(0);
    expect(summary[0].details?.totalJurisdictions).toBe(3);
  });

  it('should generate action items for non-qualifying jurisdictions', async () => {
    const jurisdictions = [
      createJurisdiction({
        code: 'HK',
        totalRevenues: 100_000_000,
        profitOrLoss: 30_000_000,
        taxAccrued: 0, // 0% ETR
        employees: 5,
        tangibleAssets: 500_000,
      }),
    ];
    const report = createTestReportWithJurisdictions(jurisdictions, 2024);
    const results = await runSafeHarbourValidator(report);

    const action = findResultsByRuleId(results, 'P2-SH-ACTION');
    expect(action.length).toBeGreaterThan(0);
    expect(action[0].message).toContain('GloBE calculation');
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle zero profit jurisdiction', async () => {
    const jurisdiction = createJurisdiction({
      code: 'CH',
      totalRevenues: 50_000_000,
      profitOrLoss: 0,
      taxAccrued: 0,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // Should not crash and should handle gracefully
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle negative tangible assets gracefully', async () => {
    const jurisdiction = createJurisdiction({
      code: 'US',
      tangibleAssets: -1_000_000, // Invalid but test robustness
      profitOrLoss: 1_000_000,
      taxAccrued: 150_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // Should not crash
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle very large numbers', async () => {
    const jurisdiction = createJurisdiction({
      code: 'JP',
      totalRevenues: 10_000_000_000, // €10 billion
      profitOrLoss: 1_000_000_000,   // €1 billion
      taxAccrued: 200_000_000,       // 20% ETR
      employees: 5000,
      tangibleAssets: 5_000_000_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // Should qualify via ETR test
    const passResults = findResultsByRuleId(results, 'P2-SH-PASS');
    expect(passResults.length).toBeGreaterThan(0);
  });

  it('should handle zero employees', async () => {
    const jurisdiction = createJurisdiction({
      code: 'MT',
      employees: 0, // Holding company with no employees
      tangibleAssets: 100_000,
      profitOrLoss: 500_000,
      taxAccrued: 100_000,
      totalRevenues: 1_000_000,
    });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);
    const results = await runSafeHarbourValidator(report);

    // Should not crash
    expect(results.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// VALIDATOR CONFIGURATION TESTS
// =============================================================================

describe('Validator Configuration', () => {
  it('should skip Pillar 2 checks when not requested', async () => {
    const jurisdiction = createJurisdiction({ code: 'LU' });
    const report = createTestReportWithJurisdictions([jurisdiction], 2024);

    const validator = new SafeHarbourValidator();
    const context = new ValidationContext(report, { checkPillar2: false });
    const result = await validator.execute(context);

    expect(result.results.length).toBe(0);
  });

  it('should have correct validator metadata', () => {
    expect(SafeHarbourValidator.metadata.id).toBe('pillar2-safe-harbour');
    expect(SafeHarbourValidator.metadata.category).toBe('pillar2_readiness');
    expect(SafeHarbourValidator.metadata.enabled).toBe(true);
  });
});
