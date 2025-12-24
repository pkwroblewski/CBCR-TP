/**
 * Luxembourg TIN Validator
 *
 * Validates Tax Identification Numbers (TINs) specific to Luxembourg.
 * Luxembourg uses the "Matricule National" (National Registration Number)
 * which follows specific format patterns.
 *
 * @module lib/validators/countries/luxembourg/tin-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { TIN, ConstituentEntity } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../../core/base-validator';
import { ValidationContext } from '../../core/validation-context';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Luxembourg TIN format patterns
 *
 * Matricule National formats:
 * - Companies: 11-13 numeric digits
 * - Standard format: YYYYMMDDNNNN (birthdate + sequence for individuals)
 * - Corporate format: Variable length numeric
 */
const LU_TIN_PATTERNS = {
  /** Standard corporate matricule: 11-13 digits */
  CORPORATE: /^\d{11,13}$/,

  /** Alternative format with year prefix */
  WITH_YEAR: /^(19|20)\d{2}\d{7,9}$/,

  /** VAT number format (LU + 8 digits) - informational */
  VAT: /^LU\d{8}$/,

  /** Minimum length for valid TIN */
  MIN_LENGTH: 11,

  /** Maximum length for valid TIN */
  MAX_LENGTH: 13,
};

/**
 * Known invalid TIN patterns
 */
const INVALID_PATTERNS = [
  /^0+$/, // All zeros
  /^1{11,13}$/, // All ones
  /^(.)\1+$/, // Single repeated character
  /^123456789\d*$/, // Sequential numbers
];

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates Luxembourg-specific TIN format
 */
export class LuxembourgTinValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'lu-tin',
    name: 'Luxembourg TIN Validator',
    description: 'Validates Luxembourg Matricule National format',
    category: ValidationCategory.COUNTRY_RULES,
    order: 200,
    applicableCountries: ['LU'],
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate Reporting Entity TIN if in Luxembourg
    const reportingEntity = this.getReportingEntity(ctx);
    const reportingJurisdiction = ctx.getReportingJurisdiction();

    if (reportingJurisdiction === 'LU') {
      results.push(...this.validateEntityTins(
        reportingEntity.tin ?? [],
        reportingEntity.name[0]?.value ?? 'Reporting Entity',
        this.xpathReportingEntity(),
        true
      ));
    }

    // Validate constituent entities in Luxembourg jurisdiction
    for (const [entity, entityIndex, report, reportIndex] of this.iterateEntities(ctx)) {
      if (report.resCountryCode !== 'LU') continue;

      const entityPath = this.xpathEntity(reportIndex, entityIndex);
      const entityName = entity.name[0]?.value ?? 'Unknown';

      results.push(...this.validateEntityTins(
        entity.tin ?? [],
        entityName,
        entityPath,
        false
      ));
    }

    return results;
  }

  /**
   * Validate TINs for an entity
   */
  private validateEntityTins(
    tins: TIN[],
    entityName: string,
    basePath: string,
    isReportingEntity: boolean
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check for Luxembourg TINs
    const luTins = tins.filter((t) => t.issuedBy === 'LU');
    const nonLuTins = tins.filter((t) => t.issuedBy !== 'LU');

    // LU-TIN-002: Check that Luxembourg entities have LU-issued TIN
    if (luTins.length === 0 && nonLuTins.length > 0) {
      results.push(
        this.result('LU-TIN-002')
          .warning()
          .message(
            `${entityName}: Luxembourg entity has TIN but none with issuedBy='LU'`
          )
          .xpath(`${basePath}/TIN`)
          .suggestion('Luxembourg entities should have a Matricule National with issuedBy="LU"')
          .build()
      );
    }

    // Validate each Luxembourg TIN
    for (let i = 0; i < luTins.length; i++) {
      const tin = luTins[i];
      const tinPath = `${basePath}/TIN[${i}]`;
      const tinValue = tin.value?.trim() ?? '';

      // Skip NOTIN
      if (tinValue.toUpperCase() === 'NOTIN') {
        continue;
      }

      // LU-TIN-001: Matricule National format
      results.push(...this.validateMatriculeFormat(tinValue, entityName, tinPath));

      // LU-TIN-003: Known format patterns
      results.push(...this.validateKnownPatterns(tinValue, entityName, tinPath));
    }

    return results;
  }

  /**
   * LU-TIN-001: Validate Matricule National format
   */
  private validateMatriculeFormat(
    tin: string,
    entityName: string,
    path: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Remove any spaces or dashes (common formatting)
    const cleanTin = tin.replace(/[\s-]/g, '');

    // Check if it's all numeric
    if (!/^\d+$/.test(cleanTin)) {
      results.push(
        this.result('LU-TIN-001')
          .error()
          .message(
            `${entityName}: Luxembourg Matricule National must be numeric only, got: ${tin}`
          )
          .xpath(path)
          .suggestion('Remove any non-numeric characters from the Matricule National')
          .build()
      );
      return results;
    }

    // Check length
    if (cleanTin.length < LU_TIN_PATTERNS.MIN_LENGTH) {
      results.push(
        this.result('LU-TIN-001')
          .error()
          .message(
            `${entityName}: Luxembourg Matricule National too short (${cleanTin.length} digits, minimum ${LU_TIN_PATTERNS.MIN_LENGTH})`
          )
          .xpath(path)
          .details({ tin, length: cleanTin.length })
          .build()
      );
    } else if (cleanTin.length > LU_TIN_PATTERNS.MAX_LENGTH) {
      results.push(
        this.result('LU-TIN-001')
          .error()
          .message(
            `${entityName}: Luxembourg Matricule National too long (${cleanTin.length} digits, maximum ${LU_TIN_PATTERNS.MAX_LENGTH})`
          )
          .xpath(path)
          .details({ tin, length: cleanTin.length })
          .build()
      );
    }

    // Check against corporate pattern
    if (!LU_TIN_PATTERNS.CORPORATE.test(cleanTin)) {
      results.push(
        this.result('LU-TIN-001')
          .warning()
          .message(
            `${entityName}: Luxembourg Matricule National doesn't match expected corporate format`
          )
          .xpath(path)
          .suggestion('Expected format: 11-13 numeric digits')
          .build()
      );
    }

    return results;
  }

  /**
   * LU-TIN-003: Validate against known patterns and detect invalid TINs
   */
  private validateKnownPatterns(
    tin: string,
    entityName: string,
    path: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const cleanTin = tin.replace(/[\s-]/g, '');

    // Check for obviously invalid patterns
    for (const pattern of INVALID_PATTERNS) {
      if (pattern.test(cleanTin)) {
        results.push(
          this.result('LU-TIN-003')
            .error()
            .message(
              `${entityName}: Luxembourg TIN appears invalid (suspicious pattern): ${tin}`
            )
            .xpath(path)
            .suggestion('Verify the Matricule National is correctly entered')
            .build()
        );
        return results;
      }
    }

    // Check for year-based format (optional validation)
    if (LU_TIN_PATTERNS.WITH_YEAR.test(cleanTin)) {
      const year = parseInt(cleanTin.substring(0, 4), 10);
      const currentYear = new Date().getFullYear();

      // Year should be reasonable (1900-current year)
      if (year < 1900 || year > currentYear) {
        results.push(
          this.result('LU-TIN-003')
            .warning()
            .message(
              `${entityName}: Luxembourg TIN starts with unusual year: ${year}`
            )
            .xpath(path)
            .build()
        );
      }
    }

    // Informational: Check if VAT number was provided instead
    if (LU_TIN_PATTERNS.VAT.test(tin.toUpperCase())) {
      results.push(
        this.result('LU-TIN-003')
          .info()
          .message(
            `${entityName}: Appears to be a VAT number (${tin}), not a Matricule National`
          )
          .xpath(path)
          .suggestion('CbC reports should use the Matricule National, not the VAT number')
          .build()
      );
    }

    return results;
  }
}

