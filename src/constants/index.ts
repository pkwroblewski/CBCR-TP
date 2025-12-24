/**
 * Constants Index
 * Re-exports all constants for convenient importing
 *
 * @example
 * import { COUNTRIES, ALL_VALIDATION_RULES, getOecdErrorCode } from '@/constants';
 */

// Error codes
export {
  OECD_FILE_ERROR_CODES,
  OECD_RECORD_ERROR_CODES,
  APP_ERROR_CODES,
  getOecdErrorCode,
  getAppErrorCode,
  getAllErrorCodes,
  type ErrorCodeDefinition,
} from './error-codes';

// Validation rules
export {
  MESSAGE_SPEC_RULES,
  DOC_SPEC_RULES,
  TIN_RULES,
  BUSINESS_ACTIVITY_RULES,
  SUMMARY_RULES,
  CROSS_FIELD_RULES,
  ENCODING_RULES,
  COUNTRY_CODE_RULES,
  PILLAR2_RULES,
  VALIDATION_RULES_BY_CATEGORY,
  ALL_VALIDATION_RULES,
  getValidationRule,
  getRulesByCategory,
  getEnabledRules,
  getRulesForJurisdiction,
} from './validation-rules';

// Countries
export {
  COUNTRIES,
  LUXEMBOURG_TIN,
  isValidCountryCode,
  getCountryByCode,
  getCountryName,
  getCbcrParticipants,
  getPillar2Countries,
  validateTinFormat,
  getAllCountryCodes,
  searchCountries,
  type CountryInfo,
} from './countries';

