/**
 * CbCR (Country-by-Country Reporting) TypeScript Type Definitions
 * Based on OECD CbC XML Schema v2.0 (CbcXML_v2.0.xsd)
 *
 * Reference: OECD BEPS Action 13 - Guidance on the Implementation of
 * Country-by-Country Reporting
 *
 * @module types/cbcr
 */

// =============================================================================
// ISO STANDARD TYPES
// =============================================================================

/**
 * ISO 3166-1 Alpha-2 country code (2 letters)
 * @example "LU" for Luxembourg, "DE" for Germany
 */
export type CountryCode = string;

/**
 * ISO 639-1 language code (2 letters)
 * @example "en" for English, "fr" for French
 */
export type LanguageCode = string;

/**
 * ISO 4217 currency code (3 letters)
 * @example "EUR" for Euro, "USD" for US Dollar
 */
export type CurrencyCode = string;

// =============================================================================
// MESSAGE SPEC TYPES
// =============================================================================

/**
 * Message type codes as defined by OECD
 * - CBC401: Primary filing to the jurisdiction of tax residence
 * - CBC402: Filing to other jurisdictions (exchange or local filing)
 */
export type MessageType = 'CBC401' | 'CBC402';

/**
 * Indicates the type of message being submitted
 * - CBC701: New data (original submission)
 * - CBC702: Corrected data (corrections/amendments)
 */
export type MessageTypeIndic = 'CBC701' | 'CBC702';

/**
 * Contact information for the sending entity
 * Used for follow-up questions about the submission
 */
export interface Contact {
  /** Contact person's name */
  name?: string;
  /** Contact person's telephone number */
  phone?: string;
  /** Contact person's email address */
  email?: string;
}

/**
 * Warning message that can be included in the message specification
 * Used to communicate important information about the submission
 */
export interface Warning {
  /** Warning text content */
  text: string;
}

/**
 * Message specification containing envelope information
 * This is the header section of a CbCR XML file
 */
export interface MessageSpec {
  /**
   * ISO 3166-1 Alpha-2 code of the sending competent authority's jurisdiction
   * @example "LU" for Luxembourg Administration des Contributions Directes
   */
  sendingCompetentAuthority: CountryCode;

  /**
   * ISO 3166-1 Alpha-2 code of the receiving competent authority's jurisdiction
   * For CBC401 messages, this is typically the same as sendingCompetentAuthority
   * @example "US" for United States Internal Revenue Service
   */
  receivingCompetentAuthority: CountryCode;

  /**
   * Type of CbC message being transmitted
   */
  messageType: MessageType;

  /**
   * ISO 639-1 language code for the message content
   * @example "en" for English
   */
  language?: LanguageCode;

  /**
   * Optional warning messages included in the submission
   */
  warning?: Warning[];

  /**
   * Contact information for queries about the message
   */
  contact?: Contact;

  /**
   * Unique identifier for the message
   * Format varies by jurisdiction but must be globally unique
   * @example "LU2024CBC401-ABC123-20240115-001"
   */
  messageRefId: string;

  /**
   * Indicates whether this is a new submission or correction
   */
  messageTypeIndic: MessageTypeIndic;

  /**
   * For corrections (CBC702), reference to the original message being corrected
   */
  corrMessageRefId?: string;

  /**
   * The fiscal year end date of the reporting period
   * @example "2023-12-31"
   */
  reportingPeriod: string;

  /**
   * Timestamp when the message was created
   * @example "2024-01-15T10:30:00"
   */
  timestamp: string;
}

// =============================================================================
// DOC SPEC TYPES
// =============================================================================

/**
 * Document type indicator codes as defined by OECD
 *
 * Standard indicators:
 * - OECD0: Resend (identical data, administrative re-transmission)
 * - OECD1: New data (original submission)
 * - OECD2: Corrected data (replaces previously sent data)
 * - OECD3: Deletion of previously sent data
 *
 * Test indicators:
 * - OECD10: Resend (test)
 * - OECD11: New data (test)
 * - OECD12: Corrected data (test)
 * - OECD13: Deletion (test)
 */
export type DocTypeIndic =
  | 'OECD0'
  | 'OECD1'
  | 'OECD2'
  | 'OECD3'
  | 'OECD10'
  | 'OECD11'
  | 'OECD12'
  | 'OECD13';

/**
 * Document specification for tracking and correcting individual records
 * Each ReportingEntity, CbcReports, and AdditionalInfo element must have a DocSpec
 */
export interface DocSpec {
  /**
   * Indicates the type of data being submitted
   * Must be consistent with MessageTypeIndic:
   * - CBC701 message → OECD1 or OECD11 (new)
   * - CBC702 message → OECD2, OECD3, OECD12, or OECD13 (correction/deletion)
   */
  docTypeIndic: DocTypeIndic;

  /**
   * Unique identifier for this document/record
   * Must be globally unique across all submissions from the sending jurisdiction
   * Recommended format: [CountryCode][Year][UniqueIdentifier]
   * @example "LU2023CBC-ENTITY001-RPT001"
   */
  docRefId: string;

  /**
   * For corrections (OECD2/OECD12) or deletions (OECD3/OECD13),
   * reference to the MessageRefId of the original message
   */
  corrMessageRefId?: string;

  /**
   * For corrections (OECD2/OECD12) or deletions (OECD3/OECD13),
   * reference to the DocRefId of the original record being corrected/deleted
   */
  corrDocRefId?: string;
}

// =============================================================================
// ORGANISATION / PARTY TYPES
// =============================================================================

/**
 * Tax Identification Number with issuing jurisdiction
 * Primary identifier for constituent entities
 */
export interface TIN {
  /**
   * The tax identification number value
   * Format varies by jurisdiction
   * @example "12345678" for a Luxembourg TIN
   */
  value: string;

  /**
   * ISO 3166-1 Alpha-2 code of the jurisdiction that issued the TIN
   * @example "LU" for a Luxembourg-issued TIN
   */
  issuedBy?: CountryCode;
}

/**
 * Type of identification number
 * Used when IN is not a standard TIN
 */
export type INType = 'TIN' | 'EIN' | 'GIIN' | 'LEI' | 'Other';

/**
 * Identification Number (alternative to TIN)
 * Used for entities that may not have a TIN but have other identifiers
 */
export interface IN {
  /**
   * The identification number value
   */
  value: string;

  /**
   * ISO 3166-1 Alpha-2 code of the jurisdiction that issued the IN
   */
  issuedBy?: CountryCode;

  /**
   * Type of identification number
   */
  inType?: INType;
}

/**
 * Name type indicator
 */
export type NameType = 'OECD201' | 'OECD202' | 'OECD203' | 'OECD204' | 'OECD205';

/**
 * Organisation or entity name with optional type
 */
export interface Name {
  /**
   * The name value
   */
  value: string;

  /**
   * Type of name:
   * - OECD201: Legal name
   * - OECD202: Trading name/DBA
   * - OECD203: Alias
   * - OECD204: Individual's birth name
   * - OECD205: Other
   */
  nameType?: NameType;
}

/**
 * Address type indicator
 */
export type AddressType =
  | 'OECD301' // Residential or business address
  | 'OECD302' // Residential address
  | 'OECD303' // Business address
  | 'OECD304' // Registered office address
  | 'OECD305'; // Former address

/**
 * Structured address following OECD fix format
 * Used when address components are known separately
 */
export interface AddressFix {
  /**
   * Street name and number
   */
  street?: string;

  /**
   * Building identifier (name or number)
   */
  buildingIdentifier?: string;

  /**
   * Suite, apartment, or unit identifier
   */
  suiteIdentifier?: string;

  /**
   * Floor number
   */
  floorIdentifier?: string;

  /**
   * District or sub-locality name
   */
  districtName?: string;

  /**
   * Post office box number
   */
  pob?: string;

  /**
   * Postal/ZIP code
   */
  postCode?: string;

  /**
   * City name
   */
  city: string;

  /**
   * Country sub-division (state, province, canton)
   */
  countrySubentity?: string;
}

/**
 * Unstructured free-text address
 * Used when address cannot be parsed into structured format
 */
export interface AddressFree {
  /**
   * Complete address as free-form text
   */
  value: string;
}

/**
 * Complete address structure supporting both fixed and free formats
 */
export interface Address {
  /**
   * ISO 3166-1 Alpha-2 country code for the address
   */
  countryCode: CountryCode;

  /**
   * Type of address
   */
  addressType?: AddressType;

  /**
   * Structured address components (mutually exclusive with addressFree)
   */
  addressFix?: AddressFix;

  /**
   * Free-text address (mutually exclusive with addressFix)
   */
  addressFree?: AddressFree;
}

/**
 * Organisation party (company/entity) base type
 * Used as base for ReportingEntity and ConstituentEntity
 */
export interface OrganisationParty {
  /**
   * Tax identification number(s) for the organisation
   * May have multiple TINs from different jurisdictions
   */
  tin?: TIN[];

  /**
   * Other identification numbers (if TIN not available)
   */
  in?: IN[];

  /**
   * Organisation name(s)
   * At least one name is required
   */
  name: Name[];

  /**
   * Organisation address(es)
   */
  address?: Address[];
}

// =============================================================================
// BUSINESS ACTIVITY CODES
// =============================================================================

/**
 * Main business activity codes as defined by OECD for Table 2
 *
 * CBC501 - Research and Development
 * CBC502 - Holding or Managing intellectual property
 * CBC503 - Purchasing or Procurement
 * CBC504 - Manufacturing or Production
 * CBC505 - Sales, Marketing or Distribution
 * CBC506 - Administrative, Management or Support Services
 * CBC507 - Provision of Services to unrelated parties
 * CBC508 - Internal Group Finance
 * CBC509 - Regulated Financial Services
 * CBC510 - Insurance
 * CBC511 - Holding shares or other equity instruments
 * CBC512 - Dormant
 * CBC513 - Other
 */
export type BizActivityCode =
  | 'CBC501'
  | 'CBC502'
  | 'CBC503'
  | 'CBC504'
  | 'CBC505'
  | 'CBC506'
  | 'CBC507'
  | 'CBC508'
  | 'CBC509'
  | 'CBC510'
  | 'CBC511'
  | 'CBC512'
  | 'CBC513';

/**
 * Mapping of business activity codes to human-readable descriptions
 */
export const BUSINESS_ACTIVITY_DESCRIPTIONS: Record<BizActivityCode, string> = {
  CBC501: 'Research and Development',
  CBC502: 'Holding or Managing Intellectual Property',
  CBC503: 'Purchasing or Procurement',
  CBC504: 'Manufacturing or Production',
  CBC505: 'Sales, Marketing or Distribution',
  CBC506: 'Administrative, Management or Support Services',
  CBC507: 'Provision of Services to Unrelated Parties',
  CBC508: 'Internal Group Finance',
  CBC509: 'Regulated Financial Services',
  CBC510: 'Insurance',
  CBC511: 'Holding Shares or Other Equity Instruments',
  CBC512: 'Dormant',
  CBC513: 'Other',
};

// =============================================================================
// CBC BODY TYPES - SUMMARY (TABLE 1)
// =============================================================================

/**
 * Monetary amount with optional currency specification
 * All amounts should be in the same currency as specified in the CBC report
 */
export interface MonetaryAmount {
  /**
   * The monetary value (can be negative for losses)
   */
  value: number;

  /**
   * ISO 4217 currency code (optional if using report's default currency)
   */
  currCode?: CurrencyCode;
}

/**
 * Summary data for a jurisdiction (Table 1 of CbC Report)
 * Contains aggregate financial data for all constituent entities in a tax jurisdiction
 */
export interface Summary {
  /**
   * Revenues from unrelated parties
   * Arm's length transactions with third parties
   */
  unrelatedRevenues?: MonetaryAmount;

  /**
   * Revenues from related parties
   * Intra-group transactions (intercompany)
   */
  relatedRevenues?: MonetaryAmount;

  /**
   * Total revenues (sum of related and unrelated)
   * Must equal unrelatedRevenues + relatedRevenues
   */
  totalRevenues: MonetaryAmount;

  /**
   * Profit or loss before income tax
   * Negative values indicate a loss
   */
  profitOrLoss: MonetaryAmount;

  /**
   * Income tax paid (cash basis)
   * Actual tax payments made during the fiscal year
   * Includes withholding taxes paid by other entities
   */
  taxPaid: MonetaryAmount;

  /**
   * Income tax accrued (current year)
   * Tax expense per financial statements for the current year
   * Should not include deferred taxes or provisions for uncertain tax positions
   */
  taxAccrued: MonetaryAmount;

  /**
   * Stated/share capital
   * Total equity attributable to the constituent entities
   * For permanent establishments, regulatory capital if applicable
   */
  capital: MonetaryAmount;

  /**
   * Accumulated earnings (retained earnings)
   * Cumulative earnings not distributed as dividends
   * For permanent establishments, not applicable if no separate accounts
   */
  accumulatedEarnings: MonetaryAmount;

  /**
   * Number of full-time equivalent employees
   * Can include independent contractors participating in operating activities
   */
  numberOfEmployees: number;

  /**
   * Tangible assets (property, plant, equipment)
   * Excludes cash, cash equivalents, intangibles, and financial assets
   */
  tangibleAssets: MonetaryAmount;
}

// =============================================================================
// CBC BODY TYPES - CONSTITUENT ENTITIES (TABLE 2)
// =============================================================================

/**
 * Incorporation country code type for constituent entities
 * May differ from tax residence jurisdiction
 */
export interface IncorpCountryCode {
  /**
   * ISO 3166-1 Alpha-2 country code where entity is incorporated
   */
  value: CountryCode;
}

/**
 * Constituent entity information (Table 2 of CbC Report)
 * Individual entity details within a tax jurisdiction
 */
export interface ConstituentEntity extends OrganisationParty {
  /**
   * Role of the entity in the MNE group
   * - CBC801: Ultimate Parent Entity
   * - CBC802: Surrogate Parent Entity
   * - CBC803: Constituent Entity resident in filing jurisdiction
   * - CBC804: Constituent Entity resident in other jurisdiction
   */
  role?: EntityRole;

  /**
   * Country of incorporation if different from tax residence
   */
  incorpCountryCode?: CountryCode;

  /**
   * Accounting period start date for this entity
   * @example "2023-01-01"
   */
  acctPeriodStart?: string;

  /**
   * Accounting period end date for this entity
   * @example "2023-12-31"
   */
  acctPeriodEnd?: string;

  /**
   * Business activities for this specific entity
   * Multiple activities can be selected per entity
   */
  bizActivities?: BizActivityCode[];

  /**
   * Other entity information (free text)
   * Used for additional context or explanations
   */
  otherEntityInfo?: string;
}

/**
 * Entity role codes
 */
export type EntityRole = 'CBC801' | 'CBC802' | 'CBC803' | 'CBC804';

/**
 * Human-readable descriptions of entity roles
 */
export const ENTITY_ROLE_DESCRIPTIONS: Record<EntityRole, string> = {
  CBC801: 'Ultimate Parent Entity',
  CBC802: 'Surrogate Parent Entity',
  CBC803: 'Constituent Entity (Filing Jurisdiction)',
  CBC804: 'Constituent Entity (Other Jurisdiction)',
};

/**
 * Constituent entities structure with business activities
 * Groups all entities in a jurisdiction with their activities
 */
export interface ConstEntities {
  /**
   * List of constituent entities in this jurisdiction
   */
  constituentEntity: ConstituentEntity[];

  /**
   * Business activities applicable to entities in this jurisdiction
   * Multiple activities can be selected per entity
   */
  bizActivities?: BizActivityCode[];
}

// =============================================================================
// CBC BODY TYPES - REPORTS
// =============================================================================

/**
 * Individual CbC Report for a tax jurisdiction
 * Combines Summary (Table 1) and Constituent Entities (Table 2)
 */
export interface CbcReport {
  /**
   * Document specification for this report
   */
  docSpec: DocSpec;

  /**
   * ISO 3166-1 Alpha-2 code of the tax jurisdiction being reported
   */
  resCountryCode: CountryCode;

  /**
   * Summary/aggregate data for the jurisdiction (Table 1)
   */
  summary: Summary;

  /**
   * Constituent entities in this jurisdiction (Table 2)
   */
  constEntities: ConstEntities;
}

// =============================================================================
// CBC BODY TYPES - REPORTING ENTITY
// =============================================================================

/**
 * Reporting entity type indicator
 */
export type ReportingRole =
  | 'CBC801' // Ultimate Parent Entity
  | 'CBC802' // Surrogate Parent Entity
  | 'CBC803'; // Other (local filing)

/**
 * The entity filing the CbC Report
 * Usually the Ultimate Parent Entity or Surrogate Parent Entity
 */
export interface ReportingEntity extends OrganisationParty {
  /**
   * Document specification for this reporting entity record
   */
  docSpec: DocSpec;

  /**
   * Role of the reporting entity in the MNE group
   */
  reportingRole: ReportingRole;

  /**
   * Fiscal period start date
   * @example "2023-01-01"
   */
  startDate?: string;

  /**
   * Fiscal period end date (should match MessageSpec.reportingPeriod)
   * @example "2023-12-31"
   */
  endDate?: string;
}

// =============================================================================
// CBC BODY TYPES - ADDITIONAL INFO
// =============================================================================

/**
 * Language structure for additional info
 */
export interface OtherInfo {
  /**
   * ISO 639-1 language code for this text
   */
  language?: LanguageCode;

  /**
   * Additional information text content
   */
  value: string;
}

/**
 * Additional information element
 * Free-text explanations about the CbC Report
 */
export interface AdditionalInfo {
  /**
   * Document specification for this additional info record
   */
  docSpec: DocSpec;

  /**
   * Additional information text entries (can be multilingual)
   */
  otherInfo: OtherInfo[];

  /**
   * ISO 3166-1 Alpha-2 code if this info relates to specific jurisdiction(s)
   */
  resCountryCode?: CountryCode[];

  /**
   * Summary reference if this info relates to specific summary data
   */
  summaryRef?: string;
}

// =============================================================================
// CBC BODY - COMPLETE
// =============================================================================

/**
 * CbC Report Body containing all report data
 */
export interface CbcBody {
  /**
   * Information about the reporting MNE group
   */
  reportingEntity: ReportingEntity;

  /**
   * CbC Reports for each tax jurisdiction (Tables 1 & 2)
   * One report per jurisdiction where the MNE group operates
   */
  cbcReports: CbcReport[];

  /**
   * Optional additional information entries
   * Used for explanations, methodologies, or clarifications
   */
  additionalInfo?: AdditionalInfo[];
}

// =============================================================================
// COMPLETE CBC MESSAGE STRUCTURE
// =============================================================================

/**
 * Complete CbCR XML Message structure
 * Root element representing a full CbC Report submission
 */
export interface CbcMessage {
  /**
   * XML version identifier
   * @example "2.0" for CbC Schema v2.0
   */
  version?: string;

  /**
   * Message envelope information
   */
  messageSpec: MessageSpec;

  /**
   * Report body containing all data
   */
  cbcBody: CbcBody;
}

/**
 * Parsed CbC Report with metadata
 * Extended structure used in the application after parsing
 */
export interface ParsedCbcReport {
  /**
   * Original file name
   */
  fileName: string;

  /**
   * File size in bytes
   */
  fileSize: number;

  /**
   * SHA-256 hash of the original file
   */
  fileHash?: string;

  /**
   * Timestamp when the file was parsed
   */
  parsedAt: string;

  /**
   * The parsed CbC message structure
   */
  message: CbcMessage;

  /**
   * Raw XML string (optional, for debugging)
   */
  rawXml?: string;

  /**
   * Parsing warnings or non-critical issues found during parsing
   */
  parsingWarnings?: string[];
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract reporting period from MessageSpec
 * Represents fiscal year information
 */
export interface ReportingPeriodInfo {
  /**
   * Start date of the fiscal year
   */
  startDate: string;

  /**
   * End date of the fiscal year (from MessageSpec.reportingPeriod)
   */
  endDate: string;

  /**
   * Fiscal year as a number (e.g., 2023)
   */
  fiscalYear: number;
}

/**
 * Jurisdiction summary for quick reference
 * Aggregated data per country
 */
export interface JurisdictionSummary {
  /**
   * ISO 3166-1 Alpha-2 country code
   */
  countryCode: CountryCode;

  /**
   * Country name (derived from code)
   */
  countryName?: string;

  /**
   * Number of constituent entities in this jurisdiction
   */
  entityCount: number;

  /**
   * Total revenues (unrelated + related)
   */
  totalRevenues: number;

  /**
   * Profit or loss before tax
   */
  profitOrLoss: number;

  /**
   * Tax paid (cash basis)
   */
  taxPaid: number;

  /**
   * Tax accrued (current year)
   */
  taxAccrued: number;

  /**
   * Number of employees
   */
  employees: number;

  /**
   * Total tangible assets
   */
  tangibleAssets: number;

  /**
   * Business activities in this jurisdiction
   */
  activities: BizActivityCode[];
}

/**
 * MNE Group summary
 * Top-level aggregation across all jurisdictions
 */
export interface MneGroupSummary {
  /**
   * Name of the MNE group (from reporting entity)
   */
  groupName: string;

  /**
   * Ultimate parent entity TIN
   */
  parentTin?: string;

  /**
   * Ultimate parent entity jurisdiction
   */
  parentJurisdiction: CountryCode;

  /**
   * Reporting period end date
   */
  reportingPeriod: string;

  /**
   * Total number of jurisdictions reported
   */
  jurisdictionCount: number;

  /**
   * Total number of constituent entities
   */
  totalEntities: number;

  /**
   * Global totals (aggregated from all jurisdictions)
   */
  globalTotals: {
    totalRevenues: number;
    profitOrLoss: number;
    taxPaid: number;
    taxAccrued: number;
    employees: number;
    tangibleAssets: number;
  };

  /**
   * Currency used for all amounts
   */
  currency: CurrencyCode;

  /**
   * Per-jurisdiction summaries
   */
  jurisdictions: JurisdictionSummary[];
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a value is a valid DocTypeIndic
 */
export function isDocTypeIndic(value: unknown): value is DocTypeIndic {
  return (
    typeof value === 'string' &&
    ['OECD0', 'OECD1', 'OECD2', 'OECD3', 'OECD10', 'OECD11', 'OECD12', 'OECD13'].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid MessageTypeIndic
 */
export function isMessageTypeIndic(value: unknown): value is MessageTypeIndic {
  return typeof value === 'string' && ['CBC701', 'CBC702'].includes(value);
}

/**
 * Type guard to check if a value is a valid BizActivityCode
 */
export function isBizActivityCode(value: unknown): value is BizActivityCode {
  return (
    typeof value === 'string' &&
    [
      'CBC501',
      'CBC502',
      'CBC503',
      'CBC504',
      'CBC505',
      'CBC506',
      'CBC507',
      'CBC508',
      'CBC509',
      'CBC510',
      'CBC511',
      'CBC512',
      'CBC513',
    ].includes(value)
  );
}

/**
 * Type guard to check if address has fixed format
 */
export function hasAddressFix(address: Address): address is Address & { addressFix: AddressFix } {
  return address.addressFix !== undefined;
}

/**
 * Type guard to check if address has free format
 */
export function hasAddressFree(
  address: Address
): address is Address & { addressFree: AddressFree } {
  return address.addressFree !== undefined;
}

