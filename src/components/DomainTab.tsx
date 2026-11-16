import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  RefreshCw,
  Search,
  Server,
  Trash2,
} from 'lucide-react';
import {
  KILELE_NAMESERVERS,
  TransferEligibilityResult,
  checkTransferEligibility,
  getTldRule,
  searchDomainAvailability,
  validateDomainSearchInput,
  validateFullDomainInput,
} from '../config/domainsConfig';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import {
  DomainConfig,
  DomainMode,
  DomainSearchResult,
} from '../types/checkout';
import { formatCurrency } from '../utils/pricing';
import { DomainInlineOptions } from './DomainInlineOptions';

const DOMAIN_MODES: {
  id: DomainMode;
  label: string;
  helper?: string;
}[] = [
  { id: 'register', label: 'Register a new domain' },
  { id: 'transfer', label: 'Transfer a domain I own' },
  {
    id: 'existing',
    label: 'Use a domain I already have',
    helper: "I'll update DNS myself",
  },
  { id: 'later', label: "I'll choose a domain later" },
];

export function DomainTab() {
  const { state, setDomainMode } = useCart();
  const { isMobileLayout } = useViewport();
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleRadioKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (idx + 1) % DOMAIN_MODES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (idx - 1 + DOMAIN_MODES.length) % DOMAIN_MODES.length;
    }
    if (nextIdx !== null) {
      e.preventDefault();
      const nextMode = DOMAIN_MODES[nextIdx].id;
      setDomainMode(nextMode);
      radioRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div className="mt-5 space-y-5">
      {/* 4-option segmented control with radiogroup semantics */}
      <div
        role="radiogroup"
        aria-label="Domain configuration mode"
        className={`grid gap-2 p-1.5 rounded-[16px] bg-canvas border border-border-subtle ${
          isMobileLayout ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {DOMAIN_MODES.map((mode, idx) => {
          const isSelected = state.domainMode === mode.id;
          return (
            <button
              key={mode.id}
              ref={(el) => {
                radioRefs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setDomainMode(mode.id)}
              onKeyDown={(e) => handleRadioKeyDown(e, idx)}
              className={`flex flex-col items-start justify-center min-h-[48px] px-3.5 py-2.5 rounded-[12px] text-left transition-all kh-focus cursor-pointer kh-touch-surface ${
                isSelected
                  ? 'bg-surface text-ink border border-primary ring-1 ring-primary shadow-card'
                  : 'text-secondary hover:text-ink hover:bg-surface/70 border border-transparent'
              }`}
            >
              <span className="text-[13px] font-bold leading-snug">
                {mode.label}
              </span>
              {mode.helper && (
                <span className="text-[11px] text-muted font-medium mt-0.5">
                  {mode.helper}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mode Content */}
      {state.domainMode === 'register' && <RegisterDomainPanel />}
      {state.domainMode === 'transfer' && <TransferDomainPanel />}
      {state.domainMode === 'existing' && <UseExistingDomainPanel />}
      {state.domainMode === 'later' && <ChooseLaterPanel />}
    </div>
  );
}

function RegisterDomainPanel() {
  const { state, addDomainItem, removeItem } = useCart();
  const { isMobileLayout } = useViewport();

  const [query, setQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DomainSearchResult[] | null>(null);
  const [searchedLabel, setSearchedLabel] = useState<string>('');
  const [availableOnlyFilter, setAvailableOnlyFilter] = useState(false);
  const searchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setValidationError(null);
      return;
    }
    const check = validateDomainSearchInput(val);
    setValidationError(check.valid ? null : check.error ?? 'Invalid domain name');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateDomainSearchInput(query);
    if (!check.valid) {
      setValidationError(check.error ?? 'Enter a valid domain name.');
      return;
    }

    setValidationError(null);
    setIsSearching(true);
    setSearchedLabel(check.tld ? `${check.sld}${check.tld}` : `${check.sld}.co.ke`);

    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      const lookup = searchDomainAvailability(check.sld, check.tld);
      setResults(lookup);
      setIsSearching(false);
    }, 800);
  };

  const handleAddResult = (res: DomainSearchResult) => {
    const cfg: DomainConfig = {
      fullDomain: res.fullDomain,
      sld: res.sld,
      tld: res.tld,
      registrationType: 'register',
      years: 1,
      autoRenew: true,
      whoisPrivacy: res.whoisSupport !== 'unsupported',
      whoisSupport: res.whoisSupport,
      whoisPriceYearlyUSD: res.whoisYearlyUSD,
      firstYearPriceUSD: res.firstYearUSD,
      renewalYearlyUSD: res.renewalUSD,
    };
    addDomainItem(cfg);
  };

  const exactMatch = results ? results[0] : null;
  const suggestions = results ? results.slice(1) : [];

  return (
    <div className="space-y-5 min-w-0">
      {/* Search form */}
      <form onSubmit={handleSearch} noValidate className="space-y-2.5">
        <label
          htmlFor="domain-register-search"
          className="block text-sm font-semibold text-ink"
        >
          Search for a new domain name
        </label>
        <div
          className={`flex gap-3 ${
            isMobileLayout ? 'flex-col' : 'flex-col sm:flex-row sm:items-stretch'
          }`}
        >
          <div className="relative flex-1 min-w-0">
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              id="domain-register-search"
              type="search"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Find your perfect domain, e.g. mybiashara"
              aria-invalid={Boolean(validationError)}
              aria-describedby={
                validationError ? 'domain-register-error' : 'domain-register-help'
              }
              className={`kh-input pl-10! min-h-[48px]! text-[16px]! ${
                validationError
                  ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                  : ''
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className={`kh-btn kh-btn-primary min-h-[48px]! px-7! shrink-0 ${
              isMobileLayout ? 'w-full' : 'w-full sm:w-auto'
            }`}
          >
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>

        {validationError ? (
          <p
            id="domain-register-error"
            role="alert"
            className="text-xs font-semibold text-error flex items-center gap-1.5 pt-0.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{validationError}</span>
          </p>
        ) : (
          <p id="domain-register-help" className="text-xs text-muted">
            Lowercase letters, numbers, and hyphens only (2–63 characters).
          </p>
        )}
      </form>

      {/* ~800ms Skeleton Loader */}
      {isSearching && (
        <div
          aria-busy="true"
          aria-label={`Checking availability for ${searchedLabel}`}
          className="space-y-3 animate-pulse"
        >
          <div className="p-4 sm:p-5 rounded-[16px] border border-border-subtle bg-surface-tint/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-3.5 w-24 bg-divider rounded" />
              <div className="h-6 w-48 max-w-full bg-divider rounded" />
              <div className="h-3.5 w-60 max-w-full bg-canvas rounded" />
            </div>
            <div className="h-11 w-full sm:w-28 bg-divider rounded-full shrink-0" />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="p-4 rounded-[14px] border border-border-subtle bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-4 w-40 max-w-full bg-divider rounded" />
                  <div className="h-3 w-52 max-w-full bg-canvas rounded" />
                </div>
                <div className="h-11 w-full sm:w-24 bg-divider rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {!isSearching && results && exactMatch && (
        <div className="space-y-5">
          {/* Exact Match Card */}
          {exactMatch.isAvailable ? (
            <div className="p-4 sm:p-5 rounded-[18px] border-2 border-primary bg-primary-tint/50 shadow-card">
              <div
                className={`flex justify-between gap-4 ${
                  isMobileLayout
                    ? 'flex-col items-stretch'
                    : 'flex-col sm:flex-row sm:items-center'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                      Exact match
                    </span>
                    {exactMatch.firstYearDiscountPercent > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                        Save {exactMatch.firstYearDiscountPercent}% first year
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-[19px] sm:text-[20px] text-ink mt-1 overflow-anywhere">
                    {exactMatch.fullDomain} is available!
                  </h3>
                  <p className="text-sm text-body mt-1 tabular-nums">
                    <strong className="font-display font-bold text-ink whitespace-nowrap">
                      {formatCurrency(exactMatch.firstYearUSD, state.currency)}
                    </strong>{' '}
                    first year · renews at{' '}
                    <span className="font-semibold text-ink whitespace-nowrap">
                      {formatCurrency(exactMatch.renewalUSD, state.currency)}/yr
                    </span>
                  </p>
                </div>

                <DomainResultActionButton
                  fullDomain={exactMatch.fullDomain}
                  cartItems={state.items}
                  onAdd={() => handleAddResult(exactMatch)}
                  onRemove={(id) => removeItem(id)}
                  fullWidthMobile={isMobileLayout}
                />
              </div>

              {(() => {
                const matchedItem = state.items.find(
                  (i) =>
                    i.vertical === 'domain' &&
                    i.domainConfig?.fullDomain === exactMatch.fullDomain &&
                    i.domainConfig?.registrationType === 'register'
                );
                return matchedItem ? (
                  <DomainInlineOptions item={matchedItem} />
                ) : null;
              })()}
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-[18px] border border-border-subtle bg-canvas text-secondary">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                <AlertCircle className="w-4 h-4 text-muted shrink-0" />
                <span>Unavailable</span>
              </div>
              <h3 className="font-display font-bold text-[19px] text-ink mt-1 overflow-anywhere">
                {exactMatch.fullDomain} is taken
              </h3>
              <p className="text-sm text-secondary mt-1">
                Try these available extensions instead:
              </p>
            </div>
          )}

          {/* Suggestions across TLDs */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="eyebrow-label">
                {exactMatch.isAvailable
                  ? 'More domain extensions'
                  : 'Try these instead'}
              </h4>
              <button
                type="button"
                aria-pressed={availableOnlyFilter}
                onClick={() => setAvailableOnlyFilter((prev) => !prev)}
                className={`min-h-[44px] px-3.5 rounded-full text-xs font-semibold border transition-colors kh-focus cursor-pointer ${
                  availableOnlyFilter
                    ? 'bg-primary-tint text-primary border-primary/40'
                    : 'bg-canvas text-secondary border-border-subtle hover:text-ink'
                }`}
              >
                {availableOnlyFilter ? 'Showing available only' : 'Available only'}
              </button>
            </div>

            {(() => {
              const displayedSuggestions = availableOnlyFilter
                ? suggestions.filter((s) => s.isAvailable)
                : suggestions;

              if (displayedSuggestions.length === 0) {
                return (
                  <div className="p-6 rounded-[16px] border border-border-subtle bg-canvas text-center space-y-2.5">
                    <p className="font-display font-bold text-base text-ink">
                      No domain matches found
                    </p>
                    <p className="text-sm text-secondary max-w-md mx-auto">
                      Try searching a different keyword or turning off the filter
                      to view all extensions.
                    </p>
                    {availableOnlyFilter && (
                      <button
                        type="button"
                        onClick={() => setAvailableOnlyFilter(false)}
                        className="kh-btn kh-btn-secondary min-h-[44px]! py-2! px-4! text-xs"
                      >
                        Show all extensions
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <ul className="space-y-2.5">
                  {displayedSuggestions.map((res) => {
                    const matchedItem = state.items.find(
                      (i) =>
                        i.vertical === 'domain' &&
                        i.domainConfig?.fullDomain === res.fullDomain &&
                        i.domainConfig?.registrationType === 'register'
                    );

                    return (
                      <li
                        key={res.fullDomain}
                        className={`p-4 rounded-[14px] border transition-colors ${
                          !res.isAvailable
                            ? 'border-border-subtle bg-canvas opacity-70'
                            : matchedItem
                            ? 'border-primary bg-primary-tint/35'
                            : 'border-border-subtle bg-surface hover:border-border-strong'
                        }`}
                      >
                        <div
                          className={`flex justify-between gap-3 ${
                            isMobileLayout
                              ? 'flex-col items-stretch'
                              : 'flex-col sm:flex-row sm:items-center'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            {/* Line 1: Domain name + discount badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-bold text-[16px] text-ink overflow-anywhere">
                                {res.fullDomain}
                              </span>
                              {res.isAvailable &&
                                res.firstYearDiscountPercent > 0 && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-accent-ink text-[11px] font-bold whitespace-nowrap">
                                    Save {res.firstYearDiscountPercent}% first year
                                  </span>
                                )}
                            </div>

                            {/* Line 2: First-year + renewal price */}
                            {res.isAvailable ? (
                              <p className="text-[13px] text-secondary mt-1 tabular-nums">
                                <span className="font-bold text-ink whitespace-nowrap">
                                  {formatCurrency(
                                    res.firstYearUSD,
                                    state.currency
                                  )}
                                </span>{' '}
                                first year · renews at{' '}
                                <span className="font-semibold text-ink whitespace-nowrap">
                                  {formatCurrency(
                                    res.renewalUSD,
                                    state.currency
                                  )}
                                  /yr
                                </span>
                              </p>
                            ) : (
                              <p className="text-[13px] text-muted mt-1">
                                Taken · Not available for new registration
                              </p>
                            )}
                          </div>

                          {/* Line 3: Full-width action on mobile */}
                          {res.isAvailable ? (
                            <DomainResultActionButton
                              fullDomain={res.fullDomain}
                              cartItems={state.items}
                              onAdd={() => handleAddResult(res)}
                              onRemove={(id) => removeItem(id)}
                              fullWidthMobile={isMobileLayout}
                            />
                          ) : (
                            <span className="text-xs font-semibold text-muted px-1 sm:px-3 py-1.5">
                              Unavailable
                            </span>
                          )}
                        </div>

                        {matchedItem && <DomainInlineOptions item={matchedItem} />}
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function DomainResultActionButton({
  fullDomain,
  cartItems,
  onAdd,
  onRemove,
  addLabel = 'Add',
  fullWidthMobile = false,
}: {
  fullDomain: string;
  cartItems: ReturnType<typeof useCart>['state']['items'];
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel?: string;
  fullWidthMobile?: boolean;
}) {
  const existing = cartItems.find(
    (i) =>
      i.vertical === 'domain' &&
      i.domainConfig?.fullDomain === fullDomain &&
      i.domainConfig?.registrationType !== 'existing'
  );

  if (!existing) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className={`kh-btn kh-btn-primary min-h-[44px]! py-2.5! px-5! text-sm shrink-0 ${
          fullWidthMobile ? 'w-full' : 'w-full sm:w-auto'
        }`}
      >
        {addLabel}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 shrink-0 ${
        fullWidthMobile ? 'w-full' : 'w-full sm:w-auto'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-full bg-surface text-success border border-success/40 text-sm font-semibold ${
          fullWidthMobile ? 'flex-1' : 'flex-1 sm:flex-initial'
        }`}
      >
        <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
        <span>Added ✓</span>
      </span>

      <button
        type="button"
        onClick={() => onRemove(existing.id)}
        aria-label={`Remove ${fullDomain} from order`}
        className="min-w-[44px] min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-error-tint text-error border border-error/30 hover:border-error/60 text-xs font-semibold transition-colors kh-focus cursor-pointer shrink-0 kh-touch-surface"
      >
        <Trash2 className="w-4 h-4 shrink-0" />
        <span className="sr-only">Remove</span>
      </button>
    </div>
  );
}

function TransferDomainPanel() {
  const { state, addDomainItem, removeItem } = useCart();
  const { isMobileLayout } = useViewport();
  const [domainInput, setDomainInput] = useState('');
  const [eppCode, setEppCode] = useState('');
  const [showEpp, setShowEpp] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [eppError, setEppError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [eligibility, setEligibility] =
    useState<TransferEligibilityResult | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleDomainChange = (val: string) => {
    setDomainInput(val);
    setEligibility(null);
    if (!val.trim()) {
      setDomainError(null);
      return;
    }
    const check = validateFullDomainInput(val);
    setDomainError(check.valid ? null : check.error ?? 'Invalid domain');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateFullDomainInput(domainInput);
    if (!check.valid) {
      setDomainError(check.error ?? 'Enter a valid domain name.');
      return;
    }
    if (!eppCode.trim()) {
      setEppError('Enter the EPP/authorization code from your registrar.');
      return;
    }

    setDomainError(null);
    setEppError(null);
    setChecking(true);
    setEligibility(null);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const res = checkTransferEligibility(domainInput);
      setEligibility(res);
      setChecking(false);
    }, 800);
  };

  const handleAddTransfer = () => {
    if (!eligibility || !eligibility.eligible) return;
    const parts = eligibility.fullDomain.split('.');
    const sld = parts[0] ?? eligibility.fullDomain;
    const tld = `.${parts.slice(1).join('.')}`;
    const rule = getTldRule(tld);

    addDomainItem({
      fullDomain: eligibility.fullDomain,
      sld,
      tld,
      registrationType: 'transfer',
      years: 1,
      autoRenew: true,
      whoisPrivacy: rule.whoisSupport !== 'unsupported',
      whoisSupport: rule.whoisSupport,
      whoisPriceYearlyUSD: rule.whoisYearlyUSD,
      firstYearPriceUSD: eligibility.transferPriceUSD,
      renewalYearlyUSD: eligibility.renewalPriceUSD,
    });
  };

  const matchedTransferItem = eligibility?.eligible
    ? state.items.find(
        (i) =>
          i.vertical === 'domain' &&
          i.domainConfig?.fullDomain === eligibility.fullDomain &&
          i.domainConfig?.registrationType === 'transfer'
      )
    : undefined;

  return (
    <div className="space-y-5 min-w-0">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor="transfer-domain-input"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              Domain to transfer
            </label>
            <input
              id="transfer-domain-input"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={domainInput}
              onChange={(e) => handleDomainChange(e.target.value)}
              placeholder="e.g. mybiashara.co.ke"
              aria-invalid={Boolean(domainError)}
              className={`kh-input ${
                domainError
                  ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                  : ''
              }`}
            />
            {domainError && (
              <p
                role="alert"
                className="text-xs font-semibold text-error flex items-center gap-1.5 mt-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{domainError}</span>
              </p>
            )}
          </div>

          <div className="min-w-0">
            <label
              htmlFor="transfer-epp-input"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              EPP / Authorization code
            </label>
            <div className="relative">
              <input
                id="transfer-epp-input"
                type={showEpp ? 'text' : 'password'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={eppCode}
                onChange={(e) => {
                  setEppCode(e.target.value);
                  if (eppError) setEppError(null);
                }}
                placeholder="Enter registrar auth code"
                aria-invalid={Boolean(eppError)}
                className={`kh-input pr-12! ${
                  eppError
                    ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowEpp((prev) => !prev)}
                aria-label={
                  showEpp
                    ? 'Hide EPP authorization code'
                    : 'Show EPP authorization code'
                }
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full text-muted hover:text-ink kh-focus cursor-pointer"
              >
                {showEpp ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {eppError ? (
              <p
                role="alert"
                className="text-xs font-semibold text-error flex items-center gap-1.5 mt-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{eppError}</span>
              </p>
            ) : (
              <p className="text-xs text-muted mt-1.5">
                Get this code from your current registrar. Transfers usually
                take 5-7 days.
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={checking}
          className={`kh-btn kh-btn-primary ${
            isMobileLayout ? 'w-full' : 'w-full sm:w-auto'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Checking eligibility…' : 'Check eligibility'}</span>
        </button>
      </form>

      {/* ~800ms skeleton */}
      {checking && (
        <div
          aria-busy="true"
          className="p-4 sm:p-5 rounded-[16px] border border-border-subtle bg-canvas animate-pulse space-y-2.5"
        >
          <div className="h-4 w-36 bg-divider rounded" />
          <div className="h-6 w-56 max-w-full bg-divider rounded" />
          <div className="h-4 w-72 max-w-full bg-surface rounded" />
        </div>
      )}

      {/* Eligibility result */}
      {!checking && eligibility && (
        <>
          {eligibility.eligible ? (
            <div className="p-4 sm:p-5 rounded-[18px] border-2 border-primary bg-primary-tint/45 space-y-3">
              <div
                className={`flex justify-between gap-4 ${
                  isMobileLayout
                    ? 'flex-col items-stretch'
                    : 'flex-col sm:flex-row sm:items-center'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-success">
                    Eligible for transfer
                  </span>
                  <h3 className="font-display font-bold text-[19px] text-ink mt-1 overflow-anywhere">
                    {eligibility.fullDomain}
                  </h3>
                  <p className="text-sm text-body mt-1 tabular-nums">
                    <strong className="font-display font-bold text-ink whitespace-nowrap">
                      {formatCurrency(
                        eligibility.transferPriceUSD,
                        state.currency
                      )}
                    </strong>{' '}
                    (includes 1 year extension) · renews at{' '}
                    <span className="font-semibold text-ink whitespace-nowrap">
                      {formatCurrency(
                        eligibility.renewalPriceUSD,
                        state.currency
                      )}
                      /yr
                    </span>
                  </p>
                </div>

                <DomainResultActionButton
                  fullDomain={eligibility.fullDomain}
                  cartItems={state.items}
                  addLabel="Add transfer"
                  onAdd={handleAddTransfer}
                  onRemove={(id) => removeItem(id)}
                  fullWidthMobile={isMobileLayout}
                />
              </div>

              {matchedTransferItem && (
                <DomainInlineOptions item={matchedTransferItem} />
              )}
            </div>
          ) : (
            <div
              role="alert"
              className="p-4 sm:p-5 rounded-[16px] border border-error/40 bg-error-tint flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h3 className="font-display font-bold text-base text-ink overflow-anywhere">
                  Transfer blocked for {eligibility.fullDomain}
                </h3>
                <p className="text-sm text-error font-medium mt-1">
                  {eligibility.errorMessage}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UseExistingDomainPanel() {
  const { state, addDomainItem } = useCart();
  const { isMobileLayout } = useViewport();
  const [domainInput, setDomainInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmedDomain, setConfirmedDomain] = useState<string | null>(() => {
    const existing = state.items.find(
      (i) =>
        i.vertical === 'domain' &&
        i.domainConfig?.registrationType === 'existing'
    );
    return existing?.domainConfig?.fullDomain ?? null;
  });
  const [copiedNs, setCopiedNs] = useState<string | null>(null);

  const handleDomainChange = (val: string) => {
    setDomainInput(val);
    if (!val.trim()) {
      setError(null);
      return;
    }
    const check = validateFullDomainInput(val);
    setError(check.valid ? null : check.error ?? 'Invalid domain name');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateFullDomainInput(domainInput);
    if (!check.valid || !check.tld) {
      setError(check.error ?? 'Enter a valid domain name, e.g. example.com.');
      return;
    }

    const cleanDomain = `${check.sld}${check.tld}`.toLowerCase();
    setError(null);
    setConfirmedDomain(cleanDomain);

    addDomainItem({
      fullDomain: cleanDomain,
      sld: check.sld,
      tld: check.tld,
      registrationType: 'existing',
      years: 1,
      autoRenew: false,
      whoisPrivacy: false,
      whoisSupport: 'unsupported',
      whoisPriceYearlyUSD: 0,
      firstYearPriceUSD: 0,
      renewalYearlyUSD: 0,
    });
  };

  const handleCopy = async (ns: string) => {
    try {
      await navigator.clipboard.writeText(ns);
    } catch {
      // Fallback ignored if clipboard permissions are restricted
    }
    setCopiedNs(ns);
    window.setTimeout(() => {
      setCopiedNs((current) => (current === ns ? null : current));
    }, 2000);
  };

  return (
    <div className="space-y-5 min-w-0">
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <label
          htmlFor="existing-domain-input"
          className="block text-sm font-semibold text-ink"
        >
          Your existing domain name
        </label>
        <div
          className={`flex gap-3 ${
            isMobileLayout ? 'flex-col' : 'flex-col sm:flex-row'
          }`}
        >
          <input
            id="existing-domain-input"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={domainInput}
            onChange={(e) => handleDomainChange(e.target.value)}
            placeholder="e.g. mybiashara.com"
            aria-invalid={Boolean(error)}
            className={`kh-input flex-1 min-w-0 ${
              error
                ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                : ''
            }`}
          />
          <button
            type="submit"
            className={`kh-btn kh-btn-primary shrink-0 ${
              isMobileLayout ? 'w-full' : 'w-full sm:w-auto'
            }`}
          >
            <span>Use this domain</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="text-xs font-semibold text-error flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : (
          <p className="text-xs text-muted">
            We&apos;ll keep your domain at your current registrar and add a{' '}
            <span className="whitespace-nowrap">
              {formatCurrency(0, state.currency)}
            </span>{' '}
            configuration line to your order.
          </p>
        )}
      </form>

      {confirmedDomain && (
        <div className="p-4 sm:p-5 rounded-[18px] border border-primary/40 bg-surface-tint/60 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-success-tint text-success flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-base text-ink overflow-anywhere">
                Captured: {confirmedDomain}{' '}
                <span className="whitespace-nowrap">
                  ({formatCurrency(0, state.currency)})
                </span>
              </h3>
              <p className="text-sm text-secondary mt-0.5">
                Update your nameservers at your current registrar to point your
                domain to Kilele Host:
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {KILELE_NAMESERVERS.map((ns, i) => {
              const isCopied = copiedNs === ns;
              return (
                <div
                  key={ns}
                  className="flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 rounded-[12px] bg-surface border border-border-subtle"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Server className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-muted uppercase shrink-0">
                      NS{i + 1}
                    </span>
                    <code className="text-xs sm:text-sm font-semibold text-ink overflow-anywhere">
                      {ns}
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(ns)}
                    className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full text-xs font-bold transition-colors kh-focus cursor-pointer shrink-0 ${
                      isCopied
                        ? 'bg-success-tint text-success'
                        : 'bg-canvas text-ink hover:bg-primary-tint hover:text-primary border border-border-subtle'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ChooseLaterPanel() {
  const { setDomainMode } = useCart();

  return (
    <div className="p-4 sm:p-5 rounded-[18px] bg-surface-tint/55 border border-border-subtle space-y-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-[12px] bg-surface border border-border-subtle text-primary flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-[18px] text-ink">
            You can choose or connect a domain later
          </h3>
          <p className="text-sm text-secondary mt-1 leading-relaxed">
            Your hosting plan includes a free temporary staging URL (e.g.{' '}
            <span className="font-semibold text-ink overflow-anywhere">
              site.kilelepreview.com
            </span>
            ) so you can start building immediately and link a domain anytime
            from your Kilele Host dashboard.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => setDomainMode('register')}
          className="kh-btn kh-btn-secondary min-h-[44px]! py-2! px-4! text-xs"
        >
          Register a new domain instead
        </button>
        <button
          type="button"
          onClick={() => setDomainMode('existing')}
          className="kh-btn kh-btn-secondary min-h-[44px]! py-2! px-4! text-xs"
        >
          Connect an existing domain
        </button>
      </div>
    </div>
  );
}
