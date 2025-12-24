/**
 * Country Validators Index
 *
 * Registry for country-specific CbC validators. Currently supports Luxembourg,
 * but designed to be easily extensible for additional countries.
 *
 * @module lib/validators/countries
 *
 * @example
 * ```typescript
 * import { getCountryValidator, isCountrySupported } from '@/lib/validators/countries';
 *
 * // Check if a country has specific validators
 * if (isCountrySupported('LU')) {
 *   const validator = getCountryValidator('LU');
 *   const results = await validator.validate(ctx);
 * }
 *
 * // Get all supported countries
 * const supported = getSupportedCountries();
 * console.log(supported); // ['LU']
 * ```
 */

import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationCategory } from '@/types/validation';

// Country validators
import {
  LuxembourgValidator,
  createLuxembourgValidators,
  getLuxembourgValidatorMetadata,
  LUXEMBOURG_METADATA,
} from './luxembourg';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Country validator metadata
 */
export interface CountryValidatorInfo {
  /** ISO 3166-1 Alpha-2 country code */
  countryCode: string;

  /** Country name */
  countryName: string;

  /** Competent authority information */
  authority: {
    name: string;
    abbreviation: string;
    code: string;
    website?: string;
  };

  /** Revenue threshold for CbC reporting */
  revenueThreshold: number;

  /** Currency code */
  currency: string;

  /** Whether Pillar 2 is implemented */
  pillar2Implemented: boolean;

  /** Available validators for this country */
  validators: ValidatorMetadata[];
}

/**
 * Country validator factory
 */
export type CountryValidatorFactory = () => BaseValidator[];

// =============================================================================
// COUNTRY REGISTRY
// =============================================================================

/**
 * Registry of supported countries and their validators
 */
const COUNTRY_REGISTRY: Map<string, {
  info: CountryValidatorInfo;
  factory: CountryValidatorFactory;
  combinedValidator: new () => BaseValidator;
}> = new Map();

// Register Luxembourg
COUNTRY_REGISTRY.set('LU', {
  info: {
    countryCode: LUXEMBOURG_METADATA.countryCode,
    countryName: LUXEMBOURG_METADATA.countryName,
    authority: LUXEMBOURG_METADATA.authority,
    revenueThreshold: LUXEMBOURG_METADATA.revenueThreshold,
    currency: LUXEMBOURG_METADATA.currency,
    pillar2Implemented: LUXEMBOURG_METADATA.pillar2.qdmttImplemented,
    validators: getLuxembourgValidatorMetadata(),
  },
  factory: createLuxembourgValidators,
  combinedValidator: LuxembourgValidator,
});

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Check if a country has specific validators available
 */
export function isCountrySupported(countryCode: string): boolean {
  return COUNTRY_REGISTRY.has(countryCode.toUpperCase());
}

/**
 * Get list of all supported country codes
 */
export function getSupportedCountries(): string[] {
  return Array.from(COUNTRY_REGISTRY.keys());
}

/**
 * Get country validator info
 */
export function getCountryInfo(countryCode: string): CountryValidatorInfo | null {
  const entry = COUNTRY_REGISTRY.get(countryCode.toUpperCase());
  return entry?.info ?? null;
}

/**
 * Get the combined validator for a country
 *
 * @param countryCode - ISO 3166-1 Alpha-2 country code
 * @returns Combined country validator or null if not supported
 */
export function getCountryValidator(countryCode: string): BaseValidator | null {
  const entry = COUNTRY_REGISTRY.get(countryCode.toUpperCase());
  if (!entry) return null;
  return new entry.combinedValidator();
}

/**
 * Get all individual validators for a country
 *
 * @param countryCode - ISO 3166-1 Alpha-2 country code
 * @returns Array of validators or empty array if not supported
 */
export function getCountryValidators(countryCode: string): BaseValidator[] {
  const entry = COUNTRY_REGISTRY.get(countryCode.toUpperCase());
  if (!entry) return [];
  return entry.factory();
}

/**
 * Get all country validators for all supported countries
 */
export function getAllCountryValidators(): BaseValidator[] {
  const validators: BaseValidator[] = [];
  for (const [_, entry] of COUNTRY_REGISTRY) {
    validators.push(...entry.factory());
  }
  return validators;
}

/**
 * Get all country info for all supported countries
 */
export function getAllCountryInfo(): CountryValidatorInfo[] {
  return Array.from(COUNTRY_REGISTRY.values()).map((entry) => entry.info);
}

// =============================================================================
// COUNTRY EXPORTS
// =============================================================================

// Luxembourg exports
export {
  LuxembourgValidator,
  LuxembourgTinValidator,
  LuxembourgDeadlineValidator,
  LuxembourgLocalRulesValidator,
  LuxembourgPillar2Validator,
  createLuxembourgValidators,
  getLuxembourgValidatorMetadata,
  LUXEMBOURG_METADATA,
  // Utility functions
  calculateLuFilingDeadline,
  isPastLuDeadline,
  getDaysUntilLuDeadline,
  isIirApplicable,
  isUtprApplicable,
  calculateCbcrEtr,
} from './luxembourg';

// =============================================================================
// EXTENSIBILITY
// =============================================================================

/**
 * Register a new country validator
 *
 * This allows adding support for new countries without modifying this module.
 *
 * @example
 * ```typescript
 * import { registerCountry } from '@/lib/validators/countries';
 * import { GermanyValidator, createGermanyValidators, GERMANY_METADATA } from './germany';
 *
 * registerCountry('DE', {
 *   info: {
 *     countryCode: 'DE',
 *     countryName: 'Germany',
 *     authority: { name: 'BZSt', abbreviation: 'BZSt', code: 'DE' },
 *     revenueThreshold: 750_000_000,
 *     currency: 'EUR',
 *     pillar2Implemented: true,
 *     validators: getGermanyValidatorMetadata(),
 *   },
 *   factory: createGermanyValidators,
 *   combinedValidator: GermanyValidator,
 * });
 * ```
 */
export function registerCountry(
  countryCode: string,
  config: {
    info: CountryValidatorInfo;
    factory: CountryValidatorFactory;
    combinedValidator: new () => BaseValidator;
  }
): void {
  COUNTRY_REGISTRY.set(countryCode.toUpperCase(), config);
}

/**
 * Unregister a country (mainly for testing)
 */
export function unregisterCountry(countryCode: string): boolean {
  return COUNTRY_REGISTRY.delete(countryCode.toUpperCase());
}

