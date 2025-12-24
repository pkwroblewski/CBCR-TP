/**
 * MessageSpec Validator
 *
 * Validates the MessageSpec element according to OECD CbC XML Schema v2.0
 * and business rules for message identification and routing.
 *
 * @module lib/validators/oecd/message-spec-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';
import { isValidCountryCode } from '@/constants/countries';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum length for MessageRefId */
const MAX_MESSAGE_REF_ID_LENGTH = 170;

/** Valid characters for MessageRefId (alphanumeric, hyphen, underscore, dot) */
const MESSAGE_REF_ID_PATTERN = /^[A-Za-z0-9\-_.]+$/;

/** Date format pattern (YYYY-MM-DD) */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Timestamp patterns (ISO 8601 variants) */
const TIMESTAMP_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z?$/,
];

/** Valid message types */
const VALID_MESSAGE_TYPES = ['CBC401', 'CBC402'];

/** Valid message type indicators */
const VALID_MESSAGE_TYPE_INDICS = ['CBC701', 'CBC702'];

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates MessageSpec element
 */
export class MessageSpecValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'oecd-message-spec',
    name: 'MessageSpec Validator',
    description: 'Validates MessageSpec element according to OECD CbC Schema rules',
    category: ValidationCategory.BUSINESS_RULES,
    order: 10,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const messageSpec = this.getMessageSpec(ctx);

    // MSG-001: MessageRefId required and not empty
    if (this.isEmpty(messageSpec.messageRefId)) {
      results.push(
        this.critical(
          'MSG-001',
          'MessageRefId is required and cannot be empty',
          this.xpathMessageSpec('MessageRefId')
        )
      );
    } else {
      // MSG-002: Should start with country code
      const startsWithCountry = /^[A-Z]{2}/.test(messageSpec.messageRefId);
      if (!startsWithCountry) {
        results.push(
          this.warning(
            'MSG-002',
            'MessageRefId should start with the sending jurisdiction country code',
            this.xpathMessageSpec('MessageRefId')
          )
        );
      } else {
        // Check if it starts with the correct country code
        const countryPrefix = messageSpec.messageRefId.substring(0, 2);
        if (countryPrefix !== messageSpec.sendingCompetentAuthority) {
          results.push(
            this.result('MSG-002')
              .warning()
              .message(
                `MessageRefId starts with ${countryPrefix} but SendingCompetentAuthority is ${messageSpec.sendingCompetentAuthority}`
              )
              .xpath(this.xpathMessageSpec('MessageRefId'))
              .details({
                messageRefIdPrefix: countryPrefix,
                sendingAuthority: messageSpec.sendingCompetentAuthority,
              })
              .build()
          );
        }
      }

      // MSG-003: Should contain reporting year
      const yearMatch = messageSpec.messageRefId.match(/20\d{2}/);
      const reportingYear = messageSpec.reportingPeriod?.substring(0, 4);
      if (!yearMatch) {
        results.push(
          this.info(
            'MSG-003',
            'MessageRefId should contain the reporting year for easier identification',
            this.xpathMessageSpec('MessageRefId')
          )
        );
      } else if (reportingYear && yearMatch[0] !== reportingYear) {
        results.push(
          this.result('MSG-003')
            .warning()
            .message(
              `MessageRefId contains year ${yearMatch[0]} but reporting period is ${reportingYear}`
            )
            .xpath(this.xpathMessageSpec('MessageRefId'))
            .build()
        );
      }

      // MSG-004: Max length check
      if (messageSpec.messageRefId.length > MAX_MESSAGE_REF_ID_LENGTH) {
        results.push(
          this.result('MSG-004')
            .error()
            .message(
              `MessageRefId exceeds maximum length of ${MAX_MESSAGE_REF_ID_LENGTH} characters (${messageSpec.messageRefId.length} found)`
            )
            .xpath(this.xpathMessageSpec('MessageRefId'))
            .details({ length: messageSpec.messageRefId.length, maxLength: MAX_MESSAGE_REF_ID_LENGTH })
            .build()
        );
      }

      // MSG-006: Valid characters only
      if (!MESSAGE_REF_ID_PATTERN.test(messageSpec.messageRefId)) {
        results.push(
          this.result('MSG-006')
            .error()
            .message(
              'MessageRefId contains invalid characters. Only alphanumeric, hyphen, underscore, and dot are allowed'
            )
            .xpath(this.xpathMessageSpec('MessageRefId'))
            .build()
        );
      }

      // Register MessageRefId for uniqueness tracking
      ctx.registerMessageRefId(messageSpec.messageRefId);
    }

    // MessageType validation
    if (!VALID_MESSAGE_TYPES.includes(messageSpec.messageType)) {
      results.push(
        this.result('MSG-003')
          .critical()
          .schemaCompliance()
          .message(
            `Invalid MessageType: ${messageSpec.messageType}. Must be CBC401 or CBC402`
          )
          .xpath(this.xpathMessageSpec('MessageType'))
          .values(messageSpec.messageType, 'CBC401 or CBC402')
          .build()
      );
    }

    // MessageTypeIndic validation
    if (!VALID_MESSAGE_TYPE_INDICS.includes(messageSpec.messageTypeIndic)) {
      results.push(
        this.result('MSG-004')
          .critical()
          .schemaCompliance()
          .message(
            `Invalid MessageTypeIndic: ${messageSpec.messageTypeIndic}. Must be CBC701 or CBC702`
          )
          .xpath(this.xpathMessageSpec('MessageTypeIndic'))
          .values(messageSpec.messageTypeIndic, 'CBC701 or CBC702')
          .build()
      );
    }

    // CorrMessageRefId required for corrections
    if (messageSpec.messageTypeIndic === 'CBC702') {
      if (this.isEmpty(messageSpec.corrMessageRefId)) {
        results.push(
          this.result('MSG-006')
            .critical()
            .businessRules()
            .message(
              'CorrMessageRefId is required when MessageTypeIndic is CBC702 (correction)'
            )
            .xpath(this.xpathMessageSpec('CorrMessageRefId'))
            .build()
        );
      }
    } else if (messageSpec.corrMessageRefId) {
      // CorrMessageRefId should not be present for new messages
      results.push(
        this.result('MSG-006')
          .error()
          .businessRules()
          .message(
            'CorrMessageRefId should not be present when MessageTypeIndic is CBC701 (new)'
          )
          .xpath(this.xpathMessageSpec('CorrMessageRefId'))
          .build()
      );
    }

    // ReportingPeriod format validation
    if (this.isEmpty(messageSpec.reportingPeriod)) {
      results.push(
        this.critical(
          'MSG-005',
          'ReportingPeriod is required',
          this.xpathMessageSpec('ReportingPeriod')
        )
      );
    } else if (!DATE_PATTERN.test(messageSpec.reportingPeriod)) {
      results.push(
        this.result('MSG-005')
          .error()
          .schemaCompliance()
          .message(
            `Invalid ReportingPeriod format: ${messageSpec.reportingPeriod}. Expected YYYY-MM-DD`
          )
          .xpath(this.xpathMessageSpec('ReportingPeriod'))
          .values(messageSpec.reportingPeriod, 'YYYY-MM-DD')
          .build()
      );
    } else {
      // Check if date is valid
      const date = new Date(messageSpec.reportingPeriod);
      if (isNaN(date.getTime())) {
        results.push(
          this.error(
            'MSG-005',
            `ReportingPeriod is not a valid date: ${messageSpec.reportingPeriod}`,
            this.xpathMessageSpec('ReportingPeriod')
          )
        );
      } else if (this.isFutureDate(messageSpec.reportingPeriod)) {
        results.push(
          this.warning(
            'APP-007',
            'ReportingPeriod is in the future',
            this.xpathMessageSpec('ReportingPeriod')
          )
        );
      }
    }

    // Timestamp format validation
    if (!this.isEmpty(messageSpec.timestamp)) {
      const isValidTimestamp = TIMESTAMP_PATTERNS.some((p) => p.test(messageSpec.timestamp));
      if (!isValidTimestamp) {
        results.push(
          this.result('MSG-007')
            .error()
            .schemaCompliance()
            .message(
              `Invalid Timestamp format: ${messageSpec.timestamp}. Expected ISO 8601 format`
            )
            .xpath(this.xpathMessageSpec('Timestamp'))
            .build()
        );
      }
    }

    // SendingCompetentAuthority validation
    if (this.isEmpty(messageSpec.sendingCompetentAuthority)) {
      results.push(
        this.critical(
          'MSG-008',
          'SendingCompetentAuthority is required',
          this.xpathMessageSpec('SendingCompetentAuthority')
        )
      );
    } else if (!isValidCountryCode(messageSpec.sendingCompetentAuthority)) {
      results.push(
        this.result('MSG-008')
          .critical()
          .schemaCompliance()
          .message(
            `Invalid SendingCompetentAuthority: ${messageSpec.sendingCompetentAuthority}. Must be a valid ISO 3166-1 Alpha-2 country code`
          )
          .xpath(this.xpathMessageSpec('SendingCompetentAuthority'))
          .build()
      );
    }

    // ReceivingCompetentAuthority validation
    if (this.isEmpty(messageSpec.receivingCompetentAuthority)) {
      results.push(
        this.critical(
          'MSG-009',
          'ReceivingCompetentAuthority is required',
          this.xpathMessageSpec('ReceivingCompetentAuthority')
        )
      );
    } else if (!isValidCountryCode(messageSpec.receivingCompetentAuthority)) {
      results.push(
        this.result('MSG-009')
          .critical()
          .schemaCompliance()
          .message(
            `Invalid ReceivingCompetentAuthority: ${messageSpec.receivingCompetentAuthority}. Must be a valid ISO 3166-1 Alpha-2 country code`
          )
          .xpath(this.xpathMessageSpec('ReceivingCompetentAuthority'))
          .build()
      );
    }

    // For CBC401, sending and receiving should typically be the same
    if (
      messageSpec.messageType === 'CBC401' &&
      messageSpec.sendingCompetentAuthority !== messageSpec.receivingCompetentAuthority
    ) {
      results.push(
        this.result('MSG-010')
          .warning()
          .businessRules()
          .message(
            'For CBC401 (primary filing), SendingCompetentAuthority and ReceivingCompetentAuthority are typically the same'
          )
          .xpath(this.xpathMessageSpec())
          .details({
            sending: messageSpec.sendingCompetentAuthority,
            receiving: messageSpec.receivingCompetentAuthority,
          })
          .build()
      );
    }

    // Language validation (if present)
    if (messageSpec.language && !/^[a-z]{2}$/i.test(messageSpec.language)) {
      results.push(
        this.result('MSG-010')
          .warning()
          .schemaCompliance()
          .message(
            `Invalid Language code: ${messageSpec.language}. Expected ISO 639-1 two-letter code`
          )
          .xpath(this.xpathMessageSpec('Language'))
          .build()
      );
    }

    return results;
  }
}

