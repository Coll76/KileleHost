import React, { useState } from 'react';
import { Bell, Check, Clock, HardDrive, Network } from 'lucide-react';
import {
  DEDICATED_BANDWIDTH_OPTIONS,
  DEDICATED_DATACENTERS,
  DEDICATED_SPECS,
} from '../config/hostingCatalog';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { CartItem } from '../types/checkout';
import {
  formatCurrency,
  getCycleDiscount,
  roundCents,
} from '../utils/pricing';

const DEDICATED_CART_ITEM_ID = 'dedicated-configured-server';

export function DedicatedTab() {
  const { state, upsertConfiguredItem } = useCart();
  const { isMobileLayout } = useViewport();

  const [selectedSpecId, setSelectedSpecId] = useState<string>(
    DEDICATED_SPECS[0].id
  );
  const [selectedDcId, setSelectedDcId] = useState<string>(
    DEDICATED_DATACENTERS[0].id
  );
  const [selectedBwId, setSelectedBwId] = useState<string>(
    DEDICATED_BANDWIDTH_OPTIONS[0].id
  );
  const [notifiedDcIds, setNotifiedDcIds] = useState<string[]>([]);

  const selectedSpec =
    DEDICATED_SPECS.find((s) => s.id === selectedSpecId) ?? DEDICATED_SPECS[0];
  const selectedDc =
    DEDICATED_DATACENTERS.find((d) => d.id === selectedDcId) ??
    DEDICATED_DATACENTERS[0];
  const selectedBw =
    DEDICATED_BANDWIDTH_OPTIONS.find((b) => b.id === selectedBwId) ??
    DEDICATED_BANDWIDTH_OPTIONS[0];

  const existingInCart = state.items.find(
    (i) => i.id === DEDICATED_CART_ITEM_ID
  );

  const discountRate = getCycleDiscount(state.billingCycle);
  const discountPercent = Math.round(discountRate * 100);
  const totalListMonthly = roundCents(
    selectedSpec.monthlyListUSD + selectedBw.extraMonthlyUSD
  );
  const effectiveMonthly = roundCents(totalListMonthly * (1 - discountRate));
  const activeSetupFee =
    state.billingCycle === 1
      ? selectedSpec.setupFeeMonthlyUSD
      : selectedSpec.setupFeeTermUSD;

  const handleNotifyMe = (dcId: string) => {
    setNotifiedDcIds((prev) =>
      prev.includes(dcId) ? prev : [...prev, dcId]
    );
  };

  const handleAddOrUpdate = () => {
    const dedicatedItem: CartItem = {
      id: DEDICATED_CART_ITEM_ID,
      catalogId: `${selectedSpec.id}-${selectedDc.id}-${selectedBw.id}`,
      vertical: 'dedicated',
      name: `Dedicated — ${selectedSpec.name}`,
      configLines: [
        selectedSpec.specLine,
        `${selectedDc.city} · ${selectedBw.label}`,
      ],
      basePriceUSD: totalListMonthly,
      renewalPriceUSD: totalListMonthly,
      setupFeeUSD: selectedSpec.setupFeeTermUSD,
      setupFeeMonthlyOnlyUSD: selectedSpec.setupFeeMonthlyUSD,
      quantity: 1,
      removable: true,
    };

    upsertConfiguredItem(
      dedicatedItem,
      existingInCart
        ? 'Updated dedicated server in your order'
        : 'Added dedicated server to your order'
    );
  };

  return (
    <div className="mt-5 space-y-6 min-w-0">
      {/* Delivery estimate badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">
          1. Select bare-metal hardware
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-tint text-ink text-xs font-bold border border-primary/20 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Ready in 4-24 hours</span>
        </span>
      </div>

      {/* 3 Hardware Spec Cards */}
      <div
        role="radiogroup"
        aria-label="Dedicated server hardware"
        className={`grid gap-4 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-3'}`}
      >
        {DEDICATED_SPECS.map((spec) => {
          const isSelected = spec.id === selectedSpecId;
          const specDiscountedMonthly = roundCents(
            spec.monthlyListUSD * (1 - discountRate)
          );
          const isDiscounted = specDiscountedMonthly < spec.monthlyListUSD;

          return (
            <button
              key={spec.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedSpecId(spec.id)}
              className={`kh-card p-4 sm:p-5 text-left flex flex-col justify-between min-w-0 transition-all kh-focus kh-touch-surface cursor-pointer ${
                isSelected
                  ? 'border-primary! bg-primary-tint/40! ring-1 ring-primary'
                  : 'hover:border-border-strong hover:shadow-raised'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <HardDrive className="w-4 h-4 text-primary shrink-0" />
                  {isDiscounted && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-[18px] text-ink mt-2.5">
                  {spec.name}
                </h3>
                <p className="text-[13px] text-secondary mt-1 leading-snug">
                  {spec.specLine}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-divider min-w-0">
                {isDiscounted && (
                  <div className="text-xs text-muted line-through tabular-nums whitespace-nowrap">
                    {formatCurrency(spec.monthlyListUSD, state.currency)}/mo
                  </div>
                )}
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="font-display font-extrabold text-[26px] sm:text-[28px] leading-none text-ink tabular-nums whitespace-nowrap">
                    {formatCurrency(specDiscountedMonthly, state.currency)}
                  </span>
                  <span className="text-xs text-secondary font-medium whitespace-nowrap">
                    /mo
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1 tabular-nums">
                  Renews at{' '}
                  <span className="font-semibold text-ink whitespace-nowrap">
                    {formatCurrency(spec.monthlyListUSD, state.currency)}/mo
                  </span>
                </p>
                <p className="text-[11px] font-semibold text-muted mt-2 tabular-nums">
                  Setup fee: {formatCurrency(spec.setupFeeTermUSD, state.currency)} on 12+ months ·{' '}
                  {formatCurrency(spec.setupFeeMonthlyUSD, state.currency)} on monthly
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Data Center Selector */}
      <div className="space-y-2.5 min-w-0">
        <p className="text-sm font-semibold text-ink">
          2. Data center location
        </p>
        <div
          role="radiogroup"
          aria-label="Data center location"
          className={`grid gap-2.5 ${
            isMobileLayout
              ? 'grid-cols-1 min-[360px]:grid-cols-2'
              : 'grid-cols-3'
          }`}
        >
          {DEDICATED_DATACENTERS.map((dc) => {
            const isSelected = dc.id === selectedDcId;
            const isNotified = notifiedDcIds.includes(dc.id);

            if (dc.outOfStock) {
              return (
                <div
                  key={dc.id}
                  aria-disabled="true"
                  className="p-3.5 min-h-[64px] min-w-0 rounded-[14px] border border-border-subtle bg-canvas opacity-85 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap min-w-0">
                    <span className="font-display font-bold text-sm text-muted">
                      {dc.flag} {dc.city}
                    </span>
                    <span className="text-[11px] font-bold text-error whitespace-nowrap">
                      Out of stock
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                    <span className="text-[11px] text-muted leading-snug">
                      {dc.latencyHint}
                    </span>
                    {isNotified ? (
                      <span className="min-h-[44px] inline-flex items-center gap-1 text-[11px] font-semibold text-success shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        <span>Notified</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleNotifyMe(dc.id)}
                        className="min-h-[44px] px-2 -mx-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline kh-focus kh-touch-surface rounded cursor-pointer shrink-0"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Notify me</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={dc.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedDcId(dc.id)}
                className={`p-3.5 min-h-[64px] min-w-0 rounded-[14px] border text-left flex flex-col justify-between gap-1.5 transition-all kh-focus kh-touch-surface cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary-tint/45 ring-1 ring-primary'
                    : 'border-border-subtle bg-surface hover:border-border-strong'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full min-w-0">
                  <span className="font-display font-bold text-sm text-ink leading-snug">
                    {dc.flag} {dc.city}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-primary text-surface flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-secondary leading-snug">
                  {dc.latencyHint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bandwidth Packages */}
      <div className="space-y-2.5 min-w-0">
        <p className="text-sm font-semibold text-ink">3. Bandwidth package</p>
        <div
          role="radiogroup"
          aria-label="Bandwidth package"
          className={`grid gap-2.5 ${
            isMobileLayout
              ? 'grid-cols-1 min-[360px]:grid-cols-2'
              : 'grid-cols-3'
          }`}
        >
          {DEDICATED_BANDWIDTH_OPTIONS.map((bw) => {
            const isSelected = bw.id === selectedBwId;
            return (
              <button
                key={bw.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedBwId(bw.id)}
                className={`p-3.5 min-h-[64px] min-w-0 rounded-[14px] border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 transition-all kh-focus kh-touch-surface cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary-tint/45 ring-1 ring-primary'
                    : 'border-border-subtle bg-surface hover:border-border-strong'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Network className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-ink leading-snug">
                    {bw.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-ink tabular-nums whitespace-nowrap shrink-0">
                  {bw.extraMonthlyUSD === 0
                    ? 'Included'
                    : `+${formatCurrency(bw.extraMonthlyUSD, state.currency)}/mo`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Bar + Add/Update */}
      <div className="p-4 sm:p-5 rounded-[18px] bg-surface-tint/60 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="text-xs font-semibold text-secondary">
            {selectedSpec.name} · {selectedDc.city} · {selectedBw.label}
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display font-extrabold text-[26px] sm:text-[28px] leading-none text-ink tabular-nums whitespace-nowrap">
              {formatCurrency(effectiveMonthly, state.currency)}/mo
            </span>
            {effectiveMonthly < totalListMonthly && (
              <span className="text-xs text-muted line-through tabular-nums whitespace-nowrap">
                {formatCurrency(totalListMonthly, state.currency)}/mo
              </span>
            )}
            <span className="text-xs text-secondary tabular-nums whitespace-nowrap">
              · Renews at {formatCurrency(totalListMonthly, state.currency)}/mo
            </span>
          </div>
          <p className="text-xs text-secondary tabular-nums">
            One-time setup fee today:{' '}
            <strong className="text-ink whitespace-nowrap">
              {formatCurrency(activeSetupFee, state.currency)}
            </strong>{' '}
            ({state.billingCycle === 1 ? 'waived on 12+ month terms' : 'waived for 12+ mo term'})
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddOrUpdate}
          className="kh-btn kh-btn-primary shrink-0 w-full sm:w-auto"
        >
          {existingInCart ? 'Update in cart' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
