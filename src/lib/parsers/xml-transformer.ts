/**
 * XML to TypeScript Transformer
 *
 * Transforms parsed XML objects into strongly-typed CbC Report interfaces.
 * Handles optional elements, normalizes data formats, and provides
 * comprehensive error handling.
 *
 * @module lib/parsers/xml-transformer
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
  ReportingRole,
  CbcReport,
  Summary,
  ConstEntities,
  ConstituentEntity,
  AdditionalInfo,
  TIN,
  IN,
  Name,
  Address,
  AddressFix,
  Contact,
  Warning,
  OtherInfo,
  BizActivityCode,
  MonetaryAmount,
  ParsedCbcReport,
} from '@/types/cbcr';
import { ValidationResult, ValidationCategory, ValidationSeverity } from '@/types/validation';
import { parseXmlToObject, findRootElement, getXPathValue } from './xml-parser';

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
 * Transformation context for tracking path and issues
 */
interface TransformContext {
  warnings: ValidationResult[];
  currentPath: string[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely get a string value from an object
 */
function getString(obj: unknown, key: string, defaultValue: string = ''): string {
  if (!obj || typeof obj !== 'object') return defaultValue;
  const record = obj as Record<string, unknown>;
  
  // Try direct key
  let value = record[key];
  
  // Try with namespace prefixes
  if (value === undefined) {
    const prefixes = ['cbc:', 'stf:', 'iso:'];
    for (const prefix of prefixes) {
      if (record[prefix + key] !== undefined) {
        value = record[prefix + key];
        break;
      }
    }
  }
  
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && '#text' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)['#text']).trim();
  }
  
  return defaultValue;
}

/**
 * Safely get a number value from an object
 */
function getNumber(obj: unknown, key: string, defaultValue: number = 0): number {
  const strValue = getString(obj, key);
  if (!strValue) return defaultValue;
  
  // Remove thousands separators and normalize decimal
  const normalized = strValue.replace(/,/g, '').replace(/\s/g, '');
  const parsed = parseFloat(normalized);
  
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely get an object or array from parsed XML
 */
function getObject(obj: unknown, key: string): Record<string, unknown> | null {
  if (!obj || typeof obj !== 'object') return null;
  const record = obj as Record<string, unknown>;
  
  // Try direct key
  let value = record[key];
  
  // Try with namespace prefixes
  if (value === undefined) {
    const prefixes = ['cbc:', 'stf:', 'iso:'];
    for (const prefix of prefixes) {
      if (record[prefix + key] !== undefined) {
        value = record[prefix + key];
        break;
      }
    }
  }
  
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  
  return null;
}

/**
 * Safely get an array from parsed XML
 */
function getArray(obj: unknown, key: string): unknown[] {
  const value = getObject(obj, key);
  if (value === null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

/**
 * Normalize date string to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Already in correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse and reformat
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Return original if parsing fails
  }
  
  return dateStr;
}

/**
 * Normalize timestamp to ISO format
 */
function normalizeTimestamp(timestamp: string): string {
  if (!timestamp) return new Date().toISOString();
  
  // Already in ISO format
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp)) {
    return timestamp;
  }
  
  // Try to parse
  try {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch {
    // Return current timestamp if parsing fails
  }
  
  return new Date().toISOString();
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
    xpath: '/' + ctx.currentPath.join('/'),
  });
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

/**
 * Transform DocSpec element
 */
function transformDocSpec(obj: unknown, ctx: TransformContext): DocSpec {
  ctx.currentPath.push('DocSpec');
  
  const docTypeIndicRaw = getString(obj, 'DocTypeIndic', 'OECD1');
  const validDocTypes: DocTypeIndic[] = ['OECD0', 'OECD1', 'OECD2', 'OECD3', 'OECD10', 'OECD11', 'OECD12', 'OECD13'];
  const docTypeIndic: DocTypeIndic = validDocTypes.includes(docTypeIndicRaw as DocTypeIndic)
    ? (docTypeIndicRaw as DocTypeIndic)
    : 'OECD1';
  
  const docSpec: DocSpec = {
    docTypeIndic,
    docRefId: getString(obj, 'DocRefId'),
  };
  
  // Optional correction references
  const corrDocRefId = getString(obj, 'CorrDocRefId');
  if (corrDocRefId) docSpec.corrDocRefId = corrDocRefId;
  
  const corrMessageRefId = getString(obj, 'CorrMessageRefId');
  if (corrMessageRefId) docSpec.corrMessageRefId = corrMessageRefId;
  
  // Warn if DocRefId is missing
  if (!docSpec.docRefId) {
    addWarning(ctx, 'DOC-001', 'DocRefId is missing', ValidationSeverity.ERROR);
  }
  
  ctx.currentPath.pop();
  return docSpec;
}

/**
 * Transform TIN element
 */
function transformTin(obj: unknown): TIN {
  if (typeof obj === 'string') {
    return { value: obj };
  }
  
  const record = obj as Record<string, unknown>;
  return {
    value: getString(record, '#text') || getString(record, 'value', ''),
    issuedBy: getString(record, '@_issuedBy') || undefined,
  };
}

/**
 * Transform IN (Identification Number) element
 */
function transformIn(obj: unknown): IN {
  if (typeof obj === 'string') {
    return { value: obj };
  }
  
  const record = obj as Record<string, unknown>;
  return {
    value: getString(record, '#text') || getString(record, 'value', ''),
    issuedBy: getString(record, '@_issuedBy') || undefined,
    inType: getString(record, '@_INType') as IN['inType'] || undefined,
  };
}

/**
 * Transform Name element
 */
function transformName(obj: unknown): Name {
  if (typeof obj === 'string') {
    return { value: obj };
  }
  
  const record = obj as Record<string, unknown>;
  return {
    value: getString(record, '#text') || getString(record, 'value', ''),
    nameType: getString(record, '@_nameType') as Name['nameType'] || undefined,
  };
}

/**
 * Transform Address element
 */
function transformAddress(obj: unknown): Address {
  const record = obj as Record<string, unknown>;
  
  const address: Address = {
    countryCode: getString(record, 'CountryCode', getString(record, '@_CountryCode', '')),
  };
  
  // Address type
  const addressType = getString(record, '@_legalAddressType');
  if (addressType) {
    address.addressType = addressType as Address['addressType'];
  }
  
  // Check for AddressFix (structured address)
  const addressFix = getObject(record, 'AddressFix');
  if (addressFix) {
    const fix: AddressFix = {
      city: getString(addressFix, 'City', ''),
    };
    
    const street = getString(addressFix, 'Street');
    if (street) fix.street = street;
    
    const buildingId = getString(addressFix, 'BuildingIdentifier');
    if (buildingId) fix.buildingIdentifier = buildingId;
    
    const suiteId = getString(addressFix, 'SuiteIdentifier');
    if (suiteId) fix.suiteIdentifier = suiteId;
    
    const floorId = getString(addressFix, 'FloorIdentifier');
    if (floorId) fix.floorIdentifier = floorId;
    
    const districtName = getString(addressFix, 'DistrictName');
    if (districtName) fix.districtName = districtName;
    
    const pob = getString(addressFix, 'POB');
    if (pob) fix.pob = pob;
    
    const postCode = getString(addressFix, 'PostCode');
    if (postCode) fix.postCode = postCode;
    
    const countrySubentity = getString(addressFix, 'CountrySubentity');
    if (countrySubentity) fix.countrySubentity = countrySubentity;
    
    address.addressFix = fix;
  }
  
  // Check for AddressFree (unstructured address)
  const addressFree = getString(record, 'AddressFree');
  if (addressFree && !addressFix) {
    address.addressFree = { value: addressFree };
  }
  
  return address;
}

/**
 * Transform Contact element
 */
function transformContact(obj: unknown): Contact {
  const record = obj as Record<string, unknown>;
  
  return {
    name: getString(record, 'Name') || undefined,
    phone: getString(record, 'Phone') || undefined,
    email: getString(record, 'Email') || undefined,
  };
}

/**
 * Transform Warning element
 */
function transformWarning(obj: unknown): Warning {
  if (typeof obj === 'string') {
    return { text: obj };
  }
  
  const record = obj as Record<string, unknown>;
  return {
    text: getString(record, '#text') || getString(record, 'value', ''),
  };
}

/**
 * Transform MessageSpec element
 */
function transformMessageSpec(obj: unknown, ctx: TransformContext): MessageSpec {
  ctx.currentPath.push('MessageSpec');
  
  const record = obj as Record<string, unknown>;
  
  // Message type validation
  const messageTypeRaw = getString(record, 'MessageType', 'CBC401');
  const messageType: MessageType = messageTypeRaw === 'CBC402' ? 'CBC402' : 'CBC401';
  
  // MessageTypeIndic validation
  const messageTypeIndicRaw = getString(record, 'MessageTypeIndic', 'CBC701');
  const messageTypeIndic: MessageTypeIndic = messageTypeIndicRaw === 'CBC702' ? 'CBC702' : 'CBC701';
  
  const messageSpec: MessageSpec = {
    sendingCompetentAuthority: getString(record, 'SendingCompetentAuthority'),
    receivingCompetentAuthority: getString(record, 'ReceivingCompetentAuthority'),
    messageType,
    messageRefId: getString(record, 'MessageRefId'),
    messageTypeIndic,
    reportingPeriod: normalizeDate(getString(record, 'ReportingPeriod')),
    timestamp: normalizeTimestamp(getString(record, 'Timestamp')),
  };
  
  // Optional fields
  const language = getString(record, 'Language');
  if (language) messageSpec.language = language;
  
  const corrMessageRefId = getString(record, 'CorrMessageRefId');
  if (corrMessageRefId) messageSpec.corrMessageRefId = corrMessageRefId;
  
  // Contact
  const contactObj = getObject(record, 'Contact');
  if (contactObj) {
    messageSpec.contact = transformContact(contactObj);
  }
  
  // Warnings
  const warningArray = getArray(record, 'Warning');
  if (warningArray.length > 0) {
    messageSpec.warning = warningArray.map(transformWarning);
  }
  
  // Validation warnings
  if (!messageSpec.messageRefId) {
    addWarning(ctx, 'MSG-001', 'MessageRefId is missing', ValidationSeverity.ERROR);
  }
  
  if (!messageSpec.sendingCompetentAuthority) {
    addWarning(ctx, 'MSG-008', 'SendingCompetentAuthority is missing', ValidationSeverity.ERROR);
  }
  
  ctx.currentPath.pop();
  return messageSpec;
}

/**
 * Transform MonetaryAmount from various formats
 */
function transformMonetaryAmount(value: unknown): MonetaryAmount {
  if (typeof value === 'number') {
    return { value };
  }
  
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').replace(/\s/g, '');
    return { value: parseFloat(normalized) || 0 };
  }
  
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const numValue = getString(record, '#text') || getString(record, 'value', '0');
    const currCode = getString(record, '@_currCode');
    
    return {
      value: parseFloat(numValue.replace(/,/g, '')) || 0,
      currCode: currCode || undefined,
    };
  }
  
  return { value: 0 };
}

/**
 * Transform Summary element (Table 1)
 */
function transformSummary(obj: unknown, ctx: TransformContext): Summary {
  ctx.currentPath.push('Summary');
  
  const record = obj as Record<string, unknown>;
  
  // Get Revenues sub-element
  const revenues = getObject(record, 'Revenues');
  
  const summary: Summary = {
    totalRevenues: transformMonetaryAmount(
      revenues ? getObject(revenues, 'Total') : getObject(record, 'TotalRevenues')
    ),
    profitOrLoss: transformMonetaryAmount(getObject(record, 'ProfitOrLoss')),
    taxPaid: transformMonetaryAmount(getObject(record, 'TaxPaid')),
    taxAccrued: transformMonetaryAmount(getObject(record, 'TaxAccrued')),
    capital: transformMonetaryAmount(getObject(record, 'Capital')),
    accumulatedEarnings: transformMonetaryAmount(getObject(record, 'AccumulatedEarnings')),
    numberOfEmployees: getNumber(record, 'NbEmployees', 0),
    tangibleAssets: transformMonetaryAmount(getObject(record, 'Assets')),
  };
  
  // Optional unrelated/related revenues
  if (revenues) {
    const unrelated = getObject(revenues, 'Unrelated');
    if (unrelated) summary.unrelatedRevenues = transformMonetaryAmount(unrelated);
    
    const related = getObject(revenues, 'Related');
    if (related) summary.relatedRevenues = transformMonetaryAmount(related);
  }
  
  ctx.currentPath.pop();
  return summary;
}

/**
 * Transform ConstituentEntity element
 */
function transformConstituentEntity(obj: unknown, ctx: TransformContext): ConstituentEntity {
  ctx.currentPath.push('ConstituentEntity');
  
  const record = obj as Record<string, unknown>;
  
  // Names (required, at least one)
  const nameArray = getArray(record, 'Name');
  const names: Name[] = nameArray.length > 0
    ? nameArray.map(transformName)
    : [{ value: '' }];
  
  const entity: ConstituentEntity = {
    name: names,
  };
  
  // TINs
  const tinArray = getArray(record, 'TIN');
  if (tinArray.length > 0) {
    entity.tin = tinArray.map(transformTin);
  }
  
  // INs
  const inArray = getArray(record, 'IN');
  if (inArray.length > 0) {
    entity.in = inArray.map(transformIn);
  }
  
  // Addresses
  const addressArray = getArray(record, 'Address');
  if (addressArray.length > 0) {
    entity.address = addressArray.map(transformAddress);
  }
  
  // Incorporation country
  const incorpCountry = getString(record, 'IncorpCountryCode');
  if (incorpCountry) entity.incorpCountryCode = incorpCountry;
  
  // Other entity info
  const otherInfo = getString(record, 'OtherEntityInfo');
  if (otherInfo) entity.otherEntityInfo = otherInfo;
  
  // Warn if no name
  if (names.length === 0 || !names[0].value) {
    addWarning(ctx, 'TIN-006', 'Constituent entity has no name', ValidationSeverity.ERROR);
  }
  
  ctx.currentPath.pop();
  return entity;
}

/**
 * Transform ConstEntities element (Table 2)
 */
function transformConstEntities(obj: unknown, ctx: TransformContext): ConstEntities {
  ctx.currentPath.push('ConstEntities');
  
  const record = obj as Record<string, unknown>;
  
  // Constituent entities
  const entityArray = getArray(record, 'ConstituentEntity');
  const entities = entityArray.map((e) => transformConstituentEntity(e, ctx));
  
  const constEntities: ConstEntities = {
    constituentEntity: entities,
  };
  
  // Business activities
  const bizActivitiesObj = getObject(record, 'BizActivities');
  if (bizActivitiesObj) {
    const activityArray = getArray(bizActivitiesObj, 'BizActivity');
    const validActivities: BizActivityCode[] = [
      'CBC501', 'CBC502', 'CBC503', 'CBC504', 'CBC505',
      'CBC506', 'CBC507', 'CBC508', 'CBC509', 'CBC510',
      'CBC511', 'CBC512', 'CBC513',
    ];
    
    constEntities.bizActivities = activityArray
      .map((a) => (typeof a === 'string' ? a : getString(a, '#text')))
      .filter((a): a is BizActivityCode => validActivities.includes(a as BizActivityCode));
  }
  
  ctx.currentPath.pop();
  return constEntities;
}

/**
 * Transform CbcReports element
 */
function transformCbcReport(obj: unknown, ctx: TransformContext): CbcReport {
  ctx.currentPath.push('CbcReports');
  
  const record = obj as Record<string, unknown>;
  
  // DocSpec
  const docSpecObj = getObject(record, 'DocSpec');
  const docSpec = docSpecObj ? transformDocSpec(docSpecObj, ctx) : {
    docTypeIndic: 'OECD1' as DocTypeIndic,
    docRefId: '',
  };
  
  // Summary
  const summaryObj = getObject(record, 'Summary');
  const summary = summaryObj ? transformSummary(summaryObj, ctx) : {
    totalRevenues: { value: 0 },
    profitOrLoss: { value: 0 },
    taxPaid: { value: 0 },
    taxAccrued: { value: 0 },
    capital: { value: 0 },
    accumulatedEarnings: { value: 0 },
    numberOfEmployees: 0,
    tangibleAssets: { value: 0 },
  };
  
  // ConstEntities
  const constEntitiesObj = getObject(record, 'ConstEntities');
  const constEntities = constEntitiesObj ? transformConstEntities(constEntitiesObj, ctx) : {
    constituentEntity: [],
  };
  
  const report: CbcReport = {
    docSpec,
    resCountryCode: getString(record, 'ResCountryCode'),
    summary,
    constEntities,
  };
  
  // Warn if no country code
  if (!report.resCountryCode) {
    addWarning(ctx, 'CC-002', 'ResCountryCode is missing in CbcReports', ValidationSeverity.ERROR);
  }
  
  ctx.currentPath.pop();
  return report;
}

/**
 * Transform ReportingEntity element
 */
function transformReportingEntity(obj: unknown, ctx: TransformContext): ReportingEntity {
  ctx.currentPath.push('ReportingEntity');
  
  const record = obj as Record<string, unknown>;
  
  // DocSpec
  const docSpecObj = getObject(record, 'DocSpec');
  const docSpec = docSpecObj ? transformDocSpec(docSpecObj, ctx) : {
    docTypeIndic: 'OECD1' as DocTypeIndic,
    docRefId: '',
  };
  
  // Reporting role
  const roleRaw = getString(record, 'ReportingRole', 'CBC801');
  const validRoles: ReportingRole[] = ['CBC801', 'CBC802', 'CBC803'];
  const reportingRole: ReportingRole = validRoles.includes(roleRaw as ReportingRole)
    ? (roleRaw as ReportingRole)
    : 'CBC801';
  
  // Names
  const nameArray = getArray(record, 'Name');
  const names: Name[] = nameArray.length > 0
    ? nameArray.map(transformName)
    : [{ value: '' }];
  
  const entity: ReportingEntity = {
    docSpec,
    reportingRole,
    name: names,
  };
  
  // TINs
  const tinArray = getArray(record, 'TIN');
  if (tinArray.length > 0) {
    entity.tin = tinArray.map(transformTin);
  }
  
  // INs
  const inArray = getArray(record, 'IN');
  if (inArray.length > 0) {
    entity.in = inArray.map(transformIn);
  }
  
  // Addresses
  const addressArray = getArray(record, 'Address');
  if (addressArray.length > 0) {
    entity.address = addressArray.map(transformAddress);
  }
  
  // Date range
  const startDate = getString(record, 'ReportingPeriod.StartDate') || getString(record, 'StartDate');
  if (startDate) entity.startDate = normalizeDate(startDate);
  
  const endDate = getString(record, 'ReportingPeriod.EndDate') || getString(record, 'EndDate');
  if (endDate) entity.endDate = normalizeDate(endDate);
  
  ctx.currentPath.pop();
  return entity;
}

/**
 * Transform AdditionalInfo element
 */
function transformAdditionalInfo(obj: unknown, ctx: TransformContext): AdditionalInfo {
  ctx.currentPath.push('AdditionalInfo');
  
  const record = obj as Record<string, unknown>;
  
  // DocSpec
  const docSpecObj = getObject(record, 'DocSpec');
  const docSpec = docSpecObj ? transformDocSpec(docSpecObj, ctx) : {
    docTypeIndic: 'OECD1' as DocTypeIndic,
    docRefId: '',
  };
  
  // OtherInfo
  const otherInfoArray = getArray(record, 'OtherInfo');
  const otherInfo: OtherInfo[] = otherInfoArray.map((info) => {
    if (typeof info === 'string') {
      return { value: info };
    }
    const infoRecord = info as Record<string, unknown>;
    return {
      value: getString(infoRecord, '#text') || '',
      language: getString(infoRecord, '@_language') || undefined,
    };
  });
  
  const additionalInfo: AdditionalInfo = {
    docSpec,
    otherInfo: otherInfo.length > 0 ? otherInfo : [{ value: '' }],
  };
  
  // ResCountryCode (can be multiple)
  const countryArray = getArray(record, 'ResCountryCode');
  if (countryArray.length > 0) {
    additionalInfo.resCountryCode = countryArray.map((c) =>
      typeof c === 'string' ? c : getString(c, '#text')
    );
  }
  
  // SummaryRef
  const summaryRef = getString(record, 'SummaryRef');
  if (summaryRef) additionalInfo.summaryRef = summaryRef;
  
  ctx.currentPath.pop();
  return additionalInfo;
}

/**
 * Transform CbcBody element
 */
function transformCbcBody(obj: unknown, ctx: TransformContext): CbcBody {
  ctx.currentPath.push('CbcBody');
  
  const record = obj as Record<string, unknown>;
  
  // ReportingEntity
  const reportingEntityObj = getObject(record, 'ReportingEntity');
  const reportingEntity = reportingEntityObj
    ? transformReportingEntity(reportingEntityObj, ctx)
    : {
        docSpec: { docTypeIndic: 'OECD1' as DocTypeIndic, docRefId: '' },
        reportingRole: 'CBC801' as ReportingRole,
        name: [{ value: '' }],
      };
  
  // CbcReports
  const reportsArray = getArray(record, 'CbcReports');
  const cbcReports = reportsArray.map((r) => transformCbcReport(r, ctx));
  
  const body: CbcBody = {
    reportingEntity,
    cbcReports,
  };
  
  // AdditionalInfo
  const additionalInfoArray = getArray(record, 'AdditionalInfo');
  if (additionalInfoArray.length > 0) {
    body.additionalInfo = additionalInfoArray.map((a) => transformAdditionalInfo(a, ctx));
  }
  
  // Warn if no reports
  if (cbcReports.length === 0) {
    addWarning(ctx, 'SUM-001', 'No CbcReports found in the file', ValidationSeverity.ERROR);
  }
  
  ctx.currentPath.pop();
  return body;
}

// =============================================================================
// MAIN TRANSFORM FUNCTION
// =============================================================================

/**
 * Transform parsed XML to typed CbcMessage
 */
export function transformToCbcMessage(
  parsed: Record<string, unknown>,
  ctx: TransformContext
): CbcMessage | null {
  // Find root element
  const root = findRootElement(parsed);
  if (!root) {
    ctx.warnings.push({
      ruleId: 'APP-001',
      category: ValidationCategory.SCHEMA_COMPLIANCE,
      severity: ValidationSeverity.CRITICAL,
      message: 'Could not find CBC_OECD root element',
    });
    return null;
  }
  
  ctx.currentPath.push('CBC_OECD');
  
  // Extract version
  const version = getString(root, '@_version') || '2.0';
  
  // Transform MessageSpec
  const messageSpecObj = getObject(root, 'MessageSpec');
  if (!messageSpecObj) {
    ctx.warnings.push({
      ruleId: 'MSG-001',
      category: ValidationCategory.SCHEMA_COMPLIANCE,
      severity: ValidationSeverity.CRITICAL,
      message: 'MessageSpec element is missing',
      xpath: '/CBC_OECD',
    });
    return null;
  }
  const messageSpec = transformMessageSpec(messageSpecObj, ctx);
  
  // Transform CbcBody
  const cbcBodyObj = getObject(root, 'CbcBody');
  if (!cbcBodyObj) {
    ctx.warnings.push({
      ruleId: 'APP-001',
      category: ValidationCategory.SCHEMA_COMPLIANCE,
      severity: ValidationSeverity.CRITICAL,
      message: 'CbcBody element is missing',
      xpath: '/CBC_OECD',
    });
    return null;
  }
  const cbcBody = transformCbcBody(cbcBodyObj, ctx);
  
  ctx.currentPath.pop();
  
  return {
    version,
    messageSpec,
    cbcBody,
  };
}

/**
 * Transform XML content to ParsedCbcReport
 *
 * @param xmlContent - Raw XML string
 * @param fileName - Original file name
 * @param fileSize - File size in bytes
 * @returns TransformResult with typed data or errors
 */
export function transformXmlToCbcReport(
  xmlContent: string,
  fileName: string = 'unknown.xml',
  fileSize?: number
): TransformResult {
  const ctx: TransformContext = {
    warnings: [],
    currentPath: [],
  };
  
  // Parse XML to object
  const parsed = parseXmlToObject(xmlContent);
  if (!parsed) {
    return {
      success: false,
      errors: [{
        ruleId: 'APP-001',
        category: ValidationCategory.XML_WELLFORMEDNESS,
        severity: ValidationSeverity.CRITICAL,
        message: 'Failed to parse XML content',
      }],
    };
  }
  
  // Transform to typed structure
  const message = transformToCbcMessage(parsed, ctx);
  
  // Check for critical errors
  const criticalErrors = ctx.warnings.filter((w) => w.severity === ValidationSeverity.CRITICAL);
  if (criticalErrors.length > 0 || !message) {
    return {
      success: false,
      errors: ctx.warnings,
    };
  }
  
  // Build ParsedCbcReport
  const report: ParsedCbcReport = {
    fileName,
    fileSize: fileSize ?? xmlContent.length,
    parsedAt: new Date().toISOString(),
    message,
    parsingWarnings: ctx.warnings
      .filter((w) => w.severity !== ValidationSeverity.CRITICAL)
      .map((w) => w.message),
  };
  
  return {
    success: true,
    data: report,
    warnings: ctx.warnings.filter((w) => w.severity !== ValidationSeverity.CRITICAL),
  };
}

/**
 * Extract key metadata from parsed report for quick reference
 */
export function extractReportMetadata(report: ParsedCbcReport): {
  messageRefId: string;
  reportingPeriod: string;
  upeName: string;
  upeJurisdiction: string;
  jurisdictionCount: number;
  entityCount: number;
} {
  const messageSpec = report.message.messageSpec;
  const reportingEntity = report.message.cbcBody.reportingEntity;
  const cbcReports = report.message.cbcBody.cbcReports;
  
  return {
    messageRefId: messageSpec.messageRefId,
    reportingPeriod: messageSpec.reportingPeriod,
    upeName: reportingEntity.name[0]?.value ?? 'Unknown',
    upeJurisdiction: messageSpec.sendingCompetentAuthority,
    jurisdictionCount: cbcReports.length,
    entityCount: cbcReports.reduce(
      (sum, r) => sum + r.constEntities.constituentEntity.length,
      0
    ),
  };
}

