/**
 * OECD Validators Module
 *
 * Exports all OECD-specific validators for CbC XML Schema v2.0 compliance.
 * These validators implement the core OECD business rules that apply to
 * all jurisdictions.
 *
 * @module lib/validators/oecd
 *
 * @example
 * ```typescript
 * import { OecdValidator, registerOecdValidators } from '@/lib/validators/oecd';
 *
 * // Register all OECD validators with the engine
 * registerOecdValidators(engine);
 *
 * // Or use individual validators
 * engine.registerValidator(new MessageSpecValidator());
 * ```
 */

import { ValidationEngine } from '../core/validator';
import { BaseValidator, ValidatorMetadata, validatorRegistry } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';
import { ValidationResult, ValidationCategory } from '@/types/validation';

// Individual validators
export { MessageSpecValidator } from './message-spec-validator';
export { DocSpecValidator } from './doc-spec-validator';
export { TinValidator } from './tin-validator';
export { SummaryValidator } from './summary-validator';
export { BusinessActivityValidator } from './business-activity-validator';

// Import for local use
import { MessageSpecValidator } from './message-spec-validator';
import { DocSpecValidator } from './doc-spec-validator';
import { TinValidator } from './tin-validator';
import { SummaryValidator } from './summary-validator';
import { BusinessActivityValidator } from './business-activity-validator';

// =============================================================================
// OECD VALIDATOR COLLECTION
// =============================================================================

/**
 * All OECD validators as an array
 */
export const OECD_VALIDATORS: BaseValidator[] = [
  new MessageSpecValidator(),
  new DocSpecValidator(),
  new TinValidator(),
  new SummaryValidator(),
  new BusinessActivityValidator(),
];

/**
 * Register all OECD validators with a validation engine
 */
export function registerOecdValidators(engine: ValidationEngine): void {
  for (const validator of OECD_VALIDATORS) {
    engine.registerValidator(validator);
  }
}

/**
 * Register all OECD validators with the global registry
 */
export function registerOecdValidatorsGlobally(): void {
  for (const validator of OECD_VALIDATORS) {
    validatorRegistry.register(validator);
  }
}

// =============================================================================
// COMBINED OECD VALIDATOR
// =============================================================================

/**
 * Combined OECD validator that runs all sub-validators
 *
 * This is a convenience class that combines all OECD validators
 * into a single validator. Useful for simple setups.
 *
 * @example
 * ```typescript
 * const engine = new ValidationEngine();
 * engine.registerValidator(new OecdValidator());
 * ```
 */
export class OecdValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'oecd-combined',
    name: 'OECD Combined Validator',
    description: 'Runs all OECD CbC XML Schema v2.0 validations',
    category: ValidationCategory.BUSINESS_RULES,
    order: 1,
    enabled: true,
  };

  private subValidators: BaseValidator[];

  constructor() {
    super();
    this.subValidators = [
      new MessageSpecValidator(),
      new DocSpecValidator(),
      new TinValidator(),
      new SummaryValidator(),
      new BusinessActivityValidator(),
    ];
  }

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const validator of this.subValidators) {
      const validatorResults = await validator.execute(ctx);
      results.push(...validatorResults.results);

      // Stop if context indicates we should stop
      if (ctx.shouldStopValidation()) {
        break;
      }
    }

    return results;
  }
}

// =============================================================================
// VALIDATOR METADATA
// =============================================================================

/**
 * Get metadata for all OECD validators
 */
export function getOecdValidatorMetadata(): ValidatorMetadata[] {
  return OECD_VALIDATORS.map((v) => v.getMetadata());
}

/**
 * Get OECD validators by category
 */
export function getOecdValidatorsByCategory(
  category: ValidationCategory
): BaseValidator[] {
  return OECD_VALIDATORS.filter((v) => v.getMetadata().category === category);
}

// =============================================================================
// RULE COVERAGE
// =============================================================================

/**
 * OECD rule coverage information
 */
export const OECD_RULE_COVERAGE = {
  messageSpec: {
    validator: 'MessageSpecValidator',
    rules: ['MSG-001', 'MSG-002', 'MSG-003', 'MSG-004', 'MSG-005', 'MSG-006', 'MSG-007', 'MSG-008', 'MSG-009', 'MSG-010'],
  },
  docSpec: {
    validator: 'DocSpecValidator',
    rules: ['DOC-001', 'DOC-002', 'DOC-003', 'DOC-004', 'DOC-005', 'DOC-006', 'DOC-007'],
  },
  tin: {
    validator: 'TinValidator',
    rules: ['TIN-001', 'TIN-002', 'TIN-003', 'TIN-004', 'TIN-005', 'TIN-006'],
  },
  summary: {
    validator: 'SummaryValidator',
    rules: ['SUM-001', 'SUM-002', 'SUM-003', 'SUM-004', 'SUM-005', 'SUM-006', 'SUM-007', 'SUM-008', 'SUM-009', 'SUM-010'],
  },
  businessActivity: {
    validator: 'BusinessActivityValidator',
    rules: ['BIZ-001', 'BIZ-002', 'BIZ-003', 'BIZ-004'],
  },
};

/**
 * Get all OECD rules covered by validators
 */
export function getAllOecdRules(): string[] {
  return Object.values(OECD_RULE_COVERAGE).flatMap((c) => c.rules);
}

