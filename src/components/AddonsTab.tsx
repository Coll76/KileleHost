import React, { useState } from 'react';
import {
  Check,
  CloudLightning,
  HardDriveDownload,
  Info,
  Lock,
  Mail,
  Minus,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  ADDON_IDS,
  ADDON_PRICING,
  DDOS_OPTIONS,
  SSL_OPTIONS,
} from '../config/addonsConfig';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { CartItem, DdosOptionId, SslOptionId } from '../types/checkout';
import {
  formatCurrency,
  getCycleDiscount,
  roundCents,
} from '../utils/pricing';

function useUserEmailDomain(): string {
  const { state } = useCart();
  const domainItem = state.items.find(
    (i) => i.vertical === 'domain' && i.domainConfig?.fullDomain
  );
  return domainItem?.domainConfig?.fullDomain ?? 'mybiashara.co.ke';
}

function DisabledTooltipWrapper({
  disabled,
  children,
}: {
  disabled: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <div
          role="tooltip"
          className="absolute right-0 bottom-full mb-2 max-w-[240px] px-3 py-1.5 rounded-[10px] bg-ink-deep text-surface text-xs font-semibold shadow-raised z-30 pointer-events-none"
        >
          Add a hosting plan first
        </div>
      )}
    </div>
  );
}

export function AddonsTab() {
  const {
    state,
    hasHostingPlan,
    backupsIncludedInPlan,
    upsertByCatalogId,
    removeByCatalogId,
    setActiveVertical,
  } = useCart();
  const { isMobileLayout } = useViewport();
  const userDomain = useUserEmailDomain();

  const discountRate = getCycleDiscount(state.billingCycle);
  const discountPercent = Math.round(discountRate * 100);

  // Active add-on items from cart
  const backupsInCart = Boolean(
    state.items.find((i) => i.catalogId === ADDON_IDS.BACKUPS)
  );
  const sslOvInCart = Boolean(
    state.items.find((i) => i.catalogId === ADDON_IDS.SSL_OV)
  );
  const sslWildcardInCart = Boolean(
    state.items.find((i) => i.catalogId === ADDON_IDS.SSL_WILDCARD)
  );
  const activeSsl: SslOptionId = sslWildcardInCart
    ? 'wildcard'
    : sslOvInCart
    ? 'ov'
    : 'free';

  const emailItem = state.items.find(
    (i) => i.catalogId === ADDON_IDS.EMAIL
  );
  const [mailboxDraftCount, setMailboxDraftCount] = useState<number>(
    emailItem?.quantity ?? 2
  );
  const mailboxCount = emailItem ? emailItem.quantity : mailboxDraftCount;

  const ddosAdvancedInCart = Boolean(
    state.items.find((i) => i.catalogId === ADDON_IDS.DDOS_ADVANCED)
  );
  const activeDdos: DdosOptionId = ddosAdvancedInCart ? 'advanced' : 'standard';

  const cdnInCart = Boolean(
    state.items.find((i) => i.catalogId === ADDON_IDS.CDN)
  );

  // Handlers
  const handleToggleBackups = () => {
    if (!hasHostingPlan || backupsIncludedInPlan) return;
    if (backupsInCart) {
      removeByCatalogId(ADDON_IDS.BACKUPS);
    } else {
      upsertByCatalogId({
        id: `addon-${ADDON_IDS.BACKUPS}-${Date.now()}`,
        catalogId: ADDON_IDS.BACKUPS,
        vertical: 'addon',
        name: 'Automated daily backups',
        configLines: ['30-day retention · One-click restore'],
        basePriceUSD: ADDON_PRICING.backupsMonthlyUSD,
        renewalPriceUSD: ADDON_PRICING.backupsMonthlyUSD,
        setupFeeUSD: 0,
        quantity: 1,
        removable: true,
      });
    }
  };

  const handleSelectSsl = (optionId: SslOptionId) => {
    if (!hasHostingPlan) return;
    removeByCatalogId(ADDON_IDS.SSL_OV);
    removeByCatalogId(ADDON_IDS.SSL_WILDCARD);

    if (optionId === 'ov') {
      const monthlyRate = roundCents(ADDON_PRICING.sslOvYearlyUSD / 12);
      upsertByCatalogId({
        id: `addon-${ADDON_IDS.SSL_OV}-${Date.now()}`,
        catalogId: ADDON_IDS.SSL_OV,
        vertical: 'addon',
        name: 'Premium OV SSL',
        configLines: ['Organization-verified trust seal · $1.25M warranty'],
        basePriceUSD: monthlyRate,
        renewalPriceUSD: monthlyRate,
        setupFeeUSD: 0,
        quantity: 1,
        removable: true,
      });
    } else if (optionId === 'wildcard') {
      const monthlyRate = roundCents(ADDON_PRICING.sslWildcardYearlyUSD / 12);
      upsertByCatalogId({
        id: `addon-${ADDON_IDS.SSL_WILDCARD}-${Date.now()}`,
        catalogId: ADDON_IDS.SSL_WILDCARD,
        vertical: 'addon',
        name: 'Wildcard SSL',
        configLines: ['Secures unlimited subdomains'],
        basePriceUSD: monthlyRate,
        renewalPriceUSD: monthlyRate,
        setupFeeUSD: 0,
        quantity: 1,
        removable: true,
      });
    }
  };

  const handleToggleEmail = () => {
    if (!hasHostingPlan) return;
    if (emailItem) {
      removeByCatalogId(ADDON_IDS.EMAIL);
    } else {
      upsertByCatalogId(buildEmailCartItem(mailboxCount, userDomain));
    }
  };

  const handleMailboxCountChange = (nextCount: number) => {
    if (!hasHostingPlan) return;
    const clamped = Math.min(50, Math.max(1, nextCount));
    setMailboxDraftCount(clamped);
    if (emailItem) {
      upsertByCatalogId(buildEmailCartItem(clamped, userDomain));
    }
  };

  const handleSelectDdos = (optionId: DdosOptionId) => {
    if (!hasHostingPlan) return;
    if (optionId === 'standard') {
      removeByCatalogId(ADDON_IDS.DDOS_ADVANCED);
    } else {
      upsertByCatalogId({
        id: `addon-${ADDON_IDS.DDOS_ADVANCED}-${Date.now()}`,
        catalogId: ADDON_IDS.DDOS_ADVANCED,
        vertical: 'addon',
        name: 'Advanced L7 DDoS Protection',
        configLines: ['Application-layer WAF, bot mitigation & rate limiting'],
        basePriceUSD: ADDON_PRICING.ddosAdvancedMonthlyUSD,
        renewalPriceUSD: ADDON_PRICING.ddosAdvancedMonthlyUSD,
        setupFeeUSD: 0,
        quantity: 1,
        removable: true,
      });
    }
  };

  const handleToggleCdn = () => {
    if (!hasHostingPlan) return;
    if (cdnInCart) {
      removeByCatalogId(ADDON_IDS.CDN);
    } else {
      upsertByCatalogId({
        id: `addon-${ADDON_IDS.CDN}-${Date.now()}`,
        catalogId: ADDON_IDS.CDN,
        vertical: 'addon',
        name: 'CDN Integration',
        configLines: ['Faster load times across Africa and worldwide'],
        basePriceUSD: ADDON_PRICING.cdnMonthlyUSD,
        renewalPriceUSD: ADDON_PRICING.cdnMonthlyUSD,
        setupFeeUSD: 0,
        quantity: 1,
        removable: true,
      });
    }
  };

  const backupsEffective = roundCents(
    ADDON_PRICING.backupsMonthlyUSD * (1 - discountRate)
  );
  const emailEffectivePerBox = roundCents(
    ADDON_PRICING.emailPerMailboxMonthlyUSD * (1 - discountRate)
  );
  const cdnEffective = roundCents(
    ADDON_PRICING.cdnMonthlyUSD * (1 - discountRate)
  );

  return (
    <div className="mt-5 space-y-4 min-w-0">
      {!hasHostingPlan && (
        <div
          role="alert"
          className="p-4 rounded-[14px] bg-surface-warm border border-warning/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
        >
          <div className="flex items-start sm:items-center gap-2.5 text-sm text-ink min-w-0">
            <Info className="w-4 h-4 text-accent-ink shrink-0 mt-0.5 sm:mt-0" />
            <span className="min-w-0">
              <strong>Add a hosting plan first</strong> to enable backups,
              SSL upgrades, email, DDoS, and CDN add-ons.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveVertical('shared')}
            className="kh-btn kh-btn-secondary min-h-[44px]! py-2! px-4! text-xs shrink-0 w-full sm:w-auto"
          >
            Browse hosting plans
          </button>
        </div>
      )}

      {/* 1. Automated daily backups */}
      <DisabledTooltipWrapper disabled={!hasHostingPlan}>
        <div
          className={`kh-card p-4 sm:p-5 transition-opacity min-w-0 ${
            !hasHostingPlan ? 'opacity-55' : ''
          } ${
            backupsInCart || backupsIncludedInPlan
              ? 'border-primary/50 bg-primary-tint/25'
              : ''
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[12px] bg-surface-tint text-primary flex items-center justify-center shrink-0">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-[17px] text-ink">
                    Automated daily backups
                  </h3>
                  {backupsIncludedInPlan ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-tint text-success text-xs font-bold whitespace-nowrap">
                      <Check className="w-3 h-3" strokeWidth={3} />
                      <span>Included</span>
                    </span>
                  ) : (
                    discountPercent > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                        Save {discountPercent}%
                      </span>
                    )
                  )}
                </div>
                <p className="text-sm text-secondary mt-0.5">
                  30-day retention, one-click restore.
                  {backupsIncludedInPlan &&
                    ' Already included with your selected Business/Max plan.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
              {backupsIncludedInPlan ? (
                <span className="font-display font-bold text-base text-success whitespace-nowrap">
                  Included
                </span>
              ) : (
                <div className="text-left sm:text-right">
                  <div className="font-display font-bold text-lg text-ink tabular-nums whitespace-nowrap">
                    {formatCurrency(backupsEffective, state.currency)}/mo
                  </div>
                  <div className="text-xs text-muted tabular-nums whitespace-nowrap">
                    Renews at{' '}
                    {formatCurrency(
                      ADDON_PRICING.backupsMonthlyUSD,
                      state.currency
                    )}
                    /mo
                  </div>
                </div>
              )}

              {!backupsIncludedInPlan && (
                <button
                  type="button"
                  role="switch"
                  disabled={!hasHostingPlan}
                  aria-checked={backupsInCart}
                  aria-label="Toggle automated daily backups"
                  title={!hasHostingPlan ? 'Add a hosting plan first' : undefined}
                  onClick={handleToggleBackups}
                  className={`min-w-[48px] min-h-[44px] inline-flex items-center justify-end shrink-0 kh-focus ${
                    !hasHostingPlan ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <span
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      !hasHostingPlan
                        ? 'bg-divider'
                        : backupsInCart
                        ? 'bg-primary'
                        : 'bg-border-input'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow-card transition-transform ${
                        backupsInCart ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DisabledTooltipWrapper>

      {/* 2. SSL Certificates (Radio) */}
      <DisabledTooltipWrapper disabled={!hasHostingPlan}>
        <div
          className={`kh-card p-4 sm:p-5 space-y-3.5 transition-opacity min-w-0 ${
            !hasHostingPlan ? 'opacity-55' : ''
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[12px] bg-surface-tint text-primary flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-[17px] text-ink">
                SSL certificates
              </h3>
              <p className="text-sm text-secondary mt-0.5">
                Encrypt visitor traffic and boost trust across browsers.
              </p>
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label="SSL certificate tier"
            className={`grid gap-2.5 ${
              isMobileLayout ? 'grid-cols-1' : 'grid-cols-3'
            }`}
          >
            {SSL_OPTIONS.map((opt) => {
              const isSelected = activeSsl === opt.id;
              const monthlyList = roundCents(opt.yearlyPriceUSD / 12);
              const yearlyDiscounted = roundCents(
                opt.yearlyPriceUSD * (1 - discountRate)
              );

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  disabled={!hasHostingPlan}
                  aria-checked={isSelected}
                  title={!hasHostingPlan ? 'Add a hosting plan first' : undefined}
                  onClick={() => handleSelectSsl(opt.id)}
                  className={`p-3.5 min-h-[64px] min-w-0 rounded-[14px] border text-left flex flex-col justify-between transition-all kh-focus kh-touch-surface ${
                    !hasHostingPlan
                      ? 'cursor-not-allowed bg-canvas border-border-subtle'
                      : isSelected
                      ? 'border-primary bg-primary-tint/45 ring-1 ring-primary cursor-pointer'
                      : 'border-border-subtle bg-surface hover:border-border-strong cursor-pointer'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm text-ink">
                        {opt.name}
                      </span>
                      {opt.yearlyPriceUSD === 0 && (
                        <span className="text-[11px] font-bold text-success whitespace-nowrap">
                          Included
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary mt-1">
                      {opt.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-divider text-xs tabular-nums">
                    {opt.yearlyPriceUSD === 0 ? (
                      <span className="font-bold text-success">
                        Included free
                      </span>
                    ) : (
                      <div>
                        <span className="font-bold text-ink text-sm whitespace-nowrap">
                          {formatCurrency(yearlyDiscounted, state.currency)}/yr
                        </span>{' '}
                        <span className="text-muted">
                          (renews{' '}
                          <span className="whitespace-nowrap">
                            {formatCurrency(opt.yearlyPriceUSD, state.currency)}/yr
                          </span>{' '}
                          ·{' '}
                          <span className="whitespace-nowrap">
                            {formatCurrency(monthlyList, state.currency)}/mo
                          </span>
                          )
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DisabledTooltipWrapper>

      {/* 3. Professional Email (Stepper 1-50) */}
      <DisabledTooltipWrapper disabled={!hasHostingPlan}>
        <div
          className={`kh-card p-4 sm:p-5 transition-opacity min-w-0 ${
            !hasHostingPlan ? 'opacity-55' : ''
          } ${emailItem ? 'border-primary/50 bg-primary-tint/25' : ''}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[12px] bg-surface-tint text-primary flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-[17px] text-ink">
                    Professional email
                  </h3>
                  {discountPercent > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary mt-0.5 overflow-anywhere">
                  10 GB per mailbox · e.g.{' '}
                  <strong className="text-ink">you@{userDomain}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0">
              {/* Stepper 1-50 with >=8px gap */}
              <div className="flex items-center gap-2 bg-canvas border border-border-subtle rounded-full p-1">
                <button
                  type="button"
                  disabled={!hasHostingPlan || mailboxCount <= 1}
                  aria-label="Decrease mailboxes"
                  onClick={() => handleMailboxCountChange(mailboxCount - 1)}
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full bg-surface text-ink hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed kh-focus kh-touch-surface cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-xs font-bold text-ink tabular-nums whitespace-nowrap">
                  {mailboxCount} {mailboxCount === 1 ? 'mailbox' : 'mailboxes'}
                </span>
                <button
                  type="button"
                  disabled={!hasHostingPlan || mailboxCount >= 50}
                  aria-label="Increase mailboxes"
                  onClick={() => handleMailboxCountChange(mailboxCount + 1)}
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full bg-surface text-ink hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed kh-focus kh-touch-surface cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-left sm:text-right">
                  <div className="font-display font-bold text-base text-ink tabular-nums whitespace-nowrap">
                    {formatCurrency(
                      roundCents(emailEffectivePerBox * mailboxCount),
                      state.currency
                    )}
                    /mo
                  </div>
                  <div className="text-[11px] text-muted tabular-nums whitespace-nowrap">
                    {formatCurrency(
                      ADDON_PRICING.emailPerMailboxMonthlyUSD,
                      state.currency
                    )}
                    /box renewal
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!hasHostingPlan}
                  onClick={handleToggleEmail}
                  title={!hasHostingPlan ? 'Add a hosting plan first' : undefined}
                  className={`kh-btn min-h-[44px]! py-2! px-4! text-sm ${
                    emailItem ? 'kh-btn-secondary' : 'kh-btn-primary'
                  }`}
                >
                  {emailItem ? 'Remove' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DisabledTooltipWrapper>

      {/* 4. DDoS Protection (Radio) */}
      <DisabledTooltipWrapper disabled={!hasHostingPlan}>
        <div
          className={`kh-card p-4 sm:p-5 space-y-3.5 transition-opacity min-w-0 ${
            !hasHostingPlan ? 'opacity-55' : ''
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[12px] bg-surface-tint text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-[17px] text-ink">
                DDoS protection
              </h3>
              <p className="text-sm text-secondary mt-0.5">
                Keep your site online during traffic spikes and automated
                attacks.
              </p>
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label="DDoS protection level"
            className={`grid gap-2.5 ${
              isMobileLayout ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {DDOS_OPTIONS.map((opt) => {
              const isSelected = activeDdos === opt.id;
              const effectiveMonthly = roundCents(
                opt.monthlyPriceUSD * (1 - discountRate)
              );

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  disabled={!hasHostingPlan}
                  aria-checked={isSelected}
                  title={!hasHostingPlan ? 'Add a hosting plan first' : undefined}
                  onClick={() => handleSelectDdos(opt.id)}
                  className={`p-3.5 min-h-[64px] min-w-0 rounded-[14px] border text-left flex items-center justify-between gap-3 transition-all kh-focus kh-touch-surface ${
                    !hasHostingPlan
                      ? 'cursor-not-allowed bg-canvas border-border-subtle'
                      : isSelected
                      ? 'border-primary bg-primary-tint/45 ring-1 ring-primary cursor-pointer'
                      : 'border-border-subtle bg-surface hover:border-border-strong cursor-pointer'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-sm text-ink">
                      {opt.name}
                    </div>
                    <div className="text-xs text-secondary mt-0.5">
                      {opt.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    {opt.monthlyPriceUSD === 0 ? (
                      <span className="text-xs font-bold text-success whitespace-nowrap">
                        Included
                      </span>
                    ) : (
                      <div>
                        <div className="font-display font-bold text-sm text-ink whitespace-nowrap">
                          {formatCurrency(effectiveMonthly, state.currency)}/mo
                        </div>
                        <div className="text-[11px] text-muted whitespace-nowrap">
                          Renews{' '}
                          {formatCurrency(opt.monthlyPriceUSD, state.currency)}
                          /mo
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DisabledTooltipWrapper>

      {/* 5. CDN Integration */}
      <DisabledTooltipWrapper disabled={!hasHostingPlan}>
        <div
          className={`kh-card p-4 sm:p-5 transition-opacity min-w-0 ${
            !hasHostingPlan ? 'opacity-55' : ''
          } ${cdnInCart ? 'border-primary/50 bg-primary-tint/25' : ''}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[12px] bg-surface-tint text-primary flex items-center justify-center shrink-0">
                <CloudLightning className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-[17px] text-ink">
                    CDN integration
                  </h3>
                  {discountPercent > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary mt-0.5">
                  Faster load times across Africa and worldwide.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
              <div className="text-left sm:text-right">
                <div className="font-display font-bold text-lg text-ink tabular-nums whitespace-nowrap">
                  {formatCurrency(cdnEffective, state.currency)}/mo
                </div>
                <div className="text-xs text-muted tabular-nums whitespace-nowrap">
                  Renews at{' '}
                  {formatCurrency(ADDON_PRICING.cdnMonthlyUSD, state.currency)}
                  /mo
                </div>
              </div>

              <button
                type="button"
                role="switch"
                disabled={!hasHostingPlan}
                aria-checked={cdnInCart}
                aria-label="Toggle CDN integration"
                title={!hasHostingPlan ? 'Add a hosting plan first' : undefined}
                onClick={handleToggleCdn}
                className={`min-w-[48px] min-h-[44px] inline-flex items-center justify-end shrink-0 kh-focus ${
                  !hasHostingPlan ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    !hasHostingPlan
                      ? 'bg-divider'
                      : cdnInCart
                      ? 'bg-primary'
                      : 'bg-border-input'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow-card transition-transform ${
                      cdnInCart ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </DisabledTooltipWrapper>
    </div>
  );
}

function buildEmailCartItem(mailboxes: number, domain: string): CartItem {
  return {
    id: `addon-${ADDON_IDS.EMAIL}-${Date.now()}`,
    catalogId: ADDON_IDS.EMAIL,
    vertical: 'addon',
    name: 'Professional Email',
    configLines: [
      `10 GB per mailbox · e.g. you@${domain}`,
      `${mailboxes} ${mailboxes === 1 ? 'mailbox' : 'mailboxes'}`,
    ],
    basePriceUSD: ADDON_PRICING.emailPerMailboxMonthlyUSD,
    renewalPriceUSD: ADDON_PRICING.emailPerMailboxMonthlyUSD,
    setupFeeUSD: 0,
    quantity: mailboxes,
    removable: true,
  };
}

/**
 * Compact "Recommended for your plan" strip shown under the selected hosting plan.
 */
export function RecommendedAddonsStrip() {
  const {
    state,
    hasHostingPlan,
    backupsIncludedInPlan,
    upsertByCatalogId,
    removeByCatalogId,
    setActiveVertical,
  } = useCart();
  const { isMobileLayout } = useViewport();
  const userDomain = useUserEmailDomain();

  if (!hasHostingPlan) {
    return null;
  }

  const discountRate = getCycleDiscount(state.billingCycle);
  const backupsInCart = Boolean(
    state.items.find((i) => i.catalogId === ADDON_IDS.BACKUPS)
  );
  const emailInCart = Boolean(
    state.items.find((i) => i.catalogId === ADDON_IDS.EMAIL)
  );
  const cdnInCart = Boolean(
    state.items.find((i) => i.catalogId === ADDON_IDS.CDN)
  );

  const backupsEffective = roundCents(
    ADDON_PRICING.backupsMonthlyUSD * (1 - discountRate)
  );
  const emailEffective = roundCents(
    ADDON_PRICING.emailPerMailboxMonthlyUSD * (1 - discountRate)
  );
  const cdnEffective = roundCents(
    ADDON_PRICING.cdnMonthlyUSD * (1 - discountRate)
  );

  return (
    <div className="p-4 rounded-[16px] bg-canvas border border-border-subtle space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <p className="eyebrow-label">Recommended for your plan</p>
          <p className="text-xs text-secondary mt-0.5">
            One-click extras tailored to your hosting term
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveVertical('addon')}
          className="min-h-[44px] inline-flex items-center text-xs font-semibold text-primary hover:underline kh-focus kh-touch-surface rounded px-2 cursor-pointer shrink-0"
        >
          See all add-ons
        </button>
      </div>

      <div
        className={`grid gap-2.5 ${
          isMobileLayout ? 'grid-cols-1' : 'grid-cols-3'
        }`}
      >
        {/* Backups quick card */}
        <div className="p-3 rounded-[12px] bg-surface border border-border-subtle flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-ink truncate">
              Daily backups
            </div>
            <div className="text-[11px] text-secondary tabular-nums">
              {backupsIncludedInPlan
                ? 'Included in plan'
                : `${formatCurrency(backupsEffective, state.currency)}/mo`}
            </div>
          </div>
          {backupsIncludedInPlan ? (
            <span className="text-[11px] font-bold text-success shrink-0">
              Included
            </span>
          ) : (
            <button
              type="button"
              onClick={() =>
                backupsInCart
                  ? removeByCatalogId(ADDON_IDS.BACKUPS)
                  : upsertByCatalogId({
                      id: `addon-${ADDON_IDS.BACKUPS}-${Date.now()}`,
                      catalogId: ADDON_IDS.BACKUPS,
                      vertical: 'addon',
                      name: 'Automated daily backups',
                      configLines: ['30-day retention · One-click restore'],
                      basePriceUSD: ADDON_PRICING.backupsMonthlyUSD,
                      renewalPriceUSD: ADDON_PRICING.backupsMonthlyUSD,
                      setupFeeUSD: 0,
                      quantity: 1,
                      removable: true,
                    })
              }
              className={`min-h-[44px] min-w-[68px] px-3.5 rounded-full text-xs font-bold transition-colors kh-focus kh-touch-surface cursor-pointer shrink-0 ${
                backupsInCart
                  ? 'bg-primary-tint text-primary border border-primary/40'
                  : 'bg-canvas text-ink hover:bg-primary hover:text-surface border border-border-strong'
              }`}
            >
              {backupsInCart ? 'Added ✓' : 'Add'}
            </button>
          )}
        </div>

        {/* Email quick card */}
        <div className="p-3 rounded-[12px] bg-surface border border-border-subtle flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-ink truncate">
              Professional email
            </div>
            <div className="text-[11px] text-secondary tabular-nums overflow-anywhere">
              {formatCurrency(emailEffective, state.currency)}/box · @{userDomain}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              emailInCart
                ? removeByCatalogId(ADDON_IDS.EMAIL)
                : upsertByCatalogId(buildEmailCartItem(1, userDomain))
            }
            className={`min-h-[44px] min-w-[68px] px-3.5 rounded-full text-xs font-bold transition-colors kh-focus kh-touch-surface cursor-pointer shrink-0 ${
              emailInCart
                ? 'bg-primary-tint text-primary border border-primary/40'
                : 'bg-canvas text-ink hover:bg-primary hover:text-surface border border-border-strong'
            }`}
          >
            {emailInCart ? 'Added ✓' : 'Add'}
          </button>
        </div>

        {/* CDN quick card */}
        <div className="p-3 rounded-[12px] bg-surface border border-border-subtle flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-ink truncate">
              CDN integration
            </div>
            <div className="text-[11px] text-secondary tabular-nums">
              {formatCurrency(cdnEffective, state.currency)}/mo · Africa edge
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              cdnInCart
                ? removeByCatalogId(ADDON_IDS.CDN)
                : upsertByCatalogId({
                    id: `addon-${ADDON_IDS.CDN}-${Date.now()}`,
                    catalogId: ADDON_IDS.CDN,
                    vertical: 'addon',
                    name: 'CDN Integration',
                    configLines: ['Faster load times across Africa and worldwide'],
                    basePriceUSD: ADDON_PRICING.cdnMonthlyUSD,
                    renewalPriceUSD: ADDON_PRICING.cdnMonthlyUSD,
                    setupFeeUSD: 0,
                    quantity: 1,
                    removable: true,
                  })
            }
            className={`min-h-[44px] min-w-[68px] px-3.5 rounded-full text-xs font-bold transition-colors kh-focus kh-touch-surface cursor-pointer shrink-0 ${
              cdnInCart
                ? 'bg-primary-tint text-primary border border-primary/40'
                : 'bg-canvas text-ink hover:bg-primary hover:text-surface border border-border-strong'
            }`}
          >
            {cdnInCart ? 'Added ✓' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
