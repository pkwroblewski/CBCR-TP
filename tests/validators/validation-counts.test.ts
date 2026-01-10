/**
 * Validation Counts Tests
 *
 * Critical tests to ensure validation result counting is accurate.
 * These tests verify that:
 * 1. Total counts match sum of category counts
 * 2. Total counts match sum of severity counts
 * 3. All results have valid categories and severities
 *
 * @module tests/validators/validation-counts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformXmlToCbcReport } from '@/lib/parsers/xml-transformer';
import { createFullyConfiguredEngine, countBySeverity, countByCategory } from '@/lib/validators';
import { ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { ParsedCbcReport } from '@/types/cbcr';
import type { ValidationResult, ValidationReport } from '@/types/validation';

// =============================================================================
// TEST DATA
// =============================================================================

const FIXTURES_DIR = join(__dirname, '../fixtures');

let validReport: ParsedCbcReport;
let dataQualityIssuesReport: ParsedCbcReport;
let invalidTinReport: ParsedCbcReport;

// =============================================================================
// SETUP
// =============================================================================

beforeAll(async () => {
  // Load test fixtures
  const validXml = readFileSync(join(FIXTURES_DIR, 'valid-cbcr-report.xml'), 'utf-8');
  const validTransformed = transformXmlToCbcReport(validXml, 'valid-cbcr-report.xml');
  if (validTransformed.success) {
    validReport = validTransformed.data;
  }

  const dqXml = readFileSync(join(FIXTURES_DIR, 'data-quality-issues.xml'), 'utf-8');
  const dqTransformed = transformXmlToCbcReport(dqXml, 'data-quality-issues.xml');
  if (dqTransformed.success) {
    dataQualityIssuesReport = dqTransformed.data;
  }

  const tinXml = readFileSync(join(FIXTURES_DIR, 'invalid-tin.xml'), 'utf-8');
  const tinTransformed = transformXmlToCbcReport(tinXml, 'invalid-tin.xml');
  if (tinTransformed.success) {
    invalidTinReport = tinTransformed.data;
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate that counts are internally consistent
 */
function validateCountConsistency(report: ValidationReport): {
  isConsistent: boolean;
  totalResults: number;
  severitySum: number;
  categorySum: number;
  errors: string[];
} {
  const errors: string[] = [];
  const totalResults = report.results.length;

  // Sum severity counts from summary
  const severitySum =
    report.summary.critical +
    report.summary.errors +
    report.summary.warnings +
    report.summary.info;

  // Sum category counts from byCategory
  const categorySum = Object.values(report.byCategory).reduce((a, b) => a + b, 0);

  // Check if totals match
  if (totalResults !== severitySum) {
    errors.push(
      `Results count (${totalResults}) does not match severity sum (${severitySum})`
    );
  }

  if (totalResults !== categorySum) {
    errors.push(
      `Results count (${totalResults}) does not match category sum (${categorySum})`
    );
  }

  // Verify each result has a valid category
  const validCategories = Object.values(ValidationCategory);
  for (const result of report.results) {
    if (!validCategories.includes(result.category)) {
      errors.push(`Invalid category "${result.category}" in result ${result.ruleId}`);
    }
  }

  // Verify each result has a valid severity
  const validSeverities = Object.values(ValidationSeverity);
  for (const result of report.results) {
    if (!validSeverities.includes(result.severity)) {
      errors.push(`Invalid severity "${result.severity}" in result ${result.ruleId}`);
    }
  }

  return {
    isConsistent: errors.length === 0,
    totalResults,
    severitySum,
    categorySum,
    errors,
  };
}

/**
 * Manually count results by category
 */
function manualCountByCategory(results: ValidationResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const result of results) {
    counts[result.category] = (counts[result.category] || 0) + 1;
  }
  return counts;
}

/**
 * Manually count results by severity
 */
function manualCountBySeverity(results: ValidationResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const result of results) {
    counts[result.severity] = (counts[result.severity] || 0) + 1;
  }
  return counts;
}

// =============================================================================
// COUNT CONSISTENCY TESTS
// =============================================================================

describe('Validation Count Consistency', () => {
  describe('Valid Report', () => {
    it('should have consistent counts for valid report', async () => {
      const engine = createFullyConfiguredEngine('LU', true);
      const report = await engine.validate(validReport, { checkPillar2: true });

      const consistency = validateCountConsistency(report);

      expect(consistency.isConsistent).toBe(true);
      expect(consistency.errors).toEqual([]);
    });

    it('should match manual category count', async () => {
      const engine = createFullyConfiguredEngine('LU', true);
      const report = await engine.validate(validReport, { checkPillar2: true });

      const manualCounts = manualCountByCategory(report.results);

      // Compare with report.byCategory
      for (const [category, count] of Object.entries(report.byCategory)) {
        expect(count).toBe(manualCounts[category] || 0);
      }
    });
  });

  describe('Data Quality Issues Report', () => {
    it('should have consistent counts', async () => {
      const engine = createFullyConfiguredEngine('LU', true);
      const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

      const consistency = validateCountConsistency(report);

      expect(consistency.isConsistent).toBe(true);
      if (!consistency.isConsistent) {
        console.error('Count consistency errors:', consistency.errors);
      }
    });

    it('total results should equal sum of severity counts', async () => {
      const engine = createFullyConfiguredEngine('LU', true);
      const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

      const severitySum =
        report.summary.critical +
        report.summary.errors +
        report.summary.warnings +
        report.summary.info;

      expect(report.results.length).toBe(severitySum);
    });

    it('total results should equal sum of category counts', async () => {
      const engine = createFullyConfiguredEngine('LU', true);
      const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

      const categorySum = Object.values(report.byCategory).reduce((a, b) => a + b, 0);

      expect(report.results.length).toBe(categorySum);
    });
  });

  describe('Invalid TIN Report', () => {
    it('should have consistent counts', async () => {
      const engine = createFullyConfiguredEngine('LU', true);
      const report = await engine.validate(invalidTinReport, { checkPillar2: true });

      const consistency = validateCountConsistency(report);

      expect(consistency.isConsistent).toBe(true);
    });
  });
});

// =============================================================================
// CATEGORY VALIDATION TESTS
// =============================================================================

describe('Category Validation', () => {
  it('all results should have valid categories', async () => {
    const engine = createFullyConfiguredEngine('LU', true);
    const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

    const validCategories = Object.values(ValidationCategory);

    for (const result of report.results) {
      expect(validCategories).toContain(result.category);
    }
  });

  it('byCategory should only contain valid category keys', async () => {
    const engine = createFullyConfiguredEngine('LU', true);
    const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

    const validCategories = Object.values(ValidationCategory);

    for (const category of Object.keys(report.byCategory)) {
      expect(validCategories).toContain(category);
    }
  });

  it('no results should have undefined or null category', async () => {
    const engine = createFullyConfiguredEngine('LU', true);
    const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

    for (const result of report.results) {
      expect(result.category).toBeDefined();
      expect(result.category).not.toBeNull();
    }
  });
});

// =============================================================================
// SEVERITY VALIDATION TESTS
// =============================================================================

describe('Severity Validation', () => {
  it('all results should have valid severities', async () => {
    const engine = createFullyConfiguredEngine('LU', true);
    const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

    const validSeverities = Object.values(ValidationSeverity);

    for (const result of report.results) {
      expect(validSeverities).toContain(result.severity);
    }
  });

  it('summary counts should match actual results', async () => {
    const engine = createFullyConfiguredEngine('LU', true);
    const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

    const manualCounts = manualCountBySeverity(report.results);

    expect(report.summary.critical).toBe(manualCounts['critical'] || 0);
    expect(report.summary.errors).toBe(manualCounts['error'] || 0);
    expect(report.summary.warnings).toBe(manualCounts['warning'] || 0);
    expect(report.summary.info).toBe(manualCounts['info'] || 0);
  });

  it('no results should have undefined or null severity', async () => {
    const engine = createFullyConfiguredEngine('LU', true);
    const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

    for (const result of report.results) {
      expect(result.severity).toBeDefined();
      expect(result.severity).not.toBeNull();
    }
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('Utility Functions', () => {
  it('countBySeverity should return correct counts', async () => {
    const engine = createFullyConfiguredEngine('LU', true);
    const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

    const counts = countBySeverity(report.results);

    // Verify all severities are present
    expect(counts).toHaveProperty(ValidationSeverity.CRITICAL);
    expect(counts).toHaveProperty(ValidationSeverity.ERROR);
    expect(counts).toHaveProperty(ValidationSeverity.WARNING);
    expect(counts).toHaveProperty(ValidationSeverity.INFO);

    // Sum should equal total
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(report.results.length);
  });

  it('countByCategory should return correct counts', async () => {
    const engine = createFullyConfiguredEngine('LU', true);
    const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

    const counts = countByCategory(report.results);

    // Sum should equal total
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(report.results.length);
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('empty results should have zero counts', () => {
    const emptyResults: ValidationResult[] = [];

    const severityCounts = countBySeverity(emptyResults);
    const categoryCounts = countByCategory(emptyResults);

    expect(severityCounts[ValidationSeverity.CRITICAL]).toBe(0);
    expect(severityCounts[ValidationSeverity.ERROR]).toBe(0);
    expect(severityCounts[ValidationSeverity.WARNING]).toBe(0);
    expect(severityCounts[ValidationSeverity.INFO]).toBe(0);

    const categorySum = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    expect(categorySum).toBe(0);
  });

  it('all categories should be accounted for', async () => {
    const engine = createFullyConfiguredEngine('LU', true);
    const report = await engine.validate(dataQualityIssuesReport, { checkPillar2: true });

    // Get all unique categories from results
    const resultCategories = new Set(report.results.map((r) => r.category));

    // byCategory should contain all categories that have results
    for (const category of resultCategories) {
      expect(report.byCategory[category]).toBeGreaterThan(0);
    }

    // No orphan categories in byCategory (non-zero count but no results)
    for (const [category, count] of Object.entries(report.byCategory)) {
      if (count > 0) {
        const resultsWithCategory = report.results.filter((r) => r.category === category);
        expect(resultsWithCategory.length).toBe(count);
      }
    }
  });
});
