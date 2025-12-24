/**
 * Currency Conversion Utilities
 *
 * Provides currency conversion for Pillar 2 calculations.
 * Uses approximate exchange rates for EUR conversions.
 *
 * Note: For production use, these rates should be fetched from
 * an external API (ECB, Bloomberg, etc.) or configured per report.
 *
 * @module lib/utils/currency
 */

// =============================================================================
// EXCHANGE RATES (EUR base)
// =============================================================================

/**
 * Approximate EUR exchange rates (as of 2024)
 * Format: 1 EUR = X units of foreign currency
 *
 * These are indicative rates. For accurate Pillar 2 calculations,
 * use the average exchange rate for the fiscal year as published
 * by the relevant tax authority or central bank.
 */
export const EUR_EXCHANGE_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.08,   // US Dollar
  GBP: 0.86,   // British Pound
  CHF: 0.95,   // Swiss Franc
  JPY: 161.0,  // Japanese Yen
  CNY: 7.8,    // Chinese Yuan
  CAD: 1.47,   // Canadian Dollar
  AUD: 1.65,   // Australian Dollar
  NZD: 1.78,   // New Zealand Dollar
  SGD: 1.45,   // Singapore Dollar
  HKD: 8.45,   // Hong Kong Dollar
  KRW: 1450.0, // Korean Won
  INR: 90.0,   // Indian Rupee
  BRL: 5.35,   // Brazilian Real
  MXN: 18.5,   // Mexican Peso
  ZAR: 20.0,   // South African Rand
  SEK: 11.5,   // Swedish Krona
  NOK: 11.8,   // Norwegian Krone
  DKK: 7.46,   // Danish Krone (pegged)
  PLN: 4.3,    // Polish Zloty
  CZK: 25.3,   // Czech Koruna
  HUF: 390.0,  // Hungarian Forint
  RON: 5.0,    // Romanian Leu
  BGN: 1.96,   // Bulgarian Lev (pegged)
  HRK: 7.53,   // Croatian Kuna (legacy, now EUR)
  RUB: 100.0,  // Russian Ruble
  TRY: 35.0,   // Turkish Lira
  AED: 3.97,   // UAE Dirham
  SAR: 4.05,   // Saudi Riyal
  ILS: 4.0,    // Israeli Shekel
  THB: 39.0,   // Thai Baht
  MYR: 5.1,    // Malaysian Ringgit
  IDR: 17000,  // Indonesian Rupiah
  PHP: 60.0,   // Philippine Peso
  VND: 27000,  // Vietnamese Dong
  TWD: 34.0,   // Taiwan Dollar
  ARS: 950.0,  // Argentine Peso
  CLP: 1000.0, // Chilean Peso
  COP: 4300.0, // Colombian Peso
  PEN: 4.0,    // Peruvian Sol
  EGP: 52.0,   // Egyptian Pound
  NGN: 1600.0, // Nigerian Naira
  KES: 170.0,  // Kenyan Shilling
  MAD: 11.0,   // Moroccan Dirham
};

// =============================================================================
// CONVERSION FUNCTIONS
// =============================================================================

/**
 * Convert an amount from one currency to EUR
 *
 * @param amount - The amount in the source currency
 * @param fromCurrency - The source currency code (ISO 4217)
 * @returns The amount in EUR
 */
export function toEUR(amount: number, fromCurrency: string): number {
  const rate = EUR_EXCHANGE_RATES[fromCurrency.toUpperCase()];

  if (!rate) {
    console.warn(`Unknown currency: ${fromCurrency}. Using amount as EUR.`);
    return amount;
  }

  if (fromCurrency.toUpperCase() === 'EUR') {
    return amount;
  }

  // Convert foreign currency to EUR: EUR = amount / rate
  return amount / rate;
}

/**
 * Convert an amount from EUR to another currency
 *
 * @param amount - The amount in EUR
 * @param toCurrency - The target currency code (ISO 4217)
 * @returns The amount in the target currency
 */
export function fromEUR(amount: number, toCurrency: string): number {
  const rate = EUR_EXCHANGE_RATES[toCurrency.toUpperCase()];

  if (!rate) {
    console.warn(`Unknown currency: ${toCurrency}. Using amount as-is.`);
    return amount;
  }

  if (toCurrency.toUpperCase() === 'EUR') {
    return amount;
  }

  // Convert EUR to foreign currency: Foreign = EUR * rate
  return amount * rate;
}

/**
 * Convert an amount between two currencies
 *
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency code
 * @param toCurrency - The target currency code
 * @returns The converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return amount;
  }

  // Convert to EUR first, then to target currency
  const eurAmount = toEUR(amount, fromCurrency);
  return fromEUR(eurAmount, toCurrency);
}

/**
 * Check if a currency is supported
 *
 * @param currencyCode - The currency code to check
 * @returns true if the currency is supported
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return currencyCode.toUpperCase() in EUR_EXCHANGE_RATES;
}

/**
 * Get the exchange rate for a currency (EUR base)
 *
 * @param currencyCode - The currency code
 * @returns The exchange rate or undefined if not found
 */
export function getExchangeRate(currencyCode: string): number | undefined {
  return EUR_EXCHANGE_RATES[currencyCode.toUpperCase()];
}

// =============================================================================
// PILLAR 2 SPECIFIC UTILITIES
// =============================================================================

/**
 * Normalize Pillar 2 amounts to EUR for calculations
 *
 * Pillar 2 calculations should typically be done in the
 * parent entity's functional currency, but thresholds
 * (de minimis, etc.) are defined in EUR.
 */
export interface CurrencyNormalizedAmounts {
  /** Amount in EUR */
  amountEUR: number;
  /** Original amount */
  originalAmount: number;
  /** Original currency */
  originalCurrency: string;
  /** Exchange rate used */
  exchangeRate: number;
}

/**
 * Normalize an amount to EUR with full conversion details
 *
 * @param amount - The amount to convert
 * @param currency - The currency code (defaults to EUR)
 * @returns Normalized amounts with conversion details
 */
export function normalizeToEUR(
  amount: number,
  currency: string = 'EUR'
): CurrencyNormalizedAmounts {
  const rate = EUR_EXCHANGE_RATES[currency.toUpperCase()] ?? 1.0;
  const amountEUR = currency.toUpperCase() === 'EUR' ? amount : amount / rate;

  return {
    amountEUR,
    originalAmount: amount,
    originalCurrency: currency.toUpperCase(),
    exchangeRate: rate,
  };
}

/**
 * Format currency amount for display
 *
 * @param amount - The amount to format
 * @param currency - The currency code
 * @param locale - The locale for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback for unsupported currencies
    return `${currency.toUpperCase()} ${amount.toLocaleString(locale)}`;
  }
}

/**
 * Pillar 2 De Minimis threshold check with currency conversion
 *
 * @param revenue - Total revenue
 * @param profit - Profit before tax
 * @param currency - Currency of the amounts
 * @returns Whether the jurisdiction qualifies for de minimis
 */
export function checkDeMinimisThreshold(
  revenue: number,
  profit: number,
  currency: string = 'EUR'
): {
  qualifies: boolean;
  revenueEUR: number;
  profitEUR: number;
  revenueThresholdEUR: number;
  profitThresholdEUR: number;
} {
  const revenueEUR = toEUR(revenue, currency);
  const profitEUR = toEUR(profit, currency);

  const REVENUE_THRESHOLD = 10_000_000; // €10M
  const PROFIT_THRESHOLD = 1_000_000;   // €1M

  return {
    qualifies: revenueEUR < REVENUE_THRESHOLD && profitEUR < PROFIT_THRESHOLD,
    revenueEUR,
    profitEUR,
    revenueThresholdEUR: REVENUE_THRESHOLD,
    profitThresholdEUR: PROFIT_THRESHOLD,
  };
}
