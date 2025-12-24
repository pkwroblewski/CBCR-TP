/**
 * Pillar 2 Information Constants
 *
 * Concepts, rules, and jurisdiction implementation status for GloBE/Pillar 2.
 *
 * @module constants/pillar2-info
 */

export type Pillar2ConceptCategory =
  | 'rule'
  | 'calculation'
  | 'safe-harbour'
  | 'threshold'
  | 'mechanism';

export interface Pillar2Concept {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Full description */
  description: string;
  /** Category for grouping */
  category: Pillar2ConceptCategory;
  /** Key points as bullet list */
  keyPoints: string[];
  /** Reference to official documentation */
  reference?: string;
  /** Related concept IDs */
  relatedConcepts?: string[];
}

export interface Pillar2Jurisdiction {
  /** ISO country code */
  code: string;
  /** Country name */
  name: string;
  /** Implementation date (YYYY-MM-DD) or null if not implemented */
  iirDate: string | null;
  /** UTPR implementation date */
  utprDate: string | null;
  /** QDMTT implementation date */
  qdmttDate: string | null;
  /** Implementation mechanism/legislation */
  mechanism?: string;
  /** Additional notes */
  notes?: string;
}

// ============================================================================
// Pillar 2 Concepts
// ============================================================================

export const PILLAR2_CONCEPTS: Pillar2Concept[] = [
  // Core Rules
  {
    id: 'globe-rules',
    title: 'GloBE Rules',
    description:
      'The Global Anti-Base Erosion Rules are a set of coordinated rules designed to ensure that large multinational enterprises (MNEs) pay a minimum level of tax on the income arising in each jurisdiction where they operate.',
    category: 'rule',
    keyPoints: [
      'Applies to MNE Groups with consolidated revenue of EUR 750 million or more',
      'Establishes a 15% minimum effective tax rate',
      'Comprises the Income Inclusion Rule (IIR) and Undertaxed Profits Rule (UTPR)',
      'Uses financial accounting income as the starting point',
    ],
    reference: 'OECD Pillar 2 Model Rules',
    relatedConcepts: ['iir', 'utpr', 'minimum-tax'],
  },
  {
    id: 'iir',
    title: 'Income Inclusion Rule (IIR)',
    description:
      'The primary rule for collecting top-up tax. It requires a parent entity to include its share of the top-up tax payable in respect of any Constituent Entity that is subject to an effective tax rate below 15%.',
    category: 'rule',
    keyPoints: [
      'Primary mechanism for collecting top-up tax',
      'Applied at the level of the Ultimate Parent Entity first',
      'Follows ownership chain down if UPE jurisdiction has no IIR',
      'Applies to profits of low-taxed Constituent Entities',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 2.1',
    relatedConcepts: ['globe-rules', 'utpr', 'top-up-tax'],
  },
  {
    id: 'utpr',
    title: 'Undertaxed Profits Rule (UTPR)',
    description:
      'A backstop rule that applies when the top-up tax has not been fully collected through the IIR. It denies deductions or requires an equivalent adjustment to collect the remaining top-up tax.',
    category: 'rule',
    keyPoints: [
      'Acts as a backstop to the IIR',
      'Allocates top-up tax based on employees and tangible assets',
      'Implemented one year after IIR in most jurisdictions',
      'Does not apply if full top-up tax collected under IIR/QDMTT',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 2.4',
    relatedConcepts: ['globe-rules', 'iir', 'top-up-tax'],
  },
  {
    id: 'qdmtt',
    title: 'Qualified Domestic Minimum Top-up Tax (QDMTT)',
    description:
      'A domestic minimum tax that meets GloBE standards and has priority over the IIR and UTPR. Allows jurisdictions to collect top-up tax on their own low-taxed profits.',
    category: 'mechanism',
    keyPoints: [
      'Domestic minimum tax meeting GloBE requirements',
      'Has priority over IIR and UTPR',
      'Allows source jurisdictions to retain top-up tax revenue',
      'Must follow GloBE calculation methodology',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 10.1',
    relatedConcepts: ['iir', 'utpr', 'top-up-tax'],
  },

  // Calculations
  {
    id: 'etr',
    title: 'Effective Tax Rate (ETR)',
    description:
      'The ratio of Adjusted Covered Taxes to GloBE Income for a jurisdiction. If the ETR is below the 15% minimum rate, a top-up tax is due.',
    category: 'calculation',
    keyPoints: [
      'Calculated per jurisdiction, not per entity',
      'ETR = Adjusted Covered Taxes / GloBE Income',
      'Compared against 15% minimum rate',
      'Negative ETR treated as zero for calculation purposes',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 5.1',
    relatedConcepts: ['covered-taxes', 'globe-income', 'top-up-tax'],
  },
  {
    id: 'globe-income',
    title: 'GloBE Income or Loss',
    description:
      'The net income or loss determined for a Constituent Entity for Pillar 2 purposes. Starts from financial accounting income and applies specified adjustments.',
    category: 'calculation',
    keyPoints: [
      'Based on financial accounting net income/loss',
      'Adjusted for excluded dividends, excluded equity gains/losses',
      'Excludes international shipping income',
      'Aggregated at jurisdiction level',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 3.1',
    relatedConcepts: ['etr', 'covered-taxes'],
  },
  {
    id: 'covered-taxes',
    title: 'Covered Taxes',
    description:
      'Taxes recorded in the financial accounts that are covered by the GloBE Rules, including income taxes and certain taxes in lieu of income taxes.',
    category: 'calculation',
    keyPoints: [
      'Includes current tax expense and deferred tax adjustments',
      'Covers taxes on income, profits, or gains',
      'Includes taxes in lieu of income tax',
      'Adjusted for items like uncertain tax positions',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 4.2',
    relatedConcepts: ['etr', 'globe-income'],
  },
  {
    id: 'top-up-tax',
    title: 'Top-up Tax',
    description:
      'The additional tax due when the effective tax rate in a jurisdiction is below 15%. Brings the total tax up to the minimum rate.',
    category: 'calculation',
    keyPoints: [
      'Top-up Tax Percentage = 15% - Jurisdictional ETR',
      'Applied to Excess Profits (GloBE Income less SBIE)',
      'Collected through IIR, UTPR, or QDMTT',
      'Zero if ETR >= 15%',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 5.2',
    relatedConcepts: ['etr', 'sbie', 'iir', 'utpr'],
  },
  {
    id: 'sbie',
    title: 'Substance-based Income Exclusion (SBIE)',
    description:
      'An exclusion from GloBE Income based on the payroll costs of employees and the carrying value of tangible assets in a jurisdiction. Recognises that some income is attributable to real economic activities.',
    category: 'calculation',
    keyPoints: [
      'Payroll carve-out: percentage of eligible payroll costs',
      'Asset carve-out: percentage of tangible asset values',
      'Percentages phase down over 10 years',
      '2024: 10% payroll + 8% assets; 2033: 5% payroll + 5% assets',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 5.3',
    relatedConcepts: ['top-up-tax', 'globe-income'],
  },

  // Safe Harbours
  {
    id: 'transitional-safe-harbour',
    title: 'Transitional CbCR Safe Harbour',
    description:
      'A temporary safe harbour for fiscal years beginning before 2027 (2028 for UTPR) that allows MNE Groups to use CbC Report data to demonstrate no top-up tax is due.',
    category: 'safe-harbour',
    keyPoints: [
      'Uses existing CbC Report data (simplified approach)',
      'Three tests: De Minimis, Simplified ETR, Routine Profits',
      'Meeting any one test results in zero top-up tax',
      'Available until FY 2026 (IIR) or FY 2027 (UTPR)',
    ],
    reference: 'OECD Administrative Guidance, December 2022',
    relatedConcepts: ['de-minimis-test', 'simplified-etr-test', 'routine-profits-test'],
  },
  {
    id: 'de-minimis-test',
    title: 'De Minimis Test',
    description:
      'A safe harbour test where top-up tax is deemed zero if the jurisdiction has average GloBE Revenue under EUR 10 million and average GloBE Income under EUR 1 million.',
    category: 'safe-harbour',
    keyPoints: [
      'Revenue threshold: < EUR 10 million (3-year average)',
      'Income threshold: < EUR 1 million (3-year average)',
      'Both conditions must be met',
      'Uses CbCR Revenue and Profit Before Tax data',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 5.5',
    relatedConcepts: ['transitional-safe-harbour'],
  },
  {
    id: 'simplified-etr-test',
    title: 'Simplified ETR Test',
    description:
      'A safe harbour test where top-up tax is deemed zero if the jurisdiction\'s simplified ETR (using CbCR data) meets or exceeds the transition rate.',
    category: 'safe-harbour',
    keyPoints: [
      'Simplified ETR = Income Tax Accrued / Profit Before Tax',
      'Transition rates: 15% (2024-2025), 16% (2026), 17% (2027+)',
      'Uses CbCR Table 1 data directly',
      'Loss jurisdictions automatically fail this test',
    ],
    reference: 'OECD Administrative Guidance, December 2022',
    relatedConcepts: ['transitional-safe-harbour', 'etr'],
  },
  {
    id: 'routine-profits-test',
    title: 'Routine Profits Test',
    description:
      'A safe harbour test where top-up tax is deemed zero if Profit Before Tax is at or below the Substance-based Income Exclusion amount for the jurisdiction.',
    category: 'safe-harbour',
    keyPoints: [
      'Tests if PBT <= SBIE (payroll + asset carve-outs)',
      'Uses CbCR Table 1 payroll and tangible asset data',
      'Effectively tests if all profits are routine',
      'Loss jurisdictions automatically qualify',
    ],
    reference: 'OECD Administrative Guidance, December 2022',
    relatedConcepts: ['transitional-safe-harbour', 'sbie'],
  },

  // Thresholds
  {
    id: 'revenue-threshold',
    title: 'EUR 750 Million Revenue Threshold',
    description:
      'MNE Groups are only in scope of the GloBE Rules if they have consolidated group revenue of at least EUR 750 million in at least two of the four preceding fiscal years.',
    category: 'threshold',
    keyPoints: [
      'Based on consolidated group revenue',
      'Must be met in 2 of the 4 preceding years',
      'Same threshold as for CbC Reporting',
      'Currency conversion at average exchange rate',
    ],
    reference: 'OECD Pillar 2 Model Rules, Article 1.1',
    relatedConcepts: ['globe-rules'],
  },
  {
    id: 'minimum-tax',
    title: '15% Minimum Tax Rate',
    description:
      'The globally agreed minimum effective tax rate under Pillar 2. Jurisdictions with an ETR below 15% are subject to top-up tax.',
    category: 'threshold',
    keyPoints: [
      'Applies to in-scope MNE Groups',
      'Calculated per jurisdiction',
      'Permanent rate (unlike transitional safe harbour rates)',
      'Based on GloBE accounting, not local tax rules',
    ],
    reference: 'OECD Pillar 2 Model Rules',
    relatedConcepts: ['etr', 'top-up-tax'],
  },
];

// ============================================================================
// Pillar 2 Jurisdiction Implementation Status
// ============================================================================

export const PILLAR2_JURISDICTIONS: Pillar2Jurisdiction[] = [
  // EU Countries (via EU Minimum Tax Directive)
  {
    code: 'AT',
    name: 'Austria',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'BE',
    name: 'Belgium',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'BG',
    name: 'Bulgaria',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'CY',
    name: 'Cyprus',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'DE',
    name: 'Germany',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive + Minimum Tax Act',
  },
  {
    code: 'DK',
    name: 'Denmark',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'EE',
    name: 'Estonia',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'ES',
    name: 'Spain',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'FI',
    name: 'Finland',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'FR',
    name: 'France',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive + Finance Law 2024',
  },
  {
    code: 'GR',
    name: 'Greece',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'HR',
    name: 'Croatia',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'HU',
    name: 'Hungary',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: '2024-01-01',
    mechanism: 'EU Minimum Tax Directive',
    notes: 'QDMTT implemented alongside IIR',
  },
  {
    code: 'IE',
    name: 'Ireland',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: '2024-01-01',
    mechanism: 'EU Minimum Tax Directive + Finance Act 2023',
    notes: 'QDMTT implemented alongside IIR',
  },
  {
    code: 'IT',
    name: 'Italy',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive + Legislative Decree',
  },
  {
    code: 'LT',
    name: 'Lithuania',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'LU',
    name: 'Luxembourg',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: '2024-01-01',
    mechanism: 'EU Minimum Tax Directive + Law of 22 December 2023',
    notes: 'QDMTT implemented alongside IIR',
  },
  {
    code: 'LV',
    name: 'Latvia',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'MT',
    name: 'Malta',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive + Minimum Tax Act 2024',
  },
  {
    code: 'PL',
    name: 'Poland',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'PT',
    name: 'Portugal',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'RO',
    name: 'Romania',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'SE',
    name: 'Sweden',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'SI',
    name: 'Slovenia',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },
  {
    code: 'SK',
    name: 'Slovakia',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'EU Minimum Tax Directive',
  },

  // Non-EU Countries
  {
    code: 'GB',
    name: 'United Kingdom',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: '2024-01-01',
    mechanism: 'Finance (No. 2) Act 2023',
    notes: 'Early adopter with own legislation',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    iirDate: '2024-01-01',
    utprDate: null,
    qdmttDate: '2024-01-01',
    mechanism: 'Federal Council Ordinance',
    notes: 'QDMTT only initially; IIR with QDMTT priority',
  },
  {
    code: 'KR',
    name: 'South Korea',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'International Tax Coordination Act',
  },
  {
    code: 'JP',
    name: 'Japan',
    iirDate: '2024-04-01',
    utprDate: '2025-04-01',
    qdmttDate: null,
    mechanism: 'Tax Reform 2023',
    notes: 'Fiscal year basis (April start)',
  },
  {
    code: 'AU',
    name: 'Australia',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: '2024-01-01',
    mechanism: 'Treasury Laws Amendment',
  },
  {
    code: 'CA',
    name: 'Canada',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: '2024-01-01',
    mechanism: 'Global Minimum Tax Act',
  },
  {
    code: 'SG',
    name: 'Singapore',
    iirDate: '2025-01-01',
    utprDate: null,
    qdmttDate: '2025-01-01',
    mechanism: 'Income Tax (Amendment) Act 2024',
    notes: 'Delayed implementation; QDMTT with IIR',
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    iirDate: '2025-01-01',
    utprDate: null,
    qdmttDate: '2025-01-01',
    mechanism: 'Inland Revenue (Amendment) Ordinance',
    notes: 'Delayed implementation',
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'Taxation (Annual Rates etc) Act 2023',
  },
  {
    code: 'NO',
    name: 'Norway',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'Minimum Tax Act',
  },
  {
    code: 'LI',
    name: 'Liechtenstein',
    iirDate: '2024-01-01',
    utprDate: '2025-01-01',
    qdmttDate: null,
    mechanism: 'Minimum Tax Law',
  },

  // Countries with announced but not yet implemented
  {
    code: 'US',
    name: 'United States',
    iirDate: null,
    utprDate: null,
    qdmttDate: null,
    notes: 'No implementation announced; CAMT may have similar effects',
  },
  {
    code: 'CN',
    name: 'China',
    iirDate: null,
    utprDate: null,
    qdmttDate: null,
    notes: 'No implementation announced',
  },
  {
    code: 'IN',
    name: 'India',
    iirDate: null,
    utprDate: null,
    qdmttDate: null,
    notes: 'Under consideration',
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get concepts by category
 */
export function getConceptsByCategory(
  category: Pillar2ConceptCategory
): Pillar2Concept[] {
  return PILLAR2_CONCEPTS.filter((c) => c.category === category);
}

/**
 * Get a concept by ID
 */
export function getConceptById(id: string): Pillar2Concept | undefined {
  return PILLAR2_CONCEPTS.find((c) => c.id === id);
}

/**
 * Get jurisdictions that have implemented Pillar 2
 */
export function getImplementedJurisdictions(): Pillar2Jurisdiction[] {
  return PILLAR2_JURISDICTIONS.filter(
    (j) => j.iirDate !== null || j.qdmttDate !== null
  );
}

/**
 * Get jurisdictions with QDMTT
 */
export function getQdmttJurisdictions(): Pillar2Jurisdiction[] {
  return PILLAR2_JURISDICTIONS.filter((j) => j.qdmttDate !== null);
}

/**
 * Check if a jurisdiction has implemented by a given date
 */
export function isImplementedByDate(
  jurisdiction: Pillar2Jurisdiction,
  date: Date
): boolean {
  const iirImplemented =
    jurisdiction.iirDate !== null && new Date(jurisdiction.iirDate) <= date;
  const qdmttImplemented =
    jurisdiction.qdmttDate !== null && new Date(jurisdiction.qdmttDate) <= date;
  return iirImplemented || qdmttImplemented;
}

/**
 * Category labels for display
 */
export const CONCEPT_CATEGORY_LABELS: Record<Pillar2ConceptCategory, string> = {
  rule: 'Core Rules',
  calculation: 'Calculations',
  'safe-harbour': 'Safe Harbours',
  threshold: 'Thresholds',
  mechanism: 'Mechanisms',
};

/**
 * Get implementation statistics
 */
export function getPillar2Statistics() {
  const implemented = PILLAR2_JURISDICTIONS.filter(
    (j) => j.iirDate !== null || j.qdmttDate !== null
  );
  const withIir = PILLAR2_JURISDICTIONS.filter((j) => j.iirDate !== null);
  const withUtpr = PILLAR2_JURISDICTIONS.filter((j) => j.utprDate !== null);
  const withQdmtt = PILLAR2_JURISDICTIONS.filter((j) => j.qdmttDate !== null);

  return {
    total: PILLAR2_JURISDICTIONS.length,
    implemented: implemented.length,
    withIir: withIir.length,
    withUtpr: withUtpr.length,
    withQdmtt: withQdmtt.length,
  };
}
