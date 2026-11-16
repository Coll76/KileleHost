import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Minus,
} from 'lucide-react';
import { SHARED_PLANS, SHARED_SUBTABS } from '../config/hostingCatalog';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { SharedPlan, SharedSubCategory } from '../types/checkout';
import {
  formatCurrency,
  getCycleDiscount,
  roundCents,
} from '../utils/pricing';
import { RecommendedAddonsStrip } from './AddonsTab';

export function SharedHostingTab() {
  const {
    state,
    selectSharedPlan,
    setActiveVertical,
    setDomainMode,
  } = useCart();
  const { isMobileLayout } = useViewport();

  const activeSharedItem = state.items.find((i) => i.vertical === 'shared');
  const activePlanFromCart = activeSharedItem
    ? SHARED_PLANS.find((p) => p.id === activeSharedItem.catalogId)
    : undefined;

  const [subTab, setSubTab] = useState<SharedSubCategory>(
    activePlanFromCart?.category ?? 'web'
  );
  const [compareOpen, setCompareOpen] = useState(false);

  // Mobile: Recommended plan features open by default, others closed by default
  const [expandedPlanFeatures, setExpandedPlanFeatures] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    SHARED_PLANS.forEach((p) => {
      if (p.recommended) initial[p.id] = true;
    });
    return initial;
  });

  // Mobile: Compare all features per-feature accordion state
  const [expandedCompareFeature, setExpandedCompareFeature] = useState<
    string | null
  >('websites');

  const nextDecisionRef = useRef<HTMLDivElement | null>(null);

  const rawPlans = SHARED_PLANS.filter((p) => p.category === subTab);
  const plans = isMobileLayout
    ? [...rawPlans].sort(
        (a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended))
      )
    : rawPlans;

  const activeSubMeta = SHARED_SUBTABS.find((t) => t.id === subTab);
  const discountRate = getCycleDiscount(state.billingCycle);
  const discountPercent = Math.round(discountRate * 100);
  const hasDomainInCart = state.items.some((i) => i.vertical === 'domain');

  const handleJumpToDomains = () => {
    setDomainMode('register');
    setActiveVertical('domain');
  };

  const handleSelectPlan = (plan: SharedPlan) => {
    selectSharedPlan(plan);
    if (isMobileLayout) {
      window.setTimeout(() => {
        nextDecisionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 160);
    }
  };

  const toggleFeatures = (planId: string) => {
    setExpandedPlanFeatures((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const compareRows: Array<{
    key: string;
    label: string;
    getValue: (p: SharedPlan) => string;
  }> = [
    { key: 'websites', label: 'Websites', getValue: (p) => p.features.websites },
    {
      key: 'storage',
      label: 'NVMe Storage',
      getValue: (p) => p.features.storage,
    },
    { key: 'ssl', label: 'SSL Security', getValue: (p) => p.features.ssl },
    {
      key: 'domain',
      label: 'Free Domain',
      getValue: (p) => p.features.freeDomain,
    },
    { key: 'email', label: 'Email Accounts', getValue: (p) => p.features.email },
    {
      key: 'backups',
      label: 'Daily Backups',
      getValue: (p) => (p.features.backupsIncluded ? 'Yes' : 'No (Weekly only)'),
    },
  ];

  return (
    <div className="mt-5 space-y-5 min-w-0">
      {/* Sub-tabs: Web Hosting | WordPress | WooCommerce */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        {isMobileLayout ? (
          <div className="relative min-w-0 max-w-full">
            <div
              role="tablist"
              aria-label="Shared hosting categories"
              className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar pr-8 pb-1"
            >
              {SHARED_SUBTABS.map((tab) => {
                const isSelected = subTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSubTab(tab.id)}
                    className={`snap-start min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-all kh-focus kh-touch-surface cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-surface shadow-card'
                        : 'bg-canvas text-secondary border border-border-subtle hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-surface to-transparent"
            />
          </div>
        ) : (
          <div
            role="tablist"
            aria-label="Shared hosting categories"
            className="inline-flex items-center gap-1.5 p-1 rounded-full bg-canvas border border-border-subtle overflow-x-auto max-w-full"
          >
            {SHARED_SUBTABS.map((tab) => {
              const isSelected = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSubTab(tab.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-all kh-focus cursor-pointer ${
                    isSelected
                      ? 'bg-surface text-ink shadow-card border border-primary/40'
                      : 'text-secondary hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-[13px] text-secondary">{activeSubMeta?.subtitle}</p>
      </div>

      {/* 3 Plan Cards: Row on desktop, vertical stack on mobile with Recommended first */}
      <div
        role="tabpanel"
        aria-label={activeSubMeta?.label}
        className={
          isMobileLayout
            ? 'flex flex-col gap-4 min-w-0'
            : 'grid grid-cols-3 gap-4 items-stretch pt-2'
        }
      >
        {plans.map((plan) => {
          const isSelected = activeSharedItem?.catalogId === plan.id;
          const effectiveMonthly = roundCents(
            plan.listPriceUSD * (1 - discountRate)
          );
          const isDiscounted = effectiveMonthly < plan.listPriceUSD;
          const featuresOpen = Boolean(expandedPlanFeatures[plan.id]);

          const bullets: { text: string; included: boolean }[] = [
            { text: plan.features.websites, included: true },
            { text: plan.features.storage, included: true },
            { text: plan.features.ssl, included: true },
            { text: plan.features.freeDomain, included: state.billingCycle >= 12 },
            { text: plan.features.email, included: true },
            {
              text: plan.features.backups,
              included: plan.features.backupsIncluded,
            },
            ...(plan.features.extras ?? []).map((extra) => ({
              text: extra,
              included: true,
            })),
          ];

          return (
            <div
              key={plan.id}
              className={`kh-card p-4 sm:p-5 flex flex-col justify-between transition-all min-w-0 ${
                plan.recommended && !isMobileLayout
                  ? 'lg:-translate-y-1.5 shadow-raised'
                  : ''
              } ${
                isSelected
                  ? 'border-primary! ring-1 ring-primary bg-primary-tint/35!'
                  : plan.recommended
                  ? 'border-primary/45'
                  : ''
              }`}
            >
              <div className="min-w-0">
                {/* Top badge row */}
                <div className="flex items-center justify-between gap-2 min-h-[26px] flex-wrap">
                  {plan.recommended ? (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-primary text-surface text-[11px] font-bold whitespace-nowrap">
                      Recommended
                    </span>
                  ) : (
                    <span className="eyebrow-label">{activeSubMeta?.label}</span>
                  )}

                  {isDiscounted && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-[20px] text-ink mt-2.5">
                  {plan.name}
                </h3>
                <p
                  className={`text-[13px] text-secondary mt-0.5 ${
                    isMobileLayout ? '' : 'min-h-[36px]'
                  }`}
                >
                  {plan.audience}
                </p>

                {/* Price Block */}
                <div className="mt-4 pt-4 border-t border-divider">
                  {isDiscounted && (
                    <div className="text-xs text-muted line-through tabular-nums mb-1 whitespace-nowrap">
                      {formatCurrency(plan.listPriceUSD, state.currency)}/mo
                    </div>
                  )}

                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-display font-extrabold text-[34px] sm:text-[36px] leading-none text-ink tabular-nums whitespace-nowrap">
                      {formatCurrency(effectiveMonthly, state.currency)}
                    </span>
                    <span className="text-sm text-secondary font-medium whitespace-nowrap">
                      /mo
                    </span>
                  </div>

                  <p className="text-xs text-secondary mt-1.5 tabular-nums">
                    Renews at{' '}
                    <span className="font-semibold text-ink whitespace-nowrap">
                      {formatCurrency(plan.listPriceUSD, state.currency)}/mo
                    </span>
                  </p>
                </div>

                {/* Mobile Select CTA comes right above features accordion for compact collapsed cards */}
                {isMobileLayout ? (
                  <div className="mt-4 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      aria-pressed={isSelected}
                      className={`kh-btn w-full ${
                        isSelected
                          ? 'bg-surface text-primary border-2 border-primary font-bold'
                          : 'kh-btn-primary'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                          <span>Selected ✓</span>
                        </>
                      ) : (
                        <span>Select plan</span>
                      )}
                    </button>

                    <div className="pt-1 border-t border-divider">
                      <button
                        type="button"
                        onClick={() => toggleFeatures(plan.id)}
                        aria-expanded={featuresOpen}
                        className="w-full min-h-[44px] flex items-center justify-between gap-2 px-1 text-xs font-semibold text-primary kh-focus kh-touch-surface rounded-lg cursor-pointer"
                      >
                        <span>
                          {featuresOpen ? 'Hide features' : 'See features'}
                        </span>
                        {featuresOpen ? (
                          <ChevronUp className="w-4 h-4 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 shrink-0" />
                        )}
                      </button>

                      {featuresOpen && (
                        <ul className="mt-2 pb-1 space-y-2 text-[13px] text-body">
                          {bullets.map((b) => (
                            <li key={b.text} className="flex items-start gap-2">
                              {b.included ? (
                                <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                              ) : (
                                <Minus className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                              )}
                              <span
                                className={`min-w-0 ${
                                  b.included ? 'text-body' : 'text-muted'
                                }`}
                              >
                                {b.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Desktop Feature bullets */
                  <ul className="mt-4 space-y-2 text-[13px] text-body">
                    {bullets.map((b) => (
                      <li key={b.text} className="flex items-start gap-2">
                        {b.included ? (
                          <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                        )}
                        <span className={b.included ? 'text-body' : 'text-muted'}>
                          {b.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!isMobileLayout && (
                <div className="mt-5 pt-4 border-t border-divider">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    aria-pressed={isSelected}
                    className={`kh-btn w-full ${
                      isSelected
                        ? 'bg-surface text-primary border-2 border-primary font-bold'
                        : 'kh-btn-primary'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                        <span>Selected ✓</span>
                      </>
                    ) : (
                      <span>Select plan</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next Decision Anchor (Free-domain prompt + Recommended Add-ons) */}
      <div
        id="shared-next-decision"
        ref={nextDecisionRef}
        className="space-y-4 scroll-mt-[84px]"
      >
        {activeSharedItem && !hasDomainInCart && (
          <div className="p-4 rounded-[14px] bg-surface-tint/70 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5 text-sm text-ink min-w-0">
              <Globe className="w-4 h-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <span>Your plan includes a free domain for the first year. </span>
                <button
                  type="button"
                  onClick={handleJumpToDomains}
                  className="font-bold text-primary hover:text-primary-hover underline underline-offset-2 kh-focus rounded cursor-pointer inline-flex items-center gap-1 min-h-[44px] -my-2"
                >
                  <span>Search now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSharedItem && <RecommendedAddonsStrip />}
      </div>

      {/* Compare all features toggle & table (Desktop) / Per-feature Accordion (Mobile) */}
      <div className="pt-1 min-w-0">
        <button
          type="button"
          onClick={() => setCompareOpen((prev) => !prev)}
          aria-expanded={compareOpen}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-sm font-semibold text-primary hover:text-primary-hover kh-focus rounded-lg cursor-pointer"
        >
          <span>Compare all features</span>
          {compareOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {compareOpen &&
          (isMobileLayout ? (
            <div className="mt-3 space-y-2 min-w-0">
              {compareRows.map((row) => {
                const isOpen = expandedCompareFeature === row.key;
                return (
                  <div
                    key={row.key}
                    className="rounded-[14px] border border-border-subtle bg-surface overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setExpandedCompareFeature((prev) =>
                          prev === row.key ? null : row.key
                        )
                      }
                      className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-2 text-left kh-focus kh-touch-surface cursor-pointer"
                    >
                      <span className="font-display font-bold text-sm text-ink">
                        {row.label}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-3 pt-1 border-t border-divider space-y-2 bg-canvas/50">
                        {rawPlans.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-start justify-between gap-3 text-xs py-1"
                          >
                            <span className="font-semibold text-ink shrink-0">
                              {p.name}
                            </span>
                            <span className="text-secondary text-right min-w-0">
                              {row.getValue(p)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-[14px] border border-border-subtle bg-surface">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-canvas border-b border-divider">
                    <th
                      scope="col"
                      className="py-3 px-4 font-display font-bold text-ink"
                    >
                      Feature
                    </th>
                    {plans.map((p) => (
                      <th
                        key={p.id}
                        scope="col"
                        className="py-3 px-4 font-display font-bold text-ink whitespace-nowrap"
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider text-[13px]">
                  {compareRows.map((row) => (
                    <tr key={row.key}>
                      <th
                        scope="row"
                        className="py-3 px-4 font-semibold text-ink"
                      >
                        {row.label}
                      </th>
                      {plans.map((p) => (
                        <td key={p.id} className="py-3 px-4 text-secondary">
                          {row.getValue(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
}
