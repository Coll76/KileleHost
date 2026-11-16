import {
  COUNTRY_TAX_RULES,
  CURRENCY_CONFIGS,
  CYCLE_DISCOUNT_MAP,
  VALID_PROMO_CODES,
} from '../config/pricingConfig';
import {
  BillingCycle,
  CartItem,
  CurrencyCode,
  OrderSummaryTotals,
  PricedLineItem,
  PromoCode,
} from '../types/checkout';

export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function convertCurrencyAmount(
  amountUSD: number,
  currency: CurrencyCode = 'KES'
): number {
  const config = CURRENCY_CONFIGS[currency] ?? CURRENCY_CONFIGS.KES;
  const raw = amountUSD * config.rateFromUSD;
  if (config.decimals === 0) {
    return Math.round(raw);
  }
  return roundCents(raw);
}

export function formatConvertedNumber(
  convertedValue: number,
  currency: CurrencyCode = 'KES'
): string {
  const config = CURRENCY_CONFIGS[currency] ?? CURRENCY_CONFIGS.KES;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(convertedValue);
}

export function getCycleDiscount(cycle: BillingCycle): number {
  return CYCLE_DISCOUNT_MAP[cycle] ?? 0;
}

export function getEffectiveBillingMonths(
  item: CartItem,
  hostingCycle: BillingCycle
): number {
  if (item.vertical === 'domain') {
    const years = item.domainConfig?.years ?? 1;
    return years * 12;
  }
  return hostingCycle;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  return result;
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCurrency(
  amountUSD: number,
  currency: CurrencyCode = 'KES'
): string {
  const converted = convertCurrencyAmount(amountUSD, currency);
  return formatConvertedNumber(converted, currency);
}

export function validatePromoCode(rawInput: string): {
  valid: boolean;
  promo: PromoCode | null;
  errorMessage?: string;
} {
  const normalized = rawInput.trim().toUpperCase();
  if (!normalized) {
    return {
      valid: false,
      promo: null,
      errorMessage: 'Enter a promo code to apply a discount.',
    };
  }

  const matched = VALID_PROMO_CODES[normalized];
  if (!matched) {
    return {
      valid: false,
      promo: null,
      errorMessage: `"${normalized}" is not a valid code. Try KILELE10 or WELCOME20.`,
    };
  }

  return {
    valid: true,
    promo: matched,
  };
}

export function calculateLineItemPricing(
  item: CartItem,
  hostingCycle: BillingCycle,
  referenceDate: Date = new Date()
): PricedLineItem {
  const isYearlyOnly = item.vertical === 'domain';
  const domainCfg = item.domainConfig;
  const isExistingDomain =
    isYearlyOnly && domainCfg?.registrationType === 'existing';

  if (isExistingDomain) {
    const renewalDate = addMonths(referenceDate, 12);
    return {
      item,
      termMonths: 12,
      isYearlyOnly: true,
      isExistingDomain: true,
      cycleDiscountPercent: 0,
      savingsPercent: 0,
      effectiveMonthlyUSD: 0,
      upfrontTotalUSD: 0,
      listTotalUSD: 0,
      setupFeeTotalUSD: 0,
      renewalMonthlyUSD: 0,
      renewalTermUSD: 0,
      renewalDate,
      renewalDateFormatted: formatShortDate(renewalDate),
    };
  }

  if (isYearlyOnly && domainCfg) {
    const years = domainCfg.years;
    const termMonths = years * 12;
    const whoisYearly =
      domainCfg.whoisSupport !== 'unsupported' && domainCfg.whoisPrivacy
        ? domainCfg.whoisPriceYearlyUSD
        : 0;

    const upfrontDomainPortion =
      domainCfg.firstYearPriceUSD +
      Math.max(0, years - 1) * domainCfg.renewalYearlyUSD;
    const upfrontTotalUSD = roundCents(
      (upfrontDomainPortion + whoisYearly * years) * item.quantity
    );
    const listTotalUSD = roundCents(
      (years * domainCfg.renewalYearlyUSD + whoisYearly * years) * item.quantity
    );

    const savingsPercent =
      listTotalUSD > upfrontTotalUSD && listTotalUSD > 0
        ? Math.round(((listTotalUSD - upfrontTotalUSD) / listTotalUSD) * 100)
        : 0;

    const renewalYearlyTotal = roundCents(
      (domainCfg.renewalYearlyUSD + whoisYearly) * item.quantity
    );
    const renewalMonthlyUSD = roundCents(renewalYearlyTotal / 12);
    const effectiveMonthlyUSD = roundCents(upfrontTotalUSD / termMonths);
    const setupFeeTotalUSD = roundCents(item.setupFeeUSD * item.quantity);
    const renewalDate = addMonths(referenceDate, termMonths);

    return {
      item,
      termMonths,
      isYearlyOnly: true,
      isExistingDomain: false,
      cycleDiscountPercent: 0,
      savingsPercent,
      effectiveMonthlyUSD,
      upfrontTotalUSD,
      listTotalUSD,
      setupFeeTotalUSD,
      renewalMonthlyUSD,
      renewalTermUSD: renewalYearlyTotal,
      renewalDate,
      renewalDateFormatted: formatShortDate(renewalDate),
    };
  }

  const termMonths = getEffectiveBillingMonths(item, hostingCycle);
  const cycleDiscountRate = isYearlyOnly ? 0 : getCycleDiscount(hostingCycle);
  const cycleDiscountPercent = Math.round(cycleDiscountRate * 100);

  const effectiveMonthlyUSD = roundCents(
    item.basePriceUSD * (1 - cycleDiscountRate)
  );
  const upfrontTotalUSD = roundCents(
    effectiveMonthlyUSD * termMonths * item.quantity
  );
  const listMonthlyBase = isYearlyOnly ? item.renewalPriceUSD : item.basePriceUSD;
  const listTotalUSD = roundCents(
    listMonthlyBase * termMonths * item.quantity
  );

  const savingsPercent =
    listTotalUSD > upfrontTotalUSD && listTotalUSD > 0
      ? Math.round(((listTotalUSD - upfrontTotalUSD) / listTotalUSD) * 100)
      : cycleDiscountPercent;

  const unitSetupFee =
    termMonths === 1 && item.setupFeeMonthlyOnlyUSD !== undefined
      ? item.setupFeeMonthlyOnlyUSD
      : item.setupFeeUSD;
  const setupFeeTotalUSD = roundCents(unitSetupFee * item.quantity);

  // Renewals are always at the standard 1-term list rate, never discounted
  const renewalMonthlyUSD = roundCents(item.renewalPriceUSD);
  const renewalTermUSD = roundCents(
    renewalMonthlyUSD * termMonths * item.quantity
  );

  const renewalDate = addMonths(referenceDate, termMonths);

  return {
    item,
    termMonths,
    isYearlyOnly,
    isExistingDomain: false,
    cycleDiscountPercent,
    savingsPercent,
    effectiveMonthlyUSD,
    upfrontTotalUSD,
    listTotalUSD,
    setupFeeTotalUSD,
    renewalMonthlyUSD,
    renewalTermUSD,
    renewalDate,
    renewalDateFormatted: formatShortDate(renewalDate),
  };
}

export function calculateOrderSummary(
  items: CartItem[],
  hostingCycle: BillingCycle,
  promoCode: PromoCode | null,
  currency: CurrencyCode = 'KES',
  billingCountry: string = 'Kenya',
  referenceDate: Date = new Date()
): OrderSummaryTotals {
  const lineItems = items.map((item) =>
    calculateLineItemPricing(item, hostingCycle, referenceDate)
  );

  const plansSubtotalUSD = roundCents(
    lineItems.reduce((sum, li) => sum + li.upfrontTotalUSD, 0)
  );
  const setupFeesTotalUSD = roundCents(
    lineItems.reduce((sum, li) => sum + li.setupFeeTotalUSD, 0)
  );
  const grossSubtotalUSD = roundCents(plansSubtotalUSD + setupFeesTotalUSD);

  const promoDiscountUSD = promoCode
    ? roundCents(grossSubtotalUSD * (promoCode.discountPercent / 100))
    : 0;

  const taxableSubtotalUSD = roundCents(
    Math.max(0, grossSubtotalUSD - promoDiscountUSD)
  );

  const taxRule =
    COUNTRY_TAX_RULES[billingCountry] ?? COUNTRY_TAX_RULES.Kenya;
  const estimatedTaxUSD = roundCents(taxableSubtotalUSD * taxRule.rate);
  const totalDueTodayUSD = roundCents(taxableSubtotalUSD + estimatedTaxUSD);

  const listGrandTotalUSD = roundCents(
    lineItems.reduce((sum, li) => sum + li.listTotalUSD, 0) + setupFeesTotalUSD
  );
  const totalSavingsUSD = roundCents(
    Math.max(0, listGrandTotalUSD - grossSubtotalUSD + promoDiscountUSD)
  );

  const renewalSummaryText = buildRenewalSummaryText(
    lineItems,
    hostingCycle,
    currency
  );

  return {
    lineItems,
    plansSubtotalUSD,
    setupFeesTotalUSD,
    grossSubtotalUSD,
    promoDiscountUSD,
    taxableSubtotalUSD,
    taxRate: taxRule.rate,
    taxLabel: taxRule.label,
    taxNote: taxRule.note,
    estimatedTaxUSD,
    totalDueTodayUSD,
    totalSavingsUSD,
    renewalSummaryText,
  };
}

function buildRenewalSummaryText(
  lineItems: PricedLineItem[],
  hostingCycle: BillingCycle,
  currency: CurrencyCode
): string {
  const billableItems = lineItems.filter((li) => !li.isExistingDomain);
  if (billableItems.length === 0) {
    if (lineItems.some((li) => li.isExistingDomain)) {
      return 'No recurring charges on your order. Update your nameservers at your registrar to connect.';
    }
    return '';
  }

  const domainItems = billableItems.filter((li) => li.isYearlyOnly);
  const hostingItems = billableItems.filter((li) => !li.isYearlyOnly);

  const domainRenewalTotal = roundCents(
    domainItems.reduce((sum, li) => sum + li.renewalTermUSD, 0)
  );
  const hostingRenewalTotal = roundCents(
    hostingItems.reduce((sum, li) => sum + li.renewalTermUSD, 0)
  );

  if (hostingItems.length > 0 && domainItems.length === 0) {
    const cadence = hostingCycle === 1 ? 'month' : `${hostingCycle} months`;
    return `You'll be billed ${formatCurrency(hostingRenewalTotal, currency)} every ${cadence} after your first term.`;
  }

  if (domainItems.length > 0 && hostingItems.length === 0) {
    return `You'll be billed ${formatCurrency(domainRenewalTotal, currency)} every year for domain renewals (when auto-renew is on).`;
  }

  if (hostingCycle === 12) {
    const combined = roundCents(hostingRenewalTotal + domainRenewalTotal);
    return `You'll be billed ${formatCurrency(combined, currency)} every 12 months after your first term.`;
  }

  const hostingCadence =
    hostingCycle === 1 ? 'month' : `${hostingCycle} months`;
  return `After your first term: ${formatCurrency(hostingRenewalTotal, currency)} every ${hostingCadence} for hosting + ${formatCurrency(domainRenewalTotal, currency)}/yr for domains.`;
}
