# OECD Common Errors - Implementation Addendum

## Overview

This addendum adds the **28 common errors** identified by the OECD from tax administrations worldwide. These should be integrated into your CbCR Review App as additional validation rules.

**Source:** OECD "Common errors made by MNE groups in preparing Country-by-Country Reports"
**URL:** https://www.oecd.org/content/dam/oecd/en/topics/policy-sub-issues/cbcr/common-errors-mnes-cbc-reports.pdf

---

## PART 1: New Validation Rules to Add

Add these to `src/constants/validation-rules.ts` after the existing rules:

```typescript
// ===========================================
// OECD COMMON ERRORS (CE-001 to CE-028)
// Source: OECD Common Errors Document
// ===========================================

export const OECD_COMMON_ERROR_RULES = {
  // ─────────────────────────────────────────
  // TIN ERRORS (Most Critical for Data Use)
  // ─────────────────────────────────────────
  
  'CE-001': {
    id: 'CE-001',
    category: 'DATA_QUALITY',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Missing Tax Identification Number',
    description: 'TIN field is blank or contains only spaces. TIN is required for all Constituent Entities.',
    correctTreatment: 'Provide valid TIN for each Constituent Entity. Use "NOTIN" only if no TIN has been issued by the tax administration.',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  'CE-002': {
    id: 'CE-002',
    category: 'DATA_QUALITY',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid NOTIN Usage',
    description: 'NOTIN entered for entity that has been issued a TIN.',
    correctTreatment: 'NOTIN should only be used when no TIN has been issued. If entity has a TIN, it must be provided.',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  'CE-003': {
    id: 'CE-003',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Invalid TIN Format',
    description: 'TIN does not match the expected format for the issuing jurisdiction.',
    correctTreatment: 'Ensure TIN follows the format required by the issuing tax administration.',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  'CE-004': {
    id: 'CE-004',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Duplicate TIN',
    description: 'Same TIN used for multiple different Constituent Entities.',
    correctTreatment: 'Each Constituent Entity should have a unique TIN unless they share one legitimately (rare).',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  'CE-005': {
    id: 'CE-005',
    category: 'DATA_QUALITY',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Missing issuedBy Attribute',
    description: 'TIN provided without the issuedBy jurisdiction attribute.',
    correctTreatment: 'Always include issuedBy attribute with ISO country code indicating which jurisdiction issued the TIN.',
    reference: 'CbCR XML Schema User Guide, page 12'
  },

  // ─────────────────────────────────────────
  // TABLE 1/2/3 CONSISTENCY ERRORS
  // ─────────────────────────────────────────

  'CE-006': {
    id: 'CE-006',
    category: 'DATA_QUALITY',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Table 1/Table 2 Jurisdiction Mismatch',
    description: 'Jurisdiction appears in Table 1 but not in Table 2, or vice versa.',
    correctTreatment: 'Every jurisdiction in Table 1 must have corresponding entities in Table 2, and every entity jurisdiction in Table 2 must be reflected in Table 1.',
    reference: 'CbC Report Specific Instructions, page 35'
  },

  'CE-007': {
    id: 'CE-007',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Missing Constituent Entity',
    description: 'Not all Constituent Entities of the MNE Group are included in the CbC Report.',
    correctTreatment: 'Include ALL Constituent Entities, including dormant entities, partnerships, trusts, and permanent establishments.',
    reference: 'CbC Report Specific Instructions, page 35'
  },

  'CE-008': {
    id: 'CE-008',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Reporting Entity Not in Entity List',
    description: 'The Reporting Entity is not included as a Constituent Entity in Table 2.',
    correctTreatment: 'The Reporting Entity must also appear in the list of Constituent Entities for its jurisdiction.',
    reference: 'CbCR XML Schema User Guide, page 21'
  },

  'CE-009': {
    id: 'CE-009',
    category: 'DATA_QUALITY',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Incorrect PE Naming Convention',
    description: 'Permanent Establishment not named using correct format.',
    correctTreatment: 'Name PEs as: "Entity Legal Name – Jurisdiction PE" (e.g., "ACME Corp – Germany PE").',
    reference: 'BEPS Action 13 Report, Part III, Question 7.1'
  },

  // ─────────────────────────────────────────
  // NUMERIC/FORMAT ERRORS
  // ─────────────────────────────────────────

  'CE-010': {
    id: 'CE-010',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Decimals in Table 1 Amounts',
    description: 'Table 1 amounts contain decimal values.',
    correctTreatment: 'Full numbers must be used without decimals. Round to nearest whole unit.',
    reference: 'BEPS Action 13 Report, Part II, Question 8.1'
  },

  'CE-011': {
    id: 'CE-011',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Shortened Numbers (Thousands/Millions)',
    description: 'Amounts appear to be in thousands or millions instead of full units.',
    correctTreatment: 'Report full amounts. Do not abbreviate by dropping final digits. €1,500,000 should not be reported as 1,500 or 1.5.',
    reference: 'BEPS Action 13 Report, Part II, Question 8.1'
  },

  'CE-012': {
    id: 'CE-012',
    category: 'DATA_QUALITY',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Revenue Sum Mismatch',
    description: 'Total Revenues does not equal Related Party Revenues + Unrelated Party Revenues.',
    correctTreatment: 'Total Revenues must always equal the sum of Unrelated Party Revenues and Related Party Revenues.',
    reference: 'BEPS Action 13 Report, Part II, Question 7.1'
  },

  'CE-013': {
    id: 'CE-013',
    category: 'DATA_QUALITY',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Inconsistent Currency',
    description: 'Different currencies used across jurisdictions in the same report.',
    correctTreatment: 'All amounts must be in the same functional currency of the Reporting MNE. Convert using average exchange rate and note in Table 3.',
    reference: 'BEPS Action 13 Report, Part II, Question 7.1'
  },

  'CE-014': {
    id: 'CE-014',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Negative Revenue Values',
    description: 'Revenue figures reported as negative values.',
    correctTreatment: 'Revenue figures should only be provided as positive integers. Negative values are not permitted for revenue fields.',
    reference: 'CbCR XML Schema User Guide'
  },

  // ─────────────────────────────────────────
  // DIVIDEND TREATMENT ERRORS (May 2024 Update)
  // ─────────────────────────────────────────

  'CE-015': {
    id: 'CE-015',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors (May 2024)',
    title: 'Dividends Included in Revenues',
    description: 'Dividends received from other Constituent Entities are included in Revenues.',
    correctTreatment: 'Exclude dividends from Constituent Entities from both Related Party Revenues and Total Revenues.',
    reference: 'OECD Guidance May 2024, BEPS Action 13'
  },

  'CE-016': {
    id: 'CE-016',
    category: 'DATA_QUALITY',
    severity: 'ERROR',
    source: 'OECD Common Errors (May 2024)',
    title: 'Dividends Included in Profit/Loss',
    description: 'Dividends received from other Constituent Entities are included in Profit (Loss) before Income Tax.',
    correctTreatment: 'Exclude dividends from Constituent Entities from Profit (Loss) before Income Tax consistently with Revenue treatment.',
    reference: 'OECD Guidance May 2024, BEPS Action 13'
  },

  // ─────────────────────────────────────────
  // XML SCHEMA/CHARACTER ERRORS
  // ─────────────────────────────────────────

  'CE-017': {
    id: 'CE-017',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Ampersand',
    description: 'Unescaped ampersand (&) found in XML content.',
    correctTreatment: 'Replace & with &amp; in all text content.',
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-018': {
    id: 'CE-018',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Less Than',
    description: 'Unescaped less-than sign (<) found in XML content.',
    correctTreatment: 'Replace < with &lt; in all text content.',
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-019': {
    id: 'CE-019',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Greater Than',
    description: 'Unescaped greater-than sign (>) found in XML content.',
    correctTreatment: 'Replace > with &gt; in all text content.',
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-020': {
    id: 'CE-020',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Apostrophe',
    description: 'Unescaped apostrophe (\') found in XML attribute.',
    correctTreatment: 'Replace \' with &apos; in attribute values.',
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-021': {
    id: 'CE-021',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Invalid XML Characters - Quote',
    description: 'Unescaped double quote (") found in XML attribute.',
    correctTreatment: 'Replace " with &quot; in attribute values.',
    reference: 'CbCR XML Schema User Guide'
  },

  'CE-022': {
    id: 'CE-022',
    category: 'XML_WELLFORMEDNESS',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Non-UTF-8 Encoding',
    description: 'XML file is not encoded in UTF-8.',
    correctTreatment: 'Ensure XML declaration specifies encoding="UTF-8" and file is actually saved as UTF-8.',
    reference: 'CbCR XML Schema User Guide, HMRC Error CbC-MNE-BR-014'
  },

  'CE-023': {
    id: 'CE-023',
    category: 'XML_WELLFORMEDNESS',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Prohibited Control Characters',
    description: 'XML contains control characters that cannot be represented even with escaping.',
    correctTreatment: 'Remove all control characters (0x00-0x1F except tab, newline, carriage return).',
    reference: 'CbCR XML Schema User Guide'
  },

  // ─────────────────────────────────────────
  // DATE/PERIOD ERRORS
  // ─────────────────────────────────────────

  'CE-024': {
    id: 'CE-024',
    category: 'BUSINESS_RULES',
    severity: 'CRITICAL',
    source: 'OECD Common Errors',
    title: 'Incorrect Reporting Period End Date',
    description: 'ReportingPeriod does not reflect the last day of the MNE fiscal year.',
    correctTreatment: 'ReportingPeriod must be the last day of the MNE Group\'s fiscal year (e.g., 2024-12-31 for calendar year).',
    reference: 'CbCR XML Schema User Guide, page 11'
  },

  'CE-025': {
    id: 'CE-025',
    category: 'BUSINESS_RULES',
    severity: 'ERROR',
    source: 'OECD Common Errors',
    title: 'Filing Date Used as Reporting Period',
    description: 'The date the CbC report was filed is incorrectly used as the ReportingPeriod.',
    correctTreatment: 'Use the fiscal year end date, not the filing date.',
    reference: 'CbC Report General Instructions, page 32'
  },

  'CE-026': {
    id: 'CE-026',
    category: 'BUSINESS_RULES',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Long Accounting Period Not Split',
    description: 'Single CbC report covers accounting period longer than 12 months.',
    correctTreatment: 'If fiscal period exceeds 12 months (e.g., 18-month transition), split into separate CbC reports or explain in Table 3.',
    reference: 'BEPS Action 13 Report, Part IV, Question 3.3'
  },

  // ─────────────────────────────────────────
  // BUSINESS ACTIVITY ERRORS
  // ─────────────────────────────────────────

  'CE-027': {
    id: 'CE-027',
    category: 'DATA_QUALITY',
    severity: 'WARNING',
    source: 'OECD Common Errors',
    title: 'Other (CBC513) Without Explanation',
    description: 'Business activity code CBC513 (Other) selected without explanation in Table 3.',
    correctTreatment: 'When using CBC513, provide detailed explanation in OtherEntityInfo or Table 3 Additional Information.',
    reference: 'CbC Report Specific Instructions'
  },

  'CE-028': {
    id: 'CE-028',
    category: 'DATA_QUALITY',
    severity: 'INFO',
    source: 'OECD Common Errors',
    title: 'Missing Data Source Explanation',
    description: 'Table 3 does not explain the sources of data used to prepare the CbC Report.',
    correctTreatment: 'Include explanation in Table 3 of whether data came from consolidation reporting packages, statutory accounts, regulatory reports, or other sources.',
    reference: 'BEPS Action 13 Report, Part IV, Question 4.1'
  }
} as const;

export type OecdCommonErrorRuleId = keyof typeof OECD_COMMON_ERROR_RULES;
```

---

## PART 2: New Validator File to Create

Create a new file: `src/lib/validators/quality/common-errors-validator.ts`

Add this to **Prompt 7** (Data Quality Validators) or create as a separate prompt:

```typescript
/**
 * OECD Common Errors Validator
 * 
 * Implements the 28 common errors identified by OECD from tax administrations.
 * Source: https://www.oecd.org/content/dam/oecd/en/topics/policy-sub-issues/cbcr/common-errors-mnes-cbc-reports.pdf
 */

import { ValidationResult, ValidationSeverity, ValidationCategory } from '@/types/validation';
import { ParsedCbcReport } from '@/types/cbcr';
import { OECD_COMMON_ERROR_RULES } from '@/constants/validation-rules';

export class CommonErrorsValidator {
  
  validate(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // TIN Validations (CE-001 to CE-005)
    results.push(...this.validateTINs(report));
    
    // Table Consistency (CE-006 to CE-009)
    results.push(...this.validateTableConsistency(report));
    
    // Numeric/Format (CE-010 to CE-014)
    results.push(...this.validateNumericFormats(report));
    
    // Dividend Treatment (CE-015 to CE-016)
    results.push(...this.validateDividendExclusion(report));
    
    // XML Characters (CE-017 to CE-023) - handled in XML parser
    
    // Date/Period (CE-024 to CE-026)
    results.push(...this.validateDatePeriods(report));
    
    // Business Activity (CE-027 to CE-028)
    results.push(...this.validateBusinessActivities(report));
    
    return results;
  }

  private validateTINs(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];
    const seenTINs = new Map<string, string[]>(); // TIN -> entity names
    
    for (const cbcReport of report.cbcBody.cbcReports) {
      for (const entity of cbcReport.constEntities) {
        const tin = entity.tin?.value;
        const tinIssuedBy = entity.tin?.issuedBy;
        const entityName = entity.name;
        
        // CE-001: Missing TIN
        if (!tin || tin.trim() === '') {
          results.push({
            ruleId: 'CE-001',
            category: ValidationCategory.DATA_QUALITY,
            severity: ValidationSeverity.CRITICAL,
            message: `Missing TIN for entity: ${entityName}`,
            xpath: `//ConstEntity[Name="${entityName}"]/TIN`,
            details: OECD_COMMON_ERROR_RULES['CE-001'],
            suggestion: 'Provide valid TIN or use "NOTIN" if no TIN has been issued.'
          });
        }
        
        // CE-002: Invalid NOTIN usage (check if entity likely has TIN)
        // This is a heuristic - entities in jurisdictions with TIN systems should have TINs
        if (tin === 'NOTIN') {
          results.push({
            ruleId: 'CE-002',
            category: ValidationCategory.DATA_QUALITY,
            severity: ValidationSeverity.WARNING,
            message: `NOTIN used for entity: ${entityName}. Verify entity has not been issued a TIN.`,
            xpath: `//ConstEntity[Name="${entityName}"]/TIN`,
            details: OECD_COMMON_ERROR_RULES['CE-002'],
            suggestion: 'Confirm with local tax administration that no TIN has been issued.'
          });
        }
        
        // CE-004: Duplicate TIN
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
            xpath: `//ConstEntity[Name="${entityName}"]/TIN/@issuedBy`,
            details: OECD_COMMON_ERROR_RULES['CE-005'],
            suggestion: 'Add issuedBy attribute with ISO country code.'
          });
        }
      }
    }
    
    // Report duplicate TINs
    for (const [tin, entities] of seenTINs) {
      if (entities.length > 1) {
        results.push({
          ruleId: 'CE-004',
          category: ValidationCategory.DATA_QUALITY,
          severity: ValidationSeverity.ERROR,
          message: `Duplicate TIN "${tin}" used by multiple entities: ${entities.join(', ')}`,
          details: OECD_COMMON_ERROR_RULES['CE-004'],
          suggestion: 'Verify each entity has a unique TIN.'
        });
      }
    }
    
    return results;
  }

  private validateTableConsistency(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Get jurisdictions from Table 1 (Summary)
    const table1Jurisdictions = new Set<string>();
    for (const cbcReport of report.cbcBody.cbcReports) {
      table1Jurisdictions.add(cbcReport.resCountryCode);
    }
    
    // Get jurisdictions from Table 2 (Entities)
    const table2Jurisdictions = new Set<string>();
    for (const cbcReport of report.cbcBody.cbcReports) {
      for (const entity of cbcReport.constEntities) {
        table2Jurisdictions.add(entity.resCountryCode);
      }
    }
    
    // CE-006: Jurisdiction mismatch
    for (const jurisdiction of table1Jurisdictions) {
      if (!table2Jurisdictions.has(jurisdiction)) {
        results.push({
          ruleId: 'CE-006',
          category: ValidationCategory.DATA_QUALITY,
          severity: ValidationSeverity.CRITICAL,
          message: `Jurisdiction ${jurisdiction} in Table 1 has no entities in Table 2`,
          details: OECD_COMMON_ERROR_RULES['CE-006'],
          suggestion: 'Add constituent entities for this jurisdiction or remove from Table 1.'
        });
      }
    }
    
    for (const jurisdiction of table2Jurisdictions) {
      if (!table1Jurisdictions.has(jurisdiction)) {
        results.push({
          ruleId: 'CE-006',
          category: ValidationCategory.DATA_QUALITY,
          severity: ValidationSeverity.CRITICAL,
          message: `Jurisdiction ${jurisdiction} has entities in Table 2 but no summary in Table 1`,
          details: OECD_COMMON_ERROR_RULES['CE-006'],
          suggestion: 'Add summary data for this jurisdiction in Table 1.'
        });
      }
    }
    
    // CE-008: Reporting Entity in entity list
    const reportingEntityTIN = report.cbcBody.reportingEntity.tin?.value;
    const reportingEntityJurisdiction = report.cbcBody.reportingEntity.resCountryCode;
    let reportingEntityFound = false;
    
    for (const cbcReport of report.cbcBody.cbcReports) {
      if (cbcReport.resCountryCode === reportingEntityJurisdiction) {
        for (const entity of cbcReport.constEntities) {
          if (entity.tin?.value === reportingEntityTIN) {
            reportingEntityFound = true;
            break;
          }
        }
      }
    }
    
    if (!reportingEntityFound) {
      results.push({
        ruleId: 'CE-008',
        category: ValidationCategory.DATA_QUALITY,
        severity: ValidationSeverity.ERROR,
        message: 'Reporting Entity not found in Constituent Entities list',
        details: OECD_COMMON_ERROR_RULES['CE-008'],
        suggestion: 'Include the Reporting Entity in Table 2 for its jurisdiction.'
      });
    }
    
    // CE-009: PE naming convention
    for (const cbcReport of report.cbcBody.cbcReports) {
      for (const entity of cbcReport.constEntities) {
        if (entity.incorpCountryCode && entity.incorpCountryCode !== entity.resCountryCode) {
          // This might be a PE - check naming
          if (!entity.name.includes(' PE') && !entity.name.includes(' - ')) {
            results.push({
              ruleId: 'CE-009',
              category: ValidationCategory.DATA_QUALITY,
              severity: ValidationSeverity.WARNING,
              message: `Possible PE "${entity.name}" not following naming convention`,
              xpath: `//ConstEntity[Name="${entity.name}"]`,
              details: OECD_COMMON_ERROR_RULES['CE-009'],
              suggestion: 'Name PEs as: "Entity Legal Name – Jurisdiction PE"'
            });
          }
        }
      }
    }
    
    return results;
  }

  private validateNumericFormats(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    for (const cbcReport of report.cbcBody.cbcReports) {
      const jurisdiction = cbcReport.resCountryCode;
      const summary = cbcReport.summary;
      
      // Check all numeric fields
      const numericFields = [
        { name: 'Revenues.Unrelated', value: summary.revenues?.unrelated },
        { name: 'Revenues.Related', value: summary.revenues?.related },
        { name: 'Revenues.Total', value: summary.revenues?.total },
        { name: 'ProfitOrLoss', value: summary.profitOrLoss },
        { name: 'TaxPaid', value: summary.taxPaid },
        { name: 'TaxAccrued', value: summary.taxAccrued },
        { name: 'Capital', value: summary.capital },
        { name: 'AccumulatedEarnings', value: summary.accumulatedEarnings },
        { name: 'TangibleAssets', value: summary.tangibleAssets }
      ];
      
      for (const field of numericFields) {
        if (field.value !== undefined && field.value !== null) {
          const valueStr = String(field.value);
          
          // CE-010: Decimals
          if (valueStr.includes('.') || valueStr.includes(',')) {
            results.push({
              ruleId: 'CE-010',
              category: ValidationCategory.DATA_QUALITY,
              severity: ValidationSeverity.ERROR,
              message: `Decimal found in ${field.name} for ${jurisdiction}: ${valueStr}`,
              xpath: `//CbcReports[ResCountryCode="${jurisdiction}"]/Summary/${field.name.split('.')[0]}`,
              details: OECD_COMMON_ERROR_RULES['CE-010'],
              suggestion: 'Round to nearest whole unit. No decimals allowed.'
            });
          }
          
          // CE-011: Shortened numbers (heuristic: unusually small for MNE)
          const numValue = Math.abs(Number(field.value));
          if (numValue > 0 && numValue < 10000 && field.name !== 'NbEmployees') {
            results.push({
              ruleId: 'CE-011',
              category: ValidationCategory.DATA_QUALITY,
              severity: ValidationSeverity.WARNING,
              message: `${field.name} for ${jurisdiction} appears unusually small (${valueStr}). Check if amounts are in thousands/millions.`,
              xpath: `//CbcReports[ResCountryCode="${jurisdiction}"]/Summary/${field.name.split('.')[0]}`,
              details: OECD_COMMON_ERROR_RULES['CE-011'],
              suggestion: 'Ensure full amounts are reported, not abbreviated.'
            });
          }
        }
      }
      
      // CE-012: Revenue sum check
      const unrelated = Number(summary.revenues?.unrelated) || 0;
      const related = Number(summary.revenues?.related) || 0;
      const total = Number(summary.revenues?.total) || 0;
      
      if (total !== 0 && Math.abs(total - (unrelated + related)) > 1) {
        results.push({
          ruleId: 'CE-012',
          category: ValidationCategory.DATA_QUALITY,
          severity: ValidationSeverity.CRITICAL,
          message: `Revenue sum mismatch for ${jurisdiction}: Total (${total}) ≠ Unrelated (${unrelated}) + Related (${related})`,
          xpath: `//CbcReports[ResCountryCode="${jurisdiction}"]/Summary/Revenues`,
          details: OECD_COMMON_ERROR_RULES['CE-012'],
          suggestion: 'Total Revenues must equal Related + Unrelated revenues.'
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
          details: OECD_COMMON_ERROR_RULES['CE-014'],
          suggestion: 'Revenue figures must be positive integers.'
        });
      }
    }
    
    // CE-013: Currency consistency (check if all same)
    const currencies = new Set<string>();
    // Note: Currency would be extracted from report metadata
    // Implementation depends on how currency is stored in parsed report
    
    return results;
  }

  private validateDividendExclusion(report: ParsedCbcReport): ValidationResult[] {
    // CE-015 and CE-016: These require knowledge of inter-company dividends
    // which may not be directly visible in CbC data
    // Implementation could flag for manual review or use heuristics
    
    const results: ValidationResult[] = [];
    
    // Add info-level reminder about dividend exclusion
    results.push({
      ruleId: 'CE-015',
      category: ValidationCategory.DATA_QUALITY,
      severity: ValidationSeverity.INFO,
      message: 'Reminder: Ensure dividends from Constituent Entities are excluded from Revenues (OECD May 2024 guidance)',
      details: OECD_COMMON_ERROR_RULES['CE-015'],
      suggestion: 'Verify dividend exclusion with your tax/accounting team.'
    });
    
    results.push({
      ruleId: 'CE-016',
      category: ValidationCategory.DATA_QUALITY,
      severity: ValidationSeverity.INFO,
      message: 'Reminder: Ensure dividends from Constituent Entities are excluded from Profit/Loss before Tax',
      details: OECD_COMMON_ERROR_RULES['CE-016'],
      suggestion: 'Treatment must be consistent with Revenue exclusion.'
    });
    
    return results;
  }

  private validateDatePeriods(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    const reportingPeriod = report.messageSpec.reportingPeriod;
    
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
          details: OECD_COMMON_ERROR_RULES['CE-024'],
          suggestion: 'ReportingPeriod should be the last day of the MNE fiscal year.'
        });
      }
    }
    
    // CE-026: Long accounting period (check AcctPeriod if available)
    const startDate = report.cbcBody.cbcReports[0]?.acctPeriodStart;
    const endDate = report.cbcBody.cbcReports[0]?.acctPeriodEnd;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      
      if (monthsDiff > 12) {
        results.push({
          ruleId: 'CE-026',
          category: ValidationCategory.BUSINESS_RULES,
          severity: ValidationSeverity.WARNING,
          message: `Accounting period spans ${monthsDiff} months (${startDate} to ${endDate}). This exceeds 12 months.`,
          xpath: '//CbcReports/AcctPeriod',
          details: OECD_COMMON_ERROR_RULES['CE-026'],
          suggestion: 'Consider splitting into separate CbC reports or explain in Table 3.'
        });
      }
    }
    
    return results;
  }

  private validateBusinessActivities(report: ParsedCbcReport): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    for (const cbcReport of report.cbcBody.cbcReports) {
      for (const entity of cbcReport.constEntities) {
        // CE-027: CBC513 (Other) without explanation
        if (entity.bizActivities?.includes('CBC513')) {
          if (!entity.otherEntityInfo || entity.otherEntityInfo.trim() === '') {
            results.push({
              ruleId: 'CE-027',
              category: ValidationCategory.DATA_QUALITY,
              severity: ValidationSeverity.WARNING,
              message: `Entity "${entity.name}" uses CBC513 (Other) without explanation`,
              xpath: `//ConstEntity[Name="${entity.name}"]/BizActivities`,
              details: OECD_COMMON_ERROR_RULES['CE-027'],
              suggestion: 'Add explanation in OtherEntityInfo or Table 3.'
            });
          }
        }
      }
    }
    
    // CE-028: Missing data source explanation
    if (!report.additionalInfo || report.additionalInfo.length === 0) {
      results.push({
        ruleId: 'CE-028',
        category: ValidationCategory.DATA_QUALITY,
        severity: ValidationSeverity.INFO,
        message: 'Table 3 (Additional Information) is empty. Consider adding data source explanation.',
        xpath: '//AdditionalInfo',
        details: OECD_COMMON_ERROR_RULES['CE-028'],
        suggestion: 'Explain whether data came from consolidation packages, statutory accounts, or other sources.'
      });
    }
    
    return results;
  }
}

export const commonErrorsValidator = new CommonErrorsValidator();
```

---

## PART 3: How to Integrate Into Your Prompts

### Option A: Add to Existing Prompt 7

Modify **Prompt 7** to include:

```
Also create src/lib/validators/quality/common-errors-validator.ts that implements 
the 28 OECD common errors (CE-001 to CE-028). Reference the OECD_COMMON_ERROR_RULES 
constants. This validator should check:

1. TIN errors (missing, invalid NOTIN, duplicates, missing issuedBy)
2. Table 1/2/3 consistency (jurisdiction mismatch, missing entities, PE naming)
3. Numeric formats (decimals, shortened numbers, revenue sum mismatch)
4. Dividend exclusion reminders (May 2024 OECD guidance)
5. Date/period validation (fiscal year end, long accounting periods)
6. Business activity errors (CBC513 without explanation, missing data sources)
```

### Option B: Create New Prompt 7.5

Insert between Prompt 7 and 8:

```
Create an OECD Common Errors validator based on the official OECD document 
"Common errors made by MNE groups in preparing Country-by-Country Reports".

1. Add OECD_COMMON_ERROR_RULES to src/constants/validation-rules.ts with 28 rules (CE-001 to CE-028)

2. Create src/lib/validators/quality/common-errors-validator.ts implementing all 28 checks

3. Integrate CommonErrorsValidator into the QualityValidator class

4. Update ValidationCategory enum if needed to include OECD_COMMON_ERRORS

The validator should provide actionable suggestions based on OECD guidance references.
```

---

## PART 4: Update Your Technical Specification

Add a new section to your `CbCR_XML_Validation_Technical_Specification.docx`:

**Section 13: OECD Common Errors (28 Rules)**

Include the table of all CE-001 to CE-028 rules with:
- Rule ID
- Category
- Severity
- Description
- Correct Treatment
- OECD Reference

---

## Summary of Changes

| File | Action |
|------|--------|
| `src/constants/validation-rules.ts` | Add `OECD_COMMON_ERROR_RULES` object |
| `src/lib/validators/quality/common-errors-validator.ts` | Create new validator |
| `src/lib/validators/quality/index.ts` | Export CommonErrorsValidator |
| `src/lib/validators/core/validator.ts` | Add CommonErrorsValidator to pipeline |
| `docs/CbCR_XML_Validation_Technical_Specification.docx` | Add Section 13 |

Would you like me to create an updated Technical Specification document that includes these 28 OECD Common Errors?
