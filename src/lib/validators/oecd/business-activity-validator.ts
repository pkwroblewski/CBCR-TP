/**
 * Business Activity Validator
 *
 * Validates Business Activity codes (CBC501-CBC513) according to
 * OECD CbC XML Schema v2.0 Table 2 requirements.
 *
 * @module lib/validators/oecd/business-activity-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { BizActivityCode } from '@/types/cbcr';
import { BUSINESS_ACTIVITY_DESCRIPTIONS, isBizActivityCode } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';

// =============================================================================
// CONSTANTS
// =============================================================================

/** All valid business activity codes */
const VALID_BIZ_ACTIVITY_CODES: BizActivityCode[] = [
  'CBC501', 'CBC502', 'CBC503', 'CBC504', 'CBC505',
  'CBC506', 'CBC507', 'CBC508', 'CBC509', 'CBC510',
  'CBC511', 'CBC512', 'CBC513',
];

/** CBC513 (Other) code that requires explanation */
const OTHER_ACTIVITY_CODE: BizActivityCode = 'CBC513';

/** CBC512 (Dormant) code */
const DORMANT_ACTIVITY_CODE: BizActivityCode = 'CBC512';

/** Activities typically inconsistent with dormant status */
const ACTIVE_BUSINESS_CODES: BizActivityCode[] = [
  'CBC501', // R&D
  'CBC504', // Manufacturing
  'CBC505', // Sales/Distribution
  'CBC507', // Services to unrelated
  'CBC509', // Regulated Financial
  'CBC510', // Insurance
];

/** Holding-related activities */
const HOLDING_ACTIVITIES: BizActivityCode[] = ['CBC502', 'CBC511'];

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates Business Activity codes
 */
export class BusinessActivityValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'oecd-business-activity',
    name: 'Business Activity Validator',
    description: 'Validates Business Activity codes (CBC501-CBC513) for Table 2',
    category: ValidationCategory.SCHEMA_COMPLIANCE,
    order: 40,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate each CbcReport's ConstEntities
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const constEntities = report.constEntities;
      const jurisdiction = report.resCountryCode;
      const basePath = this.xpathCbcReport(reportIndex, 'ConstEntities');
      
      const activities = constEntities.bizActivities ?? [];
      const entities = constEntities.constituentEntity;

      // BIZ-001: At least one business activity should be specified
      if (activities.length === 0 && entities.length > 0) {
        results.push(
          this.result('BIZ-001')
            .warning()
            .message(
              `No business activities specified for ${entities.length} entities in ${jurisdiction}`
            )
            .xpath(`${basePath}/BizActivities`)
            .suggestion('Specify at least one business activity code (CBC501-CBC513)')
            .build()
        );
      }

      // BIZ-002: Validate each activity code
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const activityPath = `${basePath}/BizActivities/BizActivity[${i}]`;

        if (!isBizActivityCode(activity)) {
          results.push(
            this.result('BIZ-002')
              .error()
              .message(
                `Invalid business activity code: ${activity}. Must be CBC501-CBC513`
              )
              .xpath(activityPath)
              .values(activity, 'CBC501-CBC513')
              .build()
          );
        }
      }

      // Check for duplicate activities
      const activitySet = new Set<string>();
      for (const activity of activities) {
        if (activitySet.has(activity)) {
          results.push(
            this.result('BIZ-002')
              .info()
              .message(
                `Duplicate business activity code: ${activity} in ${jurisdiction}`
              )
              .xpath(`${basePath}/BizActivities`)
              .build()
          );
        }
        activitySet.add(activity);
      }

      // BIZ-004: CBC513 (Other) requires explanation
      if (activities.includes(OTHER_ACTIVITY_CODE)) {
        // Check if any entity has OtherEntityInfo
        const hasExplanation = entities.some(
          (e) => e.otherEntityInfo && e.otherEntityInfo.trim().length > 0
        );

        if (!hasExplanation) {
          results.push(
            this.result('BIZ-004')
              .info()
              .message(
                `Business activity CBC513 (Other) selected for ${jurisdiction} - consider adding explanation`
              )
              .xpath(`${basePath}/BizActivities`)
              .suggestion(
                'When using CBC513 (Other), provide explanation in OtherEntityInfo or AdditionalInfo'
              )
              .build()
          );
        }
      }

      // BIZ-003: Dormant entity consistency
      if (activities.includes(DORMANT_ACTIVITY_CODE)) {
        const summary = report.summary;

        // Check if there's significant activity for a "dormant" entity
        const hasSignificantActivity =
          summary.totalRevenues.value > 0 ||
          Math.abs(summary.profitOrLoss.value) > 0 ||
          summary.numberOfEmployees > 0;

        if (hasSignificantActivity) {
          results.push(
            this.result('BIZ-003')
              .warning()
              .message(
                `${jurisdiction} marked as Dormant (CBC512) but has financial activity: ` +
                `Revenue: ${this.formatCurrency(summary.totalRevenues.value)}, ` +
                `P&L: ${this.formatCurrency(summary.profitOrLoss.value)}, ` +
                `Employees: ${summary.numberOfEmployees}`
              )
              .xpath(`${basePath}/BizActivities`)
              .suggestion('Verify dormant status is correct for entities with activity')
              .build()
          );
        }

        // Check for inconsistent activity combinations
        const conflictingActivities = activities.filter((a) =>
          ACTIVE_BUSINESS_CODES.includes(a as BizActivityCode)
        );

        if (conflictingActivities.length > 0) {
          results.push(
            this.result('BIZ-003')
              .warning()
              .message(
                `${jurisdiction}: Dormant (CBC512) combined with active business activities: ${conflictingActivities.join(', ')}`
              )
              .xpath(`${basePath}/BizActivities`)
              .build()
          );
        }
      }

      // Check for holding-only jurisdiction with significant operations
      const isHoldingOnly =
        activities.length > 0 &&
        activities.every((a) => HOLDING_ACTIVITIES.includes(a as BizActivityCode));

      if (isHoldingOnly) {
        const summary = report.summary;
        if (summary.numberOfEmployees > 10 || summary.totalRevenues.value > 10_000_000) {
          results.push(
            this.result('BIZ-004')
              .info()
              .message(
                `${jurisdiction}: Only holding activities but significant operations ` +
                `(${summary.numberOfEmployees} employees, ${this.formatCurrency(summary.totalRevenues.value)} revenue)`
              )
              .xpath(`${basePath}/BizActivities`)
              .suggestion('Consider if additional activity codes apply')
              .build()
          );
        }
      }

      // Validate individual entities have appropriate activities
      results.push(...this.validateEntityActivities(entities, activities, jurisdiction, basePath, reportIndex));
    }

    return results;
  }

  /**
   * Validate entity-level activity consistency
   */
  private validateEntityActivities(
    entities: typeof this.getReportingEntity extends (ctx: ValidationContext) => infer R 
      ? R extends { tin?: infer T } ? { name: { value: string }[]; otherEntityInfo?: string }[] : never 
      : never,
    activities: BizActivityCode[],
    jurisdiction: string,
    basePath: string,
    reportIndex: number
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check for entities without explanation when using CBC513
    if (activities.includes(OTHER_ACTIVITY_CODE)) {
      const entitiesWithoutExplanation = entities.filter(
        (e) => !e.otherEntityInfo || e.otherEntityInfo.trim().length === 0
      );

      if (entitiesWithoutExplanation.length > 0 && entitiesWithoutExplanation.length === entities.length) {
        // Already reported at jurisdiction level
      } else if (entitiesWithoutExplanation.length > 0) {
        results.push(
          this.result('BIZ-004')
            .info()
            .message(
              `${jurisdiction}: ${entitiesWithoutExplanation.length} of ${entities.length} entities ` +
              `lack OtherEntityInfo explanation for CBC513 activity`
            )
            .xpath(basePath)
            .build()
        );
      }
    }

    return results;
  }
}

