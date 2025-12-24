/**
 * Cross-Field Validator Tests
 *
 * Tests for cross-field data consistency validation including:
 * - XFV-001: Tax paid vs tax accrued consistency
 * - XFV-002: Revenue vs employee consistency
 * - XFV-003: Profit consistency and margin analysis
 * - XFV-004: Tangible assets vs business activity consistency
 * - XFV-005/XFV-006: Dividend exclusion per OECD May 2024 guidance
 *
 * @module tests/validators/cross-field
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformXmlToCbcReport } from '@/lib/parsers/xml-transformer';
import { CrossFieldValidator } from '@/lib/validators/quality/cross-field-validator';
import { ValidationContext, JurisdictionReference } from '@/lib/validators/core/validation-context';
import type { ParsedCbcReport, BizActivityCode } from '@/types/cbcr';
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

interface TestJurisdictionData {
  code: string;
  totalRevenues: number;
  relatedRevenues?: number;
  unrelatedRevenues?: number;
  profitOrLoss: number;
  taxPaid: number;
  taxAccrued: number;
  employees: number;
  tangibleAssets: number;
  activities?: BizActivityCode[];
}

/**
 * Create a test report with custom jurisdiction data
 */
function createTestReport(jurisdictions: TestJurisdictionData[]): ParsedCbcReport {
  if (!validReport) {
    throw new Error('Valid report not loaded');
  }

  const cbcReports = jurisdictions.map((j, index) => ({
    docSpec: {
      docTypeIndic: 'OECD1' as const,
      docRefId: `DOC-${j.code}-${index}`,
    },
    resCountryCode: j.code,
    summary: {
      unrelatedRevenues: { value: j.unrelatedRevenues ?? j.totalRevenues * 0.7, currCode: 'EUR' },
      relatedRevenues: { value: j.relatedRevenues ?? j.totalRevenues * 0.3, currCode: 'EUR' },
      totalRevenues: { value: j.totalRevenues, currCode: 'EUR' },
      profitOrLoss: { value: j.profitOrLoss, currCode: 'EUR' },
      taxPaid: { value: j.taxPaid, currCode: 'EUR' },
      taxAccrued: { value: j.taxAccrued, currCode: 'EUR' },
      capital: { value: 1_000_000, currCode: 'EUR' },
      accumulatedEarnings: { value: 5_000_000, currCode: 'EUR' },
      numberOfEmployees: j.employees,
      tangibleAssets: { value: j.tangibleAssets, currCode: 'EUR' },
    },
    constEntities: {
      constituentEntity: [
        {
          name: [{ value: `Entity in ${j.code}` }],
          tin: [{ value: '12345678901', issuedBy: j.code }],
          address: [],
          bizActivities: j.activities ?? [],
        },
      ],
      bizActivities: j.activities ?? [],
    },
  }));

  return {
    ...validReport,
    message: {
      ...validReport.message,
      cbcBody: {
        ...validReport.message.cbcBody,
        cbcReports,
      },
    },
  };
}

/**
 * Run the cross-field validator
 */
async function runCrossFieldValidator(report: ParsedCbcReport): Promise<ValidationResult[]> {
  const validator = new CrossFieldValidator();
  const context = new ValidationContext(report);
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
 * Check if any result message contains the specified jurisdiction
 */
function hasJurisdictionResult(results: ValidationResult[], jurisdiction: string, ruleId?: string): boolean {
  return results.some((r) =>
    r.message?.includes(jurisdiction) && (!ruleId || r.ruleId === ruleId)
  );
}

// =============================================================================
// XFV-001: TAX PAID VS TAX ACCRUED CONSISTENCY
// =============================================================================

describe('XFV-001: Tax Paid vs Tax Accrued Consistency', () => {
  it('should pass for consistent tax values', async () => {
    const report = createTestReport([{
      code: 'LU',
      totalRevenues: 10_000_000,
      profitOrLoss: 1_000_000,
      taxPaid: 200_000,
      taxAccrued: 210_000, // Small difference - acceptable
      employees: 50,
      tangibleAssets: 2_000_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const taxResults = findResultsByRuleId(results, 'XFV-001');

    // Should not have significant discrepancy warnings
    expect(taxResults.filter((r) => r.message?.includes('Large discrepancy')).length).toBe(0);
  });

  it('should warn for large discrepancy between tax paid and accrued', async () => {
    const report = createTestReport([{
      code: 'DE',
      totalRevenues: 10_000_000,
      profitOrLoss: 1_000_000,
      taxPaid: 100_000,
      taxAccrued: 250_000, // 150% discrepancy
      employees: 50,
      tangibleAssets: 2_000_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const taxResults = findResultsByRuleId(results, 'XFV-001');

    expect(taxResults.length).toBeGreaterThan(0);
    expect(taxResults.some((r) => r.message?.includes('discrepancy'))).toBe(true);
  });

  it('should warn for opposite signs in tax paid vs accrued', async () => {
    const report = createTestReport([{
      code: 'FR',
      totalRevenues: 10_000_000,
      profitOrLoss: 1_000_000,
      taxPaid: 200_000,
      taxAccrued: -50_000, // Opposite signs
      employees: 50,
      tangibleAssets: 2_000_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const taxResults = findResultsByRuleId(results, 'XFV-001');

    expect(taxResults.some((r) => r.message?.includes('opposite signs'))).toBe(true);
  });

  it('should skip validation for both zero taxes', async () => {
    const report = createTestReport([{
      code: 'IE',
      totalRevenues: 10_000_000,
      profitOrLoss: -500_000, // Loss
      taxPaid: 0,
      taxAccrued: 0,
      employees: 50,
      tangibleAssets: 2_000_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const taxResults = findResultsByRuleId(results, 'XFV-001');

    // Should not produce warning for both zeros
    expect(taxResults.length).toBe(0);
  });
});

// =============================================================================
// XFV-002: REVENUE VS EMPLOYEE CONSISTENCY
// =============================================================================

describe('XFV-002: Revenue vs Employee Consistency', () => {
  it('should pass for normal revenue/employee combination', async () => {
    const report = createTestReport([{
      code: 'LU',
      totalRevenues: 5_000_000,
      profitOrLoss: 500_000,
      taxPaid: 100_000,
      taxAccrued: 100_000,
      employees: 25,
      tangibleAssets: 1_000_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const empResults = findResultsByRuleId(results, 'XFV-002');

    // Should not warn for reasonable combination
    expect(empResults.filter((r) => r.severity === 'warning').length).toBe(0);
  });

  it('should warn for zero revenue with employees', async () => {
    const report = createTestReport([{
      code: 'NL',
      totalRevenues: 0,
      profitOrLoss: -100_000,
      taxPaid: 0,
      taxAccrued: 0,
      employees: 15, // Employees but no revenue
      tangibleAssets: 500_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const empResults = findResultsByRuleId(results, 'XFV-002');

    expect(empResults.some((r) => r.message?.includes('Zero revenue') && r.message?.includes('employees'))).toBe(true);
  });

  it('should flag high revenue with zero employees', async () => {
    const report = createTestReport([{
      code: 'CH',
      totalRevenues: 50_000_000,
      profitOrLoss: 10_000_000,
      taxPaid: 2_000_000,
      taxAccrued: 2_000_000,
      employees: 0, // No employees with high revenue
      tangibleAssets: 5_000_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const empResults = findResultsByRuleId(results, 'XFV-002');

    expect(empResults.some((r) => r.message?.includes('zero employees'))).toBe(true);
  });

  it('should handle edge case of 1 employee', async () => {
    const report = createTestReport([{
      code: 'BE',
      totalRevenues: 1_000_000,
      profitOrLoss: 100_000,
      taxPaid: 25_000,
      taxAccrued: 25_000,
      employees: 1,
      tangibleAssets: 200_000,
    }]);

    const results = await runCrossFieldValidator(report);

    // Should not crash or error for single employee
    expect(results).toBeDefined();
  });
});

// =============================================================================
// XFV-003: PROFIT CONSISTENCY
// =============================================================================

describe('XFV-003: Profit Consistency', () => {
  it('should flag profit margin exceeding 100%', async () => {
    const report = createTestReport([{
      code: 'LU',
      totalRevenues: 1_000_000,
      profitOrLoss: 2_000_000, // 200% profit margin
      taxPaid: 400_000,
      taxAccrued: 400_000,
      employees: 5,
      tangibleAssets: 500_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const profitResults = findResultsByRuleId(results, 'XFV-003');

    expect(profitResults.some((r) => r.message?.includes('100%'))).toBe(true);
  });

  it('should flag large losses relative to revenue', async () => {
    const report = createTestReport([{
      code: 'DE',
      totalRevenues: 1_000_000,
      profitOrLoss: -800_000, // -80% margin
      taxPaid: 0,
      taxAccrued: 0,
      employees: 10,
      tangibleAssets: 200_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const profitResults = findResultsByRuleId(results, 'XFV-003');

    expect(profitResults.some((r) => r.message?.includes('Large loss'))).toBe(true);
  });

  it('should flag profit with negative taxes', async () => {
    const report = createTestReport([{
      code: 'NL',
      totalRevenues: 10_000_000,
      profitOrLoss: 500_000, // Significant profit
      taxPaid: -100_000,     // Tax refund
      taxAccrued: -50_000,   // Also negative
      employees: 30,
      tangibleAssets: 2_000_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const profitResults = findResultsByRuleId(results, 'XFV-003');

    expect(profitResults.some((r) => r.message?.includes('negative') || r.message?.includes('refund'))).toBe(true);
  });

  it('should flag losses with positive taxes', async () => {
    const report = createTestReport([{
      code: 'FR',
      totalRevenues: 5_000_000,
      profitOrLoss: -500_000, // Significant loss
      taxPaid: 50_000,        // But paying taxes
      taxAccrued: 50_000,
      employees: 20,
      tangibleAssets: 1_000_000,
    }]);

    const results = await runCrossFieldValidator(report);
    const profitResults = findResultsByRuleId(results, 'XFV-003');

    expect(profitResults.some((r) => r.message?.includes('Loss') && r.message?.includes('taxes'))).toBe(true);
  });
});

// =============================================================================
// XFV-004: TANGIBLE ASSETS VS BUSINESS ACTIVITY CONSISTENCY
// =============================================================================

describe('XFV-004: Tangible Assets vs Activity Consistency', () => {
  it('should flag manufacturing with low tangible assets', async () => {
    const report = createTestReport([{
      code: 'DE',
      totalRevenues: 10_000_000,
      profitOrLoss: 1_000_000,
      taxPaid: 200_000,
      taxAccrued: 200_000,
      employees: 100,
      tangibleAssets: 50_000, // Very low for manufacturing
      activities: ['CBC504'], // Manufacturing
    }]);

    const results = await runCrossFieldValidator(report);
    const assetResults = findResultsByRuleId(results, 'XFV-004');

    expect(assetResults.some((r) =>
      r.message?.includes('Manufacturing') && r.message?.includes('low tangible assets')
    )).toBe(true);
  });

  it('should pass manufacturing with appropriate assets', async () => {
    const report = createTestReport([{
      code: 'PL',
      totalRevenues: 10_000_000,
      profitOrLoss: 1_000_000,
      taxPaid: 200_000,
      taxAccrued: 200_000,
      employees: 100,
      tangibleAssets: 5_000_000, // Reasonable for manufacturing
      activities: ['CBC504'],
    }]);

    const results = await runCrossFieldValidator(report);
    const assetResults = findResultsByRuleId(results, 'XFV-004')
      .filter((r) => r.message?.includes('low tangible assets'));

    expect(assetResults.length).toBe(0);
  });

  it('should flag holding company with high tangible assets', async () => {
    const report = createTestReport([{
      code: 'LU',
      totalRevenues: 5_000_000,
      profitOrLoss: 4_000_000,
      taxPaid: 100_000,
      taxAccrued: 100_000,
      employees: 3,
      tangibleAssets: 50_000_000, // Very high for holding
      activities: ['CBC511'], // Holding shares only
    }]);

    const results = await runCrossFieldValidator(report);
    const assetResults = findResultsByRuleId(results, 'XFV-004');

    expect(assetResults.some((r) =>
      r.message?.includes('holding') && r.message?.includes('tangible assets')
    )).toBe(true);
  });

  it('should flag asset-intensive activity with zero assets', async () => {
    const report = createTestReport([{
      code: 'US',
      totalRevenues: 50_000_000,
      profitOrLoss: 5_000_000,
      taxPaid: 1_000_000,
      taxAccrued: 1_000_000,
      employees: 200,
      tangibleAssets: 0, // No assets
      activities: ['CBC505'], // Sales/Distribution
    }]);

    const results = await runCrossFieldValidator(report);
    const assetResults = findResultsByRuleId(results, 'XFV-004');

    expect(assetResults.some((r) =>
      r.message?.includes('Asset-intensive') && r.message?.includes('zero')
    )).toBe(true);
  });

  it('should handle multiple activities correctly', async () => {
    const report = createTestReport([{
      code: 'GB',
      totalRevenues: 20_000_000,
      profitOrLoss: 2_000_000,
      taxPaid: 400_000,
      taxAccrued: 400_000,
      employees: 50,
      tangibleAssets: 2_000_000,
      activities: ['CBC504', 'CBC505', 'CBC506'], // Multiple activities
    }]);

    const results = await runCrossFieldValidator(report);

    // Should not crash with multiple activities
    expect(results).toBeDefined();
  });
});

// =============================================================================
// XFV-005/006: DIVIDEND EXCLUSION (MAY 2024 OECD GUIDANCE)
// =============================================================================

describe('XFV-005: Dividend Exclusion from Revenues', () => {
  it('should flag holding activity with high related party revenue', async () => {
    const report = createTestReport([{
      code: 'LU',
      totalRevenues: 10_000_000,
      relatedRevenues: 9_000_000, // Very high related revenue
      unrelatedRevenues: 1_000_000,
      profitOrLoss: 5_000_000,
      taxPaid: 100_000,
      taxAccrued: 100_000,
      employees: 2,
      tangibleAssets: 100_000,
      activities: ['CBC511'], // Holding shares
    }]);

    const results = await runCrossFieldValidator(report);
    const divResults = findResultsByRuleId(results, 'XFV-005');

    expect(divResults.some((r) =>
      r.message?.includes('related party revenue') || r.message?.includes('dividend')
    )).toBe(true);
  });

  it('should pass operating company without dividend concern', async () => {
    const report = createTestReport([{
      code: 'DE',
      totalRevenues: 50_000_000,
      relatedRevenues: 10_000_000,
      unrelatedRevenues: 40_000_000,
      profitOrLoss: 5_000_000,
      taxPaid: 1_000_000,
      taxAccrued: 1_000_000,
      employees: 200,
      tangibleAssets: 10_000_000,
      activities: ['CBC504', 'CBC505'], // Manufacturing and Sales
    }]);

    const results = await runCrossFieldValidator(report);
    const divResults = findResultsByRuleId(results, 'XFV-005');

    // Operating companies should not trigger dividend warnings
    expect(divResults.length).toBe(0);
  });
});

describe('XFV-006: Dividend Exclusion from Profit/Loss', () => {
  it('should flag high profit holding with minimal operations', async () => {
    const report = createTestReport([{
      code: 'NL',
      totalRevenues: 2_000_000,
      profitOrLoss: 50_000_000, // Very high profit
      taxPaid: 500_000,
      taxAccrued: 500_000,
      employees: 2, // Minimal staff
      tangibleAssets: 100_000,
      activities: ['CBC511'], // Holding shares
    }]);

    const results = await runCrossFieldValidator(report);
    const divResults = findResultsByRuleId(results, 'XFV-006');

    expect(divResults.some((r) =>
      r.message?.includes('High profit') && r.message?.includes('minimal operations')
    )).toBe(true);
  });

  it('should not flag operating company with high profit', async () => {
    const report = createTestReport([{
      code: 'US',
      totalRevenues: 100_000_000,
      profitOrLoss: 50_000_000,
      taxPaid: 10_000_000,
      taxAccrued: 10_000_000,
      employees: 500,
      tangibleAssets: 20_000_000,
      activities: ['CBC505', 'CBC507'], // Sales, Services
    }]);

    const results = await runCrossFieldValidator(report);
    const divResults = findResultsByRuleId(results, 'XFV-006');

    // Operating companies with staff should not trigger this
    expect(divResults.length).toBe(0);
  });
});

// =============================================================================
// MULTI-JURISDICTION GLOBAL CONSISTENCY
// =============================================================================

describe('Global Cross-Jurisdiction Consistency', () => {
  it('should flag jurisdiction with all negative values', async () => {
    const report = createTestReport([{
      code: 'IT',
      totalRevenues: -1_000_000,
      profitOrLoss: -500_000,
      taxPaid: -50_000,
      taxAccrued: -50_000,
      employees: 10,
      tangibleAssets: 200_000,
    }]);

    const results = await runCrossFieldValidator(report);

    expect(results.some((r) =>
      r.message?.includes('All Summary values are negative') ||
      r.message?.includes('sign conventions')
    )).toBe(true);
  });

  it('should handle multiple jurisdictions independently', async () => {
    const report = createTestReport([
      {
        code: 'LU',
        totalRevenues: 5_000_000,
        profitOrLoss: 500_000,
        taxPaid: 100_000,
        taxAccrued: 100_000,
        employees: 20,
        tangibleAssets: 1_000_000,
      },
      {
        code: 'DE',
        totalRevenues: 50_000_000,
        profitOrLoss: 5_000_000,
        taxPaid: 1_000_000,
        taxAccrued: 1_000_000,
        employees: 200,
        tangibleAssets: 10_000_000,
      },
      {
        code: 'FR',
        totalRevenues: 30_000_000,
        profitOrLoss: 3_000_000,
        taxPaid: 750_000,
        taxAccrued: 750_000,
        employees: 150,
        tangibleAssets: 5_000_000,
      },
    ]);

    const results = await runCrossFieldValidator(report);

    // Should validate all three jurisdictions
    expect(hasJurisdictionResult(results, 'LU') ||
           hasJurisdictionResult(results, 'DE') ||
           hasJurisdictionResult(results, 'FR') ||
           results.length === 0).toBe(true); // Either has results or clean report
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle zero values gracefully', async () => {
    const report = createTestReport([{
      code: 'MT',
      totalRevenues: 0,
      profitOrLoss: 0,
      taxPaid: 0,
      taxAccrued: 0,
      employees: 0,
      tangibleAssets: 0,
    }]);

    const results = await runCrossFieldValidator(report);

    // Should not crash on all zeros
    expect(results).toBeDefined();
  });

  it('should handle very large numbers', async () => {
    const report = createTestReport([{
      code: 'US',
      totalRevenues: 500_000_000_000, // $500 billion
      profitOrLoss: 50_000_000_000,
      taxPaid: 10_000_000_000,
      taxAccrued: 10_000_000_000,
      employees: 500_000,
      tangibleAssets: 100_000_000_000,
    }]);

    const results = await runCrossFieldValidator(report);

    expect(results).toBeDefined();
  });

  it('should handle negative assets', async () => {
    const report = createTestReport([{
      code: 'SG',
      totalRevenues: 10_000_000,
      profitOrLoss: 1_000_000,
      taxPaid: 200_000,
      taxAccrued: 200_000,
      employees: 50,
      tangibleAssets: -500_000, // Invalid but test robustness
    }]);

    const results = await runCrossFieldValidator(report);

    // Should not crash
    expect(results).toBeDefined();
  });

  it('should handle empty activities array', async () => {
    const report = createTestReport([{
      code: 'HK',
      totalRevenues: 10_000_000,
      profitOrLoss: 1_000_000,
      taxPaid: 0,
      taxAccrued: 0,
      employees: 10,
      tangibleAssets: 500_000,
      activities: [], // Empty activities
    }]);

    const results = await runCrossFieldValidator(report);

    expect(results).toBeDefined();
  });
});

// =============================================================================
// VALIDATOR METADATA
// =============================================================================

describe('Validator Configuration', () => {
  it('should have correct validator metadata', () => {
    expect(CrossFieldValidator.metadata.id).toBe('quality-cross-field');
    expect(CrossFieldValidator.metadata.category).toBe('data_quality');
    expect(CrossFieldValidator.metadata.enabled).toBe(true);
  });
});
