/**
 * Luxembourg Deadline Validator
 *
 * Validates CbC report filing deadlines according to Luxembourg law.
 *
 * Key deadlines:
 * - Notification deadline: Last day of the fiscal year
 * - Filing deadline: 12 months after the end of the fiscal year
 *
 * @module lib/validators/countries/luxembourg/deadline-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import { BaseValidator, ValidatorMetadata } from '../../core/base-validator';
import { ValidationContext } from '../../core/validation-context';
import {
  parse,
  isValid,
  addMonths,
  addDays,
  differenceInDays,
  format,
  isBefore,
  isAfter,
  endOfMonth,
  startOfDay,
} from 'date-fns';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Luxembourg filing deadlines
 */
const LU_DEADLINES = {
  /** Filing deadline: months after fiscal year end */
  FILING_MONTHS_AFTER_FY: 12,

  /** Warning threshold: days before deadline to show warning */
  WARNING_DAYS_BEFORE: 30,

  /** Urgent warning threshold: days before deadline */
  URGENT_WARNING_DAYS: 7,

  /** Grace period in days (if any, typically 0) */
  GRACE_PERIOD_DAYS: 0,
};

/**
 * Authority information
 */
const LU_AUTHORITY = {
  name: 'Administration des Contributions Directes (ACD)',
  code: 'LU',
  website: 'https://impotsdirects.public.lu',
};

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates Luxembourg CbC filing deadlines
 */
export class LuxembourgDeadlineValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'lu-deadline',
    name: 'Luxembourg Deadline Validator',
    description: 'Validates filing deadlines per Luxembourg law',
    category: ValidationCategory.COUNTRY_RULES,
    order: 210,
    applicableCountries: ['LU'],
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Get reporting period
    const reportingPeriod = ctx.getReportingPeriod();
    if (!reportingPeriod) {
      return results; // Cannot validate without reporting period
    }

    // Parse the fiscal year end date
    const fyEndDate = parse(reportingPeriod, 'yyyy-MM-dd', new Date());
    if (!isValid(fyEndDate)) {
      return results; // Invalid date handled elsewhere
    }

    // Calculate deadlines
    const deadlines = this.calculateDeadlines(fyEndDate);
    const today = startOfDay(new Date());

    // Validate notification deadline
    results.push(...this.validateNotificationDeadline(
      deadlines.notification,
      today,
      reportingPeriod
    ));

    // Validate filing deadline
    results.push(...this.validateFilingDeadline(
      deadlines.filing,
      today,
      reportingPeriod
    ));

    // Add deadline information
    results.push(...this.addDeadlineInfo(deadlines, reportingPeriod));

    return results;
  }

  /**
   * Calculate all relevant deadlines
   */
  private calculateDeadlines(fyEndDate: Date): {
    notification: Date;
    filing: Date;
    filingWithGrace: Date;
  } {
    // Notification deadline: last day of fiscal year
    const notification = fyEndDate;

    // Filing deadline: 12 months after fiscal year end
    const filing = addMonths(fyEndDate, LU_DEADLINES.FILING_MONTHS_AFTER_FY);

    // Filing with grace period
    const filingWithGrace = addDays(filing, LU_DEADLINES.GRACE_PERIOD_DAYS);

    return {
      notification,
      filing,
      filingWithGrace,
    };
  }

  /**
   * Validate notification deadline
   */
  private validateNotificationDeadline(
    notificationDeadline: Date,
    today: Date,
    reportingPeriod: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const daysUntil = differenceInDays(notificationDeadline, today);

    if (daysUntil < 0) {
      // Past notification deadline - this is just informational
      // since we're filing, notification should have been done
      results.push(
        this.result('LU-DL-001')
          .info()
          .message(
            `Notification deadline for FY ${reportingPeriod} was ${format(notificationDeadline, 'dd/MM/yyyy')} ` +
            `(${Math.abs(daysUntil)} days ago)`
          )
          .details({
            deadline: format(notificationDeadline, 'yyyy-MM-dd'),
            daysPast: Math.abs(daysUntil),
          })
          .suggestion('Ensure CbC notification was submitted to ACD before the notification deadline')
          .build()
      );
    } else if (daysUntil <= LU_DEADLINES.URGENT_WARNING_DAYS) {
      results.push(
        this.result('LU-DL-001')
          .warning()
          .message(
            `Notification deadline approaching: ${format(notificationDeadline, 'dd/MM/yyyy')} ` +
            `(${daysUntil} days remaining)`
          )
          .suggestion('Submit CbC notification to ACD before the deadline')
          .build()
      );
    }

    return results;
  }

  /**
   * Validate filing deadline
   */
  private validateFilingDeadline(
    filingDeadline: Date,
    today: Date,
    reportingPeriod: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const daysUntil = differenceInDays(filingDeadline, today);

    if (daysUntil < 0) {
      // Past filing deadline
      const daysPast = Math.abs(daysUntil);

      if (daysPast <= LU_DEADLINES.GRACE_PERIOD_DAYS) {
        // Within grace period (if any)
        results.push(
          this.result('LU-DL-002')
            .warning()
            .message(
              `Filing deadline was ${format(filingDeadline, 'dd/MM/yyyy')} - within grace period`
            )
            .details({
              deadline: format(filingDeadline, 'yyyy-MM-dd'),
              daysPast,
            })
            .suggestion('Submit the CbC report immediately to avoid penalties')
            .build()
        );
      } else {
        // Past deadline and grace period
        results.push(
          this.result('LU-DL-002')
            .error()
            .message(
              `Filing deadline for FY ${reportingPeriod} has passed: ${format(filingDeadline, 'dd/MM/yyyy')} ` +
              `(${daysPast} days ago)`
            )
            .details({
              deadline: format(filingDeadline, 'yyyy-MM-dd'),
              daysPast,
              authority: LU_AUTHORITY.name,
            })
            .suggestion(
              'Late filing may result in penalties. Contact ACD regarding late submission procedures.'
            )
            .build()
        );
      }
    } else if (daysUntil <= LU_DEADLINES.URGENT_WARNING_DAYS) {
      // Urgent: very close to deadline
      results.push(
        this.result('LU-DL-002')
          .warning()
          .message(
            `URGENT: Filing deadline in ${daysUntil} days (${format(filingDeadline, 'dd/MM/yyyy')})`
          )
          .details({
            deadline: format(filingDeadline, 'yyyy-MM-dd'),
            daysRemaining: daysUntil,
          })
          .suggestion('Complete validation and submit the CbC report immediately')
          .build()
      );
    } else if (daysUntil <= LU_DEADLINES.WARNING_DAYS_BEFORE) {
      // Warning: approaching deadline
      results.push(
        this.result('LU-DL-002')
          .info()
          .message(
            `Filing deadline approaching: ${format(filingDeadline, 'dd/MM/yyyy')} ` +
            `(${daysUntil} days remaining)`
          )
          .details({
            deadline: format(filingDeadline, 'yyyy-MM-dd'),
            daysRemaining: daysUntil,
          })
          .build()
      );
    }

    return results;
  }

  /**
   * Add informational deadline details
   */
  private addDeadlineInfo(
    deadlines: { notification: Date; filing: Date },
    reportingPeriod: string
  ): ValidationResult[] {
    return [
      this.result('LU-DL-INFO')
        .info()
        .message(
          `Luxembourg deadlines for FY ending ${reportingPeriod}: ` +
          `Notification by ${format(deadlines.notification, 'dd/MM/yyyy')}, ` +
          `Filing by ${format(deadlines.filing, 'dd/MM/yyyy')}`
        )
        .details({
          fiscalYearEnd: reportingPeriod,
          notificationDeadline: format(deadlines.notification, 'yyyy-MM-dd'),
          filingDeadline: format(deadlines.filing, 'yyyy-MM-dd'),
          authority: LU_AUTHORITY.name,
          authorityCode: LU_AUTHORITY.code,
        })
        .build(),
    ];
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate Luxembourg filing deadline for a given fiscal year
 */
export function calculateLuFilingDeadline(fyEndDate: Date): Date {
  return addMonths(fyEndDate, LU_DEADLINES.FILING_MONTHS_AFTER_FY);
}

/**
 * Check if a date is past the Luxembourg filing deadline
 */
export function isPastLuDeadline(fyEndDate: Date, checkDate: Date = new Date()): boolean {
  const deadline = calculateLuFilingDeadline(fyEndDate);
  return isAfter(checkDate, deadline);
}

/**
 * Get days until Luxembourg filing deadline
 */
export function getDaysUntilLuDeadline(fyEndDate: Date, fromDate: Date = new Date()): number {
  const deadline = calculateLuFilingDeadline(fyEndDate);
  return differenceInDays(deadline, fromDate);
}

