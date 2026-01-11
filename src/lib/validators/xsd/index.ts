/**
 * XSD Validators Module
 *
 * Exports XSD schema validation functionality for CbCR XML files.
 *
 * @module lib/validators/xsd
 */

export {
  XsdValidator,
  getXsdValidator,
  validateXsdSchema,
  isXsdValidationAvailable,
  type XsdError,
  type XsdValidationResult,
  type XsdValidationMode,
} from './xsd-validator';
