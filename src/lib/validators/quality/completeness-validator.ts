/**
 * Completeness Validator
 *
 * Validates that all required data elements are present and populated
 * in the CbC report, including Table 1 fields, entity presence, and
 * AdditionalInfo completeness.
 *
 * @module lib/validators/quality/completeness-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { Summary, CbcReport, AdditionalInfo } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../core/base-validator';
import { ValidationContext } from '../core/validation-context';
import { XSD_STRING_LENGTHS } from '@/constants/validation-rules';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Required Table 1 fields */
const TABLE1_REQUIRED_FIELDS = [
  'totalRevenues',
  'profitOrLoss',
  'taxPaid',
  'taxAccrued',
  'capital',
  'accumulatedEarnings',
  'numberOfEmployees',
  'tangibleAssets',
] as const;

/** Field display names */
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  totalRevenues: 'Total Revenues',
  unrelatedRevenues: 'Unrelated Party Revenues',
  relatedRevenues: 'Related Party Revenues',
  profitOrLoss: 'Profit (Loss) Before Tax',
  taxPaid: 'Tax Paid (Cash Basis)',
  taxAccrued: 'Tax Accrued (Current Year)',
  capital: 'Stated Capital',
  accumulatedEarnings: 'Accumulated Earnings',
  numberOfEmployees: 'Number of Employees',
  tangibleAssets: 'Tangible Assets',
};

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates report completeness
 */
export class CompletenessValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'quality-completeness',
    name: 'Completeness Validator',
    description: 'Validates all required fields are populated',
    category: ValidationCategory.DATA_QUALITY,
    order: 80,
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate Table 1 completeness for each jurisdiction
    for (const [report, reportIndex] of this.iterateReports(ctx)) {
      const jurisdiction = report.resCountryCode;
      const basePath = this.xpathCbcReport(reportIndex);

      // Check Table 1 fields
      results.push(...this.validateTable1Completeness(report.summary, jurisdiction, basePath));

      // Check entities present
      results.push(...this.validateEntitiesPresent(report, jurisdiction, basePath));

      // Check string lengths per XSD constraints
      results.push(...this.validateStringLengths(report, basePath));
    }

    // Check ReportingEntity is in entity list
    results.push(...this.validateReportingEntityIncluded(ctx));

    // Check AdditionalInfo completeness
    results.push(...this.validateAdditionalInfoCompleteness(ctx));

    // Check jurisdiction coverage
    results.push(...this.validateJurisdictionCoverage(ctx));

    // Check AdditionalInfo string lengths
    results.push(...this.validateAdditionalInfoStringLengths(ctx));

    // Check ReportingEntity string lengths
    results.push(...this.validateReportingEntityStringLengths(ctx));

    return results;
  }

  /**
   * Validate Table 1 field completeness
   */
  private validateTable1Completeness(
    summary: Summary,
    jurisdiction: string,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const summaryPath = `${basePath}/Summary`;

    // Check each required field
    for (const field of TABLE1_REQUIRED_FIELDS) {
      const value = this.getFieldValue(summary, field);
      const displayName = FIELD_DISPLAY_NAMES[field] ?? field;

      if (value === undefined || value === null) {
        results.push(
          this.result('CMP-001')
            .warning()
            .message(`${jurisdiction}: ${displayName} is missing`)
            .xpath(`${summaryPath}/${this.getXmlElementName(field)}`)
            .build()
        );
      }
    }

    // Check revenue breakdown (both or neither)
    const hasUnrelated = summary.unrelatedRevenues !== undefined;
    const hasRelated = summary.relatedRevenues !== undefined;
    
    if (hasUnrelated !== hasRelated) {
      const missing = hasUnrelated ? 'RelatedRevenues' : 'UnrelatedRevenues';
      results.push(
        this.result('CMP-001')
          .warning()
          .message(`${jurisdiction}: ${missing} should be provided when ${hasUnrelated ? 'Unrelated' : 'Related'}Revenues is present`)
          .xpath(`${summaryPath}/Revenues`)
          .build()
      );
    }

    // Check for all zeros (might indicate incomplete data)
    const allZero = TABLE1_REQUIRED_FIELDS.every((field) => {
      const value = this.getFieldValue(summary, field);
      return value === 0 || value === undefined;
    });

    if (allZero) {
      results.push(
        this.result('CMP-001')
          .info()
          .message(`${jurisdiction}: All Table 1 values are zero or missing - verify data is complete`)
          .xpath(summaryPath)
          .build()
      );
    }

    return results;
  }

  /**
   * Validate entities are present in each jurisdiction
   */
  private validateEntitiesPresent(
    report: CbcReport,
    jurisdiction: string,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const entities = report.constEntities.constituentEntity;

    // At least one entity required per jurisdiction
    if (entities.length === 0) {
      results.push(
        this.result('CMP-002')
          .error()
          .message(`${jurisdiction}: No constituent entities - at least one entity required per jurisdiction`)
          .xpath(`${basePath}/ConstEntities`)
          .build()
      );
      return results;
    }

    // Check each entity has required fields
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const entityPath = `${basePath}/ConstEntities/ConstituentEntity[${i}]`;

      // Entity must have a name
      if (!entity.name || entity.name.length === 0 || this.isEmpty(entity.name[0]?.value)) {
        results.push(
          this.result('CMP-002')
            .error()
            .message(`${jurisdiction}: Entity at index ${i} has no name`)
            .xpath(`${entityPath}/Name`)
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Validate ReportingEntity is included in constituent entities
   */
  private validateReportingEntityIncluded(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const reportingEntity = this.getReportingEntity(ctx);
    const reportingTins = reportingEntity.tin?.map((t) => t.value?.toLowerCase()) ?? [];
    const reportingName = reportingEntity.name[0]?.value?.toLowerCase() ?? '';
    const reportingJurisdiction = ctx.getReportingJurisdiction();

    // Check if reporting entity appears in any CbcReports
    const entities = ctx.getEntityReferences();
    
    let found = false;
    let foundInCorrectJurisdiction = false;

    for (const entity of entities) {
      // Match by TIN
      const entityTins = entity.tins.map((t) => t.toLowerCase());
      const tinMatch = reportingTins.some((rt) => rt && entityTins.includes(rt));
      
      // Match by name (normalized)
      const entityName = entity.name.toLowerCase().trim();
      const nameMatch = entityName === reportingName || 
        entityName.includes(reportingName) || 
        reportingName.includes(entityName);

      if (tinMatch || nameMatch) {
        found = true;
        if (entity.jurisdiction === reportingJurisdiction) {
          foundInCorrectJurisdiction = true;
          break;
        }
      }
    }

    if (!found) {
      results.push(
        this.result('CMP-003')
          .warning()
          .message(
            `ReportingEntity "${reportingEntity.name[0]?.value}" does not appear in any jurisdiction's entity list`
          )
          .xpath(this.xpathReportingEntity())
          .suggestion('The UPE/Surrogate should typically appear as a constituent entity in its home jurisdiction')
          .build()
      );
    } else if (!foundInCorrectJurisdiction) {
      results.push(
        this.result('CMP-003')
          .info()
          .message(
            `ReportingEntity appears in entity list but not in its home jurisdiction (${reportingJurisdiction})`
          )
          .xpath(this.xpathReportingEntity())
          .build()
      );
    }

    return results;
  }

  /**
   * Validate AdditionalInfo completeness
   */
  private validateAdditionalInfoCompleteness(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const additionalInfos = this.getAdditionalInfo(ctx);

    for (let i = 0; i < additionalInfos.length; i++) {
      const info = additionalInfos[i];
      const infoPath = this.xpathAdditionalInfo(i);

      // Check if OtherInfo has content
      if (!info.otherInfo || info.otherInfo.length === 0) {
        results.push(
          this.result('CMP-004')
            .warning()
            .message(`AdditionalInfo[${i}] has no OtherInfo content`)
            .xpath(`${infoPath}/OtherInfo`)
            .build()
        );
        continue;
      }

      // Check if all OtherInfo entries are empty
      const allEmpty = info.otherInfo.every((oi) => this.isEmpty(oi.value));
      if (allEmpty) {
        results.push(
          this.result('CMP-004')
            .warning()
            .message(`AdditionalInfo[${i}] is declared but all OtherInfo entries are empty`)
            .xpath(`${infoPath}/OtherInfo`)
            .suggestion('Either provide content or remove the AdditionalInfo element')
            .build()
        );
      }

      // Check for very short content
      const hasShortContent = info.otherInfo.some(
        (oi) => oi.value && oi.value.length > 0 && oi.value.length < 10
      );
      if (hasShortContent && !allEmpty) {
        results.push(
          this.result('CMP-004')
            .info()
            .message(`AdditionalInfo[${i}] has very brief content - consider providing more detail`)
            .xpath(`${infoPath}/OtherInfo`)
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Validate jurisdiction coverage
   */
  private validateJurisdictionCoverage(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const jurisdictions = ctx.getJurisdictionReferences();
    const reportingJurisdiction = ctx.getReportingJurisdiction();

    // Check if reporting jurisdiction is included
    const hasReportingJurisdiction = jurisdictions.some(
      (j) => j.code === reportingJurisdiction
    );

    if (!hasReportingJurisdiction) {
      results.push(
        this.result('CMP-005')
          .warning()
          .message(
            `Reporting jurisdiction (${reportingJurisdiction}) not included in CbcReports`
          )
          .suggestion('The UPE/Surrogate jurisdiction should typically be included')
          .build()
      );
    }

    // Check for minimum jurisdictions (MNE groups typically have multiple)
    if (jurisdictions.length === 1) {
      results.push(
        this.result('CMP-005')
          .info()
          .message('Only one jurisdiction reported - verify all relevant jurisdictions are included')
          .build()
      );
    }

    return results;
  }

  /**
   * Get field value from summary
   */
  private getFieldValue(summary: Summary, field: string): number | undefined {
    switch (field) {
      case 'totalRevenues':
        return summary.totalRevenues?.value;
      case 'profitOrLoss':
        return summary.profitOrLoss?.value;
      case 'taxPaid':
        return summary.taxPaid?.value;
      case 'taxAccrued':
        return summary.taxAccrued?.value;
      case 'capital':
        return summary.capital?.value;
      case 'accumulatedEarnings':
        return summary.accumulatedEarnings?.value;
      case 'numberOfEmployees':
        return summary.numberOfEmployees;
      case 'tangibleAssets':
        return summary.tangibleAssets?.value;
      default:
        return undefined;
    }
  }

  /**
   * Get XML element name for a field
   */
  private getXmlElementName(field: string): string {
    const mapping: Record<string, string> = {
      totalRevenues: 'Revenues/Total',
      unrelatedRevenues: 'Revenues/Unrelated',
      relatedRevenues: 'Revenues/Related',
      profitOrLoss: 'ProfitOrLoss',
      taxPaid: 'TaxPaid',
      taxAccrued: 'TaxAccrued',
      capital: 'Capital',
      accumulatedEarnings: 'AccumulatedEarnings',
      numberOfEmployees: 'NbEmployees',
      tangibleAssets: 'Assets',
    };
    return mapping[field] ?? field;
  }

  // ===========================================================================
  // XSD STRING LENGTH VALIDATION
  // ===========================================================================

  /**
   * Validate string lengths in CbcReport per XSD constraints
   */
  private validateStringLengths(
    report: CbcReport,
    basePath: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const entities = report.constEntities.constituentEntity;

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const entityPath = `${basePath}/ConstEntities/ConstituentEntity[${i}]`;

      // Check entity names
      if (entity.name) {
        for (let j = 0; j < entity.name.length; j++) {
          const name = entity.name[j];
          if (name.value && name.value.length > XSD_STRING_LENGTHS.NAME_MAX) {
            results.push(
              this.result('XSD-LEN-001')
                .error()
                .schemaCompliance()
                .message(
                  `Entity name exceeds maximum length of ${XSD_STRING_LENGTHS.NAME_MAX} characters (${name.value.length} found)`
                )
                .xpath(`${entityPath}/Name[${j}]`)
                .details({
                  length: name.value.length,
                  maxLength: XSD_STRING_LENGTHS.NAME_MAX,
                })
                .build()
            );
          }
        }
      }

      // Check TINs
      if (entity.tin) {
        for (let j = 0; j < entity.tin.length; j++) {
          const tin = entity.tin[j];
          if (tin.value && tin.value.length > XSD_STRING_LENGTHS.TIN_MAX) {
            results.push(
              this.result('XSD-LEN-002')
                .error()
                .schemaCompliance()
                .message(
                  `TIN exceeds maximum length of ${XSD_STRING_LENGTHS.TIN_MAX} characters (${tin.value.length} found)`
                )
                .xpath(`${entityPath}/TIN[${j}]`)
                .build()
            );
          }
        }
      }

      // Check address fields
      if (entity.address) {
        for (let j = 0; j < entity.address.length; j++) {
          const addr = entity.address[j];
          const addrPath = `${entityPath}/Address[${j}]`;

          // Check addressFix fields
          if (addr.addressFix) {
            // Check city
            if (addr.addressFix.city && addr.addressFix.city.length > XSD_STRING_LENGTHS.CITY_MAX) {
              results.push(
                this.result('XSD-LEN-003')
                  .error()
                  .schemaCompliance()
                  .message(
                    `City name exceeds maximum length of ${XSD_STRING_LENGTHS.CITY_MAX} characters`
                  )
                  .xpath(`${addrPath}/AddressFix/City`)
                  .build()
              );
            }

            // Check postal code
            if (addr.addressFix.postCode && addr.addressFix.postCode.length > XSD_STRING_LENGTHS.POSTAL_CODE_MAX) {
              results.push(
                this.result('XSD-LEN-004')
                  .error()
                  .schemaCompliance()
                  .message(
                    `Postal code exceeds maximum length of ${XSD_STRING_LENGTHS.POSTAL_CODE_MAX} characters`
                  )
                  .xpath(`${addrPath}/AddressFix/PostCode`)
                  .build()
              );
            }

            // Check street
            if (addr.addressFix.street && addr.addressFix.street.length > XSD_STRING_LENGTHS.ADDRESS_LINE_MAX) {
              results.push(
                this.result('XSD-LEN-005')
                  .error()
                  .schemaCompliance()
                  .message(
                    `Street exceeds maximum length of ${XSD_STRING_LENGTHS.ADDRESS_LINE_MAX} characters`
                  )
                  .xpath(`${addrPath}/AddressFix/Street`)
                  .build()
              );
            }
          }

          // Check addressFree
          if (addr.addressFree && addr.addressFree.value && addr.addressFree.value.length > XSD_STRING_LENGTHS.OTHER_INFO_MAX) {
            results.push(
              this.result('XSD-LEN-006')
                .error()
                .schemaCompliance()
                .message(
                  `Address free text exceeds maximum length of ${XSD_STRING_LENGTHS.OTHER_INFO_MAX} characters`
                )
                .xpath(`${addrPath}/AddressFree`)
                .build()
            );
          }
        }
      }

      // Check OtherEntityInfo
      if (entity.otherEntityInfo && entity.otherEntityInfo.length > XSD_STRING_LENGTHS.OTHER_INFO_MAX) {
        results.push(
          this.result('XSD-LEN-006')
            .error()
            .schemaCompliance()
            .message(
              `OtherEntityInfo exceeds maximum length of ${XSD_STRING_LENGTHS.OTHER_INFO_MAX} characters`
            )
            .xpath(`${entityPath}/OtherEntityInfo`)
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Validate AdditionalInfo string lengths
   */
  private validateAdditionalInfoStringLengths(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const additionalInfos = this.getAdditionalInfo(ctx);

    for (let i = 0; i < additionalInfos.length; i++) {
      const info = additionalInfos[i];
      const infoPath = this.xpathAdditionalInfo(i);

      if (info.otherInfo) {
        for (let j = 0; j < info.otherInfo.length; j++) {
          const otherInfo = info.otherInfo[j];
          if (otherInfo.value && otherInfo.value.length > XSD_STRING_LENGTHS.OTHER_INFO_MAX) {
            results.push(
              this.result('XSD-LEN-007')
                .error()
                .schemaCompliance()
                .message(
                  `OtherInfo exceeds maximum length of ${XSD_STRING_LENGTHS.OTHER_INFO_MAX} characters (${otherInfo.value.length} found)`
                )
                .xpath(`${infoPath}/OtherInfo[${j}]`)
                .details({
                  length: otherInfo.value.length,
                  maxLength: XSD_STRING_LENGTHS.OTHER_INFO_MAX,
                })
                .build()
            );
          }
        }
      }
    }

    return results;
  }

  /**
   * Validate ReportingEntity string lengths
   */
  private validateReportingEntityStringLengths(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const reportingEntity = this.getReportingEntity(ctx);
    const rePath = this.xpathReportingEntity();

    // Check names
    if (reportingEntity.name) {
      for (let i = 0; i < reportingEntity.name.length; i++) {
        const name = reportingEntity.name[i];
        if (name.value && name.value.length > XSD_STRING_LENGTHS.NAME_MAX) {
          results.push(
            this.result('XSD-LEN-008')
              .error()
              .schemaCompliance()
              .message(
                `ReportingEntity name exceeds maximum length of ${XSD_STRING_LENGTHS.NAME_MAX} characters`
              )
              .xpath(`${rePath}/Name[${i}]`)
              .build()
          );
        }
      }
    }

    // Check TINs
    if (reportingEntity.tin) {
      for (let i = 0; i < reportingEntity.tin.length; i++) {
        const tin = reportingEntity.tin[i];
        if (tin.value && tin.value.length > XSD_STRING_LENGTHS.TIN_MAX) {
          results.push(
            this.result('XSD-LEN-009')
              .error()
              .schemaCompliance()
              .message(
                `ReportingEntity TIN exceeds maximum length of ${XSD_STRING_LENGTHS.TIN_MAX} characters`
              )
              .xpath(`${rePath}/TIN[${i}]`)
              .build()
          );
        }
      }
    }

    // Check addresses
    if (reportingEntity.address) {
      for (let i = 0; i < reportingEntity.address.length; i++) {
        const addr = reportingEntity.address[i];
        const addrPath = `${rePath}/Address[${i}]`;

        if (addr.addressFix) {
          if (addr.addressFix.city && addr.addressFix.city.length > XSD_STRING_LENGTHS.CITY_MAX) {
            results.push(
              this.result('XSD-LEN-010')
                .error()
                .schemaCompliance()
                .message(
                  `ReportingEntity city name exceeds maximum length of ${XSD_STRING_LENGTHS.CITY_MAX} characters`
                )
                .xpath(`${addrPath}/AddressFix/City`)
                .build()
            );
          }

          if (addr.addressFix.postCode && addr.addressFix.postCode.length > XSD_STRING_LENGTHS.POSTAL_CODE_MAX) {
            results.push(
              this.result('XSD-LEN-011')
                .error()
                .schemaCompliance()
                .message(
                  `ReportingEntity postal code exceeds maximum length of ${XSD_STRING_LENGTHS.POSTAL_CODE_MAX} characters`
                )
                .xpath(`${addrPath}/AddressFix/PostCode`)
                .build()
            );
          }
        }
      }
    }

    return results;
  }
}

