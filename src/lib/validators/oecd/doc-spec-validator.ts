/**
 * DocSpec Validator
 *
 * Validates DocSpec elements according to OECD CbC XML Schema v2.0
 * including DocRefId uniqueness, DocTypeIndic rules, and correction logic.
 *
 * @module lib/validators/oecd/doc-spec-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { DocSpec, DocTypeIndic } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';
import { DocRefIdService } from '@/lib/services/docrefid-service';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum length for DocRefId */
const MAX_DOC_REF_ID_LENGTH = 200;

/** Valid characters for DocRefId */
const DOC_REF_ID_PATTERN = /^[A-Za-z0-9\-_.]+$/;

/** Production DocTypeIndic values */
const PRODUCTION_DOC_TYPES: DocTypeIndic[] = ['OECD0', 'OECD1', 'OECD2', 'OECD3'];

/** Test DocTypeIndic values */
const TEST_DOC_TYPES: DocTypeIndic[] = ['OECD10', 'OECD11', 'OECD12', 'OECD13'];

/** New data indicators */
const NEW_DATA_INDICATORS: DocTypeIndic[] = ['OECD1', 'OECD11'];

/** Correction indicators */
const CORRECTION_INDICATORS: DocTypeIndic[] = ['OECD2', 'OECD12'];

/** Deletion indicators */
const DELETION_INDICATORS: DocTypeIndic[] = ['OECD3', 'OECD13'];

/** Resend indicators */
const RESEND_INDICATORS: DocTypeIndic[] = ['OECD0', 'OECD10'];

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates DocSpec elements
 */
export class DocSpecValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'oecd-doc-spec',
    name: 'DocSpec Validator',
    description: 'Validates DocSpec elements including DocRefId uniqueness and DocTypeIndic rules',
    category: ValidationCategory.BUSINESS_RULES,
    order: 20,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const messageTypeIndic = ctx.getMessageTypeIndic();
    const isCorrection = ctx.isCorrection();
    const isTest = ctx.isTestSubmission();

    // Track DocTypeIndic values to check for mixing
    const docTypeIndicCounts: Record<string, number> = {};
    let hasOecd2 = false;
    let hasOecd3 = false;

    // Validate ReportingEntity DocSpec
    const reportingEntity = this.getReportingEntity(ctx);
    const reDocSpec = reportingEntity.docSpec;
    results.push(
      ...this.validateDocSpec(
        reDocSpec,
        this.xpathReportingEntity('DocSpec'),
        ctx,
        'ReportingEntity'
      )
    );
    this.trackDocTypeIndic(reDocSpec.docTypeIndic, docTypeIndicCounts);
    if (CORRECTION_INDICATORS.includes(reDocSpec.docTypeIndic)) hasOecd2 = true;
    if (DELETION_INDICATORS.includes(reDocSpec.docTypeIndic)) hasOecd3 = true;

    // Validate CbcReports DocSpecs
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const docSpec = report.docSpec;
      const xpath = this.xpathCbcReport(reportIndex, 'DocSpec');

      results.push(
        ...this.validateDocSpec(docSpec, xpath, ctx, `CbcReports[${reportIndex}]`)
      );

      this.trackDocTypeIndic(docSpec.docTypeIndic, docTypeIndicCounts);
      if (CORRECTION_INDICATORS.includes(docSpec.docTypeIndic)) hasOecd2 = true;
      if (DELETION_INDICATORS.includes(docSpec.docTypeIndic)) hasOecd3 = true;
    }

    // Validate AdditionalInfo DocSpecs
    const additionalInfos = this.getAdditionalInfo(ctx);
    for (let i = 0; i < additionalInfos.length; i++) {
      const docSpec = additionalInfos[i].docSpec;
      const xpath = this.xpathAdditionalInfo(i, 'DocSpec');

      results.push(
        ...this.validateDocSpec(docSpec, xpath, ctx, `AdditionalInfo[${i}]`)
      );

      this.trackDocTypeIndic(docSpec.docTypeIndic, docTypeIndicCounts);
      if (CORRECTION_INDICATORS.includes(docSpec.docTypeIndic)) hasOecd2 = true;
      if (DELETION_INDICATORS.includes(docSpec.docTypeIndic)) hasOecd3 = true;
    }

    // DOC-004: MessageTypeIndic/DocTypeIndic consistency
    results.push(...this.validateConsistency(ctx, docTypeIndicCounts, isCorrection, isTest));

    // Check for mixing OECD2 and OECD3 in same message
    if (hasOecd2 && hasOecd3) {
      results.push(
        this.result('DOC-004')
          .error()
          .businessRules()
          .message(
            'Cannot mix OECD2 (correction) and OECD3 (deletion) DocTypeIndic values in the same message'
          )
          .suggestion('Submit corrections and deletions in separate messages')
          .build()
      );
    }

    // DOC-008: Global DocRefId uniqueness check (across all previous submissions)
    // Only check if this is not a test submission and global check is enabled
    if (!isTest && ctx.options.checkGlobalDocRefIds !== false) {
      const globalResults = await this.validateGlobalUniqueness(ctx);
      results.push(...globalResults);
    }

    return results;
  }

  /**
   * Validate DocRefId uniqueness against the global registry
   * Per OECD requirements, DocRefIds must be globally unique across all submissions
   */
  private async validateGlobalUniqueness(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const docRefIds = ctx.getAllDocRefIds();

    if (docRefIds.length === 0) {
      return results;
    }

    try {
      const batchResult = await DocRefIdService.batchCheck(docRefIds);

      for (const duplicate of batchResult.duplicates) {
        // For corrections referencing the original, this is expected
        // Check if this is a correction that properly references the existing DocRefId
        const isCorrection = ctx.isCorrection();

        if (isCorrection && duplicate.existingRecord.isSuperseded) {
          // Already superseded - this might be a re-correction
          results.push(
            this.result('DOC-008')
              .warning()
              .message(
                `DocRefId ${duplicate.docRefId} was previously superseded. ` +
                `Ensure the correction chain is valid.`
              )
              .details({
                docRefId: duplicate.docRefId,
                previouslySuperseded: true,
                originalJurisdiction: duplicate.existingRecord.issuingJurisdiction,
                originalPeriod: duplicate.existingRecord.reportingPeriod,
              })
              .build()
          );
        } else if (!isCorrection) {
          // New submission with duplicate DocRefId - critical error
          results.push(
            this.result('DOC-008')
              .critical()
              .message(
                `DocRefId ${duplicate.docRefId} already exists in a previous submission. ` +
                `DocRefIds must be globally unique per OECD requirements.`
              )
              .details({
                docRefId: duplicate.docRefId,
                existingJurisdiction: duplicate.existingRecord.issuingJurisdiction,
                existingPeriod: duplicate.existingRecord.reportingPeriod,
                existingCreatedAt: duplicate.existingRecord.createdAt,
              })
              .suggestion(
                'Generate a new unique DocRefId. Recommended format: ' +
                '[CountryCode][Year][UniqueIdentifier] e.g., LU2024CBC-RPT-001'
              )
              .reference('OECD CbC XML User Guide - DocRefId uniqueness requirements')
              .build()
          );
        }
      }

      // Add summary if there are global duplicates
      if (batchResult.duplicates.length > 0 && !ctx.isCorrection()) {
        results.push(
          this.result('DOC-008')
            .info()
            .message(
              `${batchResult.duplicates.length} DocRefId(s) conflict with previous submissions. ` +
              `${batchResult.unique.length} are unique.`
            )
            .build()
        );
      }
    } catch (error) {
      // Log but don't fail validation if global check fails
      console.error('Global DocRefId check failed:', error);
      results.push(
        this.result('DOC-008')
          .info()
          .message('Global DocRefId uniqueness check could not be completed')
          .details({ reason: 'Database connectivity issue' })
          .build()
      );
    }

    return results;
  }

  /**
   * Validate a single DocSpec element
   */
  private validateDocSpec(
    docSpec: DocSpec,
    basePath: string,
    ctx: ValidationContext,
    elementName: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // DOC-001: DocRefId required
    if (this.isEmpty(docSpec.docRefId)) {
      results.push(
        this.result('DOC-001')
          .critical()
          .message(`DocRefId is required in ${elementName}`)
          .xpath(`${basePath}/DocRefId`)
          .build()
      );
      return results; // Can't validate further without DocRefId
    }

    // DOC-002: DocRefId uniqueness within file
    const isUnique = ctx.registerDocRefId(docSpec.docRefId, `${basePath}/DocRefId`);
    if (!isUnique) {
      const firstLocation = ctx.getDocRefIdLocation(docSpec.docRefId);
      results.push(
        this.result('DOC-002')
          .critical()
          .message(`Duplicate DocRefId: ${docSpec.docRefId}`)
          .xpath(`${basePath}/DocRefId`)
          .details({
            docRefId: docSpec.docRefId,
            firstOccurrence: firstLocation,
          })
          .build()
      );
    }

    // DocRefId length check
    if (docSpec.docRefId.length > MAX_DOC_REF_ID_LENGTH) {
      results.push(
        this.result('DOC-007')
          .error()
          .message(
            `DocRefId exceeds maximum length of ${MAX_DOC_REF_ID_LENGTH} characters (${docSpec.docRefId.length} found)`
          )
          .xpath(`${basePath}/DocRefId`)
          .build()
      );
    }

    // DocRefId format check
    if (!DOC_REF_ID_PATTERN.test(docSpec.docRefId)) {
      results.push(
        this.result('DOC-007')
          .error()
          .message(
            'DocRefId contains invalid characters. Only alphanumeric, hyphen, underscore, and dot are allowed'
          )
          .xpath(`${basePath}/DocRefId`)
          .build()
      );
    }

    // DOC-007: DocRefId should start with country code
    const startsWithCountry = /^[A-Z]{2}/.test(docSpec.docRefId);
    if (!startsWithCountry) {
      results.push(
        this.result('DOC-007')
          .info()
          .dataQuality()
          .message('DocRefId should start with the jurisdiction country code')
          .xpath(`${basePath}/DocRefId`)
          .build()
      );
    }

    // DOC-003: DocTypeIndic validation
    const validDocTypes = [...PRODUCTION_DOC_TYPES, ...TEST_DOC_TYPES];
    if (!validDocTypes.includes(docSpec.docTypeIndic)) {
      results.push(
        this.result('DOC-003')
          .critical()
          .message(
            `Invalid DocTypeIndic: ${docSpec.docTypeIndic}. Must be OECD0-3 or OECD10-13`
          )
          .xpath(`${basePath}/DocTypeIndic`)
          .build()
      );
    }

    // DOC-005: CorrDocRefId required for corrections/deletions
    if (
      CORRECTION_INDICATORS.includes(docSpec.docTypeIndic) ||
      DELETION_INDICATORS.includes(docSpec.docTypeIndic)
    ) {
      if (this.isEmpty(docSpec.corrDocRefId)) {
        results.push(
          this.result('DOC-005')
            .critical()
            .message(
              `CorrDocRefId is required when DocTypeIndic is ${docSpec.docTypeIndic} (correction/deletion)`
            )
            .xpath(`${basePath}/CorrDocRefId`)
            .build()
        );
      }

      // DOC-006: CorrMessageRefId required for corrections/deletions
      if (this.isEmpty(docSpec.corrMessageRefId)) {
        results.push(
          this.result('DOC-006')
            .critical()
            .message(
              `CorrMessageRefId is required when DocTypeIndic is ${docSpec.docTypeIndic} (correction/deletion)`
            )
            .xpath(`${basePath}/CorrMessageRefId`)
            .build()
        );
      }

      // CorrDocRefId should not equal DocRefId
      if (docSpec.corrDocRefId && docSpec.corrDocRefId === docSpec.docRefId) {
        results.push(
          this.result('DOC-005')
            .error()
            .message('CorrDocRefId cannot be the same as DocRefId')
            .xpath(`${basePath}/CorrDocRefId`)
            .build()
        );
      }
    } else {
      // For new data, CorrDocRefId should not be present
      if (docSpec.corrDocRefId) {
        results.push(
          this.result('DOC-005')
            .warning()
            .message(
              `CorrDocRefId should not be present when DocTypeIndic is ${docSpec.docTypeIndic} (new data)`
            )
            .xpath(`${basePath}/CorrDocRefId`)
            .build()
        );
      }

      if (docSpec.corrMessageRefId) {
        results.push(
          this.result('DOC-006')
            .warning()
            .message(
              `CorrMessageRefId should not be present when DocTypeIndic is ${docSpec.docTypeIndic} (new data)`
            )
            .xpath(`${basePath}/CorrMessageRefId`)
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Track DocTypeIndic counts for consistency checking
   */
  private trackDocTypeIndic(
    docTypeIndic: DocTypeIndic,
    counts: Record<string, number>
  ): void {
    counts[docTypeIndic] = (counts[docTypeIndic] || 0) + 1;
  }

  /**
   * Validate MessageTypeIndic/DocTypeIndic consistency
   */
  private validateConsistency(
    ctx: ValidationContext,
    docTypeIndicCounts: Record<string, number>,
    isCorrection: boolean,
    isTest: boolean
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check production vs test consistency
    const hasProduction = Object.keys(docTypeIndicCounts).some((d) =>
      PRODUCTION_DOC_TYPES.includes(d as DocTypeIndic)
    );
    const hasTest = Object.keys(docTypeIndicCounts).some((d) =>
      TEST_DOC_TYPES.includes(d as DocTypeIndic)
    );

    if (hasProduction && hasTest) {
      results.push(
        this.result('DOC-004')
          .error()
          .businessRules()
          .message('Cannot mix production (OECD0-3) and test (OECD10-13) DocTypeIndic values')
          .build()
      );
    }

    // Check MessageTypeIndic/DocTypeIndic alignment
    if (isCorrection) {
      // CBC702 should have OECD2, OECD3, OECD0, OECD12, OECD13, or OECD10
      const hasNewData = Object.keys(docTypeIndicCounts).some(
        (d) => NEW_DATA_INDICATORS.includes(d as DocTypeIndic)
      );
      if (hasNewData) {
        results.push(
          this.result('DOC-004')
            .error()
            .businessRules()
            .message(
              'MessageTypeIndic is CBC702 (correction) but DocTypeIndic contains OECD1/OECD11 (new data)'
            )
            .suggestion('For corrections, use OECD2/OECD3 or their test equivalents')
            .build()
        );
      }
    } else {
      // CBC701 should have OECD1 or OECD11
      const hasCorrectionOrDeletion = Object.keys(docTypeIndicCounts).some(
        (d) =>
          CORRECTION_INDICATORS.includes(d as DocTypeIndic) ||
          DELETION_INDICATORS.includes(d as DocTypeIndic)
      );
      if (hasCorrectionOrDeletion) {
        results.push(
          this.result('DOC-004')
            .error()
            .businessRules()
            .message(
              'MessageTypeIndic is CBC701 (new) but DocTypeIndic contains OECD2/OECD3 (correction/deletion)'
            )
            .suggestion('For new submissions, use OECD1 or OECD11')
            .build()
        );
      }
    }

    return results;
  }
}

