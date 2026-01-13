/**
 * Excel to TypeScript Transformer
 *
 * Transforms parsed Excel data into strongly-typed CbC Report interfaces.
 * Produces the same ParsedCbcReport structure as the XML transformer.
 *
 * @module lib/parsers/excel-transformer
 */

import type {
  CbcMessage,
  MessageSpec,
  MessageType,
  MessageTypeIndic,
  DocSpec,
  DocTypeIndic,
  CbcBody,
  ReportingEntity,
  CbcReport,
  Summary,
  ConstEntities,
  ConstituentEntity,
  AdditionalInfo,
  TIN,
  Name,
  Address,
  BizActivityCode,
  MonetaryAmount,
  ParsedCbcReport,
  CountryCode,
} from '@/types/cbcr';
import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import type {
  ExcelParsedData,
  ExcelSummaryRow,
  ExcelEntityRow,
  ExcelAdditionalInfoRow,
} from '@/types/file-upload';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of transformation operation
 */
export type TransformResult =
  | { success: true; data: ParsedCbcReport; warnings: ValidationResult[] }
  | { success: false; errors: ValidationResult[] };

/**
 * Transformation context for tracking issues
 */
interface TransformContext {
  warnings: ValidationResult[];
  currentPath: string[];
  currency: string;
  docRefCounter: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique DocRefId
 */
function generateDocRefId(
  ctx: TransformContext,
  jurisdiction: string,
  type: 'RE' | 'RPT'
): string {
  ctx.docRefCounter++;
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `EXCEL${timestamp}-${type}-${jurisdiction}-${ctx.docRefCounter.toString().padStart(3, '0')}`;
}

/**
 * Add a warning to the context
 */
function addWarning(
  ctx: TransformContext,
  ruleId: string,
  message: string,
  severity: ValidationSeverity = ValidationSeverity.WARNING
): void {
  ctx.warnings.push({
    ruleId,
    category: ValidationCategory.DATA_QUALITY,
    severity,
    message,
    xpath: ctx.currentPath.join('/'),
  });
}

/**
 * Create a MonetaryAmount from a number
 */
function createMonetaryAmount(
  value: number | null | undefined,
  currency?: string
): MonetaryAmount {
  return {
    value: value ?? 0,
    currCode: currency,
  };
}

/**
 * Parse business activity codes from a comma-separated string
 */
function parseActivityCodes(activities: string | null | undefined): BizActivityCode[] {
  if (!activities) return [];

  const validCodes = [
    'CBC501', 'CBC502', 'CBC503', 'CBC504', 'CBC505',
    'CBC506', 'CBC507', 'CBC508', 'CBC509', 'CBC510',
    'CBC511', 'CBC512', 'CBC513',
  ];

  return activities
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter((code) => validCodes.includes(code)) as BizActivityCode[];
}

/**
 * Parse entity role code
 */
function parseRoleCode(role: string | null | undefined): 'CBC801' | 'CBC802' | 'CBC803' | 'CBC804' | undefined {
  if (!role) return undefined;

  const normalized = role.trim().toUpperCase();
  const validRoles = ['CBC801', 'CBC802', 'CBC803', 'CBC804'];

  if (validRoles.includes(normalized)) {
    return normalized as 'CBC801' | 'CBC802' | 'CBC803' | 'CBC804';
  }

  // Try to match by name
  const roleMap: Record<string, 'CBC801' | 'CBC802' | 'CBC803' | 'CBC804'> = {
    'UPE': 'CBC801',
    'ULTIMATE PARENT': 'CBC801',
    'SPE': 'CBC802',
    'SURROGATE PARENT': 'CBC802',
    'OTHER': 'CBC803',
    'NONE': 'CBC804',
  };

  return roleMap[normalized];
}

/**
 * Normalize country code
 */
function normalizeCountryCode(code: string | null | undefined): string {
  if (!code) return '';
  return code.trim().toUpperCase().substring(0, 2);
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

/**
 * Transform header data to MessageSpec
 */
function transformMessageSpec(
  headerData: Record<string, string | number | null>,
  ctx: TransformContext
): MessageSpec {
  ctx.currentPath.push('MessageSpec');

  const sendingAuth = normalizeCountryCode(headerData.sendingAuthority as string);
  const receivingAuth = normalizeCountryCode(headerData.receivingAuthority as string) || sendingAuth;

  // Message type
  const messageTypeRaw = (headerData.messageType as string) || 'CBC401';
  const messageType: MessageType = messageTypeRaw === 'CBC402' ? 'CBC402' : 'CBC401';

  // MessageTypeIndic
  const messageTypeIndicRaw = (headerData.messageTypeIndic as string) || 'CBC701';
  const messageTypeIndic: MessageTypeIndic =
    messageTypeIndicRaw === 'CBC702' ? 'CBC702' : 'CBC701';

  // Generate MessageRefId if not provided
  const messageRefId =
    (headerData.messageRefId as string) ||
    `EXCEL-${sendingAuth || 'XX'}${new Date().toISOString().split('T')[0].replace(/-/g, '')}-001`;

  // Reporting period
  const reportingPeriod = (headerData.reportingPeriod as string) || '';

  const messageSpec: MessageSpec = {
    sendingCompetentAuthority: sendingAuth || 'XX',
    receivingCompetentAuthority: receivingAuth || sendingAuth || 'XX',
    messageType,
    messageRefId,
    messageTypeIndic,
    reportingPeriod,
    timestamp: new Date().toISOString(),
  };

  // Optional fields
  const language = headerData.language as string;
  if (language) {
    messageSpec.language = language.toUpperCase().substring(0, 2);
  }

  // Contact info
  const contactName = headerData.contactName as string;
  const contactPhone = headerData.contactPhone as string;
  const contactEmail = headerData.contactEmail as string;

  if (contactName || contactPhone || contactEmail) {
    messageSpec.contact = {
      name: contactName || undefined,
      phone: contactPhone || undefined,
      email: contactEmail || undefined,
    };
  }

  // Validation
  if (!sendingAuth) {
    addWarning(ctx, 'EXCEL-001', 'Sending Authority is missing in Header sheet', ValidationSeverity.ERROR);
  }

  if (!reportingPeriod) {
    addWarning(ctx, 'EXCEL-002', 'Reporting Period is missing in Header sheet', ValidationSeverity.ERROR);
  }

  ctx.currentPath.pop();
  return messageSpec;
}

/**
 * Transform header data to ReportingEntity
 */
function transformReportingEntity(
  headerData: Record<string, string | number | null>,
  ctx: TransformContext
): ReportingEntity {
  ctx.currentPath.push('ReportingEntity');

  const upeName = (headerData.upeName as string) || 'Unknown UPE';
  const upeTin = headerData.upeTin as string;
  const upeTinCountry = normalizeCountryCode(headerData.upeTinCountry as string) ||
    normalizeCountryCode(headerData.sendingAuthority as string);

  const docSpec: DocSpec = {
    docTypeIndic: 'OECD1' as DocTypeIndic,
    docRefId: generateDocRefId(ctx, upeTinCountry || 'XX', 'RE'),
  };

  const reportingEntity: ReportingEntity = {
    docSpec,
    name: [{ value: upeName }],
    reportingRole: 'CBC801', // Ultimate Parent Entity
  };

  // Add TIN if provided
  if (upeTin) {
    reportingEntity.tin = [
      {
        value: upeTin,
        issuedBy: upeTinCountry || undefined,
      },
    ];
  }

  if (!upeName || upeName === 'Unknown UPE') {
    addWarning(ctx, 'EXCEL-003', 'UPE Name is missing in Header sheet', ValidationSeverity.WARNING);
  }

  ctx.currentPath.pop();
  return reportingEntity;
}

/**
 * Transform a summary row to Summary
 */
function transformSummary(row: ExcelSummaryRow, ctx: TransformContext): Summary {
  ctx.currentPath.push(`Summary[${row.jurisdiction}]`);

  const summary: Summary = {
    totalRevenues: createMonetaryAmount(row.totalRevenue, ctx.currency),
    profitOrLoss: createMonetaryAmount(row.profitOrLoss, ctx.currency),
    taxPaid: createMonetaryAmount(row.taxPaid, ctx.currency),
    taxAccrued: createMonetaryAmount(row.taxAccrued, ctx.currency),
    capital: createMonetaryAmount(row.capital, ctx.currency),
    accumulatedEarnings: createMonetaryAmount(row.accumulatedEarnings, ctx.currency),
    numberOfEmployees: row.numberOfEmployees ?? 0,
    tangibleAssets: createMonetaryAmount(row.tangibleAssets, ctx.currency),
  };

  // Add optional revenues
  if (row.unrelatedRevenue !== null && row.unrelatedRevenue !== undefined) {
    summary.unrelatedRevenues = createMonetaryAmount(row.unrelatedRevenue, ctx.currency);
  }

  if (row.relatedRevenue !== null && row.relatedRevenue !== undefined) {
    summary.relatedRevenues = createMonetaryAmount(row.relatedRevenue, ctx.currency);
  }

  ctx.currentPath.pop();
  return summary;
}

/**
 * Transform an entity row to ConstituentEntity
 */
function transformConstituentEntity(
  row: ExcelEntityRow,
  ctx: TransformContext
): ConstituentEntity {
  ctx.currentPath.push(`Entity[${row.entityName}]`);

  const entity: ConstituentEntity = {
    name: [{ value: row.entityName }],
  };

  // TIN
  if (row.tin) {
    entity.tin = [
      {
        value: row.tin,
        issuedBy: normalizeCountryCode(row.tinIssuedBy) || normalizeCountryCode(row.jurisdiction) || undefined,
      },
    ];
  }

  // Address
  if (row.address) {
    entity.address = [
      {
        countryCode: normalizeCountryCode(row.jurisdiction) || '',
        addressFree: { value: row.address },
      },
    ];
  }

  // Incorporation country
  const incCountry = normalizeCountryCode(row.incorporationCountry);
  if (incCountry && incCountry !== normalizeCountryCode(row.jurisdiction)) {
    entity.incorpCountryCode = incCountry;
  }

  // Business activities
  const activities = parseActivityCodes(row.activities);
  if (activities.length > 0) {
    entity.bizActivities = activities;
  }

  // Role
  const role = parseRoleCode(row.role);
  if (role) {
    entity.role = role;
  }

  // Other info
  if (row.otherInfo) {
    entity.otherEntityInfo = row.otherInfo;
  }

  ctx.currentPath.pop();
  return entity;
}

/**
 * Transform entity rows grouped by jurisdiction to ConstEntities
 */
function transformConstEntities(
  entities: ExcelEntityRow[],
  ctx: TransformContext
): ConstEntities {
  return {
    constituentEntity: entities.map((row) => transformConstituentEntity(row, ctx)),
  };
}

/**
 * Transform summary and entity rows to CbcReport
 */
function transformCbcReport(
  summaryRow: ExcelSummaryRow,
  entityRows: ExcelEntityRow[],
  ctx: TransformContext
): CbcReport {
  const jurisdiction = normalizeCountryCode(summaryRow.jurisdiction);
  ctx.currentPath.push(`CbcReport[${jurisdiction}]`);

  const docSpec: DocSpec = {
    docTypeIndic: 'OECD1' as DocTypeIndic,
    docRefId: generateDocRefId(ctx, jurisdiction, 'RPT'),
  };

  const cbcReport: CbcReport = {
    docSpec,
    resCountryCode: jurisdiction,
    summary: transformSummary(summaryRow, ctx),
    constEntities: transformConstEntities(entityRows, ctx),
  };

  ctx.currentPath.pop();
  return cbcReport;
}

/**
 * Transform additional info rows to AdditionalInfo array
 */
function transformAdditionalInfo(
  rows: ExcelAdditionalInfoRow[],
  ctx: TransformContext
): AdditionalInfo[] {
  return rows.map((row) => {
    const additionalInfo: AdditionalInfo = {
      docSpec: {
        docTypeIndic: 'OECD1' as DocTypeIndic,
        docRefId: generateDocRefId(ctx, 'AI', 'RPT'),
      },
      otherInfo: [{ value: row.notes }],
    };

    // Parse country codes
    if (row.countryCodes) {
      const codes = row.countryCodes
        .split(',')
        .map((c) => normalizeCountryCode(c))
        .filter((c) => c.length === 2);

      if (codes.length > 0) {
        additionalInfo.resCountryCode = codes as CountryCode[];
      }
    }

    return additionalInfo;
  });
}

// =============================================================================
// MAIN TRANSFORMER
// =============================================================================

/**
 * Transform Excel parsed data to ParsedCbcReport
 *
 * @param excelData - Parsed Excel data from excel-parser
 * @param fileName - Original file name
 * @param fileSize - File size in bytes
 * @returns TransformResult with ParsedCbcReport or errors
 */
export function transformExcelToCbcReport(
  excelData: ExcelParsedData,
  fileName: string,
  fileSize: number = 0
): TransformResult {
  const ctx: TransformContext = {
    warnings: [],
    currentPath: [],
    currency: excelData.currency || 'EUR',
    docRefCounter: 0,
  };

  try {
    // Validate minimum data requirements
    if (excelData.summaryRows.length === 0) {
      return {
        success: false,
        errors: [
          {
            ruleId: 'EXCEL-010',
            category: ValidationCategory.BUSINESS_RULES,
            severity: ValidationSeverity.CRITICAL,
            message: 'No jurisdiction summary data found in Excel file',
            xpath: 'Table1_Summary',
          },
        ],
      };
    }

    // Transform MessageSpec
    const messageSpec = transformMessageSpec(excelData.headerData, ctx);

    // Transform ReportingEntity
    const reportingEntity = transformReportingEntity(excelData.headerData, ctx);

    // Group entities by jurisdiction
    const entitiesByJurisdiction = new Map<string, ExcelEntityRow[]>();
    for (const entity of excelData.entityRows) {
      const jurisdiction = normalizeCountryCode(entity.jurisdiction);
      if (!jurisdiction) continue;

      if (!entitiesByJurisdiction.has(jurisdiction)) {
        entitiesByJurisdiction.set(jurisdiction, []);
      }
      entitiesByJurisdiction.get(jurisdiction)!.push(entity);
    }

    // Transform CbcReports
    const cbcReports: CbcReport[] = excelData.summaryRows.map((summaryRow) => {
      const jurisdiction = normalizeCountryCode(summaryRow.jurisdiction);
      const entities = entitiesByJurisdiction.get(jurisdiction) || [];
      return transformCbcReport(summaryRow, entities, ctx);
    });

    // Check for entities without matching summary rows
    const summaryJurisdictions = new Set(
      excelData.summaryRows.map((r) => normalizeCountryCode(r.jurisdiction))
    );
    for (const entity of excelData.entityRows) {
      const jurisdiction = normalizeCountryCode(entity.jurisdiction);
      if (jurisdiction && !summaryJurisdictions.has(jurisdiction)) {
        addWarning(
          ctx,
          'EXCEL-011',
          `Entity "${entity.entityName}" has jurisdiction ${jurisdiction} but no matching summary row`,
          ValidationSeverity.WARNING
        );
      }
    }

    // Build CbcBody
    const cbcBody: CbcBody = {
      reportingEntity,
      cbcReports,
    };

    // Transform AdditionalInfo if present
    if (excelData.additionalInfoRows && excelData.additionalInfoRows.length > 0) {
      cbcBody.additionalInfo = transformAdditionalInfo(
        excelData.additionalInfoRows,
        ctx
      );
    }

    // Build CbcMessage
    const message: CbcMessage = {
      version: '2.0',
      messageSpec,
      cbcBody,
    };

    // Build ParsedCbcReport
    const parsedReport: ParsedCbcReport = {
      fileName,
      fileSize,
      parsedAt: new Date().toISOString(),
      message,
      parsingWarnings: ctx.warnings
        .filter((w) => w.severity === ValidationSeverity.WARNING)
        .map((w) => w.message),
    };

    return {
      success: true,
      data: parsedReport,
      warnings: ctx.warnings,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      errors: [
        {
          ruleId: 'EXCEL-999',
          category: ValidationCategory.XML_WELLFORMEDNESS,
          severity: ValidationSeverity.CRITICAL,
          message: `Failed to transform Excel data: ${errorMessage}`,
          xpath: ctx.currentPath.join('/'),
        },
      ],
    };
  }
}
