/**
 * Core Validation Engine
 *
 * Provides the foundation for CbCR validation including:
 * - ValidationEngine: Main orchestrator
 * - BaseValidator: Abstract base for validators
 * - ValidationContext: State management
 * - ResultBuilder: Fluent result creation
 *
 * @module lib/validators/core
 *
 * @example
 * ```typescript
 * import {
 *   ValidationEngine,
 *   BaseValidator,
 *   ValidationContext,
 *   result,
 * } from '@/lib/validators/core';
 *
 * // Create and configure engine
 * const engine = new ValidationEngine();
 * engine.registerValidator(new MyValidator());
 *
 * // Validate a report
 * const report = await engine.validate(parsedReport, {
 *   country: 'LU',
 *   checkPillar2: true,
 * });
 * ```
 */

// Validation Engine
export {
  ValidationEngine,
  getValidationEngine,
  createValidationEngine,
  validateReport,
  type ValidationEngineConfig,
} from './validator';

// Base Validator
export {
  BaseValidator,
  ValidatorRegistry,
  validatorRegistry,
  type ValidatorMetadata,
  type ValidatorExecutionResult,
} from './base-validator';

// Validation Context
export {
  ValidationContext,
  DEFAULT_VALIDATION_OPTIONS,
  type ExtendedValidationOptions,
  type EntityReference,
  type JurisdictionReference,
  type ValidationTiming,
} from './validation-context';

// Result Builder
export {
  ResultBuilder,
  result,
  criticalResult,
  errorResult,
  warningResult,
  infoResult,
  countBySeverity,
  countByCategory,
  sortBySeverity,
  groupByCategory,
  getProblems,
} from './result-builder';

