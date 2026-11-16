import {
  DomainRegistrationYears,
  DomainSearchResult,
  TldPriceRule,
  WhoisSupportStatus,
} from '../types/checkout';

export const DOMAIN_REGISTRATION_YEARS: DomainRegistrationYears[] = [
  1, 2, 3, 5, 10,
];

export const WHOIS_PAID_YEARLY_USD = 2.99;

export const KILELE_NAMESERVERS = [
  'ns1.kilelehost.com',
  'ns2.kilelehost.com',
] as const;

export const TLD_PRICE_TABLE: TldPriceRule[] = [
  {
    tld: '.co.ke',
    firstYearUSD: 2.3,
    renewalUSD: 11.6,
    whoisSupport: 'unsupported',
    whoisYearlyUSD: 0,
    popular: true,
  },
  {
    tld: '.com',
    firstYearUSD: 9.99,
    renewalUSD: 14.99,
    whoisSupport: 'free',
    whoisYearlyUSD: 0,
    popular: true,
  },
  {
    tld: '.ke',
    firstYearUSD: 15.0,
    renewalUSD: 22.0,
    whoisSupport: 'unsupported',
    whoisYearlyUSD: 0,
  },
  {
    tld: '.africa',
    firstYearUSD: 9.0,
    renewalUSD: 18.0,
    whoisSupport: 'paid',
    whoisYearlyUSD: WHOIS_PAID_YEARLY_USD,
  },
  {
    tld: '.net',
    firstYearUSD: 11.99,
    renewalUSD: 15.99,
    whoisSupport: 'free',
    whoisYearlyUSD: 0,
  },
  {
    tld: '.org',
    firstYearUSD: 9.99,
    renewalUSD: 14.99,
    whoisSupport: 'free',
    whoisYearlyUSD: 0,
  },
  {
    tld: '.io',
    firstYearUSD: 39.0,
    renewalUSD: 49.0,
    whoisSupport: 'paid',
    whoisYearlyUSD: WHOIS_PAID_YEARLY_USD,
  },
  {
    tld: '.store',
    firstYearUSD: 1.99,
    renewalUSD: 39.99,
    whoisSupport: 'paid',
    whoisYearlyUSD: WHOIS_PAID_YEARLY_USD,
  },
  {
    tld: '.online',
    firstYearUSD: 1.49,
    renewalUSD: 34.99,
    whoisSupport: 'paid',
    whoisYearlyUSD: WHOIS_PAID_YEARLY_USD,
  },
  {
    tld: '.dev',
    firstYearUSD: 13.0,
    renewalUSD: 16.0,
    whoisSupport: 'paid',
    whoisYearlyUSD: WHOIS_PAID_YEARLY_USD,
  },
];

const TAKEN_COM_KEYWORDS = ['google', 'safaricom', 'test'];

export interface DomainValidationResult {
  valid: boolean;
  sld: string;
  tld: string | null;
  error?: string;
}

/**
 * Validates domain label according to strict rules:
 * lowercase letters, numbers, and hyphens only, 2-63 chars, no leading/trailing hyphen.
 */
export function validateDomainLabel(label: string): string | null {
  if (!label) {
    return 'Enter a domain name to continue.';
  }
  if (label.length < 2 || label.length > 63) {
    return 'Domain name must be between 2 and 63 characters.';
  }
  if (/[A-Z]/.test(label)) {
    return 'Use lowercase letters only (a-z, 0-9, and hyphens).';
  }
  if (/[^a-z0-9-]/.test(label)) {
    return 'Only lowercase letters, numbers, and hyphens (-) are allowed.';
  }
  if (label.startsWith('-') || label.endsWith('-')) {
    return 'Domain name cannot start or end with a hyphen.';
  }
  return null;
}

export function validateDomainSearchInput(raw: string): DomainValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      sld: '',
      tld: null,
      error: 'Enter a domain name, e.g. mybiashara.',
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      sld: trimmed,
      tld: null,
      error: 'Domain names cannot contain spaces.',
    };
  }

  const firstDot = trimmed.indexOf('.');
  if (firstDot === -1) {
    const labelErr = validateDomainLabel(trimmed);
    return {
      valid: !labelErr,
      sld: trimmed,
      tld: null,
      error: labelErr ?? undefined,
    };
  }

  const sld = trimmed.slice(0, firstDot);
  const tldPart = trimmed.slice(firstDot);
  const labelErr = validateDomainLabel(sld);
  if (labelErr) {
    return { valid: false, sld, tld: tldPart, error: labelErr };
  }

  if (!/^\.[a-z0-9.-]{2,}$/.test(tldPart) || tldPart.endsWith('.')) {
    return {
      valid: false,
      sld,
      tld: tldPart,
      error: 'Enter a valid extension such as .co.ke or .com.',
    };
  }

  return { valid: true, sld, tld: tldPart };
}

export function validateFullDomainInput(raw: string): DomainValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      sld: '',
      tld: null,
      error: 'Enter your full domain name, e.g. mybiashara.co.ke.',
    };
  }

  if (!trimmed.includes('.')) {
    const labelErr = validateDomainLabel(trimmed);
    return {
      valid: false,
      sld: trimmed,
      tld: null,
      error: labelErr ?? 'Include your domain extension (e.g. .com or .co.ke).',
    };
  }

  return validateDomainSearchInput(trimmed);
}

export function getTldRule(tld: string): TldPriceRule {
  const normalized = tld.startsWith('.') ? tld.toLowerCase() : `.${tld.toLowerCase()}`;
  const found = TLD_PRICE_TABLE.find((entry) => entry.tld === normalized);
  if (found) {
    return found;
  }
  return {
    tld: normalized,
    firstYearUSD: 14.99,
    renewalUSD: 14.99,
    whoisSupport: 'paid',
    whoisYearlyUSD: WHOIS_PAID_YEARLY_USD,
  };
}

export function getWhoisSupportInfo(tld: string): {
  support: WhoisSupportStatus;
  yearlyUSD: number;
} {
  const rule = getTldRule(tld);
  return {
    support: rule.whoisSupport,
    yearlyUSD: rule.whoisYearlyUSD,
  };
}

export function isDomainAvailable(sld: string, tld: string): boolean {
  const normalizedSld = sld.toLowerCase();
  const normalizedTld = tld.toLowerCase();
  if (normalizedTld === '.com') {
    return !TAKEN_COM_KEYWORDS.some((kw) => normalizedSld.includes(kw));
  }
  return true;
}

export function searchDomainAvailability(
  sld: string,
  preferredTld: string | null
): DomainSearchResult[] {
  const cleanSld = sld.toLowerCase();
  const exactTld = preferredTld ? preferredTld.toLowerCase() : '.co.ke';

  const orderedRules: TldPriceRule[] = [
    getTldRule(exactTld),
    ...TLD_PRICE_TABLE.filter((r) => r.tld !== exactTld),
  ];

  return orderedRules.map((rule, index) => {
    const discountPercent =
      rule.renewalUSD > rule.firstYearUSD
        ? Math.round((1 - rule.firstYearUSD / rule.renewalUSD) * 100)
        : 0;

    return {
      fullDomain: `${cleanSld}${rule.tld}`,
      sld: cleanSld,
      tld: rule.tld,
      isAvailable: isDomainAvailable(cleanSld, rule.tld),
      isExactMatch: index === 0,
      firstYearUSD: rule.firstYearUSD,
      renewalUSD: rule.renewalUSD,
      firstYearDiscountPercent: discountPercent,
      whoisSupport: rule.whoisSupport,
      whoisYearlyUSD: rule.whoisYearlyUSD,
    };
  });
}

export interface TransferEligibilityResult {
  eligible: boolean;
  fullDomain: string;
  tld: string;
  transferPriceUSD: number;
  renewalPriceUSD: number;
  whoisSupport: WhoisSupportStatus;
  whoisYearlyUSD: number;
  errorMessage?: string;
}

export function checkTransferEligibility(
  fullDomain: string
): TransferEligibilityResult {
  const parsed = validateFullDomainInput(fullDomain);
  const tld = parsed.tld ?? '.com';
  const rule = getTldRule(tld);
  const lower = fullDomain.trim().toLowerCase();

  if (lower.includes('locked')) {
    return {
      eligible: false,
      fullDomain: lower,
      tld,
      transferPriceUSD: rule.firstYearUSD,
      renewalPriceUSD: rule.renewalUSD,
      whoisSupport: rule.whoisSupport,
      whoisYearlyUSD: rule.whoisYearlyUSD,
      errorMessage:
        'This domain is locked at your current registrar. Unlock it and try again.',
    };
  }

  return {
    eligible: true,
    fullDomain: lower,
    tld,
    transferPriceUSD: rule.firstYearUSD,
    renewalPriceUSD: rule.renewalUSD,
    whoisSupport: rule.whoisSupport,
    whoisYearlyUSD: rule.whoisYearlyUSD,
  };
}
