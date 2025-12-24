/**
 * Luxembourg Validators Index
 *
 * Exports all Luxembourg-specific CbC validators and provides a combined
 * LuxembourgValidator class for convenient usage.
 *
 * Luxembourg CbC requirements are based on:
 * - Law of 23 December 2016 (CbCR implementation)
 * - Law of 22 December 2023 (Pillar 2 implementation)
 * - Administration des Contributions Directes (ACD) guidance
 *
 * @module lib/validators/countries/luxembourg
 */

import { ValidationResult, ValidationCategory } from '@/types/validation';
import { BaseValidator, ValidatorMetadata } from '../../core/base-validator';
import { ValidationContext } from '../../core/validation-context';

// Individual validators
import { LuxembourgTinValidator } from './tin-validator';
import { LuxembourgDeadlineValidator } from './deadline-validator';
import { LuxembourgLocalRulesValidator } from './local-rules-validator';
import { LuxembourgPillar2Validator } from './pillar2-validator';

// =============================================================================
// EXPORTS
// =============================================================================

export { LuxembourgTinValidator } from './tin-validator';
export {
  LuxembourgDeadlineValidator,
  calculateLuFilingDeadline,
  isPastLuDeadline,
  getDaysUntilLuDeadline,
} from './deadline-validator';
export { LuxembourgLocalRulesValidator } from './local-rules-validator';
export {
  LuxembourgPillar2Validator,
  isIirApplicable,
  isUtprApplicable,
  calculateCbcrEtr,
} from './pillar2-validator';

// =============================================================================
// LUXEMBOURG METADATA
// =============================================================================

/**
 * Luxembourg CbCR jurisdiction metadata
 */
export const LUXEMBOURG_METADATA = {
  /** ISO 3166-1 Alpha-2 country code */
  countryCode: 'LU',

  /** Country name */
  countryName: 'Luxembourg',

  /** Competent authority */
  authority: {
    name: 'Administration des Contributions Directes',
    abbreviation: 'ACD',
    code: 'LU',
    website: 'https://impotsdirects.public.lu',
    email: 'info@co.etat.lu',
  },

  /** Revenue threshold for CbC reporting (EUR) */
  revenueThreshold: 750_000_000,

  /** Currency */
  currency: 'EUR',

  /** Filing deadlines */
  deadlines: {
    /** Notification deadline: last day of fiscal year */
    notificationMonthsAfterFy: 0,
    /** Filing deadline: 12 months after fiscal year end */
    filingMonthsAfterFy: 12,
  },

  /** Pillar 2 implementation */
  pillar2: {
    /** IIR effective date */
    iirEffective: '2023-12-31',
    /** UTPR effective date */
    utprEffective: '2024-12-31',
    /** QDMTT implemented */
    qdmttImplemented: true,
    /** QDMTT effective date */
    qdmttEffective: '2023-12-31',
  },

  /** TIN format */
  tinFormat: {
    name: 'Matricule National',
    pattern: '^\\d{11,13}$',
    description: '11-13 digit numeric code',
  },

  /** CbC exchange agreements */
  exchanges: {
    mcaa: true, // MCAA signatory
    bilateral: [], // Additional bilateral agreements
  },

  /** Penalties */
  penalties: {
    lateFilingMax: 250_000, // EUR
    nonComplianceMax: 250_000, // EUR
    currency: 'EUR',
  },
};

// =============================================================================
// COMBINED VALIDATOR
// =============================================================================

/**
 * Combined Luxembourg validator that runs all Luxembourg-specific validators
 */
export class LuxembourgValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'lu-combined',
    name: 'Luxembourg Validator',
    description: 'Combined validator for all Luxembourg CbC requirements',
    category: ValidationCategory.COUNTRY_RULES,
    order: 200,
    applicableCountries: ['LU'],
    enabled: true,
  };

  private subValidators: BaseValidator[];

  constructor() {
    super();
    this.subValidators = [
      new LuxembourgTinValidator(),
      new LuxembourgDeadlineValidator(),
      new LuxembourgLocalRulesValidator(),
      new LuxembourgPillar2Validator(),
    ];
  }

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Run all sub-validators
    for (const validator of this.subValidators) {
      const validatorResults = await validator.validate(ctx);
      results.push(...validatorResults);
    }

    return results;
  }

  /**
   * Get list of all sub-validators
   */
  getSubValidators(): BaseValidator[] {
    return [...this.subValidators];
  }

  /**
   * Get Luxembourg metadata
   */
  static getMetadata() {
    return LUXEMBOURG_METADATA;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all Luxembourg validator metadata
 */
export function getLuxembourgValidatorMetadata(): ValidatorMetadata[] {
  return [
    LuxembourgTinValidator.metadata,
    LuxembourgDeadlineValidator.metadata,
    LuxembourgLocalRulesValidator.metadata,
    LuxembourgPillar2Validator.metadata,
  ];
}

/**
 * Create instances of all Luxembourg validators
 */
export function createLuxembourgValidators(): BaseValidator[] {
  return [
    new LuxembourgTinValidator(),
    new LuxembourgDeadlineValidator(),
    new LuxembourgLocalRulesValidator(),
    new LuxembourgPillar2Validator(),
  ];
}

