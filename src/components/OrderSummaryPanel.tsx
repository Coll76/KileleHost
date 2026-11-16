import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Headphones,
  Info,
  Lock,
  RotateCcw,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { BILLING_CYCLES } from '../config/pricingConfig';
import { useCart } from '../store/CartContext';
import { BillingCycle } from '../types/checkout';
import { formatCurrency, validatePromoCode } from '../utils/pricing';
import { AnimatedPrice } from './AnimatedPrice';
import { DomainInlineOptions } from './DomainInlineOptions';

interface OrderSummaryPanelProps {
  inDrawer?: boolean;
  onBrowsePlans?: () => void;
}

export function OrderSummaryPanel({
  inDrawer = false,
  onBrowsePlans,
}: OrderSummaryPanelProps) {
  const {
    state,
    summary,
    isSummaryLoading,
    removeItem,
    setBillingCycle,
    setPromoCode,
    goToStep,
    setActiveVertical,
  } = useCart();

  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [taxTooltipOpen, setTaxTooltipOpen] = useState(false);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validatePromoCode(promoInput);
    if (!result.valid || !result.promo) {
      setPromoError(result.errorMessage ?? 'Invalid promo code');
      return;
    }
    setPromoError(null);
    setPromoCode(result.promo);
    setPromoInput('');
  };

  const handleBrowsePlans = () => {
    setActiveVertical('shared');
    goToStep(1);
    onBrowsePlans?.();
  };

  if (isSummaryLoading) {
    return <OrderSummarySkeleton inDrawer={inDrawer} />;
  }

  const hasItems = summary.lineItems.length > 0;

  return (
    <aside
      aria-label="Order summary"
      className={inDrawer ? 'w-full' : 'kh-panel p-6 lg:sticky lg:top-6'}
    >
      {/* Header + Mirrored Billing Cycle Dropdown */}
      <div className="flex flex-wrap items-start justify-between gap-2.5 pb-4 border-b border-divider">
        <div className="min-w-0 flex-1">
          <p className="eyebrow-label">Order Summary</p>
          <h2 className="font-display font-bold text-[20px] sm:text-[22px] text-ink mt-0.5 leading-tight">
            Your hosting stack
          </h2>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0 max-w-full">
          <label htmlFor={inDrawer ? 'summary-cycle-drawer' : 'summary-cycle'} className="sr-only">
            Billing cycle
          </label>
          <select
            id={inDrawer ? 'summary-cycle-drawer' : 'summary-cycle'}
            value={state.billingCycle}
            onChange={(e) =>
              setBillingCycle(Number(e.target.value) as BillingCycle)
            }
            className="min-h-[44px] max-w-full px-2.5 py-1.5 rounded-[10px] border border-border-input bg-surface text-xs font-semibold text-ink kh-focus cursor-pointer"
          >
            {BILLING_CYCLES.map((c) => (
              <option key={c.months} value={c.months}>
                {c.label}
                {c.discountPercent > 0 ? ` (-${c.discountPercent}%)` : ''}
              </option>
            ))}
          </select>
          {hasItems && (
            <span className="text-[11px] font-semibold text-secondary tabular-nums">
              {summary.lineItems.reduce((sum, li) => sum + li.item.quantity, 0)}{' '}
              {summary.lineItems.reduce((sum, li) => sum + li.item.quantity, 0) === 1
                ? 'item'
                : 'items'}
            </span>
          )}
        </div>
      </div>

      {/* Empty cart state */}
      {!hasItems ? (
        <div className="py-10 px-2 text-center flex flex-col items-center">
          <EmptyCartIllustration />
          <h3 className="font-display font-bold text-lg text-ink mt-4">
            Your cart is empty
          </h3>
          <p className="text-sm text-secondary mt-1.5 max-w-[260px]">
            Choose a hosting plan, domain, or cloud node to see transparent
            term and renewal pricing.
          </p>
          <button
            type="button"
            onClick={handleBrowsePlans}
            className="kh-btn kh-btn-primary mt-6"
          >
            Browse plans
          </button>
        </div>
      ) : (
        <div className="pt-4">
          {/* Line items */}
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {summary.lineItems.map((li) => {
                const isDiscounted = li.listTotalUSD > li.upfrontTotalUSD;
                const domainCfg = li.item.domainConfig;
                const termLabel = li.isExistingDomain
                  ? 'External DNS'
                  : domainCfg
                  ? domainCfg.years === 1
                    ? '1 year'
                    : `${domainCfg.years} years`
                  : li.termMonths === 1
                  ? '1 month'
                  : `${li.termMonths} months`;

                const dynamicDomainLines = domainCfg
                  ? domainCfg.registrationType === 'existing'
                    ? ['DNS managed externally · Nameservers provided']
                    : [
                        `${
                          domainCfg.years === 1
                            ? '1 year'
                            : `${domainCfg.years} years`
                        } · ${
                          domainCfg.whoisSupport === 'unsupported'
                            ? 'Privacy: Not supported by registry'
                            : domainCfg.whoisPrivacy
                            ? domainCfg.whoisSupport === 'free'
                              ? 'Privacy: On (Free)'
                              : `Privacy: On (${formatCurrency(
                                  domainCfg.whoisPriceYearlyUSD,
                                  state.currency
                                )}/yr)`
                            : 'Privacy: Off'
                        }`,
                        domainCfg.autoRenew ? 'Auto-renew: On' : 'Auto-renew: Off',
                      ]
                  : li.item.configLines;

                return (
                  <motion.li
                    key={li.item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="pb-4 border-b border-divider last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-[15px] text-ink overflow-anywhere">
                            {li.item.name}
                          </span>
                          {li.item.quantity > 1 && (
                            <span className="text-xs font-semibold text-primary tabular-nums whitespace-nowrap">
                              ×{li.item.quantity}
                            </span>
                          )}
                          {li.savingsPercent > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                              Save {li.savingsPercent}%
                            </span>
                          )}
                        </div>

                        {/* 1-2 config lines */}
                        <div className="mt-1 space-y-0.5">
                          {dynamicDomainLines.slice(0, 2).map((line, i) => (
                            <p
                              key={i}
                              className="text-[13px] text-secondary leading-snug overflow-anywhere"
                            >
                              {line}
                            </p>
                          ))}
                        </div>

                        <p className="text-xs font-medium text-muted mt-1.5">
                          Term: <span className="text-ink">{termLabel}</span>
                          {li.setupFeeTotalUSD > 0 && (
                            <span>
                              {' '}
                              · Setup fee:{' '}
                              <span className="tabular-nums text-ink whitespace-nowrap">
                                {formatCurrency(
                                  li.setupFeeTotalUSD,
                                  state.currency
                                )}
                              </span>
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Price & Remove */}
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-display font-bold text-[16px] text-ink tabular-nums whitespace-nowrap">
                              {formatCurrency(li.upfrontTotalUSD, state.currency)}
                            </div>
                            {isDiscounted && (
                              <div className="text-xs text-muted line-through tabular-nums whitespace-nowrap">
                                {formatCurrency(li.listTotalUSD, state.currency)}
                              </div>
                            )}
                          </div>

                          {li.item.removable && (
                            <button
                              type="button"
                              onClick={() => removeItem(li.item.id)}
                              aria-label={`Remove ${li.item.name}`}
                              className="min-w-[44px] min-h-[44px] -mr-2 inline-flex items-center justify-center rounded-full text-muted hover:text-error hover:bg-error-tint transition-colors kh-focus cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Renewal disclosure line */}
                    {li.isExistingDomain ? (
                      <p className="mt-2 text-xs text-secondary bg-canvas px-3 py-1.5 rounded-[10px]">
                        DNS managed externally · No renewal charge
                      </p>
                    ) : li.isYearlyOnly && domainCfg ? (
                      <p className="mt-2 text-xs text-secondary tabular-nums bg-canvas px-3 py-1.5 rounded-[10px]">
                        Renews on{' '}
                        <span className="font-semibold text-ink">
                          {li.renewalDateFormatted}
                        </span>{' '}
                        at{' '}
                        <span className="font-semibold text-ink whitespace-nowrap">
                          {formatCurrency(li.renewalTermUSD, state.currency)}/yr
                        </span>
                        {!domainCfg.autoRenew && ' (auto-renew off)'}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-secondary tabular-nums bg-canvas px-3 py-1.5 rounded-[10px]">
                        Renews on{' '}
                        <span className="font-semibold text-ink">
                          {li.renewalDateFormatted}
                        </span>{' '}
                        at{' '}
                        <span className="font-semibold text-ink whitespace-nowrap">
                          {formatCurrency(li.renewalTermUSD, state.currency)}
                        </span>{' '}
                        <span className="whitespace-nowrap">
                          ({formatCurrency(li.renewalMonthlyUSD, state.currency)}/mo)
                        </span>
                      </p>
                    )}

                    {/* Inline editable options for registered/transferred domains */}
                    {domainCfg && domainCfg.registrationType !== 'existing' && (
                      <DomainInlineOptions item={li.item} compact />
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          {/* Promo code block */}
          <div className="mt-5 pt-4 border-t border-divider">
            {state.promoCode ? (
              <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-[12px] bg-success-tint border border-success/25 text-sm">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <div className="min-w-0 overflow-anywhere">
                    <span className="font-bold text-ink">
                      {state.promoCode.code}
                    </span>{' '}
                    <span className="text-secondary text-xs">
                      ({state.promoCode.label})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoCode(null)}
                  aria-label="Remove promo code"
                  className="min-h-[44px] px-2.5 text-xs font-semibold text-ink hover:text-error transition-colors kh-focus rounded-lg cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : !promoExpanded ? (
              <button
                type="button"
                onClick={() => setPromoExpanded(true)}
                className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-primary hover:text-primary-hover transition-colors kh-focus rounded-lg px-1 cursor-pointer"
              >
                <Tag className="w-4 h-4 shrink-0" />
                <span>Have a promo code?</span>
              </button>
            ) : (
              <form onSubmit={handleApplyPromo} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={inDrawer ? 'promo-input-drawer' : 'promo-input'}
                    className="text-xs font-semibold text-ink"
                  >
                    Promo code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPromoExpanded(false);
                      setPromoError(null);
                    }}
                    className="min-h-[44px] -my-2 px-2 text-xs font-medium text-muted hover:text-ink kh-focus rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex items-stretch gap-2">
                  <input
                    id={inDrawer ? 'promo-input-drawer' : 'promo-input'}
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      if (promoError) setPromoError(null);
                    }}
                    placeholder="e.g. KILELE10 or WELCOME20"
                    className="kh-input flex-1 min-w-0 text-[16px]! uppercase"
                  />
                  <button
                    type="submit"
                    className="kh-btn kh-btn-secondary px-4! min-h-[48px]! text-sm shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-error flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span>{promoError}</span>
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Totals breakdown */}
          <div className="mt-4 pt-4 border-t border-divider space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-2 text-secondary">
              <span className="min-w-0">Plans subtotal</span>
              <span className="font-medium text-ink whitespace-nowrap shrink-0">
                <AnimatedPrice
                  amountUSD={summary.plansSubtotalUSD}
                  currency={state.currency}
                />
              </span>
            </div>

            {summary.setupFeesTotalUSD > 0 && (
              <div className="flex items-center justify-between gap-2 text-secondary">
                <span className="min-w-0">One-time setup fees</span>
                <span className="font-medium text-ink tabular-nums whitespace-nowrap shrink-0">
                  {formatCurrency(summary.setupFeesTotalUSD, state.currency)}
                </span>
              </div>
            )}

            {summary.promoDiscountUSD > 0 && state.promoCode && (
              <div className="flex items-center justify-between gap-2 text-success font-medium">
                <span className="min-w-0">
                  Promo ({state.promoCode.code} · {state.promoCode.discountPercent}% off)
                </span>
                <span className="tabular-nums whitespace-nowrap shrink-0">
                  −{formatCurrency(summary.promoDiscountUSD, state.currency)}
                </span>
              </div>
            )}

            {/* Country-aware Tax row with info tooltip */}
            <div className="relative flex items-start justify-between gap-2 text-secondary">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 flex-wrap">
                  <span>{summary.taxLabel}</span>
                  <button
                    type="button"
                    onClick={() => setTaxTooltipOpen((prev) => !prev)}
                    onBlur={() => setTaxTooltipOpen(false)}
                    aria-label="Tax calculation information"
                    aria-expanded={taxTooltipOpen}
                    className="min-w-[44px] min-h-[44px] -my-3 -mx-1 inline-flex items-center justify-center rounded-full text-muted hover:text-primary hover:bg-primary-tint/60 transition-colors kh-focus cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                {summary.taxNote && (
                  <p className="text-[11px] text-muted">{summary.taxNote}</p>
                )}
              </div>
              <span className="font-medium text-ink whitespace-nowrap shrink-0">
                <AnimatedPrice
                  amountUSD={summary.estimatedTaxUSD}
                  currency={state.currency}
                />
              </span>

              {taxTooltipOpen && (
                <div
                  role="tooltip"
                  className="absolute left-0 bottom-full mb-2 w-64 max-w-full p-3 rounded-[12px] bg-ink-deep text-surface text-xs leading-relaxed shadow-raised z-20"
                >
                  Tax rate is based on your billing country in Step 2 (
                  {state.customerInfo.country || 'Kenya'}:{' '}
                  {(summary.taxRate * 100).toFixed(
                    summary.taxRate === 0.075 ? 1 : 0
                  )}
                  %).
                </div>
              )}
            </div>
          </div>

          {/* Total due today */}
          <div className="mt-4 pt-4 border-t border-divider">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display font-bold text-base text-ink min-w-0">
                Total due today
              </span>
              <span className="font-display font-extrabold text-[24px] sm:text-[28px] leading-none text-ink whitespace-nowrap shrink-0">
                <AnimatedPrice
                  amountUSD={summary.totalDueTodayUSD}
                  currency={state.currency}
                />
              </span>
            </div>

            {summary.totalSavingsUSD > 0 && (
              <p className="text-xs font-semibold text-success mt-1.5 text-right tabular-nums whitespace-nowrap">
                You save {formatCurrency(summary.totalSavingsUSD, state.currency)}{' '}
                today
              </p>
            )}

            <p className="mt-3 text-xs text-muted leading-relaxed tabular-nums">
              {summary.renewalSummaryText}
            </p>

            <p className="mt-2 text-[11px] text-muted">
              Prices shown in {state.currency}. You&apos;ll be charged in{' '}
              {state.currency}.
            </p>
          </div>
        </div>
      )}

      {/* Trust row at bottom */}
      <div className="mt-6 pt-4 border-t border-divider grid grid-cols-1 gap-2.5 text-xs text-secondary">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-primary shrink-0" />
          <span>30-day money-back guarantee</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-success shrink-0" />
          <span>Free SSL on all hosting</span>
        </div>
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary shrink-0" />
          <span>24/7 support</span>
        </div>
      </div>
    </aside>
  );
}

function OrderSummarySkeleton({ inDrawer }: { inDrawer: boolean }) {
  return (
    <aside
      aria-label="Loading order summary"
      aria-busy="true"
      className={inDrawer ? 'w-full animate-pulse' : 'kh-panel p-6 animate-pulse'}
    >
      <div className="pb-4 border-b border-divider">
        <div className="h-3 w-24 bg-divider rounded" />
        <div className="h-6 w-44 bg-divider rounded mt-2" />
      </div>

      <div className="py-5 space-y-4 border-b border-divider">
        <div className="flex justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 bg-divider rounded" />
            <div className="h-3 w-52 bg-canvas rounded" />
            <div className="h-3 w-32 bg-canvas rounded" />
          </div>
          <div className="h-5 w-16 bg-divider rounded" />
        </div>
        <div className="h-7 w-full bg-canvas rounded-[10px]" />
      </div>

      <div className="py-4 space-y-3 border-b border-divider">
        <div className="flex justify-between">
          <div className="h-3.5 w-24 bg-canvas rounded" />
          <div className="h-3.5 w-16 bg-divider rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3.5 w-32 bg-canvas rounded" />
          <div className="h-3.5 w-14 bg-divider rounded" />
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <div className="flex justify-between items-baseline">
          <div className="h-5 w-28 bg-divider rounded" />
          <div className="h-8 w-24 bg-divider rounded" />
        </div>
        <div className="h-3 w-full bg-canvas rounded" />
      </div>

      <div className="mt-6 pt-4 border-t border-divider space-y-2">
        <div className="h-3.5 w-44 bg-canvas rounded" />
        <div className="h-3.5 w-40 bg-canvas rounded" />
        <div className="h-3.5 w-28 bg-canvas rounded" />
      </div>
    </aside>
  );
}

function EmptyCartIllustration() {
  return (
    <svg
      width="112"
      height="88"
      viewBox="0 0 112 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="14"
        y="14"
        width="84"
        height="56"
        rx="14"
        fill="var(--kh-surface-tint)"
      />
      <rect
        x="26"
        y="26"
        width="60"
        height="14"
        rx="6"
        fill="var(--kh-surface)"
        stroke="var(--kh-border-strong)"
      />
      <rect
        x="26"
        y="46"
        width="60"
        height="14"
        rx="6"
        fill="var(--kh-surface)"
        stroke="var(--kh-border-strong)"
      />
      <circle cx="34" cy="33" r="2.5" fill="var(--kh-primary)" />
      <circle cx="34" cy="53" r="2.5" fill="var(--kh-accent)" />
      <path
        d="M42 33H74M42 53H66"
        stroke="var(--kh-divider)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="88"
        cy="66"
        r="14"
        fill="var(--kh-surface)"
        stroke="var(--kh-primary)"
        strokeWidth="2"
      />
      <path
        d="M83 66H93M88 61V71"
        stroke="var(--kh-primary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrustShieldBadge() {
  return <ShieldCheck className="w-4 h-4 text-success shrink-0" />;
}
