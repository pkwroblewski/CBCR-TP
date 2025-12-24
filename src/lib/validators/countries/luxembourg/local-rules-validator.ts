/**
 * Luxembourg Local Rules Validator
 *
 * Validates Luxembourg-specific CbC report requirements including
 * XSD schema extensions, mandatory fields, and currency rules.
 *
 * Reference: Luxembourg Law of 23 December 2016 (CbCR implementation)
 *
 * @module lib/validators/countries/luxembourg/local-rules-validator
 */

import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type { CbcReport, Summary, ConstituentEntity } from '@/types/cbcr';
import { BaseValidator, ValidatorMetadata } from '../../core/base-validator';
import { ValidationContext } from '../../core/validation-context';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Luxembourg-specific requirements
 */
const LU_REQUIREMENTS = {
  /** Preferred reporting currency */
  PREFERRED_CURRENCY: 'EUR',

  /** Revenue threshold for CbC reporting (in EUR) */
  REVENUE_THRESHOLD: 750_000_000,

  /** Luxembourg country code */
  COUNTRY_CODE: 'LU',

  /** Required TIN attribute */
  REQUIRED_TIN_ATTRIBUTE: 'issuedBy',

  /** Maximum allowed entity name length */
  MAX_NAME_LENGTH: 200,

  /** Language codes accepted by ACD */
  ACCEPTED_LANGUAGES: ['EN', 'FR', 'DE'],
};

/**
 * Luxembourg entity types that require specific treatment
 */
const LU_ENTITY_TYPES = {
  /** Common Luxembourg company forms */
  COMPANY_FORMS: [
    'SA',
    'SARL',
    'SCA',
    'SCS',
    'SNC',
    'SAS',
    'SE',
    'SICAV',
    'SICAR',
    'SOPARFI',
  ],

  /** Investment fund structures */
  FUND_STRUCTURES: ['SICAV', 'SICAF', 'SICAR', 'SIF', 'RAIF', 'FCP'],
};

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validates Luxembourg-specific local requirements
 */
export class LuxembourgLocalRulesValidator extends BaseValidator {
  static metadata: ValidatorMetadata = {
    id: 'lu-local-rules',
    name: 'Luxembourg Local Rules Validator',
    description: 'Validates Luxembourg XSD and local requirements',
    category: ValidationCategory.COUNTRY_RULES,
    order: 220,
    applicableCountries: ['LU'],
    enabled: true,
  };

  async validate(ctx: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate reporting currency
    results.push(...this.validateCurrency(ctx));

    // Validate Luxembourg-specific entity requirements
    results.push(...this.validateLuxembourgEntities(ctx));

    // Validate language
    results.push(...this.validateLanguage(ctx));

    // Validate threshold
    results.push(...this.validateRevenueThreshold(ctx));

    // Validate Luxembourg jurisdiction report
    results.push(...this.validateLuxembourgJurisdiction(ctx));

    return results;
  }

  /**
   * Validate reporting currency
   */
  private validateCurrency(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const currencies = new Set<string>();

    // Collect all currencies used
    for (const [report] of this.iterateReports(ctx)) {
      const summary = report.summary;
      const fields = [
        summary.totalRevenues,
        summary.profitOrLoss,
        summary.taxPaid,
        summary.taxAccrued,
        summary.capital,
        summary.accumulatedEarnings,
        summary.tangibleAssets,
      ];

      for (const field of fields) {
        if (field?.currCode) {
          currencies.add(field.currCode);
        }
      }
    }

    // Check for non-EUR currencies
    const nonEurCurrencies = [...currencies].filter((c) => c !== LU_REQUIREMENTS.PREFERRED_CURRENCY);

    if (nonEurCurrencies.length > 0) {
      // Check if EUR is used at all
      const hasEur = currencies.has(LU_REQUIREMENTS.PREFERRED_CURRENCY);

      if (!hasEur) {
        results.push(
          this.result('LU-LOC-001')
            .warning()
            .message(
              `Luxembourg filing: Preferred currency is EUR but report uses ${[...currencies].join(', ')}`
            )
            .suggestion(
              'Consider using EUR as the reporting currency for Luxembourg filings, ' +
              'or ensure consistent currency usage throughout'
            )
            .build()
        );
      } else if (currencies.size > 1) {
        results.push(
          this.result('LU-LOC-001')
            .info()
            .message(
              `Multiple currencies used in report: ${[...currencies].join(', ')}`
            )
            .suggestion('Ensure currency is consistent across all jurisdictions')
            .build()
        );
      }
    }

    // Check Luxembourg jurisdiction specifically uses EUR
    const luJurisdiction = ctx.getJurisdiction('LU');
    if (luJurisdiction) {
      for (const [report] of this.iterateReports(ctx)) {
        if (report.resCountryCode !== 'LU') continue;

        const summary = report.summary;
        const luCurrencies = [
          summary.totalRevenues?.currCode,
          summary.profitOrLoss?.currCode,
          summary.taxPaid?.currCode,
        ].filter(Boolean);

        const nonEurInLu = luCurrencies.filter((c) => c !== 'EUR');
        if (nonEurInLu.length > 0) {
          results.push(
            this.result('LU-LOC-001')
              .info()
              .message(
                `Luxembourg jurisdiction data not in EUR: ${nonEurInLu.join(', ')}`
              )
              .xpath(this.xpathCbcReport(0, 'Summary'))
              .build()
          );
        }
      }
    }

    return results;
  }

  /**
   * Validate Luxembourg entities
   */
  private validateLuxembourgEntities(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const [entity, entityIndex, report, reportIndex] of this.iterateEntities(ctx)) {
      if (report.resCountryCode !== 'LU') continue;

      const entityPath = this.xpathEntity(reportIndex, entityIndex);
      const entityName = entity.name[0]?.value ?? 'Unknown';

      // Check entity name length
      if (entityName.length > LU_REQUIREMENTS.MAX_NAME_LENGTH) {
        results.push(
          this.result('LU-LOC-002')
            .warning()
            .message(
              `Entity name exceeds ${LU_REQUIREMENTS.MAX_NAME_LENGTH} characters: "${entityName.substring(0, 50)}..."`
            )
            .xpath(`${entityPath}/Name`)
            .build()
        );
      }

      // Check for Luxembourg company form in name
      results.push(...this.validateEntityType(entity, entityPath, entityName));

      // Check TIN has issuedBy attribute
      if (entity.tin && entity.tin.length > 0) {
        for (let i = 0; i < entity.tin.length; i++) {
          const tin = entity.tin[i];
          if (tin.value?.toUpperCase() !== 'NOTIN' && !tin.issuedBy) {
            results.push(
              this.result('LU-LOC-003')
                .warning()
                .message(
                  `${entityName}: TIN missing 'issuedBy' attribute`
                )
                .xpath(`${entityPath}/TIN[${i}]`)
                .suggestion("Add issuedBy='LU' for Luxembourg TINs")
                .build()
            );
          }
        }
      }

      // Check address is provided for Luxembourg entities
      if (!entity.address || entity.address.length === 0) {
        results.push(
          this.result('LU-LOC-004')
            .warning()
            .message(
              `${entityName}: Address recommended for Luxembourg entities`
            )
            .xpath(`${entityPath}/Address`)
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Validate entity type based on name
   */
  private validateEntityType(
    entity: ConstituentEntity,
    path: string,
    entityName: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const upperName = entityName.toUpperCase();

    // Check if it looks like a fund structure
    const isFundStructure = LU_ENTITY_TYPES.FUND_STRUCTURES.some(
      (form) => upperName.includes(form)
    );

    if (isFundStructure) {
      // Funds may have special reporting requirements
      results.push(
        this.result('LU-LOC-005')
          .info()
          .message(
            `${entityName}: Appears to be an investment fund - verify CbC reporting applicability`
          )
          .xpath(`${path}/Name`)
          .suggestion(
            'Investment funds may have specific exclusions or reporting requirements under Luxembourg law'
          )
          .build()
      );
    }

    return results;
  }

  /**
   * Validate language
   */
  private validateLanguage(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const messageSpec = this.getMessageSpec(ctx);

    if (messageSpec.language) {
      const lang = messageSpec.language.toUpperCase();
      if (!LU_REQUIREMENTS.ACCEPTED_LANGUAGES.includes(lang)) {
        results.push(
          this.result('LU-LOC-006')
            .info()
            .message(
              `Report language '${lang}' - ACD accepts: ${LU_REQUIREMENTS.ACCEPTED_LANGUAGES.join(', ')}`
            )
            .xpath(this.xpathMessageSpec('Language'))
            .build()
        );
      }
    }

    return results;
  }

  /**
   * Validate revenue threshold
   */
  private validateRevenueThreshold(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const globalTotals = ctx.getGlobalTotals();

    if (globalTotals.totalRevenues < LU_REQUIREMENTS.REVENUE_THRESHOLD) {
      results.push(
        this.result('LU-LOC-007')
          .info()
          .message(
            `Total consolidated revenue (${this.formatCurrency(globalTotals.totalRevenues, 'EUR')}) ` +
            `is below €750 million threshold`
          )
          .suggestion(
            'CbC reporting is mandatory for MNE groups with consolidated revenue >= €750 million. ' +
            'Verify the group meets the threshold requirements.'
          )
          .build()
      );
    }

    return results;
  }

  /**
   * Validate Luxembourg jurisdiction is properly reported
   */
  private validateLuxembourgJurisdiction(ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Check if Luxembourg is in the report when filer is in Luxembourg
    const reportingJurisdiction = ctx.getReportingJurisdiction();
    const hasLuJurisdiction = ctx.hasJurisdiction('LU');

    if (reportingJurisdiction === 'LU' && !hasLuJurisdiction) {
      results.push(
        this.result('LU-LOC-008')
          .warning()
          .message(
            'Luxembourg is the filing jurisdiction but no LU CbcReport included'
          )
          .suggestion(
            'The reporting entity jurisdiction should typically have a CbcReport entry'
          )
          .build()
      );
    }

    // If Luxembourg jurisdiction exists, validate it has entities
    if (hasLuJurisdiction) {
      const luRef = ctx.getJurisdiction('LU');
      if (luRef && luRef.entityCount === 0) {
        results.push(
          this.result('LU-LOC-008')
            .error()
            .message(
              'Luxembourg jurisdiction reported but has no constituent entities'
            )
            .build()
        );
      }
    }

    return results;
  }
}

