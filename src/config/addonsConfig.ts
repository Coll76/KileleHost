import { DdosOptionId, SslOptionId } from '../types/checkout';

export const BACKUPS_INCLUDED_PLAN_IDS = [
  'shared-web-business',
  'shared-wp-business',
  'shared-woo-max',
];

export const ADDON_IDS = {
  BACKUPS: 'addon-daily-backups',
  SSL_OV: 'addon-ssl-ov',
  SSL_WILDCARD: 'addon-ssl-wildcard',
  EMAIL: 'addon-professional-email',
  DDOS_ADVANCED: 'addon-ddos-advanced',
  CDN: 'addon-cdn-integration',
} as const;

export const ADDON_PRICING = {
  backupsMonthlyUSD: 2.5,
  emailPerMailboxMonthlyUSD: 1.5,
  ddosAdvancedMonthlyUSD: 9.0,
  cdnMonthlyUSD: 5.0,
  sslOvYearlyUSD: 49.0,
  sslWildcardYearlyUSD: 89.0,
} as const;

export const SSL_OPTIONS: {
  id: SslOptionId;
  catalogId: string | null;
  name: string;
  description: string;
  yearlyPriceUSD: number;
}[] = [
  {
    id: 'free',
    catalogId: null,
    name: "Free Let's Encrypt SSL",
    description: 'Automated domain-validated HTTPS included on all plans',
    yearlyPriceUSD: 0,
  },
  {
    id: 'ov',
    catalogId: ADDON_IDS.SSL_OV,
    name: 'Premium OV SSL',
    description: 'Organization-verified business trust seal & $1.25M warranty',
    yearlyPriceUSD: ADDON_PRICING.sslOvYearlyUSD,
  },
  {
    id: 'wildcard',
    catalogId: ADDON_IDS.SSL_WILDCARD,
    name: 'Wildcard SSL',
    description: 'Secures unlimited subdomains under one certificate',
    yearlyPriceUSD: ADDON_PRICING.sslWildcardYearlyUSD,
  },
];

export const DDOS_OPTIONS: {
  id: DdosOptionId;
  catalogId: string | null;
  name: string;
  description: string;
  monthlyPriceUSD: number;
}[] = [
  {
    id: 'standard',
    catalogId: null,
    name: 'Standard DDoS',
    description: 'Always-on L3/L4 network mitigation included free',
    monthlyPriceUSD: 0,
  },
  {
    id: 'advanced',
    catalogId: ADDON_IDS.DDOS_ADVANCED,
    name: 'Advanced L7 DDoS',
    description: 'Application-layer WAF, bot filtering, and rate limiting',
    monthlyPriceUSD: ADDON_PRICING.ddosAdvancedMonthlyUSD,
  },
];
