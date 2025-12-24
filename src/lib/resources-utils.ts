/**
 * Resources Utilities
 *
 * Utility functions for transforming and displaying resource data
 * in the Knowledge Base / Resources section.
 *
 * @module lib/resources-utils
 */

import {
  ALL_VALIDATION_RULES,
  OECD_COMMON_ERROR_RULES,
  VALIDATION_RULES_BY_CATEGORY,
} from '@/constants/validation-rules';
import { COUNTRIES, type CountryInfo } from '@/constants/countries';
import { GLOSSARY_TERMS } from '@/constants/glossary';
import { ALL_EXTERNAL_RESOURCES } from '@/constants/external-resources';
import {
  PILLAR2_CONCEPTS,
  PILLAR2_JURISDICTIONS,
  getPillar2Statistics,
} from '@/constants/pillar2-info';
import { ValidationCategory, ValidationSeverity } from '@/types/validation';

// ============================================================================
// Validation Rules Utilities
// ============================================================================

/**
 * Get validation rules grouped by category
 */
export function getRulesGroupedByCategory() {
  return VALIDATION_RULES_BY_CATEGORY;
}

/**
 * Get validation rules by category
 */
export function getRulesByCategory(category: ValidationCategory) {
  return ALL_VALIDATION_RULES.filter((rule) => rule.category === category);
}

/**
 * Get validation rules by severity
 */
export function getRulesBySeverity(severity: ValidationSeverity) {
  return ALL_VALIDATION_RULES.filter(
    (rule) => rule.defaultSeverity === severity
  );
}

/**
 * Get rules that have OECD error codes
 */
export function getRulesWithOecdCodes() {
  return ALL_VALIDATION_RULES.filter((rule) => rule.oecdErrorCode);
}

/**
 * Search validation rules
 */
export function searchRules(query: string) {
  const lowerQuery = query.toLowerCase();
  return ALL_VALIDATION_RULES.filter(
    (rule) =>
      rule.ruleId.toLowerCase().includes(lowerQuery) ||
      rule.name.toLowerCase().includes(lowerQuery) ||
      rule.description.toLowerCase().includes(lowerQuery) ||
      rule.reference?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get rule statistics
 */
export function getRuleStatistics() {
  const categoryStats = Object.values(ValidationCategory).map((category) => ({
    category,
    count: ALL_VALIDATION_RULES.filter((r) => r.category === category).length,
  }));

  const severityStats = Object.values(ValidationSeverity).map((severity) => ({
    severity,
    count: ALL_VALIDATION_RULES.filter((r) => r.defaultSeverity === severity)
      .length,
  }));

  return {
    total: ALL_VALIDATION_RULES.length,
    byCategory: categoryStats,
    bySeverity: severityStats,
    withOecdCode: ALL_VALIDATION_RULES.filter((r) => r.oecdErrorCode).length,
  };
}

// ============================================================================
// OECD Common Errors Utilities
// ============================================================================

/**
 * Get all OECD common errors as an array
 */
export function getOecdCommonErrors() {
  return Object.values(OECD_COMMON_ERROR_RULES).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
}

/**
 * Get OECD common errors by severity
 */
export function getOecdErrorsBySeverity(severity: ValidationSeverity) {
  return getOecdCommonErrors().filter((error) => error.severity === severity);
}

/**
 * Search OECD common errors
 */
export function searchOecdErrors(query: string) {
  const lowerQuery = query.toLowerCase();
  return getOecdCommonErrors().filter(
    (error) =>
      error.id.toLowerCase().includes(lowerQuery) ||
      error.title.toLowerCase().includes(lowerQuery) ||
      error.description.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// Country Utilities
// ============================================================================

/**
 * Get all countries as an array
 */
export function getAllCountries(): CountryInfo[] {
  return Object.values(COUNTRIES);
}

/**
 * Get countries with TIN patterns
 */
export function getCountriesWithTinPatterns(): CountryInfo[] {
  return getAllCountries().filter((c) => c.tinPattern);
}

/**
 * Get countries that are CbCR participants
 */
export function getCbcrParticipants(): CountryInfo[] {
  return getAllCountries().filter((c) => c.cbcrParticipant);
}

/**
 * Get countries with Pillar 2 implemented
 */
export function getPillar2Countries(): CountryInfo[] {
  return getAllCountries().filter((c) => c.pillar2Implemented);
}

/**
 * Search countries
 */
export function searchCountries(query: string): CountryInfo[] {
  const lowerQuery = query.toLowerCase();
  return getAllCountries().filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.code.toLowerCase().includes(lowerQuery) ||
      c.tinFormat?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get country statistics
 */
export function getCountryStatistics() {
  const countries = getAllCountries();
  return {
    total: countries.length,
    withTinPattern: countries.filter((c) => c.tinPattern).length,
    cbcrParticipants: countries.filter((c) => c.cbcrParticipant).length,
    pillar2Implemented: countries.filter((c) => c.pillar2Implemented).length,
    withFilingDeadline: countries.filter((c) => c.filingDeadlineMonths).length,
  };
}

// ============================================================================
// Combined Statistics for Hub Page
// ============================================================================

/**
 * Get all statistics for the resources hub page
 */
export function getResourcesHubStatistics() {
  const ruleStats = getRuleStatistics();
  const countryStats = getCountryStatistics();
  const pillar2Stats = getPillar2Statistics();
  const oecdErrors = getOecdCommonErrors();

  return {
    validationRules: ruleStats.total,
    oecdErrors: oecdErrors.length,
    countries: countryStats.total,
    pillar2Jurisdictions: pillar2Stats.implemented,
    glossaryTerms: GLOSSARY_TERMS.length,
    externalResources: ALL_EXTERNAL_RESOURCES.length,
    pillar2Concepts: PILLAR2_CONCEPTS.length,
  };
}

// ============================================================================
// Display Labels
// ============================================================================

/**
 * Category display labels
 */
export const CATEGORY_LABELS: Record<ValidationCategory, string> = {
  [ValidationCategory.XML_WELLFORMEDNESS]: 'XML Well-formedness',
  [ValidationCategory.SCHEMA_COMPLIANCE]: 'Schema Compliance',
  [ValidationCategory.BUSINESS_RULES]: 'Business Rules',
  [ValidationCategory.COUNTRY_RULES]: 'Country Rules',
  [ValidationCategory.DATA_QUALITY]: 'Data Quality',
  [ValidationCategory.PILLAR2_READINESS]: 'Pillar 2 Readiness',
};

/**
 * Severity display labels
 */
export const SEVERITY_LABELS: Record<ValidationSeverity, string> = {
  [ValidationSeverity.CRITICAL]: 'Critical',
  [ValidationSeverity.ERROR]: 'Error',
  [ValidationSeverity.WARNING]: 'Warning',
  [ValidationSeverity.INFO]: 'Info',
};

/**
 * Severity color classes for styling
 */
export const SEVERITY_COLORS: Record<
  ValidationSeverity,
  { bg: string; text: string; border: string }
> = {
  [ValidationSeverity.CRITICAL]: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-500',
  },
  [ValidationSeverity.ERROR]: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-500',
  },
  [ValidationSeverity.WARNING]: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-500',
  },
  [ValidationSeverity.INFO]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-500',
  },
};

/**
 * Category color classes for styling
 */
export const CATEGORY_COLORS: Record<
  ValidationCategory,
  { bg: string; text: string }
> = {
  [ValidationCategory.XML_WELLFORMEDNESS]: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-800 dark:text-slate-300',
  },
  [ValidationCategory.SCHEMA_COMPLIANCE]: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-800 dark:text-violet-300',
  },
  [ValidationCategory.BUSINESS_RULES]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
  },
  [ValidationCategory.COUNTRY_RULES]: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-800 dark:text-cyan-300',
  },
  [ValidationCategory.DATA_QUALITY]: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  [ValidationCategory.PILLAR2_READINESS]: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
  },
};
