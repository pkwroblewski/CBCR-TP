/**
 * External Resources Constants
 *
 * Links to OECD documents, government portals, and other external resources.
 * Covers EU + major economies (US, UK, Switzerland, major Asian markets).
 *
 * @module constants/external-resources
 */

export type ResourceCategory =
  | 'oecd'
  | 'guidance'
  | 'government'
  | 'tax-authority'
  | 'tool'
  | 'legislation';

export interface ExternalResource {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Brief description */
  description: string;
  /** Full URL */
  url: string;
  /** Category for grouping */
  category: ResourceCategory;
  /** ISO country code if jurisdiction-specific */
  jurisdiction?: string;
  /** Tags for filtering */
  tags: string[];
  /** Last known update date (YYYY-MM-DD) */
  lastUpdated?: string;
  /** Language of the resource */
  language?: string;
}

// ============================================================================
// OECD Documents & Guidance
// ============================================================================

export const OECD_DOCUMENTS: ExternalResource[] = [
  // Core CbCR Documents
  {
    id: 'oecd-cbcr-schema',
    title: 'CbC XML Schema v2.0',
    description:
      'Official OECD Country-by-Country Reporting XML Schema and documentation for electronic exchange.',
    url: 'https://www.oecd.org/tax/beps/country-by-country-reporting-xml-schema-user-guide-for-tax-administrations.htm',
    category: 'oecd',
    tags: ['schema', 'xml', 'technical', 'cbcr'],
    lastUpdated: '2024-01-01',
    language: 'en',
  },
  {
    id: 'oecd-cbcr-user-guide',
    title: 'CbC XML Schema User Guide',
    description:
      'Comprehensive guide for implementing and using the CbC XML Schema, including validation rules and best practices.',
    url: 'https://www.oecd.org/tax/country-by-country-reporting-xml-schema-user-guide-for-tax-administrations.htm',
    category: 'oecd',
    tags: ['user-guide', 'xml', 'implementation', 'cbcr'],
    lastUpdated: '2024-01-01',
    language: 'en',
  },
  {
    id: 'oecd-common-errors',
    title: 'Common Errors Made by MNE Groups in CbC Reports',
    description:
      'OECD guidance document identifying and explaining 28 common errors found in Country-by-Country Reports.',
    url: 'https://www.oecd.org/content/dam/oecd/en/topics/policy-sub-issues/cbcr/common-errors-mnes-cbc-reports.pdf',
    category: 'oecd',
    tags: ['errors', 'guidance', 'best-practices', 'cbcr'],
    lastUpdated: '2023-06-01',
    language: 'en',
  },
  {
    id: 'oecd-action-13-report',
    title: 'BEPS Action 13 Final Report',
    description:
      'Transfer Pricing Documentation and Country-by-Country Reporting - the foundational BEPS Action 13 report.',
    url: 'https://www.oecd.org/tax/beps/beps-actions/action13/',
    category: 'oecd',
    tags: ['beps', 'action-13', 'report', 'cbcr'],
    lastUpdated: '2015-10-01',
    language: 'en',
  },
  {
    id: 'oecd-cbcr-implementation',
    title: 'CbCR Implementation Guidance',
    description:
      'OECD guidance on implementing Country-by-Country Reporting, addressing common questions and interpretations.',
    url: 'https://www.oecd.org/tax/beps/guidance-on-country-by-country-reporting-beps-action-13.htm',
    category: 'oecd',
    tags: ['implementation', 'guidance', 'cbcr'],
    language: 'en',
  },
  {
    id: 'oecd-mcaa-cbcr',
    title: 'Multilateral Competent Authority Agreement on CbCR',
    description:
      'The MCAA for automatic exchange of CbC Reports between tax administrations of signatory jurisdictions.',
    url: 'https://www.oecd.org/en/topics/sub-issues/country-by-country-reporting-for-tax-purposes.html',
    category: 'oecd',
    tags: ['mcaa', 'exchange', 'treaty', 'cbcr'],
    language: 'en',
  },

  // Pillar 2 Documents
  {
    id: 'oecd-pillar2-model-rules',
    title: 'Pillar 2 Model Rules (GloBE Rules)',
    description:
      'The Global Anti-Base Erosion Model Rules establishing a 15% minimum tax for MNE Groups.',
    url: 'https://www.oecd.org/en/topics/sub-issues/global-minimum-tax/global-anti-base-erosion-model-rules-pillar-two.html',
    category: 'oecd',
    tags: ['pillar2', 'globe', 'model-rules', 'minimum-tax'],
    lastUpdated: '2021-12-01',
    language: 'en',
  },
  {
    id: 'oecd-pillar2-commentary',
    title: 'Pillar 2 Commentary',
    description:
      'Detailed commentary explaining the interpretation and application of the GloBE Model Rules.',
    url: 'https://www.oecd.org/en/topics/sub-issues/global-minimum-tax/global-anti-base-erosion-model-rules-pillar-two.html',
    category: 'oecd',
    tags: ['pillar2', 'commentary', 'interpretation'],
    lastUpdated: '2022-03-01',
    language: 'en',
  },
  {
    id: 'oecd-pillar2-admin-guidance',
    title: 'Pillar 2 Administrative Guidance',
    description:
      'Administrative guidance on the GloBE Rules, including safe harbours and transitional rules.',
    url: 'https://www.oecd.org/en/topics/sub-issues/global-minimum-tax/global-anti-base-erosion-model-rules-pillar-two.html',
    category: 'oecd',
    tags: ['pillar2', 'admin-guidance', 'safe-harbour'],
    lastUpdated: '2024-06-01',
    language: 'en',
  },
  {
    id: 'oecd-pillar2-safe-harbour',
    title: 'Transitional CbCR Safe Harbour Guidance',
    description:
      'Guidance on using CbC Report data to qualify for the transitional safe harbour under Pillar 2.',
    url: 'https://www.oecd.org/en/topics/sub-issues/global-minimum-tax/global-anti-base-erosion-model-rules-pillar-two.html',
    category: 'oecd',
    tags: ['pillar2', 'safe-harbour', 'cbcr', 'transitional'],
    lastUpdated: '2022-12-01',
    language: 'en',
  },
  {
    id: 'oecd-pillar2-implementation',
    title: 'Pillar 2 Implementation Framework',
    description:
      'Framework for implementing the GloBE Rules in domestic legislation, including the GloBE Information Return.',
    url: 'https://www.oecd.org/en/topics/sub-issues/global-minimum-tax/global-anti-base-erosion-model-rules-pillar-two.html',
    category: 'oecd',
    tags: ['pillar2', 'implementation', 'gir'],
    lastUpdated: '2023-07-01',
    language: 'en',
  },
];

// ============================================================================
// Government Portals - EU Countries
// ============================================================================

export const EU_GOVERNMENT_PORTALS: ExternalResource[] = [
  // Luxembourg
  {
    id: 'lu-acd-portal',
    title: 'Luxembourg ACD - CbCR Portal',
    description:
      'Administration des contributions directes - Official portal for CbCR filing in Luxembourg.',
    url: 'https://guichet.public.lu/en/entreprises/fiscalite/impots-benefices/benefices-patrimoine/declaration-pays-pays-notification.html',
    category: 'government',
    jurisdiction: 'LU',
    tags: ['filing', 'portal', 'luxembourg'],
    language: 'en',
  },
  {
    id: 'lu-acd-cbcr-info',
    title: 'Luxembourg CbCR Information',
    description:
      'Official information page on Country-by-Country Reporting requirements in Luxembourg.',
    url: 'https://impotsdirects.public.lu/fr/echanges_electroniques/CbCR.html',
    category: 'tax-authority',
    jurisdiction: 'LU',
    tags: ['information', 'requirements', 'luxembourg'],
    language: 'fr',
  },

  // Germany
  {
    id: 'de-bzst-cbcr',
    title: 'Germany BZSt - CbCR',
    description:
      'Bundeszentralamt für Steuern - German federal tax authority CbCR information and filing.',
    url: 'https://www.bzst.de/EN/Businesses/CountryByCountryReporting/countryByCountryReporting_node.html',
    category: 'tax-authority',
    jurisdiction: 'DE',
    tags: ['filing', 'germany', 'bzst'],
    language: 'en',
  },

  // France
  {
    id: 'fr-dgfip-cbcr',
    title: 'France DGFiP - CbCR',
    description:
      'Direction générale des Finances publiques - French tax authority CbCR portal.',
    url: 'https://www.impots.gouv.fr/la-declaration-pays-par-pays',
    category: 'tax-authority',
    jurisdiction: 'FR',
    tags: ['filing', 'france', 'dgfip'],
    language: 'fr',
  },

  // Netherlands
  {
    id: 'nl-tax-cbcr',
    title: 'Netherlands Tax Administration - CbCR',
    description:
      'Dutch Tax and Customs Administration Country-by-Country Reporting information.',
    url: 'https://odb.belastingdienst.nl/en/country-by-country-reporting/',
    category: 'tax-authority',
    jurisdiction: 'NL',
    tags: ['filing', 'netherlands'],
    language: 'en',
  },

  // Belgium
  {
    id: 'be-spf-cbcr',
    title: 'Belgium SPF Finance - CbCR (BEPS13)',
    description:
      'Belgian Federal Public Service Finance - Country-by-Country Reporting requirements.',
    url: 'https://finance.belgium.be/en/E-services/beps13',
    category: 'tax-authority',
    jurisdiction: 'BE',
    tags: ['filing', 'belgium', 'beps13'],
    language: 'en',
  },

  // Austria
  {
    id: 'at-bmf-cbcr',
    title: 'Austria BMF - CbCR',
    description:
      'Austrian Federal Ministry of Finance - Country-by-Country Reporting information.',
    url: 'https://www.bmf.gv.at/themen/steuern/internationales-steuerrecht/country-by-country-reporting.html',
    category: 'tax-authority',
    jurisdiction: 'AT',
    tags: ['filing', 'austria'],
    language: 'de',
  },

  // Ireland
  {
    id: 'ie-revenue-cbcr',
    title: 'Ireland Revenue - CbCR',
    description:
      'Irish Revenue Commissioners Country-by-Country Reporting requirements and filing.',
    url: 'https://www.revenue.ie/en/companies-and-charities/transfer-pricing/country-by-country-reporting/index.aspx',
    category: 'tax-authority',
    jurisdiction: 'IE',
    tags: ['filing', 'ireland'],
    language: 'en',
  },

  // Spain
  {
    id: 'es-aeat-cbcr',
    title: 'Spain AEAT - CbCR (Modelo 231)',
    description:
      'Agencia Tributaria - Spanish tax agency Country-by-Country Reporting (Modelo 231).',
    url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI41.shtml',
    category: 'tax-authority',
    jurisdiction: 'ES',
    tags: ['filing', 'spain', 'modelo-231'],
    language: 'es',
  },

  // Italy
  {
    id: 'it-ade-cbcr',
    title: 'Italy Agenzia delle Entrate - CbCR',
    description:
      'Italian Revenue Agency Country-by-Country Reporting requirements (Rendicontazione paese per paese).',
    url: 'https://www.agenziaentrate.gov.it/portale/it/web/guest/schede/comunicazioni/rendicontazione-dati-nazionali-paese-per-paese/scheda-informativa-rendicontazione-dati-nazionali',
    category: 'tax-authority',
    jurisdiction: 'IT',
    tags: ['filing', 'italy'],
    language: 'it',
  },

  // Poland
  {
    id: 'pl-mf-cbcr',
    title: 'Poland Ministry of Finance - CbCR',
    description:
      'Polish Ministry of Finance Country-by-Country Reporting forms (CbC-P and CbC-R).',
    url: 'https://podatki-arch.mf.gov.pl/e-deklaracje/inne/pozostale-interaktywne/',
    category: 'tax-authority',
    jurisdiction: 'PL',
    tags: ['filing', 'poland', 'cbc-r', 'cbc-p'],
    language: 'pl',
  },

  // Sweden
  {
    id: 'se-skv-cbcr',
    title: 'Sweden Skatteverket - CbCR',
    description:
      'Swedish Tax Agency Country-by-Country Reporting requirements.',
    url: 'https://skatteverket.se/foretag/internationellt/landforlandrapporter.4.361dc8c15312eff6fd334a9.html',
    category: 'tax-authority',
    jurisdiction: 'SE',
    tags: ['filing', 'sweden'],
    language: 'sv',
  },

  // Denmark
  {
    id: 'dk-skat-cbcr',
    title: 'Denmark Skattestyrelsen - CbCR',
    description:
      'Danish Tax Agency Country-by-Country Reporting information.',
    url: 'https://skat.dk/en-us/businesses/companies-and-foundations/companies-and-foundations/country-by-country-reporting',
    category: 'tax-authority',
    jurisdiction: 'DK',
    tags: ['filing', 'denmark'],
    language: 'en',
  },

  // Finland
  {
    id: 'fi-vero-cbcr',
    title: 'Finland Vero - CbCR',
    description:
      'Finnish Tax Administration Country-by-Country Reporting requirements.',
    url: 'https://www.vero.fi/en/businesses-and-corporations/business-operations/transfer-pricing/countrybycountry-report-and-notification/',
    category: 'tax-authority',
    jurisdiction: 'FI',
    tags: ['filing', 'finland'],
    language: 'en',
  },

  // Portugal
  {
    id: 'pt-at-cbcr',
    title: 'Portugal AT - CbCR',
    description:
      'Portuguese Tax and Customs Authority Country-by-Country Reporting.',
    url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/CbCR/Paginas/default.aspx',
    category: 'tax-authority',
    jurisdiction: 'PT',
    tags: ['filing', 'portugal'],
    language: 'pt',
  },

  // Czech Republic
  {
    id: 'cz-mfcr-cbcr',
    title: 'Czech Republic MF - CbCR',
    description:
      'Czech Financial Administration Country-by-Country Reporting information.',
    url: 'https://financnisprava.gov.cz/cs/mezinarodni-spoluprace/mezinarodni-zdanovani-prime-dane/country-by-country-reporting-cbcr',
    category: 'tax-authority',
    jurisdiction: 'CZ',
    tags: ['filing', 'czech'],
    language: 'cs',
  },
];

// ============================================================================
// Government Portals - Major Economies (Non-EU)
// ============================================================================

export const MAJOR_ECONOMY_PORTALS: ExternalResource[] = [
  // United Kingdom
  {
    id: 'uk-hmrc-cbcr',
    title: 'UK HMRC - CbCR',
    description:
      'HM Revenue & Customs Country-by-Country Reporting requirements and filing guidance.',
    url: 'https://www.gov.uk/guidance/check-if-you-must-send-a-country-by-country-report',
    category: 'tax-authority',
    jurisdiction: 'GB',
    tags: ['filing', 'uk', 'hmrc'],
    language: 'en',
  },
  {
    id: 'uk-hmrc-cbcr-guidance',
    title: 'UK CbCR Technical Guidance',
    description:
      'Detailed technical guidance for preparing and submitting CbC Reports to HMRC.',
    url: 'https://www.gov.uk/government/publications/international-exchange-of-information-manual',
    category: 'guidance',
    jurisdiction: 'GB',
    tags: ['guidance', 'technical', 'uk'],
    language: 'en',
  },

  // United States
  {
    id: 'us-irs-cbcr',
    title: 'US IRS - CbCR (Form 8975)',
    description:
      'Internal Revenue Service Country-by-Country Report filing requirements and instructions.',
    url: 'https://www.irs.gov/businesses/country-by-country-reporting',
    category: 'tax-authority',
    jurisdiction: 'US',
    tags: ['filing', 'us', 'irs', 'form-8975'],
    language: 'en',
  },
  {
    id: 'us-irs-form-8975',
    title: 'IRS Form 8975 Instructions',
    description:
      'Instructions for Form 8975, Country-by-Country Report.',
    url: 'https://www.irs.gov/instructions/i8975',
    category: 'guidance',
    jurisdiction: 'US',
    tags: ['instructions', 'form-8975', 'us'],
    language: 'en',
  },

  // Switzerland
  {
    id: 'ch-estv-cbcr',
    title: 'Switzerland ESTV/AFC - CbCR',
    description:
      'Swiss Federal Tax Administration Country-by-Country Reporting requirements.',
    url: 'https://www.estv.admin.ch/estv/en/home/international-fiscal-law/country-by-country-reporting.html',
    category: 'tax-authority',
    jurisdiction: 'CH',
    tags: ['filing', 'switzerland'],
    language: 'en',
  },

  // Japan
  {
    id: 'jp-nta-cbcr',
    title: 'Japan NTA - CbCR',
    description:
      'Japanese National Tax Agency Country-by-Country Reporting requirements.',
    url: 'https://www.nta.go.jp/english/taxes/index.htm',
    category: 'tax-authority',
    jurisdiction: 'JP',
    tags: ['filing', 'japan', 'transfer-pricing'],
    language: 'en',
  },

  // Australia
  {
    id: 'au-ato-cbcr',
    title: 'Australia ATO - CbCR',
    description:
      'Australian Taxation Office Country-by-Country Reporting requirements and guidance.',
    url: 'https://www.ato.gov.au/businesses-and-organisations/international-tax-for-business/in-detail/pricing/transfer-pricing/country-by-country-reporting',
    category: 'tax-authority',
    jurisdiction: 'AU',
    tags: ['filing', 'australia'],
    language: 'en',
  },

  // Canada
  {
    id: 'ca-cra-cbcr',
    title: 'Canada CRA - CbCR',
    description:
      'Canada Revenue Agency Country-by-Country Reporting requirements.',
    url: 'https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/businesses-international-non-resident-taxes/country-reporting.html',
    category: 'tax-authority',
    jurisdiction: 'CA',
    tags: ['filing', 'canada'],
    language: 'en',
  },

  // Singapore
  {
    id: 'sg-iras-cbcr',
    title: 'Singapore IRAS - CbCR',
    description:
      'Inland Revenue Authority of Singapore Country-by-Country Reporting requirements.',
    url: 'https://www.iras.gov.sg/taxes/international-tax/country-by-country-reporting-(cbcr)',
    category: 'tax-authority',
    jurisdiction: 'SG',
    tags: ['filing', 'singapore'],
    language: 'en',
  },

  // Hong Kong
  {
    id: 'hk-ird-cbcr',
    title: 'Hong Kong IRD - CbCR',
    description:
      'Hong Kong Inland Revenue Department Country-by-Country Reporting.',
    url: 'https://www.ird.gov.hk/eng/tax/dta_cbc.htm',
    category: 'tax-authority',
    jurisdiction: 'HK',
    tags: ['filing', 'hong-kong'],
    language: 'en',
  },

  // South Korea
  {
    id: 'kr-nts-cbcr',
    title: 'South Korea NTS - CbCR',
    description:
      'Korean National Tax Service Country-by-Country Reporting requirements.',
    url: 'https://www.nts.go.kr/english/main.do',
    category: 'tax-authority',
    jurisdiction: 'KR',
    tags: ['filing', 'korea'],
    language: 'en',
  },

  // China
  {
    id: 'cn-sat-cbcr',
    title: 'China SAT - CbCR',
    description:
      'State Taxation Administration of China Country-by-Country Reporting.',
    url: 'http://www.chinatax.gov.cn/eng/',
    category: 'tax-authority',
    jurisdiction: 'CN',
    tags: ['filing', 'china'],
    language: 'en',
  },

  // India
  {
    id: 'in-cbdt-cbcr',
    title: 'India CBDT - CbCR',
    description:
      'Central Board of Direct Taxes Country-by-Country Reporting requirements.',
    url: 'https://incometaxindia.gov.in/Pages/international-taxation/transfer-pricing.aspx',
    category: 'tax-authority',
    jurisdiction: 'IN',
    tags: ['filing', 'india'],
    language: 'en',
  },

  // Brazil
  {
    id: 'br-rfb-cbcr',
    title: 'Brazil RFB - CbCR',
    description:
      'Receita Federal do Brasil Country-by-Country Reporting requirements.',
    url: 'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/ecf-escrituracao-contabil-fiscal/declaracao-pais-a-pais',
    category: 'tax-authority',
    jurisdiction: 'BR',
    tags: ['filing', 'brazil'],
    language: 'pt',
  },

  // Mexico
  {
    id: 'mx-sat-cbcr',
    title: 'Mexico SAT - CbCR',
    description:
      'Servicio de Administración Tributaria Country-by-Country Reporting.',
    url: 'https://www.sat.gob.mx/consultas/97724/conoce-como-presentar-la-declaracion-informativa-pais-por-pais',
    category: 'tax-authority',
    jurisdiction: 'MX',
    tags: ['filing', 'mexico'],
    language: 'es',
  },
];

// ============================================================================
// Technical Resources
// ============================================================================

export const TECHNICAL_RESOURCES: ExternalResource[] = [
  {
    id: 'iso-3166',
    title: 'ISO 3166 Country Codes',
    description:
      'Official ISO 3166-1 alpha-2 country codes used in CbC Reports for jurisdiction identification.',
    url: 'https://www.iso.org/iso-3166-country-codes.html',
    category: 'tool',
    tags: ['iso', 'country-codes', 'reference'],
    language: 'en',
  },
  {
    id: 'iso-4217',
    title: 'ISO 4217 Currency Codes',
    description:
      'Official ISO 4217 currency codes used for reporting monetary values in CbC Reports.',
    url: 'https://www.iso.org/iso-4217-currency-codes.html',
    category: 'tool',
    tags: ['iso', 'currency', 'reference'],
    language: 'en',
  },
  {
    id: 'oecd-cbcr-status',
    title: 'OECD CbCR Exchange Relationships',
    description:
      'Matrix of activated exchange relationships for CbC Reports between jurisdictions.',
    url: 'https://www.oecd.org/en/topics/sub-issues/country-by-country-reporting-for-tax-purposes.html',
    category: 'oecd',
    tags: ['exchange', 'relationships', 'mcaa'],
    language: 'en',
  },
  {
    id: 'oecd-pillar2-tracker',
    title: 'Pillar 2 Implementation Tracker',
    description:
      'Track the implementation status of Pillar 2 GloBE Rules across jurisdictions.',
    url: 'https://www.oecd.org/en/topics/sub-issues/global-minimum-tax/global-anti-base-erosion-model-rules-pillar-two.html',
    category: 'oecd',
    tags: ['pillar2', 'implementation', 'tracker'],
    language: 'en',
  },
];

// ============================================================================
// Combined & Utility Functions
// ============================================================================

/**
 * All external resources combined
 */
export const ALL_EXTERNAL_RESOURCES: ExternalResource[] = [
  ...OECD_DOCUMENTS,
  ...EU_GOVERNMENT_PORTALS,
  ...MAJOR_ECONOMY_PORTALS,
  ...TECHNICAL_RESOURCES,
];

/**
 * Get resources by category
 */
export function getResourcesByCategory(
  category: ResourceCategory
): ExternalResource[] {
  return ALL_EXTERNAL_RESOURCES.filter((r) => r.category === category);
}

/**
 * Get resources by jurisdiction
 */
export function getResourcesByJurisdiction(
  jurisdiction: string
): ExternalResource[] {
  return ALL_EXTERNAL_RESOURCES.filter(
    (r) => r.jurisdiction === jurisdiction
  );
}

/**
 * Search resources by query
 */
export function searchResources(query: string): ExternalResource[] {
  const lowerQuery = query.toLowerCase();
  return ALL_EXTERNAL_RESOURCES.filter(
    (r) =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.description.toLowerCase().includes(lowerQuery) ||
      r.tags.some((tag) => tag.includes(lowerQuery))
  );
}

/**
 * Get all unique jurisdictions that have resources
 */
export function getResourceJurisdictions(): string[] {
  const jurisdictions = new Set<string>();
  ALL_EXTERNAL_RESOURCES.forEach((r) => {
    if (r.jurisdiction) {
      jurisdictions.add(r.jurisdiction);
    }
  });
  return Array.from(jurisdictions).sort();
}

/**
 * Category display labels
 */
export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  oecd: 'OECD Documents',
  guidance: 'Guidance & Instructions',
  government: 'Government Portals',
  'tax-authority': 'Tax Authority Resources',
  tool: 'Tools & References',
  legislation: 'Legislation',
};
