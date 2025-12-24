/**
 * Quality Validators Index
 *
 * Exports all data quality validators and provides a combined
 * QualityValidator class for convenient usage.
 *
 * @module lib/validators/quality
 */

import { ValidationResult, ValidationCategory } from '@/types/validation';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';

// Individual validators
import { CrossFieldValidator } from './cross-field-validator';
import { EntityValidator } from './entity-validator';
import { CompletenessValidator } from './completeness-validator';
import { ConsistencyValidator } from './consistency-validator';
import { CommonErrorsValidator } from './common-errors-validator';

// =============================================================================
// EXPORTS
// =============================================================================

export { CrossFieldValidator } from './cross-field-validator';
export { EntityValidator } from './entity-validator';
export { CompletenessValidator } from './completeness-validator';
export { ConsistencyValidator } from './consistency-validator';
export { CommonErrorsValidator, commonErrorsValidator } from './common-errors-validator';

// =============================================================================
// COMBINED VALIDATOR
// =============================================================================

/**
 * Combined quality validator that runs all quality sub-validators
 */
export class QualityValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'quality-combined',
    name: 'Data Quality Validator',
    description: 'Combined validator for all data quality checks',
    category: ValidationCategory.DATA_QUALITY,
    order: 50, // Runs after OECD validators
    enabled: true,
  };

  private subValidators: BaseValidator[];

  constructor() {
    super();
    this.subValidators = [
      new CrossFieldValidator(),
      new EntityValidator(),
      new CompletenessValidator(),
      new ConsistencyValidator(),
      new CommonErrorsValidator(),
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
   * Enable or disable a specific sub-validator
   */
  setSubValidatorEnabled(id: string, enabled: boolean): void {
    const validator = this.subValidators.find(
      (v) => (v.constructor as typeof BaseValidator).metadata?.id === id
    );
    if (validator) {
      const metadata = (validator.constructor as typeof BaseValidator).metadata;
      if (metadata) {
        metadata.enabled = enabled;
      }
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all quality validator metadata
 */
export function getQualityValidatorMetadata(): ValidatorMetadata[] {
  return [
    CrossFieldValidator.metadata,
    EntityValidator.metadata,
    CompletenessValidator.metadata,
    ConsistencyValidator.metadata,
    CommonErrorsValidator.metadata,
  ];
}

/**
 * Create instances of all quality validators
 */
export function createQualityValidators(): BaseValidator[] {
  return [
    new CrossFieldValidator(),
    new EntityValidator(),
    new CompletenessValidator(),
    new ConsistencyValidator(),
    new CommonErrorsValidator(),
  ];
}

