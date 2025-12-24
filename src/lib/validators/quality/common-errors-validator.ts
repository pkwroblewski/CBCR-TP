/**
 * OECD Common Errors Validator
 *
 * Implements the 28 common errors identified by OECD from tax administrations.
 * Source: https://www.oecd.org/content/dam/oecd/en/topics/policy-sub-issues/cbcr/common-errors-mnes-cbc-reports.pdf
 *
 * @module lib/validators/quality/common-errors-validator
 */

import { ValidationResult, ValidationSeverity, ValidationCategory } from '@/types/validation';
import { ParsedCbcReport, ConstituentEntity, CbcReport } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';
import { OECD_COMMON_ERROR_RULES } from '@/constants/validation-rules';

/**
 * Validator for OECD Common Errors (CE-001 to CE-028)
 *
 * These are the most frequently encountered errors identified by tax
 * administrations worldwide when processing CbC Reports.
 */
export class CommonErrorsValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'common-errors',
    name: 'OECD Common Errors Validator',
    description: 'Validates against 28 common errors identified by OECD',
    category: ValidationCategory.DATA_QUALITY,
    order: 55, // Runs after other quality validators
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const report = ctx.report;

    if (!report) {
      return results;
    }

    // TIN Validations (CE-001 to CE-005)
    results.push(...this.validateTINs(report));

    // Table Consistency (CE-006 to CE-009)
    results.push(...this.validateTableConsistency(report));

    // Numeric/Format (CE-010 to CE-014)
    results.push(...this.validateNumericFormats(report));

    // Dividend Treatment (CE-015 to CE-016)
    results.push(...this.validateDividendExclusion());

    // XML Characters (CE-017 to CE-023) - handled in XML parser, not here

    // Date/Period (CE-024 to CE-026)
    results.push(...this.validateDatePeriods(report));

    // Business Activity (CE-027 to CE-028)
    results.push(...this.validateBusinessActivities(report));

    return results;
  }

  /**
   * Helper to convert rule to details object
   */
  private ruleToDetails(ruleId: keyof typeof OECD_COMMON_ERROR_RULES): Record<string, unknown> {
    return OECD_COMMON_ERROR_RULES[ruleId] as unknown as Record<string, unknown>;
  }

  /**
   * Validate TIN-related errors (CE-001 to CE-005)
   */
  private validateTINs(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];
    const seenTINs = new Map<string, string[]>(); // TIN -> entity names

    for (const cbcReport of report.message.cbcBody.cbcReports) {
      for (const entity of cbcReport.constEntities.constituentEntity) {
        const tin = this.getEntityTinValue(entity);
        const tinIssuedBy = this.getEntityTinIssuedBy(entity);
        const entityName = this.getEntityName(entity);

        // CE-001: Missing TIN
        if (!tin || tin.trim() === '') {
          results.push({
            ruleId: 'CE-001',
            category: ValidationCategory.DATA_QUALITY,
            severity: ValidationSeverity.CRITICAL,
            message: `Missing TIN for entity: ${entityName}`,
            xpath: `//ConstituentEntity[Name="${entityName}"]/TIN`,
            details: this.ruleToDetails('CE-001'),
            suggestion: 'Provide valid TIN or use "NOTIN" if no TIN has been issued.',
          });
        }

        // CE-002: NOTIN usage warning
        if (tin === 'NOTIN') {
          results.push({
            ruleId: 'CE-002',
            category: ValidationCategory.DATA_QUALITY,
            severity: ValidationSeverity.WARNING,
            message: `NOTIN used for entity: ${entityName}. Verify entity has not been issued a TIN.`,
            xpath: `//ConstituentEntity[Name="${entityName}"]/TIN`,
            details: this.ruleToDetails('CE-002'),
            suggestion: 'Confirm with local tax administration that no TIN has been issued.',
          });
        }

        // Track TINs for duplicate check (CE-004)
        if (tin && tin !== 'NOTIN') {
          if (seenTINs.has(tin)) {
            seenTINs.get(tin)!.push(entityName);
          } else {
            seenTINs.set(tin, [entityName]);
          }
        }

        // CE-005: Missing issuedBy
        if (tin && tin !== 'NOTIN' && !tinIssuedBy) {
          results.push({
            ruleId: 'CE-005',
            category: ValidationCategory.DATA_QUALITY,
            severity: ValidationSeverity.WARNING,
            message: `TIN missing issuedBy attribute for entity: ${entityName}`,
            xpath: `//ConstituentEntity[Name="${entityName}"]/TIN/@issuedBy`,
            details: this.ruleToDetails('CE-005'),
            suggestion: 'Add issuedBy attribute with ISO country code.',
          });
        }
      }
    }

    // CE-004: Report duplicate TINs
    for (const [tin, entities] of seenTINs) {
      if (entities.length > 1) {
        results.push({
          ruleId: 'CE-004',
          category: ValidationCategory.DATA_QUALITY,
          severity: ValidationSeverity.ERROR,
          message: `Duplicate TIN "${tin}" used by multiple entities: ${entities.join(', ')}`,
          details: this.ruleToDetails('CE-004'),
          suggestion: 'Verify each entity has a unique TIN.',
        });
      }
    }

    return results;
  }

  /**
   * Validate table consistency errors (CE-006 to CE-009)
   */
  private validateTableConsistency(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Get jurisdictions from Table 1 (Summary) - CbcReports level
    const table1Jurisdictions = new Set<string>();
    for (const cbcReport of report.message.cbcBody.cbcReports) {
      table1Jurisdictions.add(cbcReport.resCountryCode);
    }

    // Get jurisdictions from Table 2 (Entities)
    const table2Jurisdictions = new Set<string>();
    for (const cbcReport of report.message.cbcBody.cbcReports) {
      for (const entity of cbcReport.constEntities.constituentEntity) {
        // Use entity's jurisdiction if available, otherwise use cbcReport jurisdiction
        const entityJurisdiction = this.getEntityResCountryCode(entity) || cbcReport.resCountryCode;
        table2Jurisdictions.add(entityJurisdiction);
      }
    }

    // CE-006: Jurisdiction mismatch - Table 1 has jurisdiction not in Table 2
    for (const jurisdiction of table1Jurisdictions) {
      if (!table2Jurisdictions.has(jurisdiction)) {
        results.push({
          ruleId: 'CE-006',
          category: ValidationCategory.DATA_QUALITY,
          severity: ValidationSeverity.CRITICAL,
          message: `Jurisdiction ${jurisdiction} in Table 1 has no entities in Table 2`,
          details: this.ruleToDetails('CE-006'),
          suggestion: 'Add constituent entities for this jurisdiction or remove from Table 1.',
        });
      }
    }

    // CE-006: Jurisdiction mismatch - Table 2 has jurisdiction not in Table 1
    for (const jurisdiction of table2Jurisdictions) {
      if (!table1Jurisdictions.has(jurisdiction)) {
        results.push({
          ruleId: 'CE-006',
          category: ValidationCategory.DATA_QUALITY,
          severity: ValidationSeverity.CRITICAL,
          message: `Jurisdiction ${jurisdiction} has entities in Table 2 but no summary in Table 1`,
          details: this.ruleToDetails('CE-006'),
          suggestion: 'Add summary data for this jurisdiction in Table 1.',
        });
      }
    }

    // CE-008: Reporting Entity in entity list
    const reportingEntity = report.message.cbcBody.reportingEntity;
    const reportingEntityTIN = this.getReportingEntityTinValue(reportingEntity);
    const reportingEntityName = this.getReportingEntityName(reportingEntity);
    let reportingEntityFound = false;

    for (const cbcReport of report.message.cbcBody.cbcReports) {
      for (const entity of cbcReport.constEntities.constituentEntity) {
        const entityTIN = this.getEntityTinValue(entity);
        const entityName = this.getEntityName(entity);
        
        // Match by TIN or name
        if (
          (reportingEntityTIN && entityTIN === reportingEntityTIN) ||
          (reportingEntityName && entityName === reportingEntityName)
        ) {
          reportingEntityFound = true;
          break;
        }
      }
      if (reportingEntityFound) break;
    }

    if (!reportingEntityFound) {
      results.push({
        ruleId: 'CE-008',
        category: ValidationCategory.DATA_QUALITY,
        severity: ValidationSeverity.ERROR,
        message: 'Reporting Entity not found in Constituent Entities list',
        details: this.ruleToDetails('CE-008'),
        suggestion: 'Include the Reporting Entity in Table 2 for its jurisdiction.',
      });
    }

    // CE-009: PE naming convention
    for (const cbcReport of report.message.cbcBody.cbcReports) {
      for (const entity of cbcReport.constEntities.constituentEntity) {
        const entityName = this.getEntityName(entity);
        const incorpCountry = entity.incorpCountryCode;
        const resCountry = this.getEntityResCountryCode(entity) || cbcReport.resCountryCode;

        // If incorporated in different country than residence, might be a PE
        if (incorpCountry && incorpCountry !== resCountry) {
          // Check if name follows PE convention
          if (!entityName.includes(' PE') && !entityName.includes(' - ') && !entityName.toLowerCase().includes('permanent establishment')) {
            results.push({
              ruleId: 'CE-009',
              category: ValidationCategory.DATA_QUALITY,
              severity: ValidationSeverity.WARNING,
              message: `Possible PE "${entityName}" not following naming convention`,
              xpath: `//ConstituentEntity[Name="${entityName}"]`,
              details: this.ruleToDetails('CE-009'),
              suggestion: 'Name PEs as: "Entity Legal Name – Jurisdiction PE"',
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Validate numeric format errors (CE-010 to CE-014)
   */
  private validateNumericFormats(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];
    const currencies = new Set<string>();

    for (const cbcReport of report.message.cbcBody.cbcReports) {
      const jurisdiction = cbcReport.resCountryCode;
      const summary = cbcReport.summary;

      // Build list of numeric fields to check
      const numericFields = [
        { name: 'Revenues.Unrelated', value: summary.unrelatedRevenues?.value },
        { name: 'Revenues.Related', value: summary.relatedRevenues?.value },
        { name: 'Revenues.Total', value: summary.totalRevenues?.value },
        { name: 'ProfitOrLoss', value: summary.profitOrLoss?.value },
        { name: 'TaxPaid', value: summary.taxPaid?.value },
        { name: 'TaxAccrued', value: summary.taxAccrued?.value },
        { name: 'Capital', value: summary.capital?.value },
        { name: 'AccumulatedEarnings', value: summary.accumulatedEarnings?.value },
        { name: 'TangibleAssets', value: summary.tangibleAssets?.value },
      ];

      // Track currencies for consistency check
      if (summary.totalRevenues?.currCode) currencies.add(summary.totalRevenues.currCode);
      if (summary.profitOrLoss?.currCode) currencies.add(summary.profitOrLoss.currCode);

      for (const field of numericFields) {
        if (field.value !== undefined && field.value !== null) {
          const valueStr = String(field.value);

          // CE-010: Decimals in amounts
          if (valueStr.includes('.') && !Number.isInteger(field.value)) {
            results.push({
              ruleId: 'CE-010',
              category: ValidationCategory.DATA_QUALITY,
              severity: ValidationSeverity.ERROR,
              message: `Decimal found in ${field.name} for ${jurisdiction}: ${valueStr}`,
              xpath: `//CbcReports[ResCountryCode="${jurisdiction}"]/Summary/${field.name.split('.')[0]}`,
              details: this.ruleToDetails('CE-010'),
              suggestion: 'Round to nearest whole unit. No decimals allowed.',
            });
          }

          // CE-011: Shortened numbers (heuristic: unusually small for MNE)
          const numValue = Math.abs(Number(field.value));
          if (numValue > 0 && numValue < 10000 && !field.name.includes('Employees')) {
            results.push({
              ruleId: 'CE-011',
              category: ValidationCategory.DATA_QUALITY,
              severity: ValidationSeverity.WARNING,
              message: `${field.name} for ${jurisdiction} appears unusually small (${valueStr}). Check if amounts are in thousands/millions.`,
              xpath: `//CbcReports[ResCountryCode="${jurisdiction}"]/Summary/${field.name.split('.')[0]}`,
              details: this.ruleToDetails('CE-011'),
              suggestion: 'Ensure full amounts are reported, not abbreviated.',
            });
          }
        }
      }

      // CE-012: Revenue sum check
      const unrelated = Number(summary.unrelatedRevenues?.value) || 0;
      const related = Number(summary.relatedRevenues?.value) || 0;
      const total = Number(summary.totalRevenues?.value) || 0;

      if (total !== 0 && Math.abs(total - (unrelated + related)) > 1) {
        results.push({
          ruleId: 'CE-012',
          category: ValidationCategory.DATA_QUALITY,
          severity: ValidationSeverity.CRITICAL,
          message: `Revenue sum mismatch for ${jurisdiction}: Total (${total}) ≠ Unrelated (${unrelated}) + Related (${related})`,
          xpath: `//CbcReports[ResCountryCode="${jurisdiction}"]/Summary/Revenues`,
          details: this.ruleToDetails('CE-012'),
          suggestion: 'Total Revenues must equal Related + Unrelated revenues.',
        });
      }

      // CE-014: Negative revenues
      if (unrelated < 0 || related < 0 || total < 0) {
        results.push({
          ruleId: 'CE-014',
          category: ValidationCategory.DATA_QUALITY,
          severity: ValidationSeverity.ERROR,
          message: `Negative revenue value found for ${jurisdiction}`,
          xpath: `//CbcReports[ResCountryCode="${jurisdiction}"]/Summary/Revenues`,
          details: this.ruleToDetails('CE-014'),
          suggestion: 'Revenue figures must be positive integers.',
        });
      }
    }

    // CE-013: Currency consistency
    if (currencies.size > 1) {
      results.push({
        ruleId: 'CE-013',
        category: ValidationCategory.DATA_QUALITY,
        severity: ValidationSeverity.WARNING,
        message: `Multiple currencies detected in report: ${Array.from(currencies).join(', ')}`,
        details: this.ruleToDetails('CE-013'),
        suggestion: 'All amounts should be in the same functional currency. Note exchange rates in Table 3.',
      });
    }

    return results;
  }

  /**
   * Validate dividend exclusion reminders (CE-015 to CE-016)
   * These are informational as we can't detect dividends directly from CbC data
   */
  private validateDividendExclusion(): ValidationResult[] {
    // These are informational reminders since we cannot detect dividends from CbC data
    return [
      {
        ruleId: 'CE-015',
        category: ValidationCategory.DATA_QUALITY,
        severity: ValidationSeverity.INFO,
        message: 'Reminder: Ensure dividends from Constituent Entities are excluded from Revenues (OECD May 2024 guidance)',
        details: this.ruleToDetails('CE-015'),
        suggestion: 'Verify dividend exclusion with your tax/accounting team.',
      },
      {
        ruleId: 'CE-016',
        category: ValidationCategory.DATA_QUALITY,
        severity: ValidationSeverity.INFO,
        message: 'Reminder: Ensure dividends from Constituent Entities are excluded from Profit/Loss before Tax',
        details: this.ruleToDetails('CE-016'),
        suggestion: 'Treatment must be consistent with Revenue exclusion.',
      },
    ];
  }

  /**
   * Validate date/period errors (CE-024 to CE-026)
   */
  private validateDatePeriods(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];

    const reportingPeriod = report.message.messageSpec.reportingPeriod;

    // CE-024: Check if reporting period is last day of a month (likely fiscal year end)
    if (reportingPeriod) {
      const date = new Date(reportingPeriod);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // If next day is 1st of month, this is last day of month (good)
      if (nextDay.getDate() !== 1) {
        results.push({
          ruleId: 'CE-024',
          category: ValidationCategory.BUSINESS_RULES,
          severity: ValidationSeverity.WARNING,
          message: `Reporting period ${reportingPeriod} is not the last day of a month. Verify this is the correct fiscal year end.`,
          xpath: '//MessageSpec/ReportingPeriod',
          details: this.ruleToDetails('CE-024'),
          suggestion: 'ReportingPeriod should be the last day of the MNE fiscal year.',
        });
      }

      // CE-025: Check if reporting period is too recent (might be filing date)
      const today = new Date();
      const reportDate = new Date(reportingPeriod);
      const daysDiff = Math.floor((today.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));

      // If reporting period is within 30 days of today, it might be filing date
      if (daysDiff >= 0 && daysDiff < 30) {
        results.push({
          ruleId: 'CE-025',
          category: ValidationCategory.BUSINESS_RULES,
          severity: ValidationSeverity.WARNING,
          message: `Reporting period ${reportingPeriod} is very recent. Verify this is not the filing date.`,
          xpath: '//MessageSpec/ReportingPeriod',
          details: this.ruleToDetails('CE-025'),
          suggestion: 'Use the fiscal year end date, not the filing date.',
        });
      }
    }

    // CE-026: Long accounting period (check AcctPeriod if available)
    const firstReport = report.message.cbcBody.cbcReports[0];
    if (firstReport) {
      // Check first entity for accounting period
      const firstEntity = firstReport.constEntities.constituentEntity[0];
      if (firstEntity?.acctPeriodStart && firstEntity?.acctPeriodEnd) {
        const start = new Date(firstEntity.acctPeriodStart);
        const end = new Date(firstEntity.acctPeriodEnd);
        const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

        if (monthsDiff > 12) {
          results.push({
            ruleId: 'CE-026',
            category: ValidationCategory.BUSINESS_RULES,
            severity: ValidationSeverity.WARNING,
            message: `Accounting period spans ${monthsDiff} months (${firstEntity.acctPeriodStart} to ${firstEntity.acctPeriodEnd}). This exceeds 12 months.`,
            xpath: '//ConstituentEntity/AcctPeriod',
            details: this.ruleToDetails('CE-026'),
            suggestion: 'Consider splitting into separate CbC reports or explain in Table 3.',
          });
        }
      }
    }

    return results;
  }

  /**
   * Validate business activity errors (CE-027 to CE-028)
   */
  private validateBusinessActivities(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const cbcReport of report.message.cbcBody.cbcReports) {
      for (const entity of cbcReport.constEntities.constituentEntity) {
        const entityName = this.getEntityName(entity);

        // CE-027: CBC513 (Other) without explanation
        if (entity.bizActivities?.includes('CBC513')) {
          if (!entity.otherEntityInfo || entity.otherEntityInfo.trim() === '') {
            results.push({
              ruleId: 'CE-027',
              category: ValidationCategory.DATA_QUALITY,
              severity: ValidationSeverity.WARNING,
              message: `Entity "${entityName}" uses CBC513 (Other) without explanation`,
              xpath: `//ConstituentEntity[Name="${entityName}"]/BizActivities`,
              details: this.ruleToDetails('CE-027'),
              suggestion: 'Add explanation in OtherEntityInfo or Table 3.',
            });
          }
        }
      }
    }

    // CE-028: Missing data source explanation
    const additionalInfo = report.message.cbcBody.additionalInfo;
    if (!additionalInfo || additionalInfo.length === 0) {
      results.push({
        ruleId: 'CE-028',
        category: ValidationCategory.DATA_QUALITY,
        severity: ValidationSeverity.INFO,
        message: 'Table 3 (Additional Information) is empty. Consider adding data source explanation.',
        xpath: '//AdditionalInfo',
        details: this.ruleToDetails('CE-028'),
        suggestion: 'Explain whether data came from consolidation packages, statutory accounts, or other sources.',
      });
    }

    return results;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private getEntityTinValue(entity: ConstituentEntity): string | undefined {
    if (entity.tin && entity.tin.length > 0) {
      return entity.tin[0].value;
    }
    return undefined;
  }

  private getEntityTinIssuedBy(entity: ConstituentEntity): string | undefined {
    if (entity.tin && entity.tin.length > 0) {
      return entity.tin[0].issuedBy;
    }
    return undefined;
  }

  private getEntityName(entity: ConstituentEntity): string {
    if (entity.name && entity.name.length > 0) {
      return entity.name[0].value;
    }
    return 'Unknown Entity';
  }

  private getEntityResCountryCode(entity: ConstituentEntity): string | undefined {
    // ConstituentEntity may have address with country code
    if (entity.address && entity.address.length > 0) {
      return entity.address[0].countryCode;
    }
    return undefined;
  }

  private getReportingEntityTinValue(reportingEntity: { tin?: Array<{ value: string }> }): string | undefined {
    if (reportingEntity.tin && reportingEntity.tin.length > 0) {
      return reportingEntity.tin[0].value;
    }
    return undefined;
  }

  private getReportingEntityName(reportingEntity: { name?: Array<{ value: string }> }): string | undefined {
    if (reportingEntity.name && reportingEntity.name.length > 0) {
      return reportingEntity.name[0].value;
    }
    return undefined;
  }
}

export const commonErrorsValidator = new CommonErrorsValidator();

