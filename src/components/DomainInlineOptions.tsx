import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { DOMAIN_REGISTRATION_YEARS } from '../config/domainsConfig';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { CartItem, DomainRegistrationYears } from '../types/checkout';
import { formatCurrency } from '../utils/pricing';

interface DomainInlineOptionsProps {
  item: CartItem;
  compact?: boolean;
}

export function DomainInlineOptions({
  item,
  compact = false,
}: DomainInlineOptionsProps) {
  const { state, updateDomainConfig } = useCart();
  const { isMobileLayout } = useViewport();
  const [whoisTooltipOpen, setWhoisTooltipOpen] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(false);

  const cfg = item.domainConfig;
  if (!cfg || cfg.registrationType === 'existing') {
    return null;
  }

  const isWhoisUnsupported = cfg.whoisSupport === 'unsupported';
  const yearsSelectId = `${compact ? 'cart' : 'result'}-years-${item.id}`;
  const autoRenewId = `${compact ? 'cart' : 'result'}-autorenew-${item.id}`;
  const whoisId = `${compact ? 'cart' : 'result'}-whois-${item.id}`;

  const showCollapsibleWrapper = isMobileLayout;
  const isBodyVisible = !showCollapsibleWrapper || optionsExpanded;

  const summaryBits = [
    cfg.years === 1 ? '1 yr' : `${cfg.years} yrs`,
    cfg.autoRenew ? 'Auto-renew' : 'Manual renew',
    ...(cfg.whoisSupport !== 'unsupported'
      ? [cfg.whoisPrivacy ? 'Privacy on' : 'Privacy off']
      : []),
  ];

  const optionsBody = (
    <div className="space-y-3 pt-1">
      {/* Registration years dropdown */}
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={yearsSelectId}
          className="text-xs font-semibold text-ink min-w-0"
        >
          Registration period
        </label>
        <select
          id={yearsSelectId}
          value={cfg.years}
          onChange={(e) =>
            updateDomainConfig(item.id, {
              years: Number(e.target.value) as DomainRegistrationYears,
            })
          }
          className="min-h-[44px] px-3 py-1.5 rounded-[10px] border border-border-input bg-surface text-sm sm:text-xs font-semibold text-ink tabular-nums kh-focus cursor-pointer shrink-0"
        >
          {DOMAIN_REGISTRATION_YEARS.map((yr) => (
            <option key={yr} value={yr}>
              {yr === 1 ? '1 year' : `${yr} years`}
            </option>
          ))}
        </select>
      </div>

      {/* Auto-renew toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={autoRenewId}
            className="text-xs font-semibold text-ink cursor-pointer"
          >
            Auto-renew
          </label>
          <p className="text-[11px] text-secondary leading-snug mt-0.5">
            We&apos;ll renew it before it expires so your site never goes down.
          </p>
        </div>

        <button
          id={autoRenewId}
          type="button"
          role="switch"
          aria-checked={cfg.autoRenew}
          onClick={() =>
            updateDomainConfig(item.id, { autoRenew: !cfg.autoRenew })
          }
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-end shrink-0 kh-focus rounded-full cursor-pointer"
        >
          <span
            aria-hidden="true"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              cfg.autoRenew ? 'bg-primary' : 'bg-border-input'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-surface shadow-card transition-transform ${
                cfg.autoRenew ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </span>
        </button>
      </div>

      {/* WHOIS Privacy toggle */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <label
              htmlFor={whoisId}
              className={`text-xs font-semibold ${
                isWhoisUnsupported
                  ? 'text-muted cursor-not-allowed'
                  : 'text-ink cursor-pointer'
              }`}
            >
              WHOIS privacy
            </label>

            {cfg.whoisSupport === 'free' && (
              <span className="text-[11px] font-bold text-success">Free</span>
            )}
            {cfg.whoisSupport === 'paid' && (
              <span className="text-[11px] font-semibold text-secondary tabular-nums whitespace-nowrap">
                {formatCurrency(cfg.whoisPriceYearlyUSD, state.currency)}/yr
              </span>
            )}
            {isWhoisUnsupported && (
              <button
                type="button"
                onClick={() => setWhoisTooltipOpen((prev) => !prev)}
                onBlur={() => setWhoisTooltipOpen(false)}
                aria-label="Why WHOIS privacy is not supported"
                aria-expanded={whoisTooltipOpen}
                className="inline-flex items-center gap-1 min-h-[44px] -my-2 text-[11px] font-medium text-muted hover:text-primary kh-focus rounded px-1.5 cursor-pointer"
              >
                <span>Not supported by registry</span>
                <Info className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
          {!isWhoisUnsupported && (
            <p className="text-[11px] text-secondary leading-snug mt-0.5">
              Hides your personal contact details from public WHOIS lookups.
            </p>
          )}
        </div>

        <button
          id={whoisId}
          type="button"
          role="switch"
          disabled={isWhoisUnsupported}
          aria-checked={isWhoisUnsupported ? false : cfg.whoisPrivacy}
          onClick={() => {
            if (!isWhoisUnsupported) {
              updateDomainConfig(item.id, {
                whoisPrivacy: !cfg.whoisPrivacy,
              });
            }
          }}
          className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-end shrink-0 kh-focus rounded-full ${
            isWhoisUnsupported ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <span
            aria-hidden="true"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isWhoisUnsupported
                ? 'bg-divider opacity-40'
                : cfg.whoisPrivacy
                ? 'bg-primary'
                : 'bg-border-input'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-surface shadow-card transition-transform ${
                !isWhoisUnsupported && cfg.whoisPrivacy
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </span>
        </button>

        {whoisTooltipOpen && isWhoisUnsupported && (
          <div
            role="tooltip"
            className="absolute left-0 bottom-full mb-2 w-56 sm:w-64 max-w-full p-3 rounded-[12px] bg-ink-deep text-surface text-xs leading-relaxed shadow-raised z-30"
          >
            The KENIC registry for .ke and .co.ke domains requires registrant
            ownership records to remain verifiable and does not support proxy
            WHOIS privacy masking.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`${
        compact
          ? 'mt-2.5 p-3 rounded-[12px] bg-canvas border border-border-subtle space-y-2.5'
          : 'mt-3 pt-3 border-t border-divider space-y-2.5'
      }`}
    >
      {showCollapsibleWrapper ? (
        <>
          <button
            type="button"
            aria-expanded={optionsExpanded}
            onClick={() => setOptionsExpanded((prev) => !prev)}
            className="w-full min-h-[44px] px-1 flex items-center justify-between gap-2 text-left kh-focus rounded-lg cursor-pointer"
          >
            <div className="min-w-0">
              <span className="text-xs font-bold text-primary block">
                Domain options
              </span>
              <span className="text-[11px] text-secondary block">
                {summaryBits.join(' · ')}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-primary shrink-0 transition-transform ${
                optionsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isBodyVisible && (
            <div className="pt-2 border-t border-divider">{optionsBody}</div>
          )}
        </>
      ) : (
        optionsBody
      )}
    </div>
  );
}
