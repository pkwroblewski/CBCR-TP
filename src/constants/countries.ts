/**
 * Country Codes, Names, and TIN Validation Patterns
 *
 * Based on ISO 3166-1 Alpha-2 standard with CbCR-specific information
 * including Tax Identification Number (TIN) formats per jurisdiction.
 *
 * @module constants/countries
 */

/**
 * Country information for CbCR purposes
 */
export interface CountryInfo {
  /** ISO 3166-1 Alpha-2 code */
  code: string;
  /** Country name in English */
  name: string;
  /** Regular expression pattern for TIN validation (if known) */
  tinPattern?: RegExp;
  /** Description of TIN format */
  tinFormat?: string;
  /** Whether country participates in CbCR exchange */
  cbcrParticipant: boolean;
  /** Currency code (ISO 4217) */
  currencyCode?: string;
  /** Official language codes */
  languages?: string[];
  /** Whether country has implemented Pillar 2 */
  pillar2Implemented?: boolean;
  /** CbCR filing deadline (months after fiscal year end) */
  filingDeadlineMonths?: number;
}

// =============================================================================
// COMPREHENSIVE COUNTRY LIST (ISO 3166-1 Alpha-2)
// =============================================================================

export const COUNTRIES: Record<string, CountryInfo> = {
  // A
  AD: { code: 'AD', name: 'Andorra', cbcrParticipant: true, currencyCode: 'EUR' },
  AE: { code: 'AE', name: 'United Arab Emirates', cbcrParticipant: true, currencyCode: 'AED' },
  AF: { code: 'AF', name: 'Afghanistan', cbcrParticipant: false, currencyCode: 'AFN' },
  AG: { code: 'AG', name: 'Antigua and Barbuda', cbcrParticipant: true, currencyCode: 'XCD' },
  AI: { code: 'AI', name: 'Anguilla', cbcrParticipant: true, currencyCode: 'XCD' },
  AL: { code: 'AL', name: 'Albania', cbcrParticipant: true, currencyCode: 'ALL' },
  AM: { code: 'AM', name: 'Armenia', cbcrParticipant: true, currencyCode: 'AMD' },
  AO: { code: 'AO', name: 'Angola', cbcrParticipant: false, currencyCode: 'AOA' },
  AR: { code: 'AR', name: 'Argentina', cbcrParticipant: true, currencyCode: 'ARS' },
  AS: { code: 'AS', name: 'American Samoa', cbcrParticipant: false, currencyCode: 'USD' },
  AT: {
    code: 'AT',
    name: 'Austria',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^ATU\d{8}$/,
    tinFormat: 'ATU + 8 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    cbcrParticipant: true,
    currencyCode: 'AUD',
    tinPattern: /^\d{9}$|^\d{11}$/,
    tinFormat: '9 or 11 digits (TFN or ABN)',
    filingDeadlineMonths: 12,
  },
  AW: { code: 'AW', name: 'Aruba', cbcrParticipant: true, currencyCode: 'AWG' },
  AZ: { code: 'AZ', name: 'Azerbaijan', cbcrParticipant: true, currencyCode: 'AZN' },

  // B
  BA: { code: 'BA', name: 'Bosnia and Herzegovina', cbcrParticipant: true, currencyCode: 'BAM' },
  BB: { code: 'BB', name: 'Barbados', cbcrParticipant: true, currencyCode: 'BBD' },
  BD: { code: 'BD', name: 'Bangladesh', cbcrParticipant: false, currencyCode: 'BDT' },
  BE: {
    code: 'BE',
    name: 'Belgium',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^BE\d{10}$/,
    tinFormat: 'BE + 10 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  BF: { code: 'BF', name: 'Burkina Faso', cbcrParticipant: true, currencyCode: 'XOF' },
  BG: {
    code: 'BG',
    name: 'Bulgaria',
    cbcrParticipant: true,
    currencyCode: 'BGN',
    tinPattern: /^BG\d{9,10}$/,
    tinFormat: 'BG + 9-10 digits',
    pillar2Implemented: true,
  },
  BH: { code: 'BH', name: 'Bahrain', cbcrParticipant: true, currencyCode: 'BHD' },
  BI: { code: 'BI', name: 'Burundi', cbcrParticipant: false, currencyCode: 'BIF' },
  BJ: { code: 'BJ', name: 'Benin', cbcrParticipant: true, currencyCode: 'XOF' },
  BM: { code: 'BM', name: 'Bermuda', cbcrParticipant: true, currencyCode: 'BMD' },
  BN: { code: 'BN', name: 'Brunei Darussalam', cbcrParticipant: true, currencyCode: 'BND' },
  BO: { code: 'BO', name: 'Bolivia', cbcrParticipant: false, currencyCode: 'BOB' },
  BR: {
    code: 'BR',
    name: 'Brazil',
    cbcrParticipant: true,
    currencyCode: 'BRL',
    tinPattern: /^\d{14}$/,
    tinFormat: '14 digits (CNPJ)',
    filingDeadlineMonths: 12,
  },
  BS: { code: 'BS', name: 'Bahamas', cbcrParticipant: true, currencyCode: 'BSD' },
  BT: { code: 'BT', name: 'Bhutan', cbcrParticipant: false, currencyCode: 'BTN' },
  BW: { code: 'BW', name: 'Botswana', cbcrParticipant: true, currencyCode: 'BWP' },
  BY: { code: 'BY', name: 'Belarus', cbcrParticipant: false, currencyCode: 'BYN' },
  BZ: { code: 'BZ', name: 'Belize', cbcrParticipant: true, currencyCode: 'BZD' },

  // C
  CA: {
    code: 'CA',
    name: 'Canada',
    cbcrParticipant: true,
    currencyCode: 'CAD',
    tinPattern: /^\d{9}$/,
    tinFormat: '9 digits (BN)',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  CD: { code: 'CD', name: 'Democratic Republic of the Congo', cbcrParticipant: false, currencyCode: 'CDF' },
  CF: { code: 'CF', name: 'Central African Republic', cbcrParticipant: false, currencyCode: 'XAF' },
  CG: { code: 'CG', name: 'Congo', cbcrParticipant: false, currencyCode: 'XAF' },
  CH: {
    code: 'CH',
    name: 'Switzerland',
    cbcrParticipant: true,
    currencyCode: 'CHF',
    tinPattern: /^CHE\d{9}$/,
    tinFormat: 'CHE + 9 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  CI: { code: 'CI', name: "Côte d'Ivoire", cbcrParticipant: true, currencyCode: 'XOF' },
  CK: { code: 'CK', name: 'Cook Islands', cbcrParticipant: true, currencyCode: 'NZD' },
  CL: { code: 'CL', name: 'Chile', cbcrParticipant: true, currencyCode: 'CLP' },
  CM: { code: 'CM', name: 'Cameroon', cbcrParticipant: true, currencyCode: 'XAF' },
  CN: {
    code: 'CN',
    name: 'China',
    cbcrParticipant: true,
    currencyCode: 'CNY',
    tinPattern: /^\d{15}$|^\d{18}$/,
    tinFormat: '15 or 18 digits',
    filingDeadlineMonths: 12,
  },
  CO: { code: 'CO', name: 'Colombia', cbcrParticipant: true, currencyCode: 'COP' },
  CR: { code: 'CR', name: 'Costa Rica', cbcrParticipant: true, currencyCode: 'CRC' },
  CU: { code: 'CU', name: 'Cuba', cbcrParticipant: false, currencyCode: 'CUP' },
  CV: { code: 'CV', name: 'Cabo Verde', cbcrParticipant: true, currencyCode: 'CVE' },
  CW: { code: 'CW', name: 'Curaçao', cbcrParticipant: true, currencyCode: 'ANG' },
  CY: {
    code: 'CY',
    name: 'Cyprus',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^CY\d{8}[A-Z]$/,
    tinFormat: 'CY + 8 digits + 1 letter',
    pillar2Implemented: true,
  },
  CZ: {
    code: 'CZ',
    name: 'Czech Republic',
    cbcrParticipant: true,
    currencyCode: 'CZK',
    tinPattern: /^CZ\d{8,10}$/,
    tinFormat: 'CZ + 8-10 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },

  // D
  DE: {
    code: 'DE',
    name: 'Germany',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^DE\d{9}$/,
    tinFormat: 'DE + 9 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
    languages: ['de'],
  },
  DJ: { code: 'DJ', name: 'Djibouti', cbcrParticipant: false, currencyCode: 'DJF' },
  DK: {
    code: 'DK',
    name: 'Denmark',
    cbcrParticipant: true,
    currencyCode: 'DKK',
    tinPattern: /^DK\d{8}$/,
    tinFormat: 'DK + 8 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  DM: { code: 'DM', name: 'Dominica', cbcrParticipant: true, currencyCode: 'XCD' },
  DO: { code: 'DO', name: 'Dominican Republic', cbcrParticipant: true, currencyCode: 'DOP' },
  DZ: { code: 'DZ', name: 'Algeria', cbcrParticipant: false, currencyCode: 'DZD' },

  // E
  EC: { code: 'EC', name: 'Ecuador', cbcrParticipant: true, currencyCode: 'USD' },
  EE: {
    code: 'EE',
    name: 'Estonia',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^EE\d{9}$/,
    tinFormat: 'EE + 9 digits',
    pillar2Implemented: true,
  },
  EG: { code: 'EG', name: 'Egypt', cbcrParticipant: true, currencyCode: 'EGP' },
  ER: { code: 'ER', name: 'Eritrea', cbcrParticipant: false, currencyCode: 'ERN' },
  ES: {
    code: 'ES',
    name: 'Spain',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^ES[A-Z]\d{7}[A-Z]$|^ES\d{8}[A-Z]$/,
    tinFormat: 'ES + letter + 7 digits + letter OR ES + 8 digits + letter',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  ET: { code: 'ET', name: 'Ethiopia', cbcrParticipant: false, currencyCode: 'ETB' },

  // F
  FI: {
    code: 'FI',
    name: 'Finland',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^FI\d{8}$/,
    tinFormat: 'FI + 8 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  FJ: { code: 'FJ', name: 'Fiji', cbcrParticipant: true, currencyCode: 'FJD' },
  FK: { code: 'FK', name: 'Falkland Islands', cbcrParticipant: false, currencyCode: 'FKP' },
  FM: { code: 'FM', name: 'Micronesia', cbcrParticipant: false, currencyCode: 'USD' },
  FO: { code: 'FO', name: 'Faroe Islands', cbcrParticipant: true, currencyCode: 'DKK' },
  FR: {
    code: 'FR',
    name: 'France',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^FR[A-Z0-9]{2}\d{9}$/,
    tinFormat: 'FR + 2 characters + 9 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
    languages: ['fr'],
  },

  // G
  GA: { code: 'GA', name: 'Gabon', cbcrParticipant: true, currencyCode: 'XAF' },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    cbcrParticipant: true,
    currencyCode: 'GBP',
    tinPattern: /^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$/,
    tinFormat: 'GB + 9 or 12 digits, or GBGD/GBHA + 3 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
    languages: ['en'],
  },
  GD: { code: 'GD', name: 'Grenada', cbcrParticipant: true, currencyCode: 'XCD' },
  GE: { code: 'GE', name: 'Georgia', cbcrParticipant: true, currencyCode: 'GEL' },
  GG: { code: 'GG', name: 'Guernsey', cbcrParticipant: true, currencyCode: 'GBP' },
  GH: { code: 'GH', name: 'Ghana', cbcrParticipant: true, currencyCode: 'GHS' },
  GI: { code: 'GI', name: 'Gibraltar', cbcrParticipant: true, currencyCode: 'GIP' },
  GL: { code: 'GL', name: 'Greenland', cbcrParticipant: true, currencyCode: 'DKK' },
  GM: { code: 'GM', name: 'Gambia', cbcrParticipant: false, currencyCode: 'GMD' },
  GN: { code: 'GN', name: 'Guinea', cbcrParticipant: false, currencyCode: 'GNF' },
  GQ: { code: 'GQ', name: 'Equatorial Guinea', cbcrParticipant: false, currencyCode: 'XAF' },
  GR: {
    code: 'GR',
    name: 'Greece',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^EL\d{9}$/,
    tinFormat: 'EL + 9 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  GT: { code: 'GT', name: 'Guatemala', cbcrParticipant: true, currencyCode: 'GTQ' },
  GW: { code: 'GW', name: 'Guinea-Bissau', cbcrParticipant: false, currencyCode: 'XOF' },
  GY: { code: 'GY', name: 'Guyana', cbcrParticipant: true, currencyCode: 'GYD' },

  // H
  HK: {
    code: 'HK',
    name: 'Hong Kong',
    cbcrParticipant: true,
    currencyCode: 'HKD',
    tinPattern: /^\d{8}$/,
    tinFormat: '8 digits (BRN)',
    filingDeadlineMonths: 12,
  },
  HN: { code: 'HN', name: 'Honduras', cbcrParticipant: true, currencyCode: 'HNL' },
  HR: {
    code: 'HR',
    name: 'Croatia',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^HR\d{11}$/,
    tinFormat: 'HR + 11 digits',
    pillar2Implemented: true,
  },
  HT: { code: 'HT', name: 'Haiti', cbcrParticipant: false, currencyCode: 'HTG' },
  HU: {
    code: 'HU',
    name: 'Hungary',
    cbcrParticipant: true,
    currencyCode: 'HUF',
    tinPattern: /^HU\d{8}$/,
    tinFormat: 'HU + 8 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },

  // I
  ID: {
    code: 'ID',
    name: 'Indonesia',
    cbcrParticipant: true,
    currencyCode: 'IDR',
    tinPattern: /^\d{15}$/,
    tinFormat: '15 digits (NPWP)',
    filingDeadlineMonths: 12,
  },
  IE: {
    code: 'IE',
    name: 'Ireland',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^IE\d{7}[A-Z]{1,2}$|^IE\d[A-Z]\d{5}[A-Z]$/,
    tinFormat: 'IE + 7 digits + 1-2 letters, or IE + mixed format',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  IL: { code: 'IL', name: 'Israel', cbcrParticipant: true, currencyCode: 'ILS' },
  IM: { code: 'IM', name: 'Isle of Man', cbcrParticipant: true, currencyCode: 'GBP' },
  IN: {
    code: 'IN',
    name: 'India',
    cbcrParticipant: true,
    currencyCode: 'INR',
    tinPattern: /^[A-Z]{5}\d{4}[A-Z]$/,
    tinFormat: '5 letters + 4 digits + 1 letter (PAN)',
    filingDeadlineMonths: 12,
  },
  IQ: { code: 'IQ', name: 'Iraq', cbcrParticipant: false, currencyCode: 'IQD' },
  IR: { code: 'IR', name: 'Iran', cbcrParticipant: false, currencyCode: 'IRR' },
  IS: { code: 'IS', name: 'Iceland', cbcrParticipant: true, currencyCode: 'ISK' },
  IT: {
    code: 'IT',
    name: 'Italy',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^IT\d{11}$/,
    tinFormat: 'IT + 11 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },

  // J
  JE: { code: 'JE', name: 'Jersey', cbcrParticipant: true, currencyCode: 'GBP' },
  JM: { code: 'JM', name: 'Jamaica', cbcrParticipant: true, currencyCode: 'JMD' },
  JO: { code: 'JO', name: 'Jordan', cbcrParticipant: true, currencyCode: 'JOD' },
  JP: {
    code: 'JP',
    name: 'Japan',
    cbcrParticipant: true,
    currencyCode: 'JPY',
    tinPattern: /^\d{13}$/,
    tinFormat: '13 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },

  // K
  KE: { code: 'KE', name: 'Kenya', cbcrParticipant: true, currencyCode: 'KES' },
  KG: { code: 'KG', name: 'Kyrgyzstan', cbcrParticipant: false, currencyCode: 'KGS' },
  KH: { code: 'KH', name: 'Cambodia', cbcrParticipant: false, currencyCode: 'KHR' },
  KI: { code: 'KI', name: 'Kiribati', cbcrParticipant: false, currencyCode: 'AUD' },
  KM: { code: 'KM', name: 'Comoros', cbcrParticipant: false, currencyCode: 'KMF' },
  KN: { code: 'KN', name: 'Saint Kitts and Nevis', cbcrParticipant: true, currencyCode: 'XCD' },
  KP: { code: 'KP', name: 'North Korea', cbcrParticipant: false, currencyCode: 'KPW' },
  KR: {
    code: 'KR',
    name: 'South Korea',
    cbcrParticipant: true,
    currencyCode: 'KRW',
    tinPattern: /^\d{10}$/,
    tinFormat: '10 digits (BRN)',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  KW: { code: 'KW', name: 'Kuwait', cbcrParticipant: true, currencyCode: 'KWD' },
  KY: { code: 'KY', name: 'Cayman Islands', cbcrParticipant: true, currencyCode: 'KYD' },
  KZ: { code: 'KZ', name: 'Kazakhstan', cbcrParticipant: true, currencyCode: 'KZT' },

  // L
  LA: { code: 'LA', name: 'Laos', cbcrParticipant: false, currencyCode: 'LAK' },
  LB: { code: 'LB', name: 'Lebanon', cbcrParticipant: true, currencyCode: 'LBP' },
  LC: { code: 'LC', name: 'Saint Lucia', cbcrParticipant: true, currencyCode: 'XCD' },
  LI: {
    code: 'LI',
    name: 'Liechtenstein',
    cbcrParticipant: true,
    currencyCode: 'CHF',
    tinPattern: /^\d{5}$/,
    tinFormat: '5 digits',
    pillar2Implemented: true,
  },
  LK: { code: 'LK', name: 'Sri Lanka', cbcrParticipant: true, currencyCode: 'LKR' },
  LR: { code: 'LR', name: 'Liberia', cbcrParticipant: true, currencyCode: 'LRD' },
  LS: { code: 'LS', name: 'Lesotho', cbcrParticipant: true, currencyCode: 'LSL' },
  LT: {
    code: 'LT',
    name: 'Lithuania',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^LT\d{9}$|^LT\d{12}$/,
    tinFormat: 'LT + 9 or 12 digits',
    pillar2Implemented: true,
  },
  LU: {
    code: 'LU',
    name: 'Luxembourg',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^\d{11}$|^\d{13}$/,
    tinFormat: '11 digits (natural persons) or 13 digits (legal entities)',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
    languages: ['fr', 'de', 'lb'],
  },
  LV: {
    code: 'LV',
    name: 'Latvia',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^LV\d{11}$/,
    tinFormat: 'LV + 11 digits',
    pillar2Implemented: true,
  },
  LY: { code: 'LY', name: 'Libya', cbcrParticipant: false, currencyCode: 'LYD' },

  // M
  MA: { code: 'MA', name: 'Morocco', cbcrParticipant: true, currencyCode: 'MAD' },
  MC: { code: 'MC', name: 'Monaco', cbcrParticipant: true, currencyCode: 'EUR' },
  MD: { code: 'MD', name: 'Moldova', cbcrParticipant: true, currencyCode: 'MDL' },
  ME: { code: 'ME', name: 'Montenegro', cbcrParticipant: true, currencyCode: 'EUR' },
  MG: { code: 'MG', name: 'Madagascar', cbcrParticipant: false, currencyCode: 'MGA' },
  MH: { code: 'MH', name: 'Marshall Islands', cbcrParticipant: true, currencyCode: 'USD' },
  MK: { code: 'MK', name: 'North Macedonia', cbcrParticipant: true, currencyCode: 'MKD' },
  ML: { code: 'ML', name: 'Mali', cbcrParticipant: false, currencyCode: 'XOF' },
  MM: { code: 'MM', name: 'Myanmar', cbcrParticipant: false, currencyCode: 'MMK' },
  MN: { code: 'MN', name: 'Mongolia', cbcrParticipant: true, currencyCode: 'MNT' },
  MO: { code: 'MO', name: 'Macao', cbcrParticipant: true, currencyCode: 'MOP' },
  MR: { code: 'MR', name: 'Mauritania', cbcrParticipant: false, currencyCode: 'MRU' },
  MS: { code: 'MS', name: 'Montserrat', cbcrParticipant: true, currencyCode: 'XCD' },
  MT: {
    code: 'MT',
    name: 'Malta',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^MT\d{8}$/,
    tinFormat: 'MT + 8 digits',
    pillar2Implemented: true,
  },
  MU: { code: 'MU', name: 'Mauritius', cbcrParticipant: true, currencyCode: 'MUR' },
  MV: { code: 'MV', name: 'Maldives', cbcrParticipant: true, currencyCode: 'MVR' },
  MW: { code: 'MW', name: 'Malawi', cbcrParticipant: false, currencyCode: 'MWK' },
  MX: {
    code: 'MX',
    name: 'Mexico',
    cbcrParticipant: true,
    currencyCode: 'MXN',
    tinPattern: /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/,
    tinFormat: '3-4 letters + 6 digits + 3 characters (RFC)',
    filingDeadlineMonths: 12,
  },
  MY: {
    code: 'MY',
    name: 'Malaysia',
    cbcrParticipant: true,
    currencyCode: 'MYR',
    tinPattern: /^\d{12}$/,
    tinFormat: '12 digits',
    filingDeadlineMonths: 12,
  },
  MZ: { code: 'MZ', name: 'Mozambique', cbcrParticipant: false, currencyCode: 'MZN' },

  // N
  NA: { code: 'NA', name: 'Namibia', cbcrParticipant: true, currencyCode: 'NAD' },
  NC: { code: 'NC', name: 'New Caledonia', cbcrParticipant: false, currencyCode: 'XPF' },
  NE: { code: 'NE', name: 'Niger', cbcrParticipant: false, currencyCode: 'XOF' },
  NG: { code: 'NG', name: 'Nigeria', cbcrParticipant: true, currencyCode: 'NGN' },
  NI: { code: 'NI', name: 'Nicaragua', cbcrParticipant: false, currencyCode: 'NIO' },
  NL: {
    code: 'NL',
    name: 'Netherlands',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^NL\d{9}B\d{2}$/,
    tinFormat: 'NL + 9 digits + B + 2 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  NO: {
    code: 'NO',
    name: 'Norway',
    cbcrParticipant: true,
    currencyCode: 'NOK',
    tinPattern: /^NO\d{9}$/,
    tinFormat: 'NO + 9 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  NP: { code: 'NP', name: 'Nepal', cbcrParticipant: false, currencyCode: 'NPR' },
  NR: { code: 'NR', name: 'Nauru', cbcrParticipant: true, currencyCode: 'AUD' },
  NU: { code: 'NU', name: 'Niue', cbcrParticipant: true, currencyCode: 'NZD' },
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    cbcrParticipant: true,
    currencyCode: 'NZD',
    tinPattern: /^\d{8,9}$/,
    tinFormat: '8-9 digits (IRD)',
    filingDeadlineMonths: 12,
  },

  // O
  OM: { code: 'OM', name: 'Oman', cbcrParticipant: true, currencyCode: 'OMR' },

  // P
  PA: { code: 'PA', name: 'Panama', cbcrParticipant: true, currencyCode: 'PAB' },
  PE: { code: 'PE', name: 'Peru', cbcrParticipant: true, currencyCode: 'PEN' },
  PF: { code: 'PF', name: 'French Polynesia', cbcrParticipant: false, currencyCode: 'XPF' },
  PG: { code: 'PG', name: 'Papua New Guinea', cbcrParticipant: true, currencyCode: 'PGK' },
  PH: { code: 'PH', name: 'Philippines', cbcrParticipant: true, currencyCode: 'PHP' },
  PK: { code: 'PK', name: 'Pakistan', cbcrParticipant: true, currencyCode: 'PKR' },
  PL: {
    code: 'PL',
    name: 'Poland',
    cbcrParticipant: true,
    currencyCode: 'PLN',
    tinPattern: /^PL\d{10}$/,
    tinFormat: 'PL + 10 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  PM: { code: 'PM', name: 'Saint Pierre and Miquelon', cbcrParticipant: false, currencyCode: 'EUR' },
  PN: { code: 'PN', name: 'Pitcairn', cbcrParticipant: false, currencyCode: 'NZD' },
  PR: { code: 'PR', name: 'Puerto Rico', cbcrParticipant: false, currencyCode: 'USD' },
  PT: {
    code: 'PT',
    name: 'Portugal',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^PT\d{9}$/,
    tinFormat: 'PT + 9 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  PW: { code: 'PW', name: 'Palau', cbcrParticipant: false, currencyCode: 'USD' },
  PY: { code: 'PY', name: 'Paraguay', cbcrParticipant: true, currencyCode: 'PYG' },

  // Q
  QA: { code: 'QA', name: 'Qatar', cbcrParticipant: true, currencyCode: 'QAR' },

  // R
  RO: {
    code: 'RO',
    name: 'Romania',
    cbcrParticipant: true,
    currencyCode: 'RON',
    tinPattern: /^RO\d{2,10}$/,
    tinFormat: 'RO + 2-10 digits',
    pillar2Implemented: true,
  },
  RS: { code: 'RS', name: 'Serbia', cbcrParticipant: true, currencyCode: 'RSD' },
  RU: {
    code: 'RU',
    name: 'Russia',
    cbcrParticipant: true,
    currencyCode: 'RUB',
    tinPattern: /^\d{10}$|^\d{12}$/,
    tinFormat: '10 or 12 digits (INN)',
  },
  RW: { code: 'RW', name: 'Rwanda', cbcrParticipant: true, currencyCode: 'RWF' },

  // S
  SA: {
    code: 'SA',
    name: 'Saudi Arabia',
    cbcrParticipant: true,
    currencyCode: 'SAR',
    tinPattern: /^\d{10}$/,
    tinFormat: '10 digits',
    filingDeadlineMonths: 12,
  },
  SB: { code: 'SB', name: 'Solomon Islands', cbcrParticipant: false, currencyCode: 'SBD' },
  SC: { code: 'SC', name: 'Seychelles', cbcrParticipant: true, currencyCode: 'SCR' },
  SD: { code: 'SD', name: 'Sudan', cbcrParticipant: false, currencyCode: 'SDG' },
  SE: {
    code: 'SE',
    name: 'Sweden',
    cbcrParticipant: true,
    currencyCode: 'SEK',
    tinPattern: /^SE\d{12}$/,
    tinFormat: 'SE + 12 digits',
    filingDeadlineMonths: 12,
    pillar2Implemented: true,
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    cbcrParticipant: true,
    currencyCode: 'SGD',
    tinPattern: /^[A-Z]\d{7}[A-Z]$/,
    tinFormat: 'Letter + 7 digits + letter (UEN)',
    filingDeadlineMonths: 12,
  },
  SH: { code: 'SH', name: 'Saint Helena', cbcrParticipant: false, currencyCode: 'SHP' },
  SI: {
    code: 'SI',
    name: 'Slovenia',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^SI\d{8}$/,
    tinFormat: 'SI + 8 digits',
    pillar2Implemented: true,
  },
  SK: {
    code: 'SK',
    name: 'Slovakia',
    cbcrParticipant: true,
    currencyCode: 'EUR',
    tinPattern: /^SK\d{10}$/,
    tinFormat: 'SK + 10 digits',
    pillar2Implemented: true,
  },
  SL: { code: 'SL', name: 'Sierra Leone', cbcrParticipant: true, currencyCode: 'SLE' },
  SM: { code: 'SM', name: 'San Marino', cbcrParticipant: true, currencyCode: 'EUR' },
  SN: { code: 'SN', name: 'Senegal', cbcrParticipant: true, currencyCode: 'XOF' },
  SO: { code: 'SO', name: 'Somalia', cbcrParticipant: false, currencyCode: 'SOS' },
  SR: { code: 'SR', name: 'Suriname', cbcrParticipant: false, currencyCode: 'SRD' },
  SS: { code: 'SS', name: 'South Sudan', cbcrParticipant: false, currencyCode: 'SSP' },
  ST: { code: 'ST', name: 'Sao Tome and Principe', cbcrParticipant: false, currencyCode: 'STN' },
  SV: { code: 'SV', name: 'El Salvador', cbcrParticipant: true, currencyCode: 'USD' },
  SX: { code: 'SX', name: 'Sint Maarten', cbcrParticipant: true, currencyCode: 'ANG' },
  SY: { code: 'SY', name: 'Syria', cbcrParticipant: false, currencyCode: 'SYP' },
  SZ: { code: 'SZ', name: 'Eswatini', cbcrParticipant: true, currencyCode: 'SZL' },

  // T
  TC: { code: 'TC', name: 'Turks and Caicos Islands', cbcrParticipant: true, currencyCode: 'USD' },
  TD: { code: 'TD', name: 'Chad', cbcrParticipant: false, currencyCode: 'XAF' },
  TG: { code: 'TG', name: 'Togo', cbcrParticipant: true, currencyCode: 'XOF' },
  TH: { code: 'TH', name: 'Thailand', cbcrParticipant: true, currencyCode: 'THB' },
  TJ: { code: 'TJ', name: 'Tajikistan', cbcrParticipant: false, currencyCode: 'TJS' },
  TL: { code: 'TL', name: 'Timor-Leste', cbcrParticipant: false, currencyCode: 'USD' },
  TM: { code: 'TM', name: 'Turkmenistan', cbcrParticipant: false, currencyCode: 'TMT' },
  TN: { code: 'TN', name: 'Tunisia', cbcrParticipant: true, currencyCode: 'TND' },
  TO: { code: 'TO', name: 'Tonga', cbcrParticipant: false, currencyCode: 'TOP' },
  TR: {
    code: 'TR',
    name: 'Turkey',
    cbcrParticipant: true,
    currencyCode: 'TRY',
    tinPattern: /^\d{10}$/,
    tinFormat: '10 digits (VKN)',
    filingDeadlineMonths: 12,
  },
  TT: { code: 'TT', name: 'Trinidad and Tobago', cbcrParticipant: true, currencyCode: 'TTD' },
  TV: { code: 'TV', name: 'Tuvalu', cbcrParticipant: false, currencyCode: 'AUD' },
  TW: { code: 'TW', name: 'Taiwan', cbcrParticipant: false, currencyCode: 'TWD' },
  TZ: { code: 'TZ', name: 'Tanzania', cbcrParticipant: false, currencyCode: 'TZS' },

  // U
  UA: { code: 'UA', name: 'Ukraine', cbcrParticipant: true, currencyCode: 'UAH' },
  UG: { code: 'UG', name: 'Uganda', cbcrParticipant: true, currencyCode: 'UGX' },
  US: {
    code: 'US',
    name: 'United States',
    cbcrParticipant: true,
    currencyCode: 'USD',
    tinPattern: /^\d{9}$/,
    tinFormat: '9 digits (EIN)',
    filingDeadlineMonths: 12,
    languages: ['en'],
  },
  UY: { code: 'UY', name: 'Uruguay', cbcrParticipant: true, currencyCode: 'UYU' },
  UZ: { code: 'UZ', name: 'Uzbekistan', cbcrParticipant: false, currencyCode: 'UZS' },

  // V
  VA: { code: 'VA', name: 'Vatican City', cbcrParticipant: false, currencyCode: 'EUR' },
  VC: { code: 'VC', name: 'Saint Vincent and the Grenadines', cbcrParticipant: true, currencyCode: 'XCD' },
  VE: { code: 'VE', name: 'Venezuela', cbcrParticipant: false, currencyCode: 'VES' },
  VG: { code: 'VG', name: 'British Virgin Islands', cbcrParticipant: true, currencyCode: 'USD' },
  VI: { code: 'VI', name: 'US Virgin Islands', cbcrParticipant: false, currencyCode: 'USD' },
  VN: { code: 'VN', name: 'Vietnam', cbcrParticipant: true, currencyCode: 'VND' },
  VU: { code: 'VU', name: 'Vanuatu', cbcrParticipant: true, currencyCode: 'VUV' },

  // W
  WF: { code: 'WF', name: 'Wallis and Futuna', cbcrParticipant: false, currencyCode: 'XPF' },
  WS: { code: 'WS', name: 'Samoa', cbcrParticipant: true, currencyCode: 'WST' },

  // X - Special codes
  XK: { code: 'XK', name: 'Kosovo', cbcrParticipant: false, currencyCode: 'EUR' },

  // Y
  YE: { code: 'YE', name: 'Yemen', cbcrParticipant: false, currencyCode: 'YER' },

  // Z
  ZA: {
    code: 'ZA',
    name: 'South Africa',
    cbcrParticipant: true,
    currencyCode: 'ZAR',
    tinPattern: /^\d{10}$/,
    tinFormat: '10 digits',
    filingDeadlineMonths: 12,
  },
  ZM: { code: 'ZM', name: 'Zambia', cbcrParticipant: false, currencyCode: 'ZMW' },
  ZW: { code: 'ZW', name: 'Zimbabwe', cbcrParticipant: false, currencyCode: 'ZWL' },
};

// =============================================================================
// LUXEMBOURG-SPECIFIC TIN VALIDATION
// =============================================================================

/**
 * Luxembourg TIN validation details
 */
export const LUXEMBOURG_TIN = {
  code: 'LU',
  name: 'Luxembourg',
  patterns: {
    /** Natural persons: 11 digits */
    naturalPerson: /^\d{11}$/,
    /** Legal entities: 13 digits (usually starts with 19 or 20) */
    legalEntity: /^\d{13}$/,
    /** Any valid Luxembourg TIN */
    any: /^\d{11}$|^\d{13}$/,
  },
  formats: {
    naturalPerson: '11 digits (YYYY-MM-DD + sequence)',
    legalEntity: '13 digits (registration number)',
  },
  validate: (tin: string): { valid: boolean; type?: 'natural' | 'legal'; error?: string } => {
    const cleanTin = tin.replace(/\s|-/g, '');

    if (!/^\d+$/.test(cleanTin)) {
      return { valid: false, error: 'TIN must contain only digits' };
    }

    if (cleanTin.length === 11) {
      return { valid: true, type: 'natural' };
    }

    if (cleanTin.length === 13) {
      return { valid: true, type: 'legal' };
    }

    return {
      valid: false,
      error: `Invalid length: ${cleanTin.length} digits. Expected 11 (natural person) or 13 (legal entity)`,
    };
  },
  /** Administration des contributions directes filing deadline */
  filingDeadline: {
    months: 12,
    description: '12 months after fiscal year end',
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a country code is valid ISO 3166-1 Alpha-2
 */
export function isValidCountryCode(code: string): boolean {
  return code.length === 2 && code.toUpperCase() in COUNTRIES;
}

/**
 * Get country information by code
 */
export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES[code.toUpperCase()];
}

/**
 * Get country name by code
 */
export function getCountryName(code: string): string {
  return COUNTRIES[code.toUpperCase()]?.name ?? code;
}

/**
 * Get all CbCR participant countries
 */
export function getCbcrParticipants(): CountryInfo[] {
  return Object.values(COUNTRIES).filter((country) => country.cbcrParticipant);
}

/**
 * Get countries with Pillar 2 implementation
 */
export function getPillar2Countries(): CountryInfo[] {
  return Object.values(COUNTRIES).filter((country) => country.pillar2Implemented);
}

/**
 * Validate TIN format for a specific country
 */
export function validateTinFormat(tin: string, countryCode: string): { valid: boolean; error?: string } {
  const country = getCountryByCode(countryCode);

  if (!country) {
    return { valid: false, error: `Unknown country code: ${countryCode}` };
  }

  // Special handling for Luxembourg
  if (countryCode.toUpperCase() === 'LU') {
    const result = LUXEMBOURG_TIN.validate(tin);
    return { valid: result.valid, error: result.error };
  }

  // Check against known pattern if available
  if (country.tinPattern) {
    const isValid = country.tinPattern.test(tin);
    return {
      valid: isValid,
      error: isValid ? undefined : `TIN format invalid. Expected: ${country.tinFormat}`,
    };
  }

  // No pattern available - accept any non-empty value
  return { valid: tin.length > 0 };
}

/**
 * Get all country codes as an array
 */
export function getAllCountryCodes(): string[] {
  return Object.keys(COUNTRIES);
}

/**
 * Search countries by name (partial match)
 */
export function searchCountries(query: string): CountryInfo[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(COUNTRIES).filter(
    (country) =>
      country.name.toLowerCase().includes(lowerQuery) || country.code.toLowerCase().includes(lowerQuery)
  );
}

