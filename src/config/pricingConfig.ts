import { BillingCycle, CurrencyCode, PromoCode } from '../types/checkout';

export const BILLING_CYCLES: {
  months: BillingCycle;
  label: string;
  shortLabel: string;
  discountRate: number;
  discountPercent: number;
  badge?: string;
}[] = [
  {
    months: 1,
    label: '1 month',
    shortLabel: '1 mo',
    discountRate: 0,
    discountPercent: 0,
  },
  {
    months: 12,
    label: '12 months',
    shortLabel: '12 mo',
    discountRate: 0.2,
    discountPercent: 20,
    badge: 'Save 20%',
  },
  {
    months: 24,
    label: '24 months',
    shortLabel: '24 mo',
    discountRate: 0.3,
    discountPercent: 30,
    badge: 'Save 30%',
  },
  {
    months: 36,
    label: '36 months',
    shortLabel: '36 mo',
    discountRate: 0.4,
    discountPercent: 40,
    badge: 'Save 40% · Best value',
  },
];

export const CYCLE_DISCOUNT_MAP: Record<BillingCycle, number> = {
  1: 0,
  12: 0.2,
  24: 0.3,
  36: 0.4,
};

export interface CountryTaxRule {
  country: string;
  code: string;
  rate: number;
  label: string;
  note?: string;
}

export const COUNTRY_TAX_RULES: Record<string, CountryTaxRule> = {
  Kenya: {
    country: 'Kenya',
    code: 'KE',
    rate: 0.16,
    label: 'Estimated tax (VAT 16%, Kenya)',
  },
  Nigeria: {
    country: 'Nigeria',
    code: 'NG',
    rate: 0.075,
    label: 'Estimated tax (VAT 7.5%, Nigeria)',
  },
  'South Africa': {
    country: 'South Africa',
    code: 'ZA',
    rate: 0.15,
    label: 'Estimated tax (VAT 15%, South Africa)',
  },
  'United Kingdom': {
    country: 'United Kingdom',
    code: 'GB',
    rate: 0.2,
    label: 'Estimated tax (VAT 20%, United Kingdom)',
  },
  Germany: {
    country: 'Germany',
    code: 'DE',
    rate: 0.19,
    label: 'Estimated tax (VAT 19%, Germany)',
  },
  'United States': {
    country: 'United States',
    code: 'US',
    rate: 0,
    label: 'Estimated tax (0%, United States)',
    note: 'Sales tax may apply',
  },
};

export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_TAX_RULES);

export const VALID_PROMO_CODES: Record<string, PromoCode> = {
  KILELE10: {
    code: 'KILELE10',
    discountPercent: 10,
    label: '10% off your order',
    firstTermOnly: false,
  },
  WELCOME20: {
    code: 'WELCOME20',
    discountPercent: 20,
    label: '20% off your first term',
    firstTermOnly: true,
  },
};

export interface CurrencyConfig {
  code: CurrencyCode;
  flag: string;
  symbol: string;
  label: string;
  rateFromUSD: number;
  locale: string;
  decimals: number;
}

export const CURRENCY_ORDER: CurrencyCode[] = ['KES', 'USD', 'EUR', 'GBP'];

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  KES: {
    code: 'KES',
    flag: '🇰🇪',
    symbol: 'KSh',
    label: 'KES KSh',
    rateFromUSD: 129.0,
    locale: 'en-KE',
    decimals: 0,
  },
  USD: {
    code: 'USD',
    flag: '🇺🇸',
    symbol: '$',
    label: 'USD $',
    rateFromUSD: 1,
    locale: 'en-US',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    flag: '🇪🇺',
    symbol: '€',
    label: 'EUR €',
    rateFromUSD: 0.92,
    locale: 'en-IE',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    flag: '🇬🇧',
    symbol: '£',
    label: 'GBP £',
    rateFromUSD: 0.79,
    locale: 'en-GB',
    decimals: 2,
  },
};

export const SUPPORT_PHONE = '+254 709 000 111';
export const SUPPORT_EMAIL = 'support@kilelehost.co.ke';
