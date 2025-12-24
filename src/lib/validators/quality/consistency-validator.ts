/**
 * Consistency Validator
 *
 * Validates data consistency across the CbC report including currency
 * uniformity, date alignment, and identifier prefix matching.
 *
 * @module lib/validators/quality/consistency-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { CbcReport, Summary, ConstituentEntity } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';
import { parse, isValid, isBefore, isAfter, differenceInDays, format } from 'date-fns';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum fiscal year length in days */
const MAX_FISCAL_YEAR_DAYS = 400;

/** Minimum fiscal year length in days */
const MIN_FISCAL_YEAR_DAYS = 300;

/** Pattern for extracting year from MessageRefId */
const YEAR_PATTERN = /(?:20[0-9]{2}|19[0-9]{2})/;

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates data consistency across the report
 */
export class ConsistencyValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'quality-consistency',
    name: 'Consistency Validator',
    description: 'Validates currency, dates, and identifier consistency',
    category: ValidationCategory.DATA_QUALITY,
    order: 90,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Currency consistency
    results.push(...this.validateCurrencyConsistency(ctx));

    // Fiscal year alignment
    results.push(...this.validateFiscalYearAlignment(ctx));

    // Accounting period consistency
    results.push(...this.validateAccountingPeriods(ctx));

    // Identifier prefix consistency
    results.push(...this.validateIdentifierPrefixes(ctx));

    return results;
  }

  /**
   * Validate currency consistency across all jurisdictions
   */
  private validateCurrencyConsistency(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const currencies = new Map<string, string[]>();

    // Collect currencies from each jurisdiction
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const jurisdiction = report.resCountryCode;
      const summary = report.summary;

      // Check all monetary values
      const monetaryFields = [
        { field: 'totalRevenues', element: summary.totalRevenues },
        { field: 'profitOrLoss', element: summary.profitOrLoss },
        { field: 'taxPaid', element: summary.taxPaid },
        { field: 'taxAccrued', element: summary.taxAccrued },
        { field: 'capital', element: summary.capital },
        { field: 'accumulatedEarnings', element: summary.accumulatedEarnings },
        { field: 'tangibleAssets', element: summary.tangibleAssets },
      ];

      for (const { field, element } of monetaryFields) {
        if (element?.currCode) {
          const existing = currencies.get(element.currCode) ?? [];
          existing.push(`${jurisdiction}/${field}`);
          currencies.set(element.currCode, existing);
        }
      }
    }

    // Check for multiple currencies
    const currencyList = [...currencies.keys()];
    
    if (currencyList.length > 1) {
      // Multiple currencies - this is typically an error
      results.push(
        this.result('CON-001')
          .error()
          .message(
            `Multiple currencies used in report: ${currencyList.join(', ')}. ` +
            `CbC reports should use a single consistent currency.`
          )
          .details({
            currencies: Object.fromEntries(currencies),
          })
          .suggestion('Convert all amounts to a single reporting currency (typically functional currency of UPE)')
          .build()
      );

      // Detail which jurisdictions use which currency
      for (const [currency, locations] of currencies) {
        results.push(
          this.result('CON-001')
            .info()
            .message(`Currency ${currency} used in: ${locations.slice(0, 5).join(', ')}${locations.length > 5 ? ` and ${locations.length - 5} more` : ''}`)
            .build()
        );
      }
    } else if (currencyList.length === 0) {
      results.push(
        this.result('CON-001')
          .warning()
          .message('No currency codes found on monetary elements')
          .suggestion('Ensure currCode attribute is set on all monetary values')
          .build()
      );
    }

    // Check for missing currency on some fields
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const jurisdiction = report.resCountryCode;
      const basePath = this.xpathCbcReport(reportIndex);
      const summary = report.summary;

      const fieldsWithCurrency = [
        summary.totalRevenues,
        summary.profitOrLoss,
        summary.taxPaid,
        summary.taxAccrued,
        summary.capital,
        summary.accumulatedEarnings,
        summary.tangibleAssets,
      ].filter((f) => f?.currCode);

      const fieldsWithoutCurrency = [
        summary.totalRevenues,
        summary.profitOrLoss,
        summary.taxPaid,
        summary.taxAccrued,
        summary.capital,
        summary.accumulatedEarnings,
        summary.tangibleAssets,
      ].filter((f) => f && !f.currCode);

      if (fieldsWithCurrency.length > 0 && fieldsWithoutCurrency.length > 0) {
        results.push(
          this.result('CON-001')
            .warning()
            .message(`${jurisdiction}: Some monetary fields have currency codes, others do not`)
            .xpath(`${basePath}/Summary`)
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Validate fiscal year dates align with ReportingPeriod
   */
  private validateFiscalYearAlignment(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const messageSpec = this.getMessageSpec(ctx);
    const reportingPeriod = messageSpec.reportingPeriod;

    if (!reportingPeriod) {
      return results;
    }

    // Parse reporting period end date
    const rpEndDate = parse(reportingPeriod, 'yyyy-MM-dd', new Date());
    
    if (!isValid(rpEndDate)) {
      return results; // Invalid date handled elsewhere
    }

    // Check each jurisdiction's accounting periods
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const jurisdiction = report.resCountryCode;
      const basePath = this.xpathCbcReport(reportIndex);

      // Check entities for accounting period information
      const entities = report.constEntities.constituentEntity;
      
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const entityPath = `${basePath}/ConstEntities/ConstituentEntity[${i}]`;

        if (entity.acctPeriodEnd) {
          const acctEnd = parse(entity.acctPeriodEnd, 'yyyy-MM-dd', new Date());
          
          if (isValid(acctEnd)) {
            // Accounting period should align with or be before reporting period
            const daysDiff = differenceInDays(acctEnd, rpEndDate);
            
            if (daysDiff > 365) {
              results.push(
                this.result('CON-002')
                  .warning()
                  .message(
                    `${jurisdiction}: Entity "${entity.name[0]?.value}" accounting period end ` +
                    `(${entity.acctPeriodEnd}) is more than a year after reporting period (${reportingPeriod})`
                  )
                  .xpath(`${entityPath}/AcctPeriodEnd`)
                  .build()
              );
            } else if (daysDiff < -365) {
              results.push(
                this.result('CON-002')
                  .warning()
                  .message(
                    `${jurisdiction}: Entity "${entity.name[0]?.value}" accounting period end ` +
                    `(${entity.acctPeriodEnd}) is more than a year before reporting period (${reportingPeriod})`
                  )
                  .xpath(`${entityPath}/AcctPeriodEnd`)
                  .build()
              );
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Validate AcctPeriodStart is before AcctPeriodEnd
   */
  private validateAccountingPeriods(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const [entity, entityIndex, report, reportIndex] of this.iterateEntities(ctx)) {
      const jurisdiction = report.resCountryCode;
      const entityPath = this.xpathEntity(reportIndex, entityIndex);
      const entityName = entity.name[0]?.value ?? 'Unknown';

      const acctStart = entity.acctPeriodStart;
      const acctEnd = entity.acctPeriodEnd;

      // Only validate if both are present
      if (!acctStart || !acctEnd) {
        continue;
      }

      const startDate = parse(acctStart, 'yyyy-MM-dd', new Date());
      const endDate = parse(acctEnd, 'yyyy-MM-dd', new Date());

      if (!isValid(startDate) || !isValid(endDate)) {
        continue; // Invalid dates handled elsewhere
      }

      // Check start is before end
      if (!isBefore(startDate, endDate)) {
        results.push(
          this.result('CON-003')
            .error()
            .message(
              `${jurisdiction}: Entity "${entityName}" has AcctPeriodStart (${acctStart}) ` +
              `not before AcctPeriodEnd (${acctEnd})`
            )
            .xpath(`${entityPath}/AcctPeriodStart`)
            .build()
        );
        continue;
      }

      // Check period length
      const periodDays = differenceInDays(endDate, startDate);

      if (periodDays > MAX_FISCAL_YEAR_DAYS) {
        results.push(
          this.result('CON-003')
            .warning()
            .message(
              `${jurisdiction}: Entity "${entityName}" has accounting period of ${periodDays} days ` +
              `(${acctStart} to ${acctEnd}), which exceeds typical fiscal year`
            )
            .xpath(`${entityPath}/AcctPeriodEnd`)
            .suggestion('Fiscal years longer than 12 months may require explanation')
            .build()
        );
      } else if (periodDays < MIN_FISCAL_YEAR_DAYS) {
        results.push(
          this.result('CON-003')
            .info()
            .message(
              `${jurisdiction}: Entity "${entityName}" has short accounting period of ${periodDays} days ` +
              `(${acctStart} to ${acctEnd})`
            )
            .xpath(`${entityPath}/AcctPeriodStart`)
            .suggestion('Short fiscal periods may indicate new entity formation, change of fiscal year, or liquidation')
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Validate MessageRefId prefix matches DocRefId prefixes
   */
  private validateIdentifierPrefixes(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const messageSpec = this.getMessageSpec(ctx);
    const messageRefId = messageSpec.messageRefId;

    if (!messageRefId) {
      return results;
    }

    // Extract prefix (typically country code + year + entity identifier)
    // Common pattern: CC_YEAR_ENTITY_...
    const messageParts = messageRefId.split(/[_-]/);
    const messagePrefix = messageParts.slice(0, 3).join('_');

    // Check DocRefIds have consistent prefixes
    const docRefIds = ctx.getAllDocRefIds();
    const inconsistentDocs: string[] = [];

    for (const docRefId of docRefIds) {
      const docParts = docRefId.split(/[_-]/);
      const docPrefix = docParts.slice(0, 3).join('_');

      // Simple check: first 2 parts (country + year) should match
      if (docParts[0] !== messageParts[0]) {
        inconsistentDocs.push(docRefId);
      }
    }

    if (inconsistentDocs.length > 0) {
      results.push(
        this.result('CON-004')
          .info()
          .message(
            `${inconsistentDocs.length} DocRefId(s) have different prefix pattern than MessageRefId`
          )
          .details({
            messageRefId,
            sampleInconsistent: inconsistentDocs.slice(0, 3),
          })
          .suggestion('Consider using consistent identifier structure across message and document references')
          .build()
      );
    }

    // Check MessageRefId contains reporting year
    const reportingPeriod = messageSpec.reportingPeriod;
    if (reportingPeriod) {
      const reportingYear = reportingPeriod.substring(0, 4);
      const yearMatch = messageRefId.match(YEAR_PATTERN);
      
      if (yearMatch && yearMatch[0] !== reportingYear) {
        results.push(
          this.result('CON-004')
            .warning()
            .message(
              `MessageRefId contains year ${yearMatch[0]} but ReportingPeriod is ${reportingPeriod}`
            )
            .xpath(this.xpathMessageSpec() + '/MessageRefId')
            .build()
        );
      }
    }

    return results;
  }
}

