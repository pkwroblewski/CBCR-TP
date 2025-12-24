/**
 * Validators Module
 *
 * Central export point for all CbCR validation functionality.
 * Includes core infrastructure, OECD validators, and quality validators.
 *
 * @module lib/validators
 *
 * @example
 * ```typescript
 * import {
 *   ValidationEngine,
 *   createFullyConfiguredEngine,
 *   validateReport,
 * } from '@/lib/validators';
 *
 * // Quick validation with default engine
 * const report = await validateReport(parsedXml);
 *
 * // Or create a fully configured engine
 * const engine = createFullyConfiguredEngine();
 * const report = await engine.validate(parsedXml, { country: 'LU' });
 * ```
 */

// =============================================================================
// CORE EXPORTS
// =============================================================================

export {
  // Engine
  ValidationEngine,
  getValidationEngine,
  createValidationEngine,
  validateReport,
  type ValidationEngineConfig,
  // Base classes
  BaseValidator,
  ValidatorRegistry,
  validatorRegistry,
  type ValidatorMetadata,
  type ValidatorExecutionResult,
  // Context
  ValidationContext,
  DEFAULT_VALIDATION_OPTIONS,
  type ExtendedValidationOptions,
  type EntityReference,
  type JurisdictionReference,
  type ValidationTiming,
  // Result building
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
} from './core';

// =============================================================================
// OECD VALIDATORS
// =============================================================================

export {
  MessageSpecValidator,
  DocSpecValidator,
  TinValidator,
  SummaryValidator,
  BusinessActivityValidator,
} from './oecd';

// =============================================================================
// QUALITY VALIDATORS
// =============================================================================

export {
  QualityValidator,
  CrossFieldValidator,
  EntityValidator,
  CompletenessValidator,
  ConsistencyValidator,
  CommonErrorsValidator,
  commonErrorsValidator,
  getQualityValidatorMetadata,
  createQualityValidators,
} from './quality';

// =============================================================================
// COUNTRY VALIDATORS
// =============================================================================

export {
  // Registry functions
  isCountrySupported,
  getSupportedCountries,
  getCountryInfo,
  getCountryValidator,
  getCountryValidators,
  getAllCountryValidators,
  getAllCountryInfo,
  registerCountry,
  unregisterCountry,
  type CountryValidatorInfo,
  // Luxembourg
  LuxembourgValidator,
  LuxembourgTinValidator,
  LuxembourgDeadlineValidator,
  LuxembourgLocalRulesValidator,
  LuxembourgPillar2Validator,
  createLuxembourgValidators,
  getLuxembourgValidatorMetadata,
  LUXEMBOURG_METADATA,
  calculateLuFilingDeadline,
  isPastLuDeadline,
  getDaysUntilLuDeadline,
  isIirApplicable,
  isUtprApplicable,
  calculateCbcrEtr,
} from './countries';

// =============================================================================
// PILLAR 2 VALIDATORS
// =============================================================================

export {
  // Combined validator
  Pillar2Validator,
  // Individual validators
  SafeHarbourValidator,
  Pillar2DataQualityChecker,
  JurisdictionAnalyzer,
  // Metadata and constants
  PILLAR2_METADATA,
  DE_MINIMIS,
  SIMPLIFIED_ETR_RATES,
  SBIE_RATES,
  SAFE_HARBOUR_PERIOD,
  QUALIFIED_GLOBE_JURISDICTIONS,
  LOW_TAX_JURISDICTIONS,
  MINIMUM_TAX_RATE,
  // Utility functions
  getPillar2ValidatorMetadata,
  createPillar2Validators,
  mayPillar2Apply,
  estimateTopUpTax,
  getSimplifiedEtrThreshold,
  getSbieRatesForYear,
  isDeMinimisEligible,
  calculateSimplifiedEtr,
  hasQualifiedGlobeRules,
  getQualifiedRules,
  isLowTaxJurisdiction,
  // Types
  type SafeHarbourResult,
  type JurisdictionPillar2Analysis,
} from './pillar2';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

import { ValidationEngine } from './core';
import {
  MessageSpecValidator,
  DocSpecValidator,
  TinValidator,
  SummaryValidator,
  BusinessActivityValidator,
} from './oecd';
import { createQualityValidators } from './quality';
import { getAllCountryValidators, getCountryValidators } from './countries';
import { createPillar2Validators } from './pillar2';

/**
 * Create all OECD validators
 */
export function createOecdValidators() {
  return [
    new MessageSpecValidator(),
    new DocSpecValidator(),
    new TinValidator(),
    new SummaryValidator(),
    new BusinessActivityValidator(),
  ];
}

/**
 * Create all standard validators (OECD + Quality)
 */
export function createAllValidators() {
  return [...createOecdValidators(), ...createQualityValidators()];
}

/**
 * Create all validators including country-specific ones
 */
export function createAllValidatorsWithCountry(countryCode?: string) {
  const validators = createAllValidators();
  
  if (countryCode) {
    // Add validators for specific country
    validators.push(...getCountryValidators(countryCode));
  } else {
    // Add all country validators
    validators.push(...getAllCountryValidators());
  }
  
  return validators;
}

/**
 * Create all validators including Pillar 2
 */
export function createAllValidatorsWithPillar2(countryCode?: string) {
  const validators = createAllValidatorsWithCountry(countryCode);
  validators.push(...createPillar2Validators());
  return validators;
}

/**
 * Create a fully configured validation engine with all standard validators
 *
 * This is the recommended way to create an engine for typical use cases.
 *
 * @param countryCode - Optional country code to include country-specific validators
 * @param includePillar2 - Whether to include Pillar 2 validators (default: true)
 *
 * @example
 * ```typescript
 * // With Luxembourg validators and Pillar 2
 * const engine = createFullyConfiguredEngine('LU');
 * const report = await engine.validate(parsedXml, {
 *   country: 'LU',
 *   checkPillar2: true,
 * });
 *
 * // Without country-specific validators
 * const genericEngine = createFullyConfiguredEngine();
 *
 * // Without Pillar 2 validators
 * const noPillar2Engine = createFullyConfiguredEngine('LU', false);
 * ```
 */
export function createFullyConfiguredEngine(
  countryCode?: string,
  includePillar2: boolean = true
): ValidationEngine {
  const engine = new ValidationEngine();
  
  if (includePillar2) {
    engine.registerValidators(createAllValidatorsWithPillar2(countryCode));
  } else {
    engine.registerValidators(createAllValidatorsWithCountry(countryCode));
  }
  
  return engine;
}

/**
 * Quick validation with all validators pre-registered
 *
 * Convenience function that creates a configured engine and validates
 * in a single call. For repeated validations, prefer creating an engine
 * once and reusing it.
 *
 * @example
 * ```typescript
 * const report = await quickValidateReport(parsedXml);
 * console.log(`Valid: ${report.isValid}`);
 * ```
 */
export async function quickValidateReport(
  report: Parameters<ValidationEngine['validate']>[0],
  options?: Parameters<ValidationEngine['validate']>[1]
) {
  const engine = createFullyConfiguredEngine();
  return engine.validate(report, options);
}

