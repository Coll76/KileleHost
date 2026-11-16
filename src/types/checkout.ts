export type ProductVertical =
  | 'domain'
  | 'shared'
  | 'vps'
  | 'dedicated'
  | 'cloud'
  | 'addon';

export type BillingCycle = 1 | 12 | 24 | 36;

export type CurrencyCode = 'KES' | 'USD' | 'EUR' | 'GBP';

export type CheckoutStep = 1 | 2 | 3;

export type AccountMode = 'guest' | 'login';

export type AuthTabMode = 'new' | 'existing';

export type DomainMode = 'register' | 'transfer' | 'existing' | 'later';

export type DomainRegistrationType = 'register' | 'transfer' | 'existing';

export type DomainRegistrationYears = 1 | 2 | 3 | 5 | 10;

export type WhoisSupportStatus = 'free' | 'paid' | 'unsupported';

export type SharedSubCategory = 'web' | 'wordpress' | 'woocommerce';

export type VpsManagementMode = 'managed' | 'unmanaged';

export type VpsOsId = 'ubuntu' | 'almalinux' | 'debian' | 'windows';

export type CloudAutoscalingId = 'off' | 'steady' | 'burst';

export type SslOptionId = 'free' | 'ov' | 'wildcard';

export type DdosOptionId = 'standard' | 'advanced';

export type PaymentMethod = 'mpesa' | 'card' | 'paypal' | 'bank';

export interface CompletedOrderReceipt {
  orderRef: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  currency: CurrencyCode;
  summary: OrderSummaryTotals;
  hasDomainRegistration: boolean;
  hasHosting: boolean;
  hasDedicated: boolean;
  completedAtIso: string;
}

export interface DomainConfig {
  fullDomain: string;
  sld: string;
  tld: string;
  registrationType: DomainRegistrationType;
  years: DomainRegistrationYears;
  autoRenew: boolean;
  whoisPrivacy: boolean;
  whoisSupport: WhoisSupportStatus;
  whoisPriceYearlyUSD: number;
  firstYearPriceUSD: number;
  renewalYearlyUSD: number;
}

export interface SharedPlan {
  id: string;
  category: SharedSubCategory;
  name: string;
  shortName: string;
  audience: string;
  recommended?: boolean;
  listPriceUSD: number;
  features: {
    websites: string;
    storage: string;
    ssl: string;
    freeDomain: string;
    email: string;
    backups: string;
    backupsIncluded: boolean;
    extras?: string[];
  };
}

export interface CartItem {
  id: string;
  catalogId: string;
  vertical: ProductVertical;
  name: string;
  shortName?: string;
  configLines: string[];
  basePriceUSD: number;
  renewalPriceUSD: number;
  setupFeeUSD: number;
  setupFeeMonthlyOnlyUSD?: number;
  quantity: number;
  removable: boolean;
  domainConfig?: DomainConfig;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  label: string;
  firstTermOnly: boolean;
}

export interface SignedInUser {
  name: string;
  email: string;
  provider: 'google' | 'github' | 'sso' | 'password';
}

export interface CustomerInfo {
  accountMode: AccountMode;
  authTab: AuthTabMode;
  signedInUser: SignedInUser | null;
  createAccount: boolean;
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isBusinessPurchase: boolean;
  companyName: string;
  taxId: string;
}

export interface CatalogProduct {
  id: string;
  vertical: ProductVertical;
  name: string;
  tagline: string;
  badge?: string;
  configLines: string[];
  specs: string[];
  basePriceUSD: number;
  renewalPriceUSD: number;
  setupFeeUSD: number;
  isDomainYearly?: boolean;
}

export interface TldPriceRule {
  tld: string;
  firstYearUSD: number;
  renewalUSD: number;
  whoisSupport: WhoisSupportStatus;
  whoisYearlyUSD: number;
  popular?: boolean;
}

export interface DomainSearchResult {
  fullDomain: string;
  sld: string;
  tld: string;
  isAvailable: boolean;
  isExactMatch: boolean;
  firstYearUSD: number;
  renewalUSD: number;
  firstYearDiscountPercent: number;
  whoisSupport: WhoisSupportStatus;
  whoisYearlyUSD: number;
}

export interface PricedLineItem {
  item: CartItem;
  termMonths: number;
  isYearlyOnly: boolean;
  isExistingDomain: boolean;
  cycleDiscountPercent: number;
  savingsPercent: number;
  effectiveMonthlyUSD: number;
  upfrontTotalUSD: number;
  listTotalUSD: number;
  setupFeeTotalUSD: number;
  renewalMonthlyUSD: number;
  renewalTermUSD: number;
  renewalDate: Date;
  renewalDateFormatted: string;
}

export interface OrderSummaryTotals {
  lineItems: PricedLineItem[];
  plansSubtotalUSD: number;
  setupFeesTotalUSD: number;
  grossSubtotalUSD: number;
  promoDiscountUSD: number;
  taxableSubtotalUSD: number;
  taxRate: number;
  taxLabel: string;
  taxNote?: string;
  estimatedTaxUSD: number;
  totalDueTodayUSD: number;
  totalSavingsUSD: number;
  renewalSummaryText: string;
}
