import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  Globe,
  Headphones,
  Lock,
  Menu,
  MessageCircle,
  Phone,
  ShoppingBag,
  X,
} from 'lucide-react';
import {
  CURRENCY_CONFIGS,
  CURRENCY_ORDER,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from '../config/pricingConfig';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { CurrencyCode } from '../types/checkout';

export function TopStripAndHeader() {
  const {
    state,
    setCurrency,
    setSummaryDrawerOpen,
    language,
    setLanguage,
  } = useCart();
  const { isMobileLayout } = useViewport();
  const [supportOpen, setSupportOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeCurrencyCfg = CURRENCY_CONFIGS[state.currency];
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const isCompleted = Boolean(state.completedOrderReceipt);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleCurrencySelect = (code: CurrencyCode) => {
    setCurrency(code);
    setCurrencyOpen(false);
  };

  return (
    <div className="w-full">
      {/* Top deep-navy strip — hidden below 640px */}
      <div className="hidden sm:block bg-ink-deep text-surface py-2 px-4 text-center">
        <p className="text-xs font-medium tracking-wide text-surface/95 whitespace-nowrap overflow-hidden text-ellipsis">
          30-day money-back guarantee · 24/7 support · Prices in {state.currency}
        </p>
      </div>

      {/* Main checkout header */}
      <header className="bg-surface border-b border-border-subtle sticky top-0 z-30">
        {isMobileLayout ? (
          /* Mobile 56px single-row header */
          <div className="w-full px-4 h-14 flex items-center justify-between gap-2">
            <a
              href="#top"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2 min-w-0 min-h-[44px] kh-focus rounded-lg"
              aria-label="Kilele Host Home"
            >
              <LogoMark />
              <span className="font-display font-bold text-[18px] tracking-tight text-ink truncate">
                Kilele Host
              </span>
            </a>

            <div className="flex items-center gap-2 shrink-0">
              {!isCompleted && (
                <button
                  type="button"
                  onClick={() => setSummaryDrawerOpen(true)}
                  aria-label={`Open order summary (${itemCount} ${
                    itemCount === 1 ? 'item' : 'items'
                  })`}
                  className="relative min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-border-subtle bg-canvas text-ink active:scale-95 transition-transform kh-focus cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary text-surface text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
                      {itemCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open settings and help menu"
                aria-expanded={mobileMenuOpen}
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full border border-border-subtle bg-surface text-ink active:scale-95 transition-transform kh-focus cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Desktop >=1024px 72px header */
          <div className="mx-auto max-w-[1200px] px-6 h-[72px] flex items-center justify-between gap-4">
            <a
              href="#top"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2.5 shrink-0 kh-focus rounded-lg py-1"
              aria-label="Kilele Host Home"
            >
              <LogoMark />
              <span className="font-display font-bold text-[20px] tracking-tight text-ink whitespace-nowrap">
                Kilele Host
              </span>
            </a>

            <div className="flex items-center gap-5 shrink-0">
              <div className="flex items-center gap-4 text-sm text-secondary">
                <button
                  type="button"
                  onClick={() => {
                    setSupportOpen((prev) => !prev);
                    setCurrencyOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-2.5 rounded-full text-secondary hover:text-primary hover:bg-primary-tint/50 transition-colors kh-focus cursor-pointer whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 text-primary shrink-0" />
                  <span>Need help? Chat with us</span>
                </button>

                <a
                  href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-2 rounded-full text-ink font-medium hover:text-primary transition-colors kh-focus whitespace-nowrap tabular-nums"
                >
                  <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span>{SUPPORT_PHONE}</span>
                </a>
              </div>

              {/* Currency selector dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCurrencyOpen((prev) => !prev);
                    setSupportOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={currencyOpen}
                  aria-label="Currency selector"
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-full border border-border-strong bg-surface text-sm font-semibold text-ink hover:bg-canvas transition-colors kh-focus cursor-pointer whitespace-nowrap"
                >
                  <span aria-hidden="true">{activeCurrencyCfg.flag}</span>
                  <span>{activeCurrencyCfg.code}</span>
                  <span className="text-muted font-medium">
                    {activeCurrencyCfg.symbol}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
                </button>

                {currencyOpen && (
                  <div
                    role="listbox"
                    aria-label="Select currency"
                    className="absolute right-0 mt-2 w-48 bg-surface border border-border-subtle rounded-[14px] shadow-raised p-1.5 z-50"
                  >
                    <div className="px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] font-bold text-muted">
                      Currency
                    </div>
                    {CURRENCY_ORDER.map((code) => {
                      const cfg = CURRENCY_CONFIGS[code];
                      const isSelected = state.currency === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleCurrencySelect(code)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-left text-sm transition-colors kh-focus cursor-pointer ${
                            isSelected
                              ? 'bg-primary-tint text-primary font-bold'
                              : 'text-ink hover:bg-canvas font-medium'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true">{cfg.flag}</span>
                            <span>{cfg.code}</span>
                          </span>
                          <span className="text-xs text-secondary font-semibold">
                            {cfg.symbol}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink whitespace-nowrap pl-2 border-l border-divider">
                <Lock className="w-4 h-4 text-success shrink-0" />
                <span>Secure checkout</span>
              </div>
            </div>
          </div>
        )}

        {/* Desktop support inline popover */}
        {!isMobileLayout && supportOpen && (
          <div className="border-t border-divider bg-surface-tint/60">
            <div className="mx-auto max-w-[1200px] px-6 py-3 flex items-center justify-between gap-4 text-sm">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-body">
                <span className="font-semibold text-ink">
                  Nairobi Support Desk (24/7):
                </span>
                <span>
                  Call{' '}
                  <strong className="font-semibold tabular-nums text-ink">
                    {SUPPORT_PHONE}
                  </strong>
                </span>
                <span>
                  Email{' '}
                  <strong className="font-semibold text-ink">
                    {SUPPORT_EMAIL}
                  </strong>
                </span>
                <span className="text-secondary">
                  Average chat response: under 2 minutes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSupportOpen(false)}
                aria-label="Close support details"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full hover:bg-surface text-secondary kh-focus cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Sheet (Currency, Help/Phone, Language) */}
      {isMobileLayout && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-ink-deep/45 backdrop-blur-[1px]"
          />

          <div className="relative bg-surface rounded-t-[22px] max-h-[85vh] overflow-y-auto shadow-summary border-t border-border-subtle pb-safe-bar">
            <div className="pt-2.5 px-4 pb-3 border-b border-divider">
              <div
                aria-hidden="true"
                className="w-10 h-1 rounded-full bg-border-input mx-auto mb-2"
              />
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-base text-ink">
                  Menu &amp; Preferences
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="min-w-[44px] min-h-[44px] -mr-1 inline-flex items-center justify-center rounded-full bg-canvas text-ink kh-focus cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Currency selector */}
              <div className="space-y-2">
                <p className="eyebrow-label">Currency</p>
                <div className="grid grid-cols-2 gap-2">
                  {CURRENCY_ORDER.map((code) => {
                    const cfg = CURRENCY_CONFIGS[code];
                    const isSelected = state.currency === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setCurrency(code);
                          setMobileMenuOpen(false);
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-[12px] border flex items-center justify-between text-sm font-semibold transition-colors kh-focus cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary-tint text-primary'
                            : 'border-border-subtle bg-surface text-ink'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span aria-hidden="true">{cfg.flag}</span>
                          <span>{cfg.code}</span>
                        </span>
                        <span className="text-xs text-secondary">
                          {cfg.symbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language selector */}
              <div className="space-y-2">
                <p className="eyebrow-label">Language</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'en' as const, label: 'English' },
                    { id: 'sw' as const, label: 'Kiswahili' },
                  ].map((opt) => {
                    const active = language === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLanguage(opt.id)}
                        className={`min-h-[44px] px-3 py-2 rounded-[12px] border flex items-center justify-between text-sm font-semibold transition-colors kh-focus cursor-pointer ${
                          active
                            ? 'border-primary bg-primary-tint text-primary'
                            : 'border-border-subtle bg-surface text-ink'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4 shrink-0" />
                          <span>{opt.label}</span>
                        </span>
                        {active && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Help & Phone */}
              <div className="p-4 rounded-[14px] bg-canvas border border-border-subtle space-y-2.5">
                <div className="flex items-center gap-2 font-display font-bold text-sm text-ink">
                  <Headphones className="w-4 h-4 text-primary shrink-0" />
                  <span>Need help? 24/7 Nairobi Support</span>
                </div>
                <a
                  href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`}
                  className="min-h-[44px] px-3 rounded-[12px] bg-surface border border-border-subtle flex items-center justify-between text-sm font-semibold text-ink kh-focus"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span className="tabular-nums">{SUPPORT_PHONE}</span>
                  </span>
                  <span className="text-xs text-primary">Call</span>
                </a>
                <p className="text-xs text-secondary overflow-anywhere">
                  Email: <strong className="text-ink">{SUPPORT_EMAIL}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogoMark() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="9" fill="var(--kh-ink)" />
      <path
        d="M7 22L13.5 11.5L17.5 17.5L20.5 13.5L25 22H7Z"
        fill="var(--kh-primary)"
      />
      <path
        d="M13.5 11.5L15.6 14.9L13.5 16.5L11.3 15L13.5 11.5Z"
        fill="var(--kh-accent)"
      />
    </svg>
  );
}
