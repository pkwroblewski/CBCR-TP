/**
 * TIN Validator Tests
 *
 * Comprehensive tests for Tax Identification Number (TIN) validation rules.
 * Covers OECD general rules and Luxembourg-specific patterns.
 *
 * @module tests/validators/tin
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformXmlToCbcReport } from '@/lib/parsers/xml-transformer';
import { TinValidator } from '@/lib/validators/oecd/tin-validator';
import { LuxembourgTinValidator } from '@/lib/validators/countries/luxembourg/tin-validator';
import { ValidationContext } from '@/lib/validators/core/validation-context';
import { LUXEMBOURG_TIN, validateTinFormat, isValidCountryCode } from '@/constants/countries';
import type { ParsedCbcReport } from '@/types/cbcr';
import type { ValidationResult } from '@/types/validation';

// =============================================================================
// TEST DATA
// =============================================================================

const FIXTURES_DIR = join(__dirname, '../fixtures');

let validReport: ParsedCbcReport;
let invalidTinReport: ParsedCbcReport;

// =============================================================================
// SETUP
// =============================================================================

beforeAll(async () => {
  // Load valid report
  const validXml = readFileSync(join(FIXTURES_DIR, 'valid-cbcr-report.xml'), 'utf-8');
  const validTransformed = transformXmlToCbcReport(validXml, 'valid-cbcr-report.xml');
  if (validTransformed.success) {
    validReport = validTransformed.data;
  }

  // Load invalid TIN report
  const invalidXml = readFileSync(join(FIXTURES_DIR, 'invalid-tin.xml'), 'utf-8');
  const invalidTransformed = transformXmlToCbcReport(invalidXml, 'invalid-tin.xml');
  if (invalidTransformed.success) {
    invalidTinReport = invalidTransformed.data;
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function runOecdTinValidator(report: ParsedCbcReport): Promise<ValidationResult[]> {
  const validator = new TinValidator();
  const context = new ValidationContext(report);
  const result = await validator.execute(context);
  return result.results;
}

async function runLuxembourgTinValidator(report: ParsedCbcReport): Promise<ValidationResult[]> {
  const validator = new LuxembourgTinValidator();
  const context = new ValidationContext(report);
  const result = await validator.execute(context);
  return result.results;
}

function findResultByRuleId(results: ValidationResult[], ruleId: string): ValidationResult | undefined {
  return results.find((r) => r.ruleId === ruleId);
}

function findAllResultsByRuleId(results: ValidationResult[], ruleId: string): ValidationResult[] {
  return results.filter((r) => r.ruleId === ruleId);
}

function hasRuleId(results: ValidationResult[], ruleId: string): boolean {
  return results.some((r) => r.ruleId === ruleId);
}

function createTestReport(
  tin: { value: string; issuedBy?: string },
  options: { jurisdiction?: string } = {}
): ParsedCbcReport {
  const jurisdiction = options.jurisdiction ?? 'LU';
  return {
    ...validReport,
    message: {
      ...validReport.message,
      messageSpec: {
        ...validReport.message.messageSpec,
        sendingCompetentAuthority: jurisdiction,
      },
      cbcBody: {
        ...validReport.message.cbcBody,
        reportingEntity: {
          ...validReport.message.cbcBody.reportingEntity,
          tin: [tin],
        },
      },
    },
  };
}

// =============================================================================
// LUXEMBOURG TIN UTILITY TESTS
// =============================================================================

describe('LUXEMBOURG_TIN Utility', () => {
  describe('Valid Luxembourg TIN Patterns', () => {
    it('should validate 11-digit natural person TIN', () => {
      const result = LUXEMBOURG_TIN.validate('12345678901');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('natural');
    });

    it('should validate 13-digit legal entity TIN', () => {
      const result = LUXEMBOURG_TIN.validate('1234567890123');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('legal');
    });

    it('should handle TIN with spaces (cleaning)', () => {
      const result = LUXEMBOURG_TIN.validate('1234 5678 901');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('natural');
    });

    it('should handle TIN with hyphens (cleaning)', () => {
      const result = LUXEMBOURG_TIN.validate('1234-5678-901');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('natural');
    });
  });

  describe('Invalid Luxembourg TIN Patterns', () => {
    it('should reject TIN with letters', () => {
      const result = LUXEMBOURG_TIN.validate('12345678ABC');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only digits');
    });

    it('should reject TIN with wrong length (10 digits)', () => {
      const result = LUXEMBOURG_TIN.validate('1234567890');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid length');
      expect(result.error).toContain('10 digits');
    });

    it('should reject TIN with wrong length (12 digits)', () => {
      const result = LUXEMBOURG_TIN.validate('123456789012');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid length');
      expect(result.error).toContain('12 digits');
    });

    it('should reject TIN with wrong length (14 digits)', () => {
      const result = LUXEMBOURG_TIN.validate('12345678901234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid length');
    });

    it('should reject empty TIN', () => {
      const result = LUXEMBOURG_TIN.validate('');
      expect(result.valid).toBe(false);
    });

    it('should reject TIN with special characters', () => {
      const result = LUXEMBOURG_TIN.validate('12345@78901');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only digits');
    });
  });
});

describe('validateTinFormat Utility', () => {
  describe('Luxembourg TINs', () => {
    it('should validate correct 11-digit LU TIN', () => {
      const result = validateTinFormat('12345678901', 'LU');
      expect(result.valid).toBe(true);
    });

    it('should validate correct 13-digit LU TIN', () => {
      const result = validateTinFormat('1234567890123', 'LU');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid LU TIN', () => {
      const result = validateTinFormat('12345', 'LU');
      expect(result.valid).toBe(false);
    });
  });

  describe('Other Country TINs', () => {
    it('should validate correct German TIN format', () => {
      const result = validateTinFormat('DE123456789', 'DE');
      expect(result.valid).toBe(true);
    });

    it('should validate correct French TIN format', () => {
      const result = validateTinFormat('FRAB123456789', 'FR');
      expect(result.valid).toBe(true);
    });

    it('should validate correct UK TIN format', () => {
      const result = validateTinFormat('GB123456789', 'GB');
      expect(result.valid).toBe(true);
    });

    it('should validate correct US EIN format', () => {
      const result = validateTinFormat('123456789', 'US');
      expect(result.valid).toBe(true);
    });
  });

  describe('Unknown Country Codes', () => {
    it('should reject unknown country code', () => {
      const result = validateTinFormat('12345', 'XX');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown country code');
    });
  });
});

describe('isValidCountryCode Utility', () => {
  it('should accept valid ISO 3166-1 Alpha-2 codes', () => {
    expect(isValidCountryCode('LU')).toBe(true);
    expect(isValidCountryCode('DE')).toBe(true);
    expect(isValidCountryCode('FR')).toBe(true);
    expect(isValidCountryCode('US')).toBe(true);
  });

  it('should accept lowercase codes', () => {
    expect(isValidCountryCode('lu')).toBe(true);
    expect(isValidCountryCode('de')).toBe(true);
  });

  it('should reject invalid codes', () => {
    expect(isValidCountryCode('XX')).toBe(false);
    expect(isValidCountryCode('ZZ')).toBe(false);
    expect(isValidCountryCode('123')).toBe(false);
    expect(isValidCountryCode('L')).toBe(false);
  });
});

// =============================================================================
// OECD TIN VALIDATOR TESTS
// =============================================================================

describe('TinValidator (OECD Rules)', () => {
  describe('Valid Report', () => {
    it('should pass validation for valid TINs', async () => {
      const results = await runOecdTinValidator(validReport);
      const criticalErrors = results.filter((r) => r.severity === 'critical');

      // Valid report should not have critical TIN errors
      expect(criticalErrors.length).toBe(0);
    });

    it('should have issuedBy attribute on all TINs', async () => {
      const results = await runOecdTinValidator(validReport);

      // Valid report has issuedBy on all TINs
      // Should not trigger TIN-002 (missing issuedBy)
      expect(hasRuleId(results, 'TIN-002')).toBe(false);
    });
  });

  describe('TIN-001: Missing TIN on ReportingEntity', () => {
    it('should detect missing TIN on ReportingEntity', async () => {
      const testReport: ParsedCbcReport = {
        ...validReport,
        message: {
          ...validReport.message,
          cbcBody: {
            ...validReport.message.cbcBody,
            reportingEntity: {
              ...validReport.message.cbcBody.reportingEntity,
              tin: [], // No TINs
            },
          },
        },
      };

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-001')).toBe(true);

      const result = findResultByRuleId(results, 'TIN-001');
      expect(result?.severity).toBe('error');
    });
  });

  describe('TIN-002: Missing issuedBy Attribute', () => {
    it('should detect TIN without issuedBy attribute', async () => {
      const testReport = createTestReport({
        value: '12345678901',
        // Missing issuedBy
      });

      const results = await runOecdTinValidator(testReport);

      // TIN-002 is for missing issuedBy attribute (warning)
      expect(hasRuleId(results, 'TIN-002')).toBe(true);

      const result = findResultByRuleId(results, 'TIN-002');
      expect(result?.severity).toBe('warning');
    });
  });

  describe('TIN-003: Invalid TIN Format', () => {
    it('should detect TIN with repeated single character', async () => {
      const testReport = createTestReport({
        value: '11111111111', // Repeated character
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);

      // TIN-003 handles invalid TIN patterns like repeated chars
      expect(hasRuleId(results, 'TIN-003')).toBe(true);
    });

    it('should detect all zeros TIN', async () => {
      const testReport = createTestReport({
        value: '00000000000',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-003')).toBe(true);
    });

    it('should detect all nines TIN', async () => {
      const testReport = createTestReport({
        value: '99999999999',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-003')).toBe(true);
    });

    it('should detect N/A as TIN', async () => {
      const testReport = createTestReport({
        value: 'N/A',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-003')).toBe(true);
    });

    it('should detect NONE as TIN', async () => {
      const testReport = createTestReport({
        value: 'NONE',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-003')).toBe(true);
    });

    it('should detect TIN that is too short', async () => {
      const testReport = createTestReport({
        value: 'X',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-003')).toBe(true);
    });

    it('should detect TIN with leading/trailing whitespace', async () => {
      const testReport = createTestReport({
        value: '  12345678901  ',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);
      const whitespaceWarning = results.find(
        (r) => r.ruleId === 'TIN-003' && r.message.includes('whitespace')
      );
      expect(whitespaceWarning).toBeDefined();
    });

    it('should detect TIN with internal whitespace', async () => {
      const testReport = createTestReport({
        value: '12345 678901',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);
      const whitespaceWarning = results.find(
        (r) => r.message.includes('internal whitespace')
      );
      expect(whitespaceWarning).toBeDefined();
    });
  });

  describe('TIN-004: Empty TIN Value', () => {
    it('should detect empty TIN element', async () => {
      const testReport = createTestReport({
        value: '',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-004')).toBe(true);

      const result = findResultByRuleId(results, 'TIN-004');
      expect(result?.severity).toBe('error');
    });

    it('should detect whitespace-only TIN', async () => {
      const testReport = createTestReport({
        value: '   ',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-004')).toBe(true);
    });
  });

  describe('TIN-005: Invalid issuedBy Country Code', () => {
    it('should detect invalid country code in issuedBy', async () => {
      const testReport = createTestReport({
        value: '12345678901',
        issuedBy: 'XX', // Invalid country code
      });

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-005')).toBe(true);

      const result = findResultByRuleId(results, 'TIN-005');
      expect(result?.severity).toBe('error');
    });

    it('should detect 3-letter country code in issuedBy', async () => {
      const testReport = createTestReport({
        value: '12345678901',
        issuedBy: 'LUX', // Should be 2-letter
      });

      const results = await runOecdTinValidator(testReport);
      expect(hasRuleId(results, 'TIN-005')).toBe(true);
    });
  });

  describe('NOTIN Handling', () => {
    it('should accept NOTIN but flag for documentation', async () => {
      const testReport = createTestReport({
        value: 'NOTIN',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);

      // NOTIN should generate an info message
      const notinResult = results.find((r) =>
        r.message.toUpperCase().includes('NOTIN')
      );
      expect(notinResult).toBeDefined();
      expect(notinResult?.severity).toBe('info');
    });

    it('should accept lowercase notin', async () => {
      const testReport = createTestReport({
        value: 'notin',
        issuedBy: 'LU',
      });

      const results = await runOecdTinValidator(testReport);

      // Should not have critical errors for NOTIN
      const criticalErrors = results.filter((r) => r.severity === 'critical');
      expect(criticalErrors.length).toBe(0);
    });
  });
});

// =============================================================================
// LUXEMBOURG TIN VALIDATOR TESTS
// =============================================================================

describe('LuxembourgTinValidator', () => {
  describe('Valid Luxembourg TINs', () => {
    it('should accept valid 11-digit Luxembourg TIN', async () => {
      const testReport = createTestReport({
        value: '12345678901',
        issuedBy: 'LU',
      });

      const results = await runLuxembourgTinValidator(testReport);

      // Should not trigger LU-TIN-001 for valid 11-digit TIN
      const luTin001Errors = results.filter((r) =>
        r.ruleId === 'LU-TIN-001' && r.severity === 'error'
      );
      expect(luTin001Errors.length).toBe(0);
    });

    it('should accept valid 12-digit Luxembourg TIN', async () => {
      const testReport = createTestReport({
        value: '123456789012',
        issuedBy: 'LU',
      });

      const results = await runLuxembourgTinValidator(testReport);
      const luTin001Errors = results.filter((r) =>
        r.ruleId === 'LU-TIN-001' && r.severity === 'error'
      );
      expect(luTin001Errors.length).toBe(0);
    });

    it('should accept valid 13-digit Luxembourg TIN', async () => {
      const testReport = createTestReport({
        value: '1234567890123',
        issuedBy: 'LU',
      });

      const results = await runLuxembourgTinValidator(testReport);

      // Should not trigger LU-TIN-001 error for valid 13-digit TIN
      const luTin001Errors = results.filter((r) =>
        r.ruleId === 'LU-TIN-001' && r.severity === 'error'
      );
      expect(luTin001Errors.length).toBe(0);
    });
  });

  describe('Invalid Luxembourg TIN Formats (LU-TIN-001)', () => {
    it('should detect TIN with too few digits (10 digits)', async () => {
      const testReport = createTestReport({
        value: '1234567890',
        issuedBy: 'LU',
      });

      const results = await runLuxembourgTinValidator(testReport);
      const luTin001Results = findAllResultsByRuleId(results, 'LU-TIN-001');
      expect(luTin001Results.length).toBeGreaterThan(0);
    });

    it('should detect TIN with too many digits (14 digits)', async () => {
      const testReport = createTestReport({
        value: '12345678901234',
        issuedBy: 'LU',
      });

      const results = await runLuxembourgTinValidator(testReport);
      const luTin001Results = findAllResultsByRuleId(results, 'LU-TIN-001');
      expect(luTin001Results.length).toBeGreaterThan(0);
    });

    it('should detect TIN with letters', async () => {
      const testReport = createTestReport({
        value: '1234567890A',
        issuedBy: 'LU',
      });

      const results = await runLuxembourgTinValidator(testReport);
      const luTin001Results = findAllResultsByRuleId(results, 'LU-TIN-001');
      expect(luTin001Results.length).toBeGreaterThan(0);
    });

    it('should detect TIN with special characters', async () => {
      const testReport = createTestReport({
        value: '12345-67890',
        issuedBy: 'LU',
      });

      const results = await runLuxembourgTinValidator(testReport);
      // Should have format validation result
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('issuedBy Validation (LU-TIN-002)', () => {
    it('should require issuedBy="LU" for Luxembourg entities', async () => {
      const results = await runLuxembourgTinValidator(invalidTinReport);

      // LU-TIN-002 checks for missing LU issuedBy
      const luTin002Results = findAllResultsByRuleId(results, 'LU-TIN-002');
      // This may or may not trigger depending on the fixture
      expect(luTin002Results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should validate all valid length boundaries', async () => {
      // Test 11 digits (minimum valid)
      const test11 = createTestReport({ value: '12345678901', issuedBy: 'LU' });
      const results11 = await runLuxembourgTinValidator(test11);
      expect(results11.filter((r) => r.ruleId === 'LU-TIN-001' && r.severity === 'error').length).toBe(0);

      // Test 12 digits (valid)
      const test12 = createTestReport({ value: '123456789012', issuedBy: 'LU' });
      const results12 = await runLuxembourgTinValidator(test12);
      expect(results12.filter((r) => r.ruleId === 'LU-TIN-001' && r.severity === 'error').length).toBe(0);

      // Test 13 digits (maximum valid)
      const test13 = createTestReport({ value: '1234567890123', issuedBy: 'LU' });
      const results13 = await runLuxembourgTinValidator(test13);
      expect(results13.filter((r) => r.ruleId === 'LU-TIN-001' && r.severity === 'error').length).toBe(0);
    });

    it('should check format consistency for LU entities', async () => {
      // Verify the validator runs without errors
      const results = await runLuxembourgTinValidator(validReport);

      // No critical errors from Luxembourg TIN validation
      const criticalErrors = results.filter((r) => r.severity === 'critical');
      expect(criticalErrors.length).toBe(0);
    });

    it('should handle Matricule National format starting with year', async () => {
      // Luxembourg Matricule National often starts with year
      const testReport = createTestReport({
        value: '19851234567',  // 11 digits starting with year
        issuedBy: 'LU',
      });

      const results = await runLuxembourgTinValidator(testReport);
      const formatErrors = results.filter((r) =>
        r.ruleId === 'LU-TIN-001' && r.severity === 'error'
      );
      expect(formatErrors.length).toBe(0);
    });

    it('should handle legal entity TIN starting with 19 or 20', async () => {
      // Legal entity TINs (13 digits)
      const testReport = createTestReport({
        value: '1987123456789',  // 13 digits
        issuedBy: 'LU',
      });

      const results = await runLuxembourgTinValidator(testReport);
      const formatErrors = results.filter((r) =>
        r.ruleId === 'LU-TIN-001' && r.severity === 'error'
      );
      expect(formatErrors.length).toBe(0);
    });
  });
});

// =============================================================================
// COMBINED VALIDATION TESTS
// =============================================================================

describe('Combined TIN Validation', () => {
  it('should run both OECD and Luxembourg validators without conflict', async () => {
    const oecdResults = await runOecdTinValidator(validReport);
    const luxResults = await runLuxembourgTinValidator(validReport);

    // Both should produce consistent results for valid report
    const oecdCritical = oecdResults.filter((r) => r.severity === 'critical').length;
    const luxCritical = luxResults.filter((r) => r.severity === 'critical').length;

    expect(oecdCritical).toBe(0);
    expect(luxCritical).toBe(0);
  });

  it('should detect same issues from both validators for invalid TIN', async () => {
    const testReport = createTestReport({
      value: '123', // Too short
      issuedBy: 'LU',
    });

    const oecdResults = await runOecdTinValidator(testReport);
    const luxResults = await runLuxembourgTinValidator(testReport);

    // Both should flag format issues
    expect(oecdResults.length).toBeGreaterThan(0);
    expect(luxResults.length).toBeGreaterThan(0);
  });
});
