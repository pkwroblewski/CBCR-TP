/**
 * TIN Validator
 *
 * Validates Tax Identification Number (TIN) elements according to
 * OECD CbC XML Schema v2.0 requirements.
 *
 * @module lib/validators/oecd/tin-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { TIN } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';
import { isValidCountryCode, validateTinFormat } from '@/constants/countries';

// =============================================================================
// CONSTANTS
// =============================================================================

/** NOTIN value - used when TIN is not available */
const NOTIN_VALUE = 'NOTIN';

/** Minimum TIN length */
const MIN_TIN_LENGTH = 2;

/** Maximum TIN length */
const MAX_TIN_LENGTH = 200;

/** Pattern for repeated single character (invalid) */
const REPEATED_CHAR_PATTERN = /^(.)\1+$/;

/** Obviously invalid TIN patterns */
const INVALID_TIN_PATTERNS = [
  /^0+$/, // All zeros
  /^1+$/, // All ones
  /^9+$/, // All nines
  /^X+$/i, // All X's
  /^N\/?A$/i, // N/A
  /^NONE$/i, // NONE
  /^NULL$/i, // NULL
  /^UNKNOWN$/i, // UNKNOWN
];

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates TIN elements
 */
export class TinValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'oecd-tin',
    name: 'TIN Validator',
    description: 'Validates Tax Identification Number elements',
    category: ValidationCategory.BUSINESS_RULES,
    order: 30,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate ReportingEntity TINs
    const reportingEntity = this.getReportingEntity(ctx);
    const reTins = reportingEntity.tin ?? [];

    // TIN-001: Reporting entity should have at least one TIN
    if (reTins.length === 0) {
      results.push(
        this.result('TIN-001')
          .error()
          .message('ReportingEntity should have at least one TIN')
          .xpath(this.xpathReportingEntity('TIN'))
          .build()
      );
    } else {
      // Validate each TIN
      for (let i = 0; i < reTins.length; i++) {
        const tin = reTins[i];
        const xpath = `${this.xpathReportingEntity('TIN')}[${i}]`;
        results.push(...this.validateTinElement(tin, xpath, 'ReportingEntity', ctx));
      }
    }

    // Validate Constituent Entity TINs
    for (const [entity, entityIndex, report, reportIndex] of this.iterateEntities(ctx)) {
      const entityTins = entity.tin ?? [];
      const entityXpath = this.xpathEntity(reportIndex, entityIndex);

      // TIN-006: Constituent entities should have TINs when available
      if (entityTins.length === 0) {
        results.push(
          this.result('TIN-006')
            .info()
            .dataQuality()
            .message(`Constituent entity "${entity.name[0]?.value ?? 'Unknown'}" has no TIN`)
            .xpath(`${entityXpath}/TIN`)
            .details({
              entityName: entity.name[0]?.value,
              jurisdiction: report.resCountryCode,
            })
            .build()
        );
      } else {
        // Validate each TIN
        for (let i = 0; i < entityTins.length; i++) {
          const tin = entityTins[i];
          const xpath = `${entityXpath}/TIN[${i}]`;
          results.push(
            ...this.validateTinElement(
              tin,
              xpath,
              entity.name[0]?.value ?? 'Unknown',
              ctx
            )
          );
        }
      }
    }

    return results;
  }

  /**
   * Validate a single TIN element
   */
  private validateTinElement(
    tin: TIN,
    xpath: string,
    entityName: string,
    ctx: ValidationContext
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const tinValue = tin.value?.trim() ?? '';

    // TIN-004: TIN value must not be empty
    if (this.isEmpty(tinValue)) {
      results.push(
        this.result('TIN-004')
          .error()
          .message(`TIN element is empty for ${entityName}`)
          .xpath(xpath)
          .build()
      );
      return results;
    }

    // Handle NOTIN
    if (tinValue.toUpperCase() === NOTIN_VALUE) {
      // NOTIN is acceptable but should have a reason in OtherEntityInfo
      results.push(
        this.result('TIN-003')
          .info()
          .dataQuality()
          .message(`NOTIN used for ${entityName} - ensure reason is documented`)
          .xpath(xpath)
          .suggestion('Consider adding explanation in OtherEntityInfo')
          .build()
      );
      return results;
    }

    // TIN length validation
    if (tinValue.length < MIN_TIN_LENGTH) {
      results.push(
        this.result('TIN-003')
          .error()
          .message(`TIN is too short (${tinValue.length} characters) for ${entityName}`)
          .xpath(xpath)
          .build()
      );
    }

    if (tinValue.length > MAX_TIN_LENGTH) {
      results.push(
        this.result('TIN-003')
          .error()
          .message(`TIN exceeds maximum length of ${MAX_TIN_LENGTH} characters`)
          .xpath(xpath)
          .build()
      );
    }

    // Check for repeated single character
    if (REPEATED_CHAR_PATTERN.test(tinValue)) {
      results.push(
        this.result('TIN-003')
          .error()
          .message(`TIN appears invalid - repeated single character: ${tinValue}`)
          .xpath(xpath)
          .build()
      );
    }

    // Check for obviously invalid patterns
    for (const pattern of INVALID_TIN_PATTERNS) {
      if (pattern.test(tinValue)) {
        results.push(
          this.result('TIN-003')
            .error()
            .message(`TIN appears invalid: ${tinValue}`)
            .xpath(xpath)
            .suggestion('Provide a valid Tax Identification Number')
            .build()
        );
        break;
      }
    }

    // TIN-002: issuedBy attribute validation
    if (this.isEmpty(tin.issuedBy)) {
      results.push(
        this.result('TIN-002')
          .warning()
          .dataQuality()
          .message(`TIN is missing issuedBy attribute for ${entityName}`)
          .xpath(xpath)
          .suggestion('Specify the jurisdiction that issued the TIN')
          .build()
      );
    } else if (tin.issuedBy) {
      // TIN-005: Validate issuedBy is a valid country code
      if (!isValidCountryCode(tin.issuedBy)) {
        results.push(
          this.result('TIN-005')
            .error()
            .message(`TIN issuedBy contains invalid country code: ${tin.issuedBy}`)
            .xpath(xpath)
            .build()
        );
      } else {
        // TIN-003: Validate TIN format against country-specific rules
        const formatValidation = validateTinFormat(tinValue, tin.issuedBy);
        if (!formatValidation.valid) {
          results.push(
            this.result('TIN-003')
              .error()
              .countryRules()
              .message(`TIN format invalid for ${tin.issuedBy}: ${formatValidation.error}`)
              .xpath(xpath)
              .details({
                tin: tinValue,
                issuedBy: tin.issuedBy,
              })
              .build()
          );
        }
      }
    }

    // Check for whitespace issues
    if (tin.value !== tinValue) {
      results.push(
        this.result('TIN-003')
          .warning()
          .dataQuality()
          .message(`TIN contains leading/trailing whitespace for ${entityName}`)
          .xpath(xpath)
          .build()
      );
    }

    // Check for internal whitespace (unusual for TINs)
    if (/\s/.test(tinValue)) {
      results.push(
        this.result('TIN-003')
          .warning()
          .dataQuality()
          .message(`TIN contains internal whitespace for ${entityName}`)
          .xpath(xpath)
          .suggestion('TINs typically do not contain spaces')
          .build()
      );
    }

    return results;
  }
}

