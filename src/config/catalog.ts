import { CartItem, CatalogProduct, ProductVertical } from '../types/checkout';

export interface VerticalTabMeta {
  id: ProductVertical;
  label: string;
  description: string;
}

export const VERTICAL_TABS: VerticalTabMeta[] = [
  {
    id: 'domain',
    label: 'Domains',
    description: 'East African & global TLDs, billed yearly',
  },
  {
    id: 'shared',
    label: 'Shared Hosting',
    description: 'NVMe web hosting with free SSL & daily backups',
  },
  {
    id: 'vps',
    label: 'VPS',
    description: 'Configurable vCPU, RAM & NVMe nodes in Nairobi',
  },
  {
    id: 'dedicated',
    label: 'Dedicated',
    description: 'Single-tenant bare-metal servers across 5 global locations',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    description: 'Auto-scaling East African cloud instances & Managed Kubernetes',
  },
  {
    id: 'addon',
    label: 'Add-ons',
    description: 'Security, priority migration, and dedicated IPs',
  },
];

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 'addon-white-glove-migration',
    vertical: 'addon',
    name: 'Concierge Site Migration',
    tagline: 'Zero-downtime transfer of files, databases, and email',
    configLines: [
      'Handled by Nairobi sysadmin team',
      'Includes post-DNS verification',
    ],
    specs: [
      'Full cPanel / WordPress transfer',
      'Zero downtime cutover',
      'Email inbox migration',
      '24-hour completion',
    ],
    basePriceUSD: 4.0,
    renewalPriceUSD: 4.0,
    setupFeeUSD: 15.0,
  },
  {
    id: 'addon-dedicated-ip',
    vertical: 'addon',
    name: 'Dedicated IPv4 Address',
    tagline: 'Clean static IPv4 for transactional email & custom SSL',
    configLines: [
      'Static Kenyan AFRINIC IPv4',
      'PTR / rDNS configuration included',
    ],
    specs: [
      'Dedicated AFRINIC IPv4',
      'Blacklist-monitored range',
      'Instant assignment',
      'Full rDNS control',
    ],
    basePriceUSD: 4.5,
    renewalPriceUSD: 4.5,
    setupFeeUSD: 0,
  },
];

export const SEEDED_CART_ITEMS: CartItem[] = [
  {
    id: 'item-shared-web-pro-seed',
    catalogId: 'shared-web-pro',
    vertical: 'shared',
    name: 'Web Hosting — Pro',
    shortName: 'Pro',
    configLines: [
      'Unlimited websites · 100 GB NVMe SSD',
      'Free wildcard SSL · Daily automated backups',
    ],
    basePriceUSD: 6.0,
    renewalPriceUSD: 6.0,
    setupFeeUSD: 0,
    quantity: 1,
    removable: true,
  },
];
