import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Minus,
  Plus,
  Server,
  Shield,
  SlidersHorizontal,
  Terminal,
} from 'lucide-react';
import {
  VPS_MANAGED_PRICE_USD,
  VPS_OS_OPTIONS,
  VPS_PRESETS,
  VPS_RATE_PER_GB_NVME,
  VPS_RATE_PER_GB_RAM,
  VPS_RATE_PER_VCPU,
} from '../config/hostingCatalog';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { CartItem, VpsManagementMode, VpsOsId } from '../types/checkout';
import {
  formatCurrency,
  getCycleDiscount,
  roundCents,
} from '../utils/pricing';

const VPS_CART_ITEM_ID = 'vps-configured-node';

export function VpsTab() {
  const { state, upsertConfiguredItem } = useCart();
  const { isMobileLayout } = useViewport();

  const [management, setManagement] = useState<VpsManagementMode>('managed');
  const [osId, setOsId] = useState<VpsOsId>('ubuntu');
  const [vcpu, setVcpu] = useState<number>(4);
  const [ramGb, setRamGb] = useState<number>(8);
  const [nvmeGb, setNvmeGb] = useState<number>(160);
  const [windowsBumpNotice, setWindowsBumpNotice] = useState<string | null>(
    null
  );
  const [vpsCardLoading, setVpsCardLoading] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVpsCardLoading(false), 400);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedOs =
    VPS_OS_OPTIONS.find((o) => o.id === osId) ?? VPS_OS_OPTIONS[0];
  const existingInCart = state.items.find((i) => i.id === VPS_CART_ITEM_ID);

  const applyWithWindowsGuard = (
    nextOs: VpsOsId,
    nextVcpu: number,
    nextRam: number
  ) => {
    const targetOs =
      VPS_OS_OPTIONS.find((o) => o.id === nextOs) ?? VPS_OS_OPTIONS[0];
    let adjustedVcpu = nextVcpu;
    let adjustedRam = nextRam;
    let bumped = false;

    if (nextVcpu < targetOs.minVcpu) {
      adjustedVcpu = targetOs.minVcpu;
      bumped = true;
    }
    if (nextRam < targetOs.minRamGb) {
      adjustedRam = targetOs.minRamGb;
      bumped = true;
    }

    setVcpu(adjustedVcpu);
    setRamGb(adjustedRam);

    if (bumped && nextOs === 'windows') {
      setWindowsBumpNotice(
        'Windows Server 2022 requires at least 2 vCPU and 4 GB RAM. Your configuration was automatically adjusted.'
      );
    } else if (nextOs !== 'windows') {
      setWindowsBumpNotice(null);
    }
  };

  const handleOsSelect = (nextOs: VpsOsId) => {
    setOsId(nextOs);
    applyWithWindowsGuard(nextOs, vcpu, ramGb);
  };

  const handlePresetClick = (pVcpu: number, pRam: number, pNvme: number) => {
    setNvmeGb(pNvme);
    applyWithWindowsGuard(osId, pVcpu, pRam);
  };

  const handleVcpuChange = (nextVal: number) => {
    const clamped = Math.min(16, Math.max(1, nextVal));
    if (osId === 'windows' && clamped < 2) {
      setVcpu(2);
      setWindowsBumpNotice(
        'Windows Server 2022 requires at least 2 vCPU. Kept at 2 vCPU minimum.'
      );
      return;
    }
    setWindowsBumpNotice(null);
    setVcpu(clamped);
  };

  const handleRamChange = (nextVal: number) => {
    const clamped = Math.min(64, Math.max(1, nextVal));
    if (osId === 'windows' && clamped < 4) {
      setRamGb(4);
      setWindowsBumpNotice(
        'Windows Server 2022 requires at least 4 GB RAM. Kept at 4 GB minimum.'
      );
      return;
    }
    setWindowsBumpNotice(null);
    setRamGb(clamped);
  };

  const handleNvmeChange = (nextVal: number) => {
    const stepped = Math.round(nextVal / 10) * 10;
    setNvmeGb(Math.min(1000, Math.max(20, stepped)));
  };

  // Price calculations
  const vcpuCost = roundCents(vcpu * VPS_RATE_PER_VCPU);
  const ramCost = roundCents(ramGb * VPS_RATE_PER_GB_RAM);
  const nvmeCost = roundCents(nvmeGb * VPS_RATE_PER_GB_NVME);
  const managedCost = management === 'managed' ? VPS_MANAGED_PRICE_USD : 0;
  const osLicenseCost = selectedOs.licenseUSD;

  const listMonthlyUSD = roundCents(
    vcpuCost + ramCost + nvmeCost + managedCost + osLicenseCost
  );
  const discountRate = getCycleDiscount(state.billingCycle);
  const discountPercent = Math.round(discountRate * 100);
  const effectiveMonthlyUSD = roundCents(listMonthlyUSD * (1 - discountRate));

  const computePresetEffectiveMonthly = (
    pVcpu: number,
    pRam: number,
    pNvme: number
  ) => {
    const effVcpu = Math.max(pVcpu, selectedOs.minVcpu);
    const effRam = Math.max(pRam, selectedOs.minRamGb);
    const raw =
      effVcpu * VPS_RATE_PER_VCPU +
      effRam * VPS_RATE_PER_GB_RAM +
      pNvme * VPS_RATE_PER_GB_NVME +
      managedCost +
      osLicenseCost;
    return roundCents(raw * (1 - discountRate));
  };

  const handleAddOrUpdate = () => {
    const vpsItem: CartItem = {
      id: VPS_CART_ITEM_ID,
      catalogId: `vps-${management}-${osId}`,
      vertical: 'vps',
      name: `Cloud VPS (${management === 'managed' ? 'Managed' : 'Unmanaged'})`,
      configLines: [
        `${vcpu} vCPU · ${ramGb} GB RAM · ${nvmeGb} GB NVMe`,
        `${selectedOs.name} · Nairobi DC`,
      ],
      basePriceUSD: listMonthlyUSD,
      renewalPriceUSD: listMonthlyUSD,
      setupFeeUSD: 0,
      quantity: 1,
      removable: true,
    };

    upsertConfiguredItem(
      vpsItem,
      existingInCart ? 'Updated VPS in your order' : 'Added VPS to your order'
    );
  };

  const slidersBlock = (
    <div className="space-y-4 p-3.5 sm:p-4 rounded-[16px] bg-canvas border border-border-subtle min-w-0">
      <ResourceSliderRow
        id="vps-vcpu-slider"
        label="vCPU Cores"
        value={vcpu}
        unit="vCPU"
        min={1}
        max={16}
        step={1}
        priceMonthly={vcpuCost}
        currency={state.currency}
        isMobile={isMobileLayout}
        onChange={handleVcpuChange}
      />

      <ResourceSliderRow
        id="vps-ram-slider"
        label="ECC Memory (RAM)"
        value={ramGb}
        unit="GB"
        min={1}
        max={64}
        step={1}
        priceMonthly={ramCost}
        currency={state.currency}
        isMobile={isMobileLayout}
        onChange={handleRamChange}
      />

      <ResourceSliderRow
        id="vps-nvme-slider"
        label="RAID-10 NVMe Storage"
        value={nvmeGb}
        unit="GB"
        min={20}
        max={1000}
        step={10}
        priceMonthly={nvmeCost}
        currency={state.currency}
        isMobile={isMobileLayout}
        onChange={handleNvmeChange}
      />
    </div>
  );

  return (
    <div className="mt-5 space-y-6 min-w-0">
      {/* Managed vs Unmanaged Toggle Cards */}
      <div className="space-y-2.5 min-w-0">
        <p className="text-sm font-semibold text-ink">1. Management level</p>
        <div
          role="radiogroup"
          aria-label="VPS management level"
          className={`grid gap-3 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-2'}`}
        >
          <button
            type="button"
            role="radio"
            aria-checked={management === 'managed'}
            onClick={() => setManagement('managed')}
            className={`p-4 min-h-[64px] min-w-0 rounded-[14px] border text-left transition-all kh-focus kh-touch-surface cursor-pointer ${
              management === 'managed'
                ? 'border-primary bg-primary-tint/50 ring-1 ring-primary'
                : 'border-border-subtle bg-surface hover:border-border-strong'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 font-display font-bold text-base text-ink min-w-0">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <span>Managed VPS</span>
              </div>
              <span className="text-xs font-bold text-primary tabular-nums whitespace-nowrap">
                +{formatCurrency(VPS_MANAGED_PRICE_USD, state.currency)}/mo
              </span>
            </div>
            <p className="text-[13px] text-secondary mt-1.5 leading-snug">
              We handle OS updates, security patching, monitoring, and optional
              cPanel setup.
            </p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={management === 'unmanaged'}
            onClick={() => setManagement('unmanaged')}
            className={`p-4 min-h-[64px] min-w-0 rounded-[14px] border text-left transition-all kh-focus kh-touch-surface cursor-pointer ${
              management === 'unmanaged'
                ? 'border-primary bg-primary-tint/50 ring-1 ring-primary'
                : 'border-border-subtle bg-surface hover:border-border-strong'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 font-display font-bold text-base text-ink min-w-0">
                <Terminal className="w-4 h-4 text-ink shrink-0" />
                <span>Unmanaged VPS</span>
              </div>
              <span className="text-xs font-bold text-success whitespace-nowrap">
                Included
              </span>
            </div>
            <p className="text-[13px] text-secondary mt-1.5 leading-snug">
              Full root SSH access. You configure and maintain the software
              stack yourself.
            </p>
          </button>
        </div>
      </div>

      {/* OS Selector Tiles */}
      <div className="space-y-2.5 min-w-0">
        <p className="text-sm font-semibold text-ink">2. Operating system</p>
        <div
          role="radiogroup"
          aria-label="VPS operating system"
          className={`grid gap-2.5 ${
            isMobileLayout
              ? 'grid-cols-1 min-[360px]:grid-cols-2'
              : 'grid-cols-4'
          }`}
        >
          {VPS_OS_OPTIONS.map((os) => {
            const isSelected = osId === os.id;
            return (
              <button
                key={os.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleOsSelect(os.id)}
                className={`p-3.5 rounded-[14px] border text-left flex flex-col justify-between min-h-[96px] min-w-0 transition-all kh-focus kh-touch-surface cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary-tint/50 ring-1 ring-primary'
                    : 'border-border-subtle bg-surface hover:border-border-strong'
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <OsBadgeIcon osId={os.id} />
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-primary text-surface flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="mt-2.5 min-w-0">
                  <div className="font-display font-bold text-sm text-ink leading-snug">
                    {os.name}
                  </div>
                  <div className="text-[11px] text-secondary mt-0.5 leading-snug tabular-nums">
                    {os.licenseUSD > 0
                      ? `+${formatCurrency(os.licenseUSD, state.currency)}/mo license · Min ${os.minVcpu} vCPU / ${os.minRamGb} GB`
                      : os.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {windowsBumpNotice && (
          <div
            role="status"
            className="p-3 rounded-[12px] bg-info-tint border border-info/30 text-xs text-ink flex items-start gap-2"
          >
            <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <span className="min-w-0">{windowsBumpNotice}</span>
          </div>
        )}
      </div>

      {/* Presets + Resource Sliders */}
      {isMobileLayout ? (
        <div className="space-y-3 min-w-0">
          <p className="text-sm font-semibold text-ink">
            3. Choose a preset or customize
          </p>

          {/* Stacked Large Preset Cards FIRST on Mobile */}
          <div className="grid grid-cols-1 gap-2.5 min-w-0">
            {VPS_PRESETS.map((preset) => {
              const isMatch =
                vcpu === preset.vcpu &&
                ramGb === preset.ramGb &&
                nvmeGb === preset.nvmeGb;
              const presetPrice = computePresetEffectiveMonthly(
                preset.vcpu,
                preset.ramGb,
                preset.nvmeGb
              );

              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isMatch}
                  onClick={() =>
                    handlePresetClick(preset.vcpu, preset.ramGb, preset.nvmeGb)
                  }
                  className={`w-full min-h-[64px] p-3.5 rounded-[14px] border text-left flex items-center justify-between gap-3 transition-all kh-focus kh-touch-surface cursor-pointer ${
                    isMatch
                      ? 'border-primary bg-primary-tint/50 ring-1 ring-primary'
                      : 'border-border-subtle bg-surface hover:border-border-strong'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-[15px] text-ink">
                        {preset.label}
                      </span>
                      {isMatch && (
                        <span className="w-4 h-4 rounded-full bg-primary text-surface inline-flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary mt-0.5 tabular-nums">
                      {preset.vcpu} vCPU · {preset.ramGb} GB RAM · {preset.nvmeGb} GB NVMe
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-display font-bold text-sm text-ink tabular-nums whitespace-nowrap">
                      {formatCurrency(presetPrice, state.currency)}/mo
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sliders inside "Customize resources" Accordion on Mobile */}
          <div className="rounded-[16px] border border-border-subtle bg-surface overflow-hidden">
            <button
              type="button"
              aria-expanded={customizeOpen}
              onClick={() => setCustomizeOpen((prev) => !prev)}
              className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-2 text-left kh-focus kh-touch-surface cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span>Customize resources</span>
              </span>
              {customizeOpen ? (
                <ChevronUp className="w-4 h-4 text-muted shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted shrink-0" />
              )}
            </button>

            {customizeOpen && <div className="p-3 pt-0">{slidersBlock}</div>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              3. Compute & storage resources
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {VPS_PRESETS.map((preset) => {
                const isMatch =
                  vcpu === preset.vcpu &&
                  ramGb === preset.ramGb &&
                  nvmeGb === preset.nvmeGb;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      handlePresetClick(
                        preset.vcpu,
                        preset.ramGb,
                        preset.nvmeGb
                      )
                    }
                    className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors kh-focus cursor-pointer whitespace-nowrap ${
                      isMatch
                        ? 'bg-primary text-surface'
                        : 'bg-canvas text-ink border border-border-subtle hover:bg-surface-tint'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {slidersBlock}
        </div>
      )}

      {/* Live "Your VPS" Price Card (with first-render skeleton) */}
      {vpsCardLoading ? (
        <div
          aria-busy="true"
          aria-label="Loading VPS pricing"
          className="p-4 sm:p-5 rounded-[18px] bg-surface-tint/60 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse"
        >
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="h-5 w-32 bg-divider rounded" />
            <div className="h-3.5 w-full max-w-[240px] bg-canvas rounded" />
            <div className="h-8 w-44 bg-divider rounded" />
          </div>
          <div className="h-12 w-full sm:w-36 bg-divider rounded-full shrink-0" />
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-[18px] bg-surface-tint/60 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Server className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-display font-bold text-lg text-ink">
                Your VPS
              </h3>
              {discountPercent > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            <p className="text-xs text-secondary tabular-nums">
              {vcpu} vCPU ({formatCurrency(vcpuCost, state.currency)}) + {ramGb} GB
              RAM ({formatCurrency(ramCost, state.currency)}) + {nvmeGb} GB NVMe (
              {formatCurrency(nvmeCost, state.currency)})
              {managedCost > 0 &&
                ` + Managed (${formatCurrency(managedCost, state.currency)})`}
              {osLicenseCost > 0 &&
                ` + Windows (${formatCurrency(osLicenseCost, state.currency)})`}
            </p>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display font-extrabold text-[26px] sm:text-[28px] leading-none text-ink tabular-nums whitespace-nowrap">
                {formatCurrency(effectiveMonthlyUSD, state.currency)}/mo
              </span>
              {effectiveMonthlyUSD < listMonthlyUSD && (
                <span className="text-xs text-muted line-through tabular-nums whitespace-nowrap">
                  {formatCurrency(listMonthlyUSD, state.currency)}/mo
                </span>
              )}
              <span className="text-xs text-secondary tabular-nums whitespace-nowrap">
                · Renews at {formatCurrency(listMonthlyUSD, state.currency)}/mo
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddOrUpdate}
            className="kh-btn kh-btn-primary shrink-0 w-full sm:w-auto"
          >
            {existingInCart ? 'Update in cart' : 'Add to cart'}
          </button>
        </div>
      )}
    </div>
  );
}

function ResourceSliderRow({
  id,
  label,
  value,
  unit,
  min,
  max,
  step,
  priceMonthly,
  currency,
  isMobile,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  priceMonthly: number;
  currency: ReturnType<typeof useCart>['state']['currency'];
  isMobile: boolean;
  onChange: (nextVal: number) => void;
}) {
  const valueText = `${value} ${unit} (${formatCurrency(priceMonthly, currency)}/mo)`;

  if (isMobile) {
    return (
      <div className="space-y-2.5 pb-3 last:pb-0 border-b last:border-b-0 border-divider min-w-0">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <label htmlFor={id} className="block text-sm font-semibold text-ink">
              {label}
            </label>
            <div className="text-xs font-medium text-secondary tabular-nums whitespace-nowrap mt-0.5">
              +{formatCurrency(priceMonthly, currency)}/mo
            </div>
          </div>
          <span className="font-display font-bold text-sm text-ink tabular-nums whitespace-nowrap shrink-0">
            {value} {unit}
          </span>
        </div>

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={valueText}
          onChange={(e) => onChange(Number(e.target.value))}
          className="kh-slider"
        />

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            disabled={value <= min}
            onClick={() => onChange(value - step)}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-border-strong bg-surface text-ink hover:bg-primary-tint hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed kh-focus kh-touch-surface cursor-pointer shrink-0"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-medium text-muted tabular-nums">
            {min}–{max} {unit}
          </span>

          <button
            type="button"
            aria-label={`Increase ${label}`}
            disabled={value >= max}
            onClick={() => onChange(value + step)}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-border-strong bg-surface text-ink hover:bg-primary-tint hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed kh-focus kh-touch-surface cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        <div className="text-sm font-bold text-ink tabular-nums whitespace-nowrap">
          {value} {unit}{' '}
          <span className="text-xs font-medium text-secondary">
            ({formatCurrency(priceMonthly, currency)}/mo)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - step)}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-border-strong bg-surface text-ink hover:bg-primary-tint hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed kh-focus cursor-pointer shrink-0"
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={valueText}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 kh-slider"
        />

        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + step)}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-border-strong bg-surface text-ink hover:bg-primary-tint hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed kh-focus cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function OsBadgeIcon({ osId }: { osId: VpsOsId }) {
  const shortText =
    osId === 'ubuntu'
      ? 'UBU'
      : osId === 'almalinux'
      ? 'ALMA'
      : osId === 'debian'
      ? 'DEB'
      : 'WIN';

  return (
    <span className="inline-flex items-center justify-center px-2 py-1 rounded-[8px] bg-canvas border border-border-subtle font-display font-bold text-[11px] tracking-wider text-ink">
      {shortText}
    </span>
  );
}
