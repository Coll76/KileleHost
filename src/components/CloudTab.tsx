import React, { useState } from 'react';
import { Check, Cloud, Cpu, Minus, Plus } from 'lucide-react';
import {
  CLOUD_AUTOSCALING_PRESETS,
  CLOUD_INSTANCE_SIZES,
  KUBERNETES_CONTROL_PLANE_USD,
} from '../config/hostingCatalog';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { CartItem, CloudAutoscalingId } from '../types/checkout';
import {
  formatCurrency,
  getCycleDiscount,
  roundCents,
} from '../utils/pricing';

const CLOUD_CART_ITEM_ID = 'cloud-configured-cluster';
const CLOUD_K8S_ITEM_ID = 'cloud-k8s-addon';

export function CloudTab() {
  const { state, upsertCloudBundle } = useCart();
  const { isMobileLayout } = useViewport();

  const [sizeId, setSizeId] = useState<string>('c1.medium');
  const [autoscaleId, setAutoscaleId] = useState<CloudAutoscalingId>('steady');
  const [k8sEnabled, setK8sEnabled] = useState<boolean>(false);
  const [k8sNodes, setK8sNodes] = useState<number>(3);

  const selectedSize =
    CLOUD_INSTANCE_SIZES.find((s) => s.id === sizeId) ??
    CLOUD_INSTANCE_SIZES[1];
  const selectedAutoscale =
    CLOUD_AUTOSCALING_PRESETS.find((a) => a.id === autoscaleId) ??
    CLOUD_AUTOSCALING_PRESETS[1];

  const existingCloud = state.items.find((i) => i.id === CLOUD_CART_ITEM_ID);
  const discountRate = getCycleDiscount(state.billingCycle);
  const discountPercent = Math.round(discountRate * 100);

  const baselineInstances = selectedAutoscale.minInstances;
  const computeListMonthly = roundCents(
    selectedSize.monthlyUSD * baselineInstances
  );
  const computeEffectiveMonthly = roundCents(
    computeListMonthly * (1 - discountRate)
  );
  const peakMaxMonthly = roundCents(
    selectedSize.monthlyUSD * selectedAutoscale.maxInstances
  );

  const k8sNodesMonthly = roundCents(k8sNodes * selectedSize.monthlyUSD);
  const k8sTotalListMonthly = roundCents(
    KUBERNETES_CONTROL_PLANE_USD + k8sNodesMonthly
  );
  const k8sEffectiveMonthly = roundCents(
    k8sTotalListMonthly * (1 - discountRate)
  );

  const handleAddOrUpdate = () => {
    const cloudItem: CartItem = {
      id: CLOUD_CART_ITEM_ID,
      catalogId: `cloud-${selectedSize.id}-${selectedAutoscale.id}`,
      vertical: 'cloud',
      name: `Cloud Compute — ${selectedSize.label}`,
      configLines: [
        `${selectedSize.specs} · Autoscale: ${selectedAutoscale.label} (${selectedAutoscale.description})`,
        `Billed for ${baselineInstances} baseline ${
          baselineInstances === 1 ? 'instance' : 'instances'
        } · Peak est. ${formatCurrency(peakMaxMonthly, state.currency)}/mo`,
      ],
      basePriceUSD: computeListMonthly,
      renewalPriceUSD: computeListMonthly,
      setupFeeUSD: 0,
      quantity: 1,
      removable: true,
    };

    const k8sItem: CartItem | null = k8sEnabled
      ? {
          id: CLOUD_K8S_ITEM_ID,
          catalogId: `k8s-${selectedSize.id}-${k8sNodes}`,
          vertical: 'cloud',
          name: 'Managed Kubernetes',
          configLines: [
            `Control plane (${formatCurrency(
              KUBERNETES_CONTROL_PLANE_USD,
              state.currency
            )}/mo) + ${k8sNodes} × ${selectedSize.label} worker ${
              k8sNodes === 1 ? 'node' : 'nodes'
            }`,
            'Automated upgrades & Nairobi HA etcd',
          ],
          basePriceUSD: k8sTotalListMonthly,
          renewalPriceUSD: k8sTotalListMonthly,
          setupFeeUSD: 0,
          quantity: 1,
          removable: true,
        }
      : null;

    upsertCloudBundle(
      cloudItem,
      k8sItem,
      existingCloud
        ? 'Updated cloud configuration in your order'
        : 'Added cloud instance to your order'
    );
  };

  return (
    <div className="mt-5 space-y-6 min-w-0">
      {/* Instance Size Cards */}
      <div className="space-y-2.5 min-w-0">
        <p className="text-sm font-semibold text-ink">1. Select instance size</p>
        <div
          role="radiogroup"
          aria-label="Cloud instance size"
          className={`grid gap-2.5 sm:gap-3 ${
            isMobileLayout
              ? 'grid-cols-1 min-[360px]:grid-cols-2'
              : 'grid-cols-4'
          }`}
        >
          {CLOUD_INSTANCE_SIZES.map((size) => {
            const isSelected = size.id === sizeId;
            const discounted = roundCents(size.monthlyUSD * (1 - discountRate));
            const isDiscounted = discounted < size.monthlyUSD;

            return (
              <button
                key={size.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSizeId(size.id)}
                className={`kh-card p-3.5 sm:p-4 min-h-[64px] min-w-0 text-left flex flex-col justify-between transition-all kh-focus kh-touch-surface cursor-pointer ${
                  isSelected
                    ? 'border-primary! bg-primary-tint/45! ring-1 ring-primary'
                    : 'hover:border-border-strong hover:shadow-raised'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-display font-bold text-sm sm:text-base text-ink leading-snug">
                      {size.label}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-primary text-surface flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary mt-1 leading-snug">
                    {size.specs}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-divider min-w-0">
                  {isDiscounted && (
                    <div className="text-[11px] text-muted line-through tabular-nums whitespace-nowrap">
                      {formatCurrency(size.monthlyUSD, state.currency)}/mo
                    </div>
                  )}
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="font-display font-extrabold text-[22px] sm:text-[24px] leading-none text-ink tabular-nums whitespace-nowrap">
                      {formatCurrency(discounted, state.currency)}
                    </span>
                    <span className="text-xs text-secondary whitespace-nowrap">
                      /mo
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mt-1 tabular-nums">
                    Renews at{' '}
                    <span className="whitespace-nowrap">
                      {formatCurrency(size.monthlyUSD, state.currency)}/mo
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Autoscaling Presets Segmented Control */}
      <div className="space-y-3 min-w-0">
        <p className="text-sm font-semibold text-ink">
          2. Autoscaling preset
        </p>

        <div
          role="radiogroup"
          aria-label="Autoscaling preset"
          className={`grid gap-2 p-1.5 rounded-[16px] bg-canvas border border-border-subtle ${
            isMobileLayout ? 'grid-cols-1' : 'grid-cols-3'
          }`}
        >
          {CLOUD_AUTOSCALING_PRESETS.map((preset) => {
            const isSelected = preset.id === autoscaleId;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setAutoscaleId(preset.id)}
                className={`p-3 min-h-[64px] min-w-0 rounded-[12px] text-left transition-all kh-focus kh-touch-surface cursor-pointer ${
                  isSelected
                    ? 'bg-surface text-ink border border-primary ring-1 ring-primary shadow-card'
                    : 'text-secondary hover:text-ink border border-transparent'
                }`}
              >
                <div className="font-display font-bold text-sm text-ink">
                  {preset.label}
                </div>
                <div className="text-xs text-secondary mt-0.5 leading-snug">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Transparent peak cost disclosure */}
        <p className="text-xs font-medium text-ink bg-surface-warm border border-border-subtle px-3.5 py-2.5 rounded-[12px] tabular-nums">
          You pay for{' '}
          <strong>
            {baselineInstances}{' '}
            {baselineInstances === 1 ? 'instance' : 'instances'}
          </strong>{' '}
          today (
          <span className="whitespace-nowrap">
            {formatCurrency(computeEffectiveMonthly, state.currency)}/mo
          </span>
          ); estimated max{' '}
          <strong className="whitespace-nowrap">
            {formatCurrency(peakMaxMonthly, state.currency)}/mo
          </strong>{' '}
          at peak.
        </p>
      </div>

      {/* Managed Kubernetes Add-on Toggle */}
      <div className="p-4 rounded-[16px] border border-border-subtle bg-surface space-y-4 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Cpu className="w-4 h-4 text-primary shrink-0" />
              <label
                htmlFor="cloud-k8s-toggle"
                className="font-display font-bold text-base text-ink cursor-pointer"
              >
                Managed Kubernetes add-on
              </label>
              <span className="text-xs font-bold text-primary tabular-nums whitespace-nowrap">
                +{formatCurrency(KUBERNETES_CONTROL_PLANE_USD, state.currency)}
                /mo control plane
              </span>
            </div>
            <p className="text-[13px] text-secondary mt-1">
              Adds a dedicated Kubernetes control plane and worker nodes using{' '}
              <strong className="text-ink">{selectedSize.label}</strong> as its
              own line in your order summary.
            </p>
          </div>

          <button
            id="cloud-k8s-toggle"
            type="button"
            role="switch"
            aria-checked={k8sEnabled}
            onClick={() => setK8sEnabled((prev) => !prev)}
            className="min-w-[48px] min-h-[44px] inline-flex items-center justify-end shrink-0 kh-focus cursor-pointer"
          >
            <span
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                k8sEnabled ? 'bg-primary' : 'bg-border-input'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow-card transition-transform ${
                  k8sEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        </div>

        {k8sEnabled && (
          <div className="pt-3 border-t border-divider flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink">
                Worker nodes ({selectedSize.label})
              </div>
              <div className="text-xs text-secondary tabular-nums">
                {formatCurrency(KUBERNETES_CONTROL_PLANE_USD, state.currency)}{' '}
                control plane + {k8sNodes} ×{' '}
                {formatCurrency(selectedSize.monthlyUSD, state.currency)} ={' '}
                <strong className="text-ink whitespace-nowrap">
                  {formatCurrency(k8sTotalListMonthly, state.currency)}/mo
                </strong>{' '}
                list (
                <span className="whitespace-nowrap">
                  {formatCurrency(k8sEffectiveMonthly, state.currency)}/mo
                </span>{' '}
                first term)
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Decrease Kubernetes worker nodes"
                disabled={k8sNodes <= 1}
                onClick={() => setK8sNodes((n) => Math.max(1, n - 1))}
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-border-strong bg-canvas text-ink hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed kh-focus kh-touch-surface cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="min-w-[44px] text-center font-display font-bold text-base text-ink tabular-nums">
                {k8sNodes}
              </span>
              <button
                type="button"
                aria-label="Increase Kubernetes worker nodes"
                disabled={k8sNodes >= 10}
                onClick={() => setK8sNodes((n) => Math.min(10, n + 1))}
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-border-strong bg-canvas text-ink hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed kh-focus kh-touch-surface cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Summary & Add/Update Button */}
      <div className="p-4 sm:p-5 rounded-[18px] bg-surface-tint/60 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Cloud className="w-4 h-4 text-primary shrink-0" />
            <span className="font-display font-bold text-lg text-ink">
              Cloud Stack Summary
            </span>
            {discountPercent > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                Save {discountPercent}%
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display font-extrabold text-[26px] sm:text-[28px] leading-none text-ink tabular-nums whitespace-nowrap">
              {formatCurrency(
                roundCents(
                  computeEffectiveMonthly +
                    (k8sEnabled ? k8sEffectiveMonthly : 0)
                ),
                state.currency
              )}
              /mo
            </span>
            <span className="text-xs text-secondary tabular-nums whitespace-nowrap">
              · Renews at{' '}
              {formatCurrency(
                roundCents(
                  computeListMonthly + (k8sEnabled ? k8sTotalListMonthly : 0)
                ),
                state.currency
              )}
              /mo
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddOrUpdate}
          className="kh-btn kh-btn-primary shrink-0 w-full sm:w-auto"
        >
          {existingCloud ? 'Update in cart' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
