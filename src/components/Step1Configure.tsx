import React, { useRef } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Cpu,
  Globe,
  HardDrive,
  Layers,
  Server,
} from 'lucide-react';
import { VERTICAL_TABS } from '../config/catalog';
import { BILLING_CYCLES } from '../config/pricingConfig';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { ProductVertical } from '../types/checkout';
import {
  formatCurrency,
  getCycleDiscount,
  roundCents,
} from '../utils/pricing';
import { AddonsTab, RecommendedAddonsStrip } from './AddonsTab';
import { AnimatedPrice } from './AnimatedPrice';
import { CloudTab } from './CloudTab';
import { DedicatedTab } from './DedicatedTab';
import { DomainTab } from './DomainTab';
import { SharedHostingTab } from './SharedHostingTab';
import { VpsTab } from './VpsTab';

const VERTICAL_ICONS: Record<ProductVertical, React.ReactNode> = {
  domain: <Globe className="w-4 h-4 shrink-0" />,
  shared: <Server className="w-4 h-4 shrink-0" />,
  vps: <Cpu className="w-4 h-4 shrink-0" />,
  dedicated: <HardDrive className="w-4 h-4 shrink-0" />,
  cloud: <Cloud className="w-4 h-4 shrink-0" />,
  addon: <Layers className="w-4 h-4 shrink-0" />,
};

export function Step1Configure() {
  const {
    state,
    hasHostingPlan,
    setBillingCycle,
    setActiveVertical,
    mobileVerticalDetailOpen,
    setMobileVerticalDetailOpen,
    goToNextStep,
  } = useCart();
  const { isMobileLayout } = useViewport();
  const cycleRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleCycleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (idx + 1) % BILLING_CYCLES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (idx - 1 + BILLING_CYCLES.length) % BILLING_CYCLES.length;
    }
    if (nextIdx !== null) {
      e.preventDefault();
      setBillingCycle(BILLING_CYCLES[nextIdx].months);
      cycleRefs.current[nextIdx]?.focus();
    }
  };

  const activeTabMeta = VERTICAL_TABS.find(
    (t) => t.id === state.activeVertical
  );
  const hasCartItems = state.items.length > 0;

  // Cycle-eligible recurring items in the cart (hosting + add-ons)
  const cycleItems = state.items.filter((i) => i.vertical !== 'domain');
  const totalListMonthlyUSD = roundCents(
    cycleItems.reduce((sum, i) => sum + i.basePriceUSD * i.quantity, 0)
  );
  const totalRenewalMonthlyUSD = roundCents(
    cycleItems.reduce((sum, i) => sum + i.renewalPriceUSD * i.quantity, 0)
  );

  const activeDiscount = getCycleDiscount(state.billingCycle);
  const activeEffectiveMonthlyUSD = roundCents(
    totalListMonthlyUSD * (1 - activeDiscount)
  );
  const activeUpfrontHostingUSD = roundCents(
    activeEffectiveMonthlyUSD * state.billingCycle
  );

  const renderActiveVerticalPanel = () => (
    <>
      {state.activeVertical === 'domain' ? (
        <div role="tabpanel" aria-label={activeTabMeta?.label} className="min-w-0">
          <DomainTab />
        </div>
      ) : state.activeVertical === 'shared' ? (
        <div role="tabpanel" aria-label={activeTabMeta?.label} className="min-w-0">
          <SharedHostingTab />
        </div>
      ) : state.activeVertical === 'vps' ? (
        <div role="tabpanel" aria-label={activeTabMeta?.label} className="min-w-0">
          <VpsTab />
          {hasHostingPlan && (
            <div className="mt-5">
              <RecommendedAddonsStrip />
            </div>
          )}
        </div>
      ) : state.activeVertical === 'dedicated' ? (
        <div role="tabpanel" aria-label={activeTabMeta?.label} className="min-w-0">
          <DedicatedTab />
          {hasHostingPlan && (
            <div className="mt-5">
              <RecommendedAddonsStrip />
            </div>
          )}
        </div>
      ) : state.activeVertical === 'cloud' ? (
        <div role="tabpanel" aria-label={activeTabMeta?.label} className="min-w-0">
          <CloudTab />
          {hasHostingPlan && (
            <div className="mt-5">
              <RecommendedAddonsStrip />
            </div>
          )}
        </div>
      ) : (
        <div role="tabpanel" aria-label={activeTabMeta?.label} className="min-w-0">
          <AddonsTab />
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-5 lg:space-y-6 min-w-0">
      {/* Page Title */}
      <div className="min-w-0">
        <p className="eyebrow-label">Step 1 · Configure</p>
        <h1
          className={`font-display font-bold text-ink mt-1 tracking-tight ${
            isMobileLayout
              ? 'text-[26px] leading-tight'
              : 'text-[32px] leading-tight'
          }`}
        >
          Choose a product
        </h1>
        <p className="text-[15px] text-secondary mt-1.5">
          Pick your billing term and customize hosting, domains, and add-ons
          with full renewal transparency.
        </p>
      </div>

      {/* Billing Cycle Selector (placed above product tabs/chooser) */}
      <section aria-labelledby="billing-cycle-heading" className="kh-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="min-w-0">
            <h2
              id="billing-cycle-heading"
              className="font-display font-bold text-[18px] text-ink"
            >
              Billing cycle
            </h2>
            <p className="text-[13px] text-secondary">
              Applies to all hosting plans and add-ons. Domains bill yearly.
            </p>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Select hosting billing cycle"
          className={`grid gap-2.5 ${
            isMobileLayout ? 'grid-cols-2' : 'grid-cols-4'
          }`}
        >
          {BILLING_CYCLES.map((cycle, idx) => {
            const isSelected = state.billingCycle === cycle.months;
            const cycleMonthlyUSD = roundCents(
              totalListMonthlyUSD * (1 - cycle.discountRate)
            );

            return (
              <button
                key={cycle.months}
                ref={(el) => {
                  cycleRefs.current[idx] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setBillingCycle(cycle.months)}
                onKeyDown={(e) => handleCycleKeyDown(e, idx)}
                className={`relative flex flex-col items-start justify-between p-3 sm:p-3.5 min-h-[100px] min-w-0 rounded-[14px] border text-left transition-all kh-focus kh-touch-surface cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary-tint ring-1 ring-primary'
                    : 'border-border-subtle bg-surface hover:border-border-strong hover:shadow-raised'
                }`}
              >
                <div className="w-full flex items-center justify-between gap-1.5 min-w-0">
                  <span className="font-display font-bold text-[14px] sm:text-[15px] text-ink truncate">
                    {cycle.label}
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-primary bg-primary text-surface'
                        : 'border-border-input bg-surface'
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    )}
                  </span>
                </div>

                {/* Mobile puts Save badge above effective monthly price on its own line */}
                {isMobileLayout ? (
                  <div className="mt-2 w-full min-w-0 space-y-1.5">
                    {cycle.badge ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-ink text-[10px] font-bold leading-tight max-w-full">
                        {cycle.badge}
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] text-muted font-medium">
                        Standard rate
                      </span>
                    )}

                    <div className="font-display font-bold text-[15px] text-ink tabular-nums">
                      {cycleItems.length > 0 ? (
                        <span className="whitespace-nowrap">
                          {formatCurrency(cycleMonthlyUSD, state.currency)}
                          <span className="text-xs font-medium text-secondary">
                            /mo
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted">
                          No plan yet
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-2 font-display font-bold text-sm text-ink tabular-nums">
                      {cycleItems.length > 0 ? (
                        <span className="whitespace-nowrap">
                          {formatCurrency(cycleMonthlyUSD, state.currency)}
                          <span className="text-xs font-medium text-secondary">
                            /mo
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted">
                          No plan yet
                        </span>
                      )}
                    </div>

                    {cycle.badge ? (
                      <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                        {cycle.badge}
                      </span>
                    ) : (
                      <span className="mt-2 text-[11px] text-muted font-medium">
                        Standard rate
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Live plain-English cycle summary sentence with count tween */}
        <p className="mt-3.5 text-[13px] sm:text-sm text-body bg-canvas px-3.5 sm:px-4 py-2.5 rounded-[12px] border border-border-subtle">
          {cycleItems.length > 0 ? (
            <>
              You pay{' '}
              <strong className="font-display font-bold text-ink whitespace-nowrap">
                <AnimatedPrice
                  amountUSD={activeUpfrontHostingUSD}
                  currency={state.currency}
                />
              </strong>{' '}
              today for{' '}
              {state.billingCycle === 1
                ? '1 month'
                : `${state.billingCycle} months`}{' '}
              (
              <strong className="font-semibold text-ink whitespace-nowrap">
                <AnimatedPrice
                  amountUSD={activeEffectiveMonthlyUSD}
                  currency={state.currency}
                />
                /mo
              </strong>
              ). Renews at{' '}
              <strong className="font-semibold text-ink whitespace-nowrap">
                <AnimatedPrice
                  amountUSD={totalRenewalMonthlyUSD}
                  currency={state.currency}
                />
                /mo
              </strong>
              .
            </>
          ) : (
            'Select a hosting plan below to lock in up to 40% off your first term.'
          )}
        </p>
      </section>

      {/* Product Chooser: Stacked list on mobile, horizontal tabs on desktop */}
      {isMobileLayout ? (
        <section aria-labelledby="product-catalog-heading" className="kh-card p-4 min-w-0">
          {!mobileVerticalDetailOpen ? (
            <div className="space-y-3 min-w-0">
              <div>
                <h2
                  id="product-catalog-heading"
                  className="font-display font-bold text-[20px] text-ink"
                >
                  What do you need?
                </h2>
                <p className="text-[13px] text-secondary mt-0.5">
                  Tap any product to configure options and pricing.
                </p>
              </div>

              <div className="space-y-2.5">
                {VERTICAL_TABS.map((tab) => {
                  const countInCart = state.items.filter(
                    (i) => i.vertical === tab.id
                  ).length;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveVertical(tab.id)}
                      className={`w-full min-h-[64px] p-3.5 rounded-[14px] border text-left flex items-center justify-between gap-3 transition-colors kh-focus kh-touch-surface cursor-pointer ${
                        countInCart > 0
                          ? 'border-primary/45 bg-primary-tint/35'
                          : 'border-border-subtle bg-surface hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${
                            countInCart > 0
                              ? 'bg-primary text-surface'
                              : 'bg-surface-tint text-primary'
                          }`}
                        >
                          {VERTICAL_ICONS[tab.id]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-bold text-[15px] text-ink">
                              {tab.label}
                            </span>
                            {countInCart > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-surface text-[10px] font-bold whitespace-nowrap">
                                {countInCart} in cart
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-secondary mt-0.5 leading-snug">
                            {tab.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        aria-hidden="true"
                        className="w-5 h-5 text-muted shrink-0"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-divider">
                <button
                  type="button"
                  onClick={() => setMobileVerticalDetailOpen(false)}
                  className="inline-flex items-center gap-1 min-h-[44px] -ml-1 px-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary-tint kh-focus kh-touch-surface cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span>All products</span>
                </button>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted truncate">
                  {activeTabMeta?.label}
                </span>
              </div>

              <div className="mt-3 min-w-0">
                <h2
                  id="product-catalog-heading"
                  className="font-display font-bold text-[20px] text-ink flex items-center gap-2"
                >
                  <span className="text-primary">
                    {VERTICAL_ICONS[state.activeVertical]}
                  </span>
                  <span>{activeTabMeta?.label}</span>
                </h2>
                <p className="text-[13px] text-secondary mt-0.5">
                  {activeTabMeta?.description}
                </p>
              </div>

              {renderActiveVerticalPanel()}
            </div>
          )}
        </section>
      ) : (
        <section aria-labelledby="product-catalog-heading" className="kh-card p-5">
          <h2
            id="product-catalog-heading"
            className="font-display font-bold text-[22px] text-ink"
          >
            Product verticals
          </h2>
          <p className="text-[13px] text-secondary mt-0.5">
            {activeTabMeta?.description}
          </p>

          {/* Desktop Vertical Tabs */}
          <div
            role="tablist"
            aria-label="Product verticals"
            className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1"
          >
            {VERTICAL_TABS.map((tab) => {
              const isActive = state.activeVertical === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveVertical(tab.id)}
                  className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-all kh-focus cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? 'bg-primary text-surface shadow-raised'
                      : 'bg-canvas text-secondary hover:text-ink hover:bg-surface-tint/70 border border-border-subtle'
                  }`}
                >
                  {VERTICAL_ICONS[tab.id]}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {renderActiveVerticalPanel()}
        </section>
      )}

      {/* Desktop Action Row */}
      {!isMobileLayout && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-sm text-secondary">
            {hasCartItems
              ? 'Next: Enter account details or continue as a guest.'
              : 'Add at least one product to continue'}
          </p>
          <button
            type="button"
            disabled={!hasCartItems}
            onClick={goToNextStep}
            className="kh-btn kh-btn-accent"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
