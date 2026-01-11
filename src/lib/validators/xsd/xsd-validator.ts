/**
 * XSD Schema Validator
 *
 * Validates CbCR XML files against the official OECD CbC XML Schema v2.0.
 * Uses libxmljs2 for native XSD validation with proper error reporting.
 *
 * @module lib/validators/xsd/xsd-validator
 */

import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';

// =============================================================================
// TYPES
// =============================================================================

/**
 * XSD validation error from libxmljs2
 */
export interface XsdError {
  /** Line number where error occurred */
  line: number;
  /** Column number where error occurred */
  column: number;
  /** Error message from libxmljs2 */
  message: string;
  /** XPath to the element (if available) */
  xpath?: string;
  /** Mapped OECD error code */
  oecdErrorCode?: number;
  /** Error level from libxmljs2 */
  level?: string;
}

/**
 * Result of XSD validation
 */
export interface XsdValidationResult {
  /** Whether the XML is valid against the schema */
  valid: boolean;
  /** List of validation errors */
  errors: XsdError[];
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * XSD validation mode
 */
export type XsdValidationMode = 'strict' | 'lenient';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Path to XSD schema files */
const XSD_DIR = path.join(process.cwd(), 'src', 'lib', 'xsd');

/** Main CbCR schema file */
const CBCR_SCHEMA_FILE = 'CbcXML_v2.0.xsd';

/** Status message schema file */
const STATUS_MESSAGE_SCHEMA_FILE = 'CbcStatusMessageXML_v2.0.xsd';

/**
 * Map XSD error patterns to OECD error codes
 */
const XSD_ERROR_TO_OECD_CODE: Record<string, number> = {
  // File-level errors (50000 series)
  'not valid': 50002,
  'encoding': 50013,
  'namespace': 50002,
  'root element': 50002,
  
  // Record-level errors (80000 series)
  'DocTypeIndic': 80000,
  'DocRefId': 80001,
  'CountryCode': 80020,
  'ResCountryCode': 80021,
  'BizActivity': 80030,
  'NbEmployees': 80040,
  'Revenues': 80042,
  'Summary': 80043,
  'ConstEntities': 80044,
  'Name': 80050,
  'Address': 80051,
  'ReportingRole': 80060,
};

// =============================================================================
// XSD VALIDATOR CLASS
// =============================================================================

/**
 * XSD Schema Validator for CbCR XML files
 *
 * @example
 * ```typescript
 * const validator = new XsdValidator();
 * const result = await validator.validate(xmlContent);
 *
 * if (!result.valid) {
 *   console.log('Schema errors:', result.errors);
 * }
 * ```
 */
export class XsdValidator {
  private schemaDoc: unknown = null;
  private statusMessageSchemaDoc: unknown = null;
  private libxmljs: typeof import('libxmljs2') | null = null;
  private initialized = false;
  private initError: Error | null = null;

  /**
   * Initialize the validator by loading XSD schemas
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamically import libxmljs2 (it's a native module)
      this.libxmljs = await import('libxmljs2');

      // Load main CbCR schema
      const schemaPath = path.join(XSD_DIR, CBCR_SCHEMA_FILE);
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        this.schemaDoc = this.libxmljs.parseXml(schemaContent, {
          baseUrl: XSD_DIR + '/',
        });
      }

      // Load status message schema
      const statusSchemaPath = path.join(XSD_DIR, STATUS_MESSAGE_SCHEMA_FILE);
      if (fs.existsSync(statusSchemaPath)) {
        const statusSchemaContent = fs.readFileSync(statusSchemaPath, 'utf-8');
        this.statusMessageSchemaDoc = this.libxmljs.parseXml(statusSchemaContent, {
          baseUrl: XSD_DIR + '/',
        });
      }

      this.initialized = true;
    } catch (error) {
      this.initError = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to initialize XSD validator:', this.initError.message);
    }
  }

  /**
   * Validate XML content against CbCR XSD schema
   *
   * @param xmlContent - Raw XML string to validate
   * @param mode - Validation mode: 'strict' stops on errors, 'lenient' continues
   * @returns XSD validation result
   */
  async validate(xmlContent: string, mode: XsdValidationMode = 'strict'): Promise<XsdValidationResult> {
    const startTime = Date.now();
    const errors: XsdError[] = [];

    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // If initialization failed, return soft error
    if (this.initError || !this.libxmljs) {
      return {
        valid: mode === 'lenient',
        errors: [{
          line: 0,
          column: 0,
          message: `XSD validator not available: ${this.initError?.message ?? 'libxmljs2 not loaded'}`,
          oecdErrorCode: 50000,
        }],
        processingTimeMs: Date.now() - startTime,
      };
    }

    try {
      // Parse the XML document
      const xmlDoc = this.libxmljs.parseXml(xmlContent);

      // Get parse errors first
      const parseErrors = xmlDoc.errors;
      if (parseErrors && parseErrors.length > 0) {
        for (const err of parseErrors) {
          errors.push(this.mapLibxmljsError(err));
        }
      }

      // Validate against schema if we have it
      if (this.schemaDoc) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isValid = xmlDoc.validate(this.schemaDoc as any);

        if (!isValid) {
          const validationErrors = xmlDoc.validationErrors;
          if (validationErrors && validationErrors.length > 0) {
            for (const err of validationErrors) {
              errors.push(this.mapLibxmljsError(err));
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      // XML parsing failed completely
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        line: 0,
        column: 0,
        message: `XML parsing failed: ${errorMessage}`,
        oecdErrorCode: 50001,
      });

      return {
        valid: false,
        errors,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate status message XML against status message schema
   */
  async validateStatusMessage(xmlContent: string): Promise<XsdValidationResult> {
    const startTime = Date.now();
    const errors: XsdError[] = [];

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.libxmljs || !this.statusMessageSchemaDoc) {
      return {
        valid: false,
        errors: [{
          line: 0,
          column: 0,
          message: 'Status message schema not available',
        }],
        processingTimeMs: Date.now() - startTime,
      };
    }

    try {
      const xmlDoc = this.libxmljs.parseXml(xmlContent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isValid = xmlDoc.validate(this.statusMessageSchemaDoc as any);

      if (!isValid) {
        const validationErrors = xmlDoc.validationErrors;
        if (validationErrors) {
          for (const err of validationErrors) {
            errors.push(this.mapLibxmljsError(err));
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        errors: [{
          line: 0,
          column: 0,
          message: `Status message parsing failed: ${errorMessage}`,
        }],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Map libxmljs2 error to XsdError with OECD code
   */
  private mapLibxmljsError(err: unknown): XsdError {
    // libxmljs2 error structure
    const error = err as {
      line?: number;
      column?: number;
      message?: string;
      level?: number;
    };

    const message = error.message ?? 'Unknown validation error';
    const oecdErrorCode = this.detectOecdErrorCode(message);

    return {
      line: error.line ?? 0,
      column: error.column ?? 0,
      message,
      oecdErrorCode,
      level: this.mapErrorLevel(error.level),
    };
  }

  /**
   * Detect OECD error code from error message
   */
  private detectOecdErrorCode(message: string): number | undefined {
    const lowerMessage = message.toLowerCase();

    for (const [pattern, code] of Object.entries(XSD_ERROR_TO_OECD_CODE)) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        return code;
      }
    }

    // Default to generic schema error
    return 50002;
  }

  /**
   * Map libxmljs2 error level to string
   */
  private mapErrorLevel(level?: number): string {
    switch (level) {
      case 1:
        return 'warning';
      case 2:
        return 'error';
      case 3:
        return 'fatal';
      default:
        return 'error';
    }
  }

  /**
   * Convert XSD errors to ValidationResult format
   */
  toValidationResults(xsdResult: XsdValidationResult, mode: XsdValidationMode = 'strict'): ValidationResult[] {
    return xsdResult.errors.map((error) => ({
      ruleId: `XSD-${error.oecdErrorCode ?? '000'}`,
      category: ValidationCategory.SCHEMA_COMPLIANCE,
      severity: mode === 'strict' ? ValidationSeverity.CRITICAL : ValidationSeverity.WARNING,
      message: error.message,
      xpath: error.xpath,
      details: {
        line: error.line,
        column: error.column,
        oecdErrorCode: error.oecdErrorCode,
        level: error.level,
      },
    }));
  }

  /**
   * Check if validator is ready
   */
  isReady(): boolean {
    return this.initialized && !this.initError;
  }

  /**
   * Get initialization error if any
   */
  getInitError(): Error | null {
    return this.initError;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let xsdValidatorInstance: XsdValidator | null = null;

/**
 * Get the singleton XSD validator instance
 */
export function getXsdValidator(): XsdValidator {
  if (!xsdValidatorInstance) {
    xsdValidatorInstance = new XsdValidator();
  }
  return xsdValidatorInstance;
}

/**
 * Validate XML against CbCR schema using singleton
 */
export async function validateXsdSchema(
  xmlContent: string,
  mode: XsdValidationMode = 'strict'
): Promise<XsdValidationResult> {
  const validator = getXsdValidator();
  return validator.validate(xmlContent, mode);
}

/**
 * Check if XSD validation is available
 */
export async function isXsdValidationAvailable(): Promise<boolean> {
  const validator = getXsdValidator();
  await validator.initialize();
  return validator.isReady();
}
