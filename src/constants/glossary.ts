/**
 * Glossary Constants
 *
 * Comprehensive glossary of CbCR, BEPS, and Pillar 2 terminology.
 * Used in the Resources section for user reference.
 *
 * @module constants/glossary
 */

export type GlossaryCategory = 'cbcr' | 'pillar2' | 'general' | 'technical';

export interface GlossaryTerm {
  /** The full term */
  term: string;
  /** Optional acronym/abbreviation */
  acronym?: string;
  /** Definition of the term */
  definition: string;
  /** Related terms for cross-referencing */
  relatedTerms?: string[];
  /** Reference to official documentation */
  reference?: string;
  /** Category for filtering */
  category: GlossaryCategory;
}

/**
 * All glossary terms sorted alphabetically
 */
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // A
  {
    term: 'Action 13',
    definition:
      'BEPS Action 13 requires multinational enterprises to provide tax administrations with information on the global allocation of income and taxes, along with indicators of the location of economic activity. This includes transfer pricing documentation and Country-by-Country Reporting.',
    category: 'cbcr',
    reference: 'OECD BEPS Action 13 Report',
    relatedTerms: ['BEPS', 'CbCR', 'Transfer Pricing Documentation'],
  },
  {
    term: 'Adjusted Covered Taxes',
    acronym: 'ACT',
    definition:
      'The covered taxes of a Constituent Entity adjusted for GloBE purposes. This includes current tax expense, deferred tax adjustments, and other adjustments specified in the GloBE Rules.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 4.1',
    relatedTerms: ['Covered Taxes', 'ETR', 'GloBE Rules'],
  },
  // B
  {
    term: 'Base Erosion and Profit Shifting',
    acronym: 'BEPS',
    definition:
      'Tax planning strategies used by multinational enterprises that exploit gaps and mismatches in tax rules to artificially shift profits to low or no-tax locations. The OECD/G20 BEPS Project delivers solutions for governments to close these gaps.',
    category: 'general',
    reference: 'OECD BEPS Project',
    relatedTerms: ['Action 13', 'OECD', 'Transfer Pricing'],
  },
  // C
  {
    term: 'CbC Reporting Package',
    definition:
      'The complete set of information that must be included in a Country-by-Country Report, comprising the CbC Report itself (Table 1, Table 2, Table 3), additional information, and any supporting documentation required by the receiving jurisdiction.',
    category: 'cbcr',
    reference: 'OECD CbC Reporting Implementation Package',
    relatedTerms: ['CbCR', 'Table 1', 'Table 2', 'Table 3'],
  },
  {
    term: 'CbC XML Schema',
    definition:
      'The standardised XML format developed by the OECD for the electronic exchange of Country-by-Country Reports between tax administrations. The current version is CbC-Schema v2.0.',
    category: 'technical',
    reference: 'OECD CbC XML Schema User Guide',
    relatedTerms: ['XML', 'CbCR', 'Automatic Exchange'],
  },
  {
    term: 'Constituent Entity',
    acronym: 'CE',
    definition:
      'Any separate business unit of an MNE Group that is included in the Consolidated Financial Statements, or would be included if equity interests were traded on a public securities exchange. Includes Permanent Establishments.',
    category: 'cbcr',
    reference: 'BEPS Action 13 Report, Section IV',
    relatedTerms: ['MNE Group', 'Permanent Establishment', 'UPE'],
  },
  {
    term: 'Controlled Foreign Company',
    acronym: 'CFC',
    definition:
      'A foreign company in which domestic shareholders hold a controlling interest. CFC rules allow a jurisdiction to tax its residents on certain income of the foreign company to prevent profit shifting.',
    category: 'general',
    relatedTerms: ['BEPS', 'Profit Shifting'],
  },
  {
    term: 'Country-by-Country Report',
    acronym: 'CbCR',
    definition:
      'An annual report by MNE Groups with consolidated revenue of EUR 750 million or more. It contains aggregate information on revenues, profit before tax, income tax paid and accrued, employees, stated capital, retained earnings, and tangible assets for each jurisdiction.',
    category: 'cbcr',
    reference: 'BEPS Action 13 Report',
    relatedTerms: ['MNE Group', 'Table 1', 'Reporting Fiscal Year'],
  },
  {
    term: 'Covered Taxes',
    definition:
      'For Pillar 2 purposes, taxes recorded in the financial accounts that are covered by the GloBE Rules. Generally includes income taxes, taxes in lieu of income taxes, and taxes imposed on distributed profits and deemed profit distributions.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 4.2',
    relatedTerms: ['Adjusted Covered Taxes', 'ETR', 'GloBE Rules'],
  },
  // D
  {
    term: 'De Minimis Exclusion',
    definition:
      'A safe harbour test under Pillar 2 that excludes jurisdictions where the average GloBE Revenue is less than EUR 10 million and the average GloBE Income or Loss is less than EUR 1 million.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 5.5',
    relatedTerms: ['Safe Harbour', 'GloBE Rules', 'Top-up Tax'],
  },
  {
    term: 'Deemed Filing',
    definition:
      'A mechanism where a jurisdiction accepts a CbC Report filed in another jurisdiction as satisfying local filing requirements, typically through the Multilateral Competent Authority Agreement.',
    category: 'cbcr',
    relatedTerms: ['MCAA', 'CbCR', 'Surrogate Parent Entity'],
  },
  // E
  {
    term: 'Effective Tax Rate',
    acronym: 'ETR',
    definition:
      'For Pillar 2 purposes, the ratio of Adjusted Covered Taxes to GloBE Income for each jurisdiction. If the ETR is below 15%, a Top-up Tax may apply.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 5.1',
    relatedTerms: ['Adjusted Covered Taxes', 'GloBE Income', 'Top-up Tax'],
  },
  {
    term: 'Exchange of Information',
    acronym: 'EOI',
    definition:
      'The exchange of tax-relevant information between jurisdictions. CbC Reports are exchanged automatically under the Multilateral Competent Authority Agreement or bilateral tax treaties.',
    category: 'general',
    relatedTerms: ['MCAA', 'Automatic Exchange', 'CbCR'],
  },
  // F
  {
    term: 'Fiscal Year',
    definition:
      'The annual accounting period used for financial reporting. The Reporting Fiscal Year is the fiscal year reflected in the Consolidated Financial Statements of the Ultimate Parent Entity.',
    category: 'cbcr',
    relatedTerms: ['Reporting Fiscal Year', 'UPE', 'CbCR'],
  },
  {
    term: 'Flow-through Entity',
    definition:
      'An entity that is fiscally transparent in the jurisdiction where it is organised. Income flows through to the owners for tax purposes. Treatment in CbCR depends on the Constituent Entity classification.',
    category: 'cbcr',
    reference: 'OECD CbC Reporting Implementation Guidance',
    relatedTerms: ['Constituent Entity', 'Stateless Entity'],
  },
  // G
  {
    term: 'GloBE Income',
    definition:
      'The net income or loss determined for a Constituent Entity for Pillar 2 purposes, calculated by starting from financial accounting net income and making specified adjustments.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 3.1',
    relatedTerms: ['ETR', 'Adjusted Covered Taxes', 'GloBE Rules'],
  },
  {
    term: 'GloBE Rules',
    definition:
      'The Global Anti-Base Erosion Rules under Pillar 2, comprising the Income Inclusion Rule (IIR) and the Undertaxed Profits Rule (UTPR). They ensure MNE Groups pay a minimum 15% effective tax rate.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules',
    relatedTerms: ['IIR', 'UTPR', 'Pillar 2', 'Top-up Tax'],
  },
  // I
  {
    term: 'Income Inclusion Rule',
    acronym: 'IIR',
    definition:
      'A Pillar 2 rule that requires a parent entity to include its share of the Top-up Tax of any low-taxed Constituent Entity in its own taxable income. The primary mechanism for collecting top-up tax.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 2.1',
    relatedTerms: ['GloBE Rules', 'Top-up Tax', 'UTPR'],
  },
  // L
  {
    term: 'Local File',
    definition:
      'Transfer pricing documentation focusing on material intercompany transactions of a local taxpayer, providing detailed transactional information and analysis. One component of the three-tiered documentation approach.',
    category: 'general',
    reference: 'BEPS Action 13 Report, Chapter V',
    relatedTerms: ['Master File', 'Transfer Pricing Documentation', 'CbCR'],
  },
  // M
  {
    term: 'Master File',
    definition:
      'A standardised transfer pricing document providing a high-level overview of the MNE Group\'s global business operations, transfer pricing policies, and global allocation of income and economic activity.',
    category: 'general',
    reference: 'BEPS Action 13 Report, Chapter V',
    relatedTerms: ['Local File', 'Transfer Pricing Documentation', 'CbCR'],
  },
  {
    term: 'MessageRefId',
    definition:
      'A unique identifier for each CbC Report message in XML format. Must be globally unique and is used for tracking and referencing specific report transmissions.',
    category: 'technical',
    reference: 'OECD CbC XML Schema User Guide',
    relatedTerms: ['DocRefId', 'CbC XML Schema', 'CorrMessageRefId'],
  },
  {
    term: 'Minimum Tax',
    definition:
      'Under Pillar 2, a minimum 15% effective tax rate that MNE Groups must pay on profits in each jurisdiction. If local taxes are below this threshold, a Top-up Tax applies.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules',
    relatedTerms: ['ETR', 'Top-up Tax', 'GloBE Rules'],
  },
  {
    term: 'MNE Group',
    definition:
      'Multinational Enterprise Group - a group of entities related through ownership or control that includes entities or permanent establishments in two or more jurisdictions.',
    category: 'cbcr',
    reference: 'BEPS Action 13 Report',
    relatedTerms: ['UPE', 'Constituent Entity', 'CbCR'],
  },
  {
    term: 'Multilateral Competent Authority Agreement',
    acronym: 'MCAA',
    definition:
      'An agreement among tax authorities for the automatic exchange of CbC Reports. Builds on the Multilateral Convention on Mutual Administrative Assistance in Tax Matters.',
    category: 'cbcr',
    reference: 'OECD CbC MCAA',
    relatedTerms: ['Exchange of Information', 'CbCR', 'Competent Authority'],
  },
  // O
  {
    term: 'OECD',
    definition:
      'The Organisation for Economic Co-operation and Development, an intergovernmental organisation that develops and promotes policies for economic and social well-being. Leads the BEPS Project and Pillar 2 initiatives.',
    category: 'general',
    relatedTerms: ['BEPS', 'Pillar 2', 'Inclusive Framework'],
  },
  // P
  {
    term: 'Permanent Establishment',
    acronym: 'PE',
    definition:
      'A fixed place of business through which an enterprise carries on business. For CbCR purposes, a PE is treated as a Constituent Entity separate from its head office.',
    category: 'cbcr',
    reference: 'OECD Model Tax Convention, Article 5',
    relatedTerms: ['Constituent Entity', 'Tax Jurisdiction'],
  },
  {
    term: 'Pillar 1',
    definition:
      'The first pillar of the OECD/G20 two-pillar solution to address tax challenges of digitalisation. Aims to reallocate taxing rights to market jurisdictions for the largest and most profitable MNEs.',
    category: 'general',
    reference: 'OECD/G20 Inclusive Framework',
    relatedTerms: ['Pillar 2', 'BEPS', 'Amount A'],
  },
  {
    term: 'Pillar 2',
    definition:
      'The second pillar of the OECD/G20 two-pillar solution, introducing a global minimum tax of 15% for MNE Groups with consolidated revenue of EUR 750 million or more. Comprises the GloBE Rules and the Subject to Tax Rule.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules',
    relatedTerms: ['GloBE Rules', 'IIR', 'UTPR', 'Minimum Tax'],
  },
  // Q
  {
    term: 'Qualified Domestic Minimum Top-up Tax',
    acronym: 'QDMTT',
    definition:
      'A domestic minimum tax implemented by a jurisdiction that meets certain requirements under the GloBE Rules. A QDMTT has priority over the IIR and UTPR in collecting top-up tax.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 10.1',
    relatedTerms: ['GloBE Rules', 'Top-up Tax', 'IIR'],
  },
  // R
  {
    term: 'Reporting Entity',
    definition:
      'The entity that files the CbC Report with a tax administration. This is typically the Ultimate Parent Entity, but can be a Surrogate Parent Entity or local entity in certain circumstances.',
    category: 'cbcr',
    reference: 'BEPS Action 13 Report',
    relatedTerms: ['UPE', 'Surrogate Parent Entity', 'CbCR'],
  },
  {
    term: 'Reporting Fiscal Year',
    definition:
      'The fiscal year reflected in the Consolidated Financial Statements of the Ultimate Parent Entity for which the CbC Report is prepared. The period covered by the CbCR.',
    category: 'cbcr',
    relatedTerms: ['Fiscal Year', 'UPE', 'CbCR'],
  },
  {
    term: 'Routine Profits Test',
    definition:
      'A Transitional CbCR Safe Harbour test where top-up tax is deemed to be zero if Profit Before Tax is equal to or less than the Substance-based Income Exclusion for the jurisdiction.',
    category: 'pillar2',
    reference: 'OECD Administrative Guidance, December 2022',
    relatedTerms: ['Safe Harbour', 'SBIE', 'Transitional CbCR Safe Harbour'],
  },
  // S
  {
    term: 'Safe Harbour',
    definition:
      'A simplified regime that provides relief from full GloBE calculations if certain conditions are met. The Transitional CbCR Safe Harbour allows use of CbCR data for the transition period.',
    category: 'pillar2',
    reference: 'OECD Administrative Guidance',
    relatedTerms: ['Transitional CbCR Safe Harbour', 'De Minimis', 'ETR Test'],
  },
  {
    term: 'Simplified ETR Test',
    definition:
      'A Transitional CbCR Safe Harbour test where top-up tax is deemed to be zero if the simplified ETR (calculated using CbCR data) equals or exceeds the transition rate for the fiscal year.',
    category: 'pillar2',
    reference: 'OECD Administrative Guidance, December 2022',
    relatedTerms: ['ETR', 'Safe Harbour', 'Transitional CbCR Safe Harbour'],
  },
  {
    term: 'Stateless Entity',
    definition:
      'An entity that is not resident for tax purposes in any jurisdiction. For CbCR purposes, information for stateless entities is reported separately under "Stateless" jurisdiction code.',
    category: 'cbcr',
    reference: 'OECD CbC Reporting Implementation Guidance',
    relatedTerms: ['Constituent Entity', 'Tax Jurisdiction'],
  },
  {
    term: 'Substance-based Income Exclusion',
    acronym: 'SBIE',
    definition:
      'An exclusion from GloBE Income based on tangible assets and payroll costs in a jurisdiction. Recognises that a portion of income is attributable to substantive activities.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 5.3',
    relatedTerms: ['GloBE Income', 'Top-up Tax', 'Routine Profits Test'],
  },
  {
    term: 'Surrogate Parent Entity',
    definition:
      'A Constituent Entity appointed by an MNE Group to file the CbC Report on behalf of the group when the UPE is not required to file, cannot exchange reports, or has failed to file.',
    category: 'cbcr',
    reference: 'BEPS Action 13 Report',
    relatedTerms: ['UPE', 'Reporting Entity', 'CbCR'],
  },
  // T
  {
    term: 'Table 1',
    definition:
      'Overview of allocation of income, taxes and business activities by tax jurisdiction. Contains aggregate data for revenues, profit/loss, taxes, employees, capital, earnings, and assets.',
    category: 'cbcr',
    reference: 'BEPS Action 13 Report, Annex III',
    relatedTerms: ['CbCR', 'Table 2', 'Table 3'],
  },
  {
    term: 'Table 2',
    definition:
      'List of all Constituent Entities of the MNE Group. For each entity, shows the tax jurisdiction of organisation, nature of main business activities, and jurisdiction of residence if different.',
    category: 'cbcr',
    reference: 'BEPS Action 13 Report, Annex III',
    relatedTerms: ['CbCR', 'Table 1', 'Constituent Entity'],
  },
  {
    term: 'Table 3',
    definition:
      'Additional information section of the CbC Report. Contains any brief explanations that the MNE Group deems necessary or that would facilitate understanding of the information provided.',
    category: 'cbcr',
    reference: 'BEPS Action 13 Report, Annex III',
    relatedTerms: ['CbCR', 'Table 1', 'Table 2'],
  },
  {
    term: 'Tax Identification Number',
    acronym: 'TIN',
    definition:
      'A unique identifier issued by a tax authority to identify a taxpayer. In CbCR, the TIN of each Constituent Entity should be reported, using the format specified by the issuing jurisdiction.',
    category: 'technical',
    reference: 'OECD CbC XML Schema User Guide',
    relatedTerms: ['Constituent Entity', 'CbC XML Schema'],
  },
  {
    term: 'Tax Jurisdiction',
    definition:
      'A country or territory with fiscal autonomy. For CbCR purposes, data is aggregated and reported by tax jurisdiction. Special jurisdiction codes exist for Stateless entities.',
    category: 'cbcr',
    relatedTerms: ['CbCR', 'Table 1', 'ISO Country Codes'],
  },
  {
    term: 'Top-up Tax',
    definition:
      'Under Pillar 2, additional tax imposed to bring the effective tax rate in a jurisdiction up to the 15% minimum. Calculated as the difference between the minimum rate and the jurisdiction\'s ETR, applied to Excess Profits.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 5.2',
    relatedTerms: ['ETR', 'Minimum Tax', 'GloBE Rules'],
  },
  {
    term: 'Transfer Pricing',
    definition:
      'The pricing of goods, services, and intangibles between related parties. Transfer pricing rules require that transactions between related parties be conducted at arm\'s length.',
    category: 'general',
    reference: 'OECD Transfer Pricing Guidelines',
    relatedTerms: ['BEPS', 'Master File', 'Local File'],
  },
  {
    term: 'Transfer Pricing Documentation',
    definition:
      'Documentation that MNE Groups maintain to demonstrate that intercompany transactions are conducted at arm\'s length. Under BEPS Action 13, comprises the Master File, Local File, and CbC Report.',
    category: 'general',
    reference: 'BEPS Action 13 Report',
    relatedTerms: ['Master File', 'Local File', 'CbCR'],
  },
  {
    term: 'Transitional CbCR Safe Harbour',
    definition:
      'A temporary safe harbour available for fiscal years beginning before 2027 (or 2028 for UTPR). Allows MNE Groups to use CbC Report data to demonstrate that no top-up tax is due in a jurisdiction.',
    category: 'pillar2',
    reference: 'OECD Administrative Guidance, December 2022',
    relatedTerms: ['Safe Harbour', 'CbCR', 'GloBE Rules'],
  },
  // U
  {
    term: 'Ultimate Parent Entity',
    acronym: 'UPE',
    definition:
      'A Constituent Entity of an MNE Group that owns directly or indirectly sufficient interest in other Constituent Entities such that it is required to prepare Consolidated Financial Statements, and is not owned by another entity that would be required to consolidate it.',
    category: 'cbcr',
    reference: 'BEPS Action 13 Report',
    relatedTerms: ['MNE Group', 'Constituent Entity', 'Reporting Entity'],
  },
  {
    term: 'Undertaxed Profits Rule',
    acronym: 'UTPR',
    definition:
      'A backstop rule under Pillar 2 that denies deductions or requires equivalent adjustments where the IIR does not fully eliminate low taxation of Constituent Entities.',
    category: 'pillar2',
    reference: 'OECD Pillar 2 Model Rules, Article 2.4',
    relatedTerms: ['GloBE Rules', 'IIR', 'Top-up Tax'],
  },
  // X
  {
    term: 'XML',
    definition:
      'Extensible Markup Language - a standard format for structuring and exchanging data. CbC Reports are transmitted between tax authorities in XML format according to the CbC XML Schema.',
    category: 'technical',
    relatedTerms: ['CbC XML Schema', 'MessageRefId', 'DocRefId'],
  },
];

/**
 * Get glossary terms grouped by first letter
 */
export function getGlossaryByLetter(): Map<string, GlossaryTerm[]> {
  const grouped = new Map<string, GlossaryTerm[]>();

  GLOSSARY_TERMS.forEach((term) => {
    const letter = term.term[0].toUpperCase();
    const existing = grouped.get(letter) || [];
    grouped.set(letter, [...existing, term]);
  });

  return grouped;
}

/**
 * Get glossary terms by category
 */
export function getGlossaryByCategory(
  category: GlossaryCategory
): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((term) => term.category === category);
}

/**
 * Search glossary terms
 */
export function searchGlossary(query: string): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase();
  return GLOSSARY_TERMS.filter(
    (term) =>
      term.term.toLowerCase().includes(lowerQuery) ||
      term.acronym?.toLowerCase().includes(lowerQuery) ||
      term.definition.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all unique letters that have terms
 */
export function getAvailableLetters(): string[] {
  const letters = new Set<string>();
  GLOSSARY_TERMS.forEach((term) => {
    letters.add(term.term[0].toUpperCase());
  });
  return Array.from(letters).sort();
}

/**
 * Category display names
 */
export const GLOSSARY_CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  cbcr: 'CbC Reporting',
  pillar2: 'Pillar 2 / GloBE',
  general: 'General Tax',
  technical: 'Technical',
};
