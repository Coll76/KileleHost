import {
  CloudAutoscalingId,
  SharedPlan,
  SharedSubCategory,
  VpsOsId,
} from '../types/checkout';

export const SHARED_SUBTABS: {
  id: SharedSubCategory;
  label: string;
  subtitle: string;
}[] = [
  {
    id: 'web',
    label: 'Web Hosting',
    subtitle: 'Fast NVMe hosting for portfolios, blogs, and business sites',
  },
  {
    id: 'wordpress',
    label: 'WordPress',
    subtitle: 'Managed WordPress with LiteSpeed caching and 1-click staging',
  },
  {
    id: 'woocommerce',
    label: 'WooCommerce',
    subtitle: 'Store-ready hosting with preinstalled Woo & M-Pesa gateway setup',
  },
];

export const SHARED_PLANS: SharedPlan[] = [
  // Web Hosting
  {
    id: 'shared-web-starter',
    category: 'web',
    name: 'Starter',
    shortName: 'Starter',
    audience: 'For a single personal site',
    listPriceUSD: 4.0,
    features: {
      websites: '1 website',
      storage: '30 GB NVMe SSD',
      ssl: 'Free SSL certificate',
      freeDomain: 'Free domain 1st year (12+ mo)',
      email: '5 business email accounts',
      backups: 'Weekly backups',
      backupsIncluded: false,
    },
  },
  {
    id: 'shared-web-pro',
    category: 'web',
    name: 'Pro',
    shortName: 'Pro',
    audience: 'For growing East African businesses',
    recommended: true,
    listPriceUSD: 6.0,
    features: {
      websites: 'Unlimited websites',
      storage: '100 GB NVMe SSD',
      ssl: 'Free wildcard SSL',
      freeDomain: 'Free domain 1st year (12+ mo)',
      email: 'Unlimited email accounts',
      backups: 'Daily automated backups',
      backupsIncluded: true,
    },
  },
  {
    id: 'shared-web-business',
    category: 'web',
    name: 'Business',
    shortName: 'Business',
    audience: 'For high-traffic sites & agencies',
    listPriceUSD: 9.0,
    features: {
      websites: 'Unlimited websites',
      storage: '200 GB NVMe SSD',
      ssl: 'Free wildcard SSL',
      freeDomain: 'Free domain 1st year (12+ mo)',
      email: 'Unlimited email + priority relay',
      backups: 'Daily backups + on-demand',
      backupsIncluded: true,
    },
  },

  // WordPress
  {
    id: 'shared-wp-starter',
    category: 'wordpress',
    name: 'WP Starter',
    shortName: 'WP Starter',
    audience: 'For a single WordPress blog or portfolio',
    listPriceUSD: 5.0,
    features: {
      websites: '1 WordPress site',
      storage: '40 GB NVMe SSD',
      ssl: 'Free SSL + auto-updates',
      freeDomain: 'Free domain 1st year (12+ mo)',
      email: '10 email accounts',
      backups: 'Weekly backups',
      backupsIncluded: false,
      extras: ['LiteSpeed Cache pre-configured'],
    },
  },
  {
    id: 'shared-wp-pro',
    category: 'wordpress',
    name: 'WP Pro',
    shortName: 'WP Pro',
    audience: 'For growing WordPress content & agencies',
    recommended: true,
    listPriceUSD: 8.0,
    features: {
      websites: 'Unlimited WordPress sites',
      storage: '100 GB NVMe SSD',
      ssl: 'Free wildcard SSL',
      freeDomain: 'Free domain 1st year (12+ mo)',
      email: 'Unlimited email accounts',
      backups: 'Daily automated backups',
      backupsIncluded: true,
      extras: ['1-click staging environment', 'LiteSpeed Cache + Object Cache'],
    },
  },
  {
    id: 'shared-wp-business',
    category: 'wordpress',
    name: 'WP Business',
    shortName: 'WP Business',
    audience: 'For high-concurrency WordPress publishing',
    listPriceUSD: 12.0,
    features: {
      websites: 'Unlimited WordPress sites',
      storage: '200 GB NVMe SSD',
      ssl: 'Free wildcard SSL + WAF',
      freeDomain: 'Free domain 1st year (12+ mo)',
      email: 'Unlimited email accounts',
      backups: 'Daily backups + 30-day retention',
      backupsIncluded: true,
      extras: ['Multi-branch staging', 'LiteSpeed Enterprise + Redis'],
    },
  },

  // WooCommerce
  {
    id: 'shared-woo-store',
    category: 'woocommerce',
    name: 'Store',
    shortName: 'Store',
    audience: 'For launching an online shop in East Africa',
    listPriceUSD: 10.0,
    features: {
      websites: '1 WooCommerce storefront',
      storage: '60 GB NVMe SSD',
      ssl: 'Free SSL certificate',
      freeDomain: 'Free domain 1st year (12+ mo)',
      email: '20 store email accounts',
      backups: 'Daily backups: Yes',
      backupsIncluded: true,
      extras: ['WooCommerce preinstalled', 'M-Pesa & card gateway setup'],
    },
  },
  {
    id: 'shared-woo-pro',
    category: 'woocommerce',
    name: 'Store Pro',
    shortName: 'Store Pro',
    audience: 'For scaling multi-currency retail stores',
    recommended: true,
    listPriceUSD: 15.0,
    features: {
      websites: 'Up to 5 storefronts',
      storage: '120 GB NVMe SSD',
      ssl: 'Free wildcard SSL + PCI WAF',
      freeDomain: 'Free domain 1st year (12+ mo)',
      email: 'Unlimited email accounts',
      backups: 'Daily backups: Yes',
      backupsIncluded: true,
      extras: [
        'WooCommerce preinstalled',
        'M-Pesa Daraja + Pesapal + Stripe setup',
      ],
    },
  },
  {
    id: 'shared-woo-max',
    category: 'woocommerce',
    name: 'Store Max',
    shortName: 'Store Max',
    audience: 'For high-volume marketplaces & flash sales',
    listPriceUSD: 22.0,
    features: {
      websites: 'Unlimited storefronts',
      storage: '250 GB NVMe SSD',
      ssl: 'Free wildcard SSL + DDoS shield',
      freeDomain: 'Free domain 1st year (12+ mo)',
      email: 'Unlimited email accounts',
      backups: 'Hourly & daily backups: Yes',
      backupsIncluded: true,
      extras: [
        'WooCommerce + Redis + Staging',
        'Priority M-Pesa & card gateway onboarding',
      ],
    },
  },
];

// VPS Config
export const VPS_MANAGED_PRICE_USD = 15;
export const VPS_WINDOWS_LICENSE_USD = 12;
export const VPS_RATE_PER_VCPU = 4;
export const VPS_RATE_PER_GB_RAM = 2;
export const VPS_RATE_PER_GB_NVME = 0.1;

export interface VpsOsOption {
  id: VpsOsId;
  name: string;
  subtitle: string;
  licenseUSD: number;
  minVcpu: number;
  minRamGb: number;
}

export const VPS_OS_OPTIONS: VpsOsOption[] = [
  {
    id: 'ubuntu',
    name: 'Ubuntu 24.04 LTS',
    subtitle: 'Popular cloud-ready Linux',
    licenseUSD: 0,
    minVcpu: 1,
    minRamGb: 1,
  },
  {
    id: 'almalinux',
    name: 'AlmaLinux 9',
    subtitle: 'RHEL-compatible, cPanel ready',
    licenseUSD: 0,
    minVcpu: 1,
    minRamGb: 1,
  },
  {
    id: 'debian',
    name: 'Debian 12',
    subtitle: 'Lightweight & rock-solid',
    licenseUSD: 0,
    minVcpu: 1,
    minRamGb: 1,
  },
  {
    id: 'windows',
    name: 'Windows Server 2022',
    subtitle: '+$12/mo license · Min 2 vCPU / 4 GB',
    licenseUSD: VPS_WINDOWS_LICENSE_USD,
    minVcpu: 2,
    minRamGb: 4,
  },
];

export const VPS_PRESETS: {
  id: string;
  label: string;
  vcpu: number;
  ramGb: number;
  nvmeGb: number;
}[] = [
  {
    id: 'starter',
    label: 'Starter 2 vCPU/4GB/80GB',
    vcpu: 2,
    ramGb: 4,
    nvmeGb: 80,
  },
  {
    id: 'growth',
    label: 'Growth 4/8/160',
    vcpu: 4,
    ramGb: 8,
    nvmeGb: 160,
  },
  {
    id: 'power',
    label: 'Power 8/16/320',
    vcpu: 8,
    ramGb: 16,
    nvmeGb: 320,
  },
];

// Dedicated Servers Config
export interface DedicatedSpec {
  id: string;
  name: string;
  specLine: string;
  monthlyListUSD: number;
  setupFeeMonthlyUSD: number;
  setupFeeTermUSD: number;
}

export const DEDICATED_SPECS: DedicatedSpec[] = [
  {
    id: 'ded-xeon-e2388g',
    name: 'Xeon E-2388G',
    specLine: 'Xeon E-2388G, 8c/16t, 32GB ECC, 2x1TB NVMe',
    monthlyListUSD: 129,
    setupFeeMonthlyUSD: 99,
    setupFeeTermUSD: 0,
  },
  {
    id: 'ded-epyc-7313p',
    name: 'AMD EPYC 7313P',
    specLine: 'AMD EPYC 7313P, 16c/32t, 128GB ECC, 2x2TB NVMe',
    monthlyListUSD: 249,
    setupFeeMonthlyUSD: 99,
    setupFeeTermUSD: 0,
  },
  {
    id: 'ded-dual-epyc-7443',
    name: 'Dual EPYC 7443',
    specLine: 'Dual EPYC 7443, 48c/96t, 256GB ECC, 4x3.84TB NVMe',
    monthlyListUSD: 529,
    setupFeeMonthlyUSD: 99,
    setupFeeTermUSD: 0,
  },
];

export interface DedicatedDatacenter {
  id: string;
  city: string;
  countryCode: string;
  flag: string;
  latencyHint: string;
  outOfStock?: boolean;
}

export const DEDICATED_DATACENTERS: DedicatedDatacenter[] = [
  {
    id: 'nbo',
    city: 'Nairobi, KE',
    countryCode: 'KE',
    flag: '🇰🇪',
    latencyHint: 'Lowest latency for East Africa (~4ms)',
  },
  {
    id: 'jnb',
    city: 'Johannesburg, ZA',
    countryCode: 'ZA',
    flag: '🇿🇦',
    latencyHint: 'Southern Africa regional hub (~48ms)',
  },
  {
    id: 'los',
    city: 'Lagos, NG',
    countryCode: 'NG',
    flag: '🇳🇬',
    latencyHint: 'West Africa coastal PoP',
    outOfStock: true,
  },
  {
    id: 'fra',
    city: 'Frankfurt, DE',
    countryCode: 'DE',
    flag: '🇩🇪',
    latencyHint: 'European core peering (~112ms)',
  },
  {
    id: 'iad',
    city: 'Ashburn, US',
    countryCode: 'US',
    flag: '🇺🇸',
    latencyHint: 'US East transatlantic (~175ms)',
  },
];

export interface DedicatedBandwidth {
  id: string;
  label: string;
  extraMonthlyUSD: number;
}

export const DEDICATED_BANDWIDTH_OPTIONS: DedicatedBandwidth[] = [
  { id: '10tb', label: '10 TB @ 1Gbps included', extraMonthlyUSD: 0 },
  { id: '30tb', label: '30 TB @ 1Gbps', extraMonthlyUSD: 40 },
  { id: 'unmetered', label: 'Unmetered @ 1Gbps', extraMonthlyUSD: 120 },
];

// Cloud Config
export interface CloudInstanceSize {
  id: string;
  label: string;
  specs: string;
  vcpu: number;
  ramGb: number;
  monthlyUSD: number;
}

export const CLOUD_INSTANCE_SIZES: CloudInstanceSize[] = [
  {
    id: 'c1.small',
    label: 'c1.small',
    specs: '1 vCPU / 2 GB RAM',
    vcpu: 1,
    ramGb: 2,
    monthlyUSD: 8,
  },
  {
    id: 'c1.medium',
    label: 'c1.medium',
    specs: '2 vCPU / 4 GB RAM',
    vcpu: 2,
    ramGb: 4,
    monthlyUSD: 16,
  },
  {
    id: 'c1.large',
    label: 'c1.large',
    specs: '4 vCPU / 8 GB RAM',
    vcpu: 4,
    ramGb: 8,
    monthlyUSD: 32,
  },
  {
    id: 'c1.xlarge',
    label: 'c1.xlarge',
    specs: '8 vCPU / 16 GB RAM',
    vcpu: 8,
    ramGb: 16,
    monthlyUSD: 64,
  },
];

export interface CloudAutoscalingPreset {
  id: CloudAutoscalingId;
  label: string;
  description: string;
  minInstances: number;
  maxInstances: number;
}

export const CLOUD_AUTOSCALING_PRESETS: CloudAutoscalingPreset[] = [
  {
    id: 'off',
    label: 'Off',
    description: 'Fixed 1 instance',
    minInstances: 1,
    maxInstances: 1,
  },
  {
    id: 'steady',
    label: 'Steady',
    description: '1–3 instances',
    minInstances: 1,
    maxInstances: 3,
  },
  {
    id: 'burst',
    label: 'Burst',
    description: '2–10 instances',
    minInstances: 2,
    maxInstances: 10,
  },
];

export const KUBERNETES_CONTROL_PLANE_USD = 30;
