import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  CreditCard,
  Edit3,
  Globe,
  Info,
  Loader2,
  Lock,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { validatePhoneValue } from '../config/billingConfig';
import {
  detectCardBrand,
  formatCardExpiry,
  formatCardNumber,
  stripNonDigits,
  validateCardCvcInput,
  validateCardExpiryInput,
  validateCardNumberInput,
} from '../config/paymentConfig';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { PaymentMethod } from '../types/checkout';
import { formatCurrency } from '../utils/pricing';

interface PaymentTileMeta {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
}

const PAYMENT_TILES: PaymentTileMeta[] = [
  {
    id: 'mpesa',
    title: 'M-Pesa Express',
    subtitle: 'Instant STK push prompt to your mobile phone',
    badge: 'Popular in KE',
    icon: <Smartphone className="w-5 h-5 text-primary shrink-0" />,
  },
  {
    id: 'card',
    title: 'Card (Visa / Mastercard)',
    subtitle: 'Encrypted 3D-Secure card payment',
    icon: <CreditCard className="w-5 h-5 text-primary shrink-0" />,
  },
  {
    id: 'paypal',
    title: 'PayPal',
    subtitle: 'Pay with your PayPal balance or linked card',
    icon: <Wallet className="w-5 h-5 text-primary shrink-0" />,
  },
  {
    id: 'bank',
    title: 'Bank transfer (PesaLink / EFT)',
    subtitle: 'Direct bank transfer with proforma reference',
    icon: <Building2 className="w-5 h-5 text-primary shrink-0" />,
  },
];

export function Step3Payment() {
  const {
    state,
    summary,
    goToStep,
    goToPreviousStep,
    setActiveVertical,
    registerStep3Submit,
    setStep3CtaState,
    completeOrder,
  } = useCart();
  const { isMobileLayout } = useViewport();
  const { customerInfo } = state;

  // ~500ms skeleton loader for review block on Step 3 entry
  const [reviewLoading, setReviewLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setReviewLoading(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  // Default to M-Pesa for Kenya, Card otherwise
  const [method, setMethod] = useState<PaymentMethod>(() =>
    customerInfo.country === 'Kenya' ? 'mpesa' : 'card'
  );
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // M-Pesa state
  const prefilledMpesaPhone = useMemo(() => {
    const combined = `${customerInfo.phoneCountryCode} ${customerInfo.phone}`.trim();
    return customerInfo.phone.trim() ? combined : '+254 712 345 678';
  }, [customerInfo.phone, customerInfo.phoneCountryCode]);

  const [mpesaPhone, setMpesaPhone] = useState<string>(prefilledMpesaPhone);
  const [mpesaTouched, setMpesaTouched] = useState(false);
  const [mpesaCountdown, setMpesaCountdown] = useState<number | null>(null);

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(
    customerInfo.fullName.trim() || customerInfo.signedInUser?.name || ''
  );
  const [cardTouched, setCardTouched] = useState<{
    number?: boolean;
    expiry?: boolean;
    cvc?: boolean;
    name?: boolean;
  }>({});
  const [cardDeclineError, setCardDeclineError] = useState<string | null>(null);
  const [cvcTooltipOpen, setCvcTooltipOpen] = useState(false);

  // Bank transfer copy state
  const [copiedBankRef, setCopiedBankRef] = useState(false);

  // Terms & processing state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [disabledTooltipOpen, setDisabledTooltipOpen] = useState(false);

  const timersRef = useRef<number[]>([]);
  const mpesaIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      if (mpesaIntervalRef.current) {
        window.clearInterval(mpesaIntervalRef.current);
      }
    };
  }, []);

  const cardDigits = stripNonDigits(cardNumber);
  const cardBrand = detectCardBrand(cardDigits);

  const mpesaPhoneError = mpesaTouched
    ? validatePhoneValue(mpesaPhone)
    : null;
  const cardNumberError = cardTouched.number
    ? validateCardNumberInput(cardNumber)
    : null;
  const cardExpiryError = cardTouched.expiry
    ? validateCardExpiryInput(cardExpiry)
    : null;
  const cardCvcError = cardTouched.cvc
    ? validateCardCvcInput(cardCvc, cardBrand)
    : null;
  const cardNameError =
    cardTouched.name && cardName.trim().length < 2
      ? 'Enter the name printed on your card'
      : null;

  const formattedTotalDue = formatCurrency(
    summary.totalDueTodayUSD,
    state.currency
  );

  const handleRadioKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (idx + 1) % PAYMENT_TILES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (idx - 1 + PAYMENT_TILES.length) % PAYMENT_TILES.length;
    }
    if (nextIdx !== null) {
      e.preventDefault();
      setMethod(PAYMENT_TILES[nextIdx].id);
      setCardDeclineError(null);
      radioRefs.current[nextIdx]?.focus();
    }
  };

  const handlePayAndComplete = useCallback(() => {
    if (state.items.length === 0 || !termsAccepted || isProcessing) {
      return;
    }

    setCardDeclineError(null);

    if (method === 'mpesa') {
      setMpesaTouched(true);
      const err = validatePhoneValue(mpesaPhone);
      if (err) {
        const el = document.getElementById('step3-mpesa-phone');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
        return;
      }

      setIsProcessing(true);
      setMpesaCountdown(20);
      if (mpesaIntervalRef.current) {
        window.clearInterval(mpesaIntervalRef.current);
      }
      mpesaIntervalRef.current = window.setInterval(() => {
        setMpesaCountdown((prev) =>
          prev !== null && prev > 1 ? prev - 1 : prev
        );
      }, 1000);

      const finishTimer = window.setTimeout(() => {
        if (mpesaIntervalRef.current) {
          window.clearInterval(mpesaIntervalRef.current);
          mpesaIntervalRef.current = null;
        }
        setMpesaCountdown(null);
        setIsProcessing(false);
        completeOrder('mpesa', `M-Pesa Express (${mpesaPhone.trim()})`);
      }, 2400);
      timersRef.current.push(finishTimer);
      return;
    }

    if (method === 'card') {
      setCardTouched({
        number: true,
        expiry: true,
        cvc: true,
        name: true,
      });

      const numErr = validateCardNumberInput(cardNumber);
      const expErr = validateCardExpiryInput(cardExpiry);
      const cvcErr = validateCardCvcInput(cardCvc, cardBrand);
      const nmErr =
        cardName.trim().length < 2
          ? 'Enter the name printed on your card'
          : null;

      if (numErr || expErr || cvcErr || nmErr) {
        const firstId = numErr
          ? 'step3-card-number'
          : expErr
          ? 'step3-card-expiry'
          : cvcErr
          ? 'step3-card-cvc'
          : 'step3-card-name';
        const el = document.getElementById(firstId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
        return;
      }

      setIsProcessing(true);
      const cardTimer = window.setTimeout(() => {
        setIsProcessing(false);
        if (cardDigits === '4000000000000002') {
          setCardDeclineError(
            'Your card was declined by the issuing bank. Try another card (e.g. 4242 4242 4242 4242), verify your card limit, or switch to M-Pesa Express.'
          );
          return;
        }
        const last4 = cardDigits.slice(-4);
        completeOrder('card', `${cardBrand} ending in ${last4}`);
      }, 2000);
      timersRef.current.push(cardTimer);
      return;
    }

    if (method === 'paypal') {
      setIsProcessing(true);
      const ppTimer = window.setTimeout(() => {
        setIsProcessing(false);
        completeOrder('paypal', 'PayPal');
      }, 2000);
      timersRef.current.push(ppTimer);
      return;
    }

    // Bank transfer
    setIsProcessing(true);
    const bankTimer = window.setTimeout(() => {
      setIsProcessing(false);
      completeOrder('bank', 'Bank Transfer (PesaLink / EFT)');
    }, 1800);
    timersRef.current.push(bankTimer);
  }, [
    cardBrand,
    cardCvc,
    cardDigits,
    cardExpiry,
    cardName,
    cardNumber,
    completeOrder,
    isProcessing,
    method,
    mpesaPhone,
    state.items.length,
    termsAccepted,
  ]);

  useEffect(() => {
    registerStep3Submit(handlePayAndComplete);
    return () => registerStep3Submit(null);
  }, [handlePayAndComplete, registerStep3Submit]);

  useEffect(() => {
    setStep3CtaState({
      disabled: state.items.length === 0 || !termsAccepted || isProcessing,
      loading: isProcessing,
      disabledReason: !termsAccepted
        ? 'Agree to the Terms of Service above to complete your order'
        : undefined,
    });
  }, [isProcessing, setStep3CtaState, state.items.length, termsAccepted]);

  const handleCopyBankRef = async () => {
    try {
      await navigator.clipboard.writeText('KILELE-EFT-2026');
    } catch {
      // Ignore clipboard sandbox restrictions
    }
    setCopiedBankRef(true);
    const t = window.setTimeout(() => setCopiedBankRef(false), 2000);
    timersRef.current.push(t);
  };

  if (state.items.length === 0) {
    return (
      <div className="kh-card p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface-tint text-primary flex items-center justify-center">
          <Globe className="w-6 h-6" />
        </div>
        <h1 className="font-display font-bold text-2xl text-ink">
          Your cart is empty
        </h1>
        <p className="text-sm text-secondary max-w-md mx-auto">
          Add a hosting plan, domain, or server configuration before choosing a
          payment method.
        </p>
        <button
          type="button"
          onClick={() => {
            setActiveVertical('shared');
            goToStep(1);
          }}
          className="kh-btn kh-btn-primary"
        >
          Browse hosting plans
        </button>
      </div>
    );
  }

  const accountEmailDisplay =
    customerInfo.email.trim() ||
    customerInfo.signedInUser?.email ||
    'amina@example.com';

  const billingAddressParts = [
    customerInfo.address,
    customerInfo.city,
    customerInfo.postalCode,
    customerInfo.country,
  ]
    .map((s) => s.trim())
    .filter(Boolean);
  const billingAddressDisplay =
    billingAddressParts.length > 0
      ? billingAddressParts.join(', ')
      : 'Kenya';

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      <div>
        {isMobileLayout && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={goToPreviousStep}
            className="inline-flex items-center gap-1 min-h-[44px] -ml-1.5 pr-3 mb-1 text-sm font-semibold text-primary hover:text-primary-hover kh-focus rounded-lg cursor-pointer disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span>Back</span>
          </button>
        )}

        <p className="eyebrow-label">Step 3 · Payment &amp; Confirmation</p>
        <h1
          className={`font-display font-bold text-ink mt-1 tracking-tight ${
            isMobileLayout
              ? 'text-[26px] leading-tight'
              : 'text-[32px] leading-tight'
          }`}
        >
          Review &amp; pay securely
        </h1>
        <p className="text-[15px] text-secondary mt-1.5">
          Confirm your items, account details, and preferred payment method.
        </p>
      </div>

      {/* 1. REVIEW BLOCK AT TOP (~500ms skeleton on entry) */}
      {reviewLoading ? (
        <ReviewBlockSkeleton />
      ) : (
        <section
          aria-labelledby="step3-review-heading"
          className="kh-card p-4 sm:p-5 space-y-4 min-w-0"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-divider">
            <div className="min-w-0">
              <p className="eyebrow-label">Order Review</p>
              <h2
                id="step3-review-heading"
                className="font-display font-bold text-lg text-ink mt-0.5"
              >
                What you&apos;re buying
              </h2>
            </div>

            <button
              type="button"
              onClick={() => goToStep(1)}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-full text-xs font-semibold text-primary hover:bg-primary-tint transition-colors kh-focus cursor-pointer shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span>Edit items</span>
            </button>
          </div>

          <ul className="divide-y divide-divider">
            {summary.lineItems.map((li) => {
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

              return (
                <li key={li.item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-sm text-ink overflow-anywhere">
                        {li.item.name}
                        {li.item.quantity > 1 ? ` ×${li.item.quantity}` : ''}
                      </p>
                      <p className="text-xs text-secondary mt-0.5 tabular-nums">
                        Term: <strong className="text-ink">{termLabel}</strong>
                        {li.setupFeeTotalUSD > 0 && (
                          <span>
                            {' '}
                            · Setup:{' '}
                            <span className="whitespace-nowrap">
                              {formatCurrency(
                                li.setupFeeTotalUSD,
                                state.currency
                              )}
                            </span>
                          </span>
                        )}
                      </p>
                      {li.isExistingDomain ? (
                        <p className="text-xs text-muted mt-0.5">
                          No renewal charge
                        </p>
                      ) : (
                        <p className="text-xs text-muted mt-0.5 tabular-nums">
                          Renews on {li.renewalDateFormatted} at{' '}
                          <span className="font-semibold text-ink whitespace-nowrap">
                            {formatCurrency(li.renewalTermUSD, state.currency)}
                            {li.isYearlyOnly ? '/yr' : ''}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-display font-bold text-sm text-ink tabular-nums whitespace-nowrap">
                        {formatCurrency(li.upfrontTotalUSD, state.currency)}
                      </span>
                      {li.listTotalUSD > li.upfrontTotalUSD && (
                        <div className="text-[11px] text-muted line-through tabular-nums whitespace-nowrap">
                          {formatCurrency(li.listTotalUSD, state.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Account & Billing Address Review */}
          <div className="pt-3 border-t border-divider grid gap-3 sm:grid-cols-2">
            <div className="p-3.5 rounded-[12px] bg-canvas border border-border-subtle flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  Account email
                </p>
                <p className="text-xs sm:text-sm font-semibold text-ink mt-0.5 overflow-anywhere">
                  {accountEmailDisplay}
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                aria-label="Edit account email"
                className="min-h-[44px] min-w-[44px] -my-2 px-2.5 text-xs font-semibold text-primary hover:underline kh-focus rounded cursor-pointer shrink-0"
              >
                Edit
              </button>
            </div>

            <div className="p-3.5 rounded-[12px] bg-canvas border border-border-subtle flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  Billing address
                </p>
                <p className="text-xs sm:text-sm font-semibold text-ink mt-0.5 overflow-anywhere">
                  {billingAddressDisplay}
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                aria-label="Edit billing address"
                className="min-h-[44px] min-w-[44px] -my-2 px-2.5 text-xs font-semibold text-primary hover:underline kh-focus rounded cursor-pointer shrink-0"
              >
                Edit
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. PAYMENT METHOD SELECTOR */}
      <section
        aria-labelledby="payment-method-heading"
        className="kh-card p-4 sm:p-5 space-y-5 min-w-0"
      >
        <div>
          <h2
            id="payment-method-heading"
            className="font-display font-bold text-lg text-ink"
          >
            Payment method
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Select how you&apos;d like to complete today&apos;s{' '}
            <strong className="text-ink tabular-nums whitespace-nowrap">
              {formattedTotalDue}
            </strong>{' '}
            payment.
          </p>
        </div>

        {/* Radio Tiles */}
        <div
          role="radiogroup"
          aria-label="Select payment method"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {PAYMENT_TILES.map((tile, idx) => {
            const isSelected = method === tile.id;
            return (
              <button
                key={tile.id}
                ref={(el) => {
                  radioRefs.current[idx] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                disabled={isProcessing}
                onClick={() => {
                  setMethod(tile.id);
                  setCardDeclineError(null);
                }}
                onKeyDown={(e) => handleRadioKeyDown(e, idx)}
                className={`min-h-[64px] p-4 rounded-[14px] border text-left flex items-start justify-between gap-3 transition-all kh-focus cursor-pointer kh-touch-surface disabled:opacity-60 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-primary bg-primary-tint/50 ring-1 ring-primary'
                    : 'border-border-subtle bg-surface hover:border-border-strong hover:shadow-card'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5 shrink-0">{tile.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-[15px] text-ink leading-snug">
                        {tile.title}
                      </span>
                      {tile.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-ink text-[10px] font-bold whitespace-nowrap">
                          {tile.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary mt-1 leading-snug">
                      {tile.subtitle}
                    </p>
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 ${
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-border-input bg-surface'
                  }`}
                >
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-surface" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Payment Method Form / Panel */}
        {method === 'mpesa' && (
          <div className="p-4 rounded-[14px] bg-canvas border border-border-subtle space-y-3">
            <div className="min-w-0">
              <label
                htmlFor="step3-mpesa-phone"
                className="block text-sm font-semibold text-ink mb-1.5"
              >
                M-Pesa mobile number
              </label>
              <div className="relative">
                <input
                  id="step3-mpesa-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={isProcessing}
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  onBlur={() => setMpesaTouched(true)}
                  aria-invalid={Boolean(mpesaPhoneError)}
                  aria-describedby="step3-mpesa-helper step3-mpesa-error"
                  placeholder="+254 712 345 678"
                  className={`kh-input pr-10! ${
                    mpesaPhoneError
                      ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                      : mpesaTouched && !mpesaPhoneError
                      ? 'border-success/60!'
                      : ''
                  }`}
                />
                {mpesaTouched && !mpesaPhoneError && (
                  <CheckCircle2
                    aria-hidden="true"
                    className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                )}
              </div>
              {mpesaPhoneError ? (
                <p
                  id="step3-mpesa-error"
                  className="text-xs font-medium text-error mt-1"
                >
                  {mpesaPhoneError}
                </p>
              ) : (
                <p
                  id="step3-mpesa-helper"
                  className="text-xs text-secondary mt-1.5"
                >
                  You&apos;ll get a prompt on your phone to enter your M-Pesa
                  PIN.
                </p>
              )}
            </div>

            {mpesaCountdown !== null && (
              <div
                role="status"
                aria-live="polite"
                className="p-4 rounded-[12px] bg-surface-tint border border-primary/30 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-ink">
                      Check your phone…
                    </p>
                    <p className="text-xs text-secondary overflow-anywhere">
                      Enter your M-Pesa PIN on{' '}
                      <span className="whitespace-nowrap">
                        {mpesaPhone.trim()}
                      </span>{' '}
                      to authorize{' '}
                      <span className="whitespace-nowrap">
                        {formattedTotalDue}
                      </span>
                      .
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-surface border border-primary/20 text-xs font-bold text-primary tabular-nums shrink-0 whitespace-nowrap">
                  {mpesaCountdown}s
                </span>
              </div>
            )}
          </div>
        )}

        {method === 'card' && (
          <div className="p-4 rounded-[14px] bg-canvas border border-border-subtle space-y-3 sm:space-y-4">
            {cardDeclineError && (
              <div
                role="alert"
                className="p-3.5 rounded-[12px] bg-error-tint border border-error/40 flex items-start gap-2.5 text-xs text-ink"
              >
                <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-error">Payment declined</p>
                  <p className="mt-0.5 text-ink">{cardDeclineError}</p>
                </div>
              </div>
            )}

            {/* Card Number */}
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="step3-card-number"
                  className="block text-sm font-semibold text-ink"
                >
                  Card number
                </label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface border border-border-subtle text-[11px] font-bold text-ink shrink-0">
                  {cardBrand}
                </span>
              </div>
              <div className="relative">
                <input
                  id="step3-card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  disabled={isProcessing}
                  value={cardNumber}
                  onChange={(e) => {
                    setCardNumber(formatCardNumber(e.target.value));
                    if (cardDeclineError) setCardDeclineError(null);
                  }}
                  onBlur={() =>
                    setCardTouched((prev) => ({ ...prev, number: true }))
                  }
                  aria-invalid={Boolean(cardNumberError)}
                  aria-describedby="step3-card-number-error"
                  placeholder="4242 4242 4242 4242"
                  className={`kh-input pr-10! tabular-nums ${
                    cardNumberError
                      ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                      : cardTouched.number && !cardNumberError
                      ? 'border-success/60!'
                      : ''
                  }`}
                />
                {cardTouched.number && !cardNumberError && (
                  <CheckCircle2
                    aria-hidden="true"
                    className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                )}
              </div>
              {cardNumberError && (
                <p
                  id="step3-card-number-error"
                  className="text-xs font-medium text-error mt-1"
                >
                  {cardNumberError}
                </p>
              )}
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Test cards:{' '}
                <strong className="text-ink whitespace-nowrap">
                  4242 4242 4242 4242
                </strong>{' '}
                (succeeds) ·{' '}
                <strong className="text-ink whitespace-nowrap">
                  4000 0000 0000 0002
                </strong>{' '}
                (declines)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              {/* Expiry */}
              <div className="min-w-0">
                <label
                  htmlFor="step3-card-expiry"
                  className="block text-sm font-semibold text-ink mb-1.5"
                >
                  Expiry (MM/YY)
                </label>
                <div className="relative">
                  <input
                    id="step3-card-expiry"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    disabled={isProcessing}
                    value={cardExpiry}
                    onChange={(e) =>
                      setCardExpiry(formatCardExpiry(e.target.value))
                    }
                    onBlur={() =>
                      setCardTouched((prev) => ({ ...prev, expiry: true }))
                    }
                    aria-invalid={Boolean(cardExpiryError)}
                    aria-describedby="step3-card-expiry-error"
                    placeholder="08/28"
                    className={`kh-input pr-10! tabular-nums ${
                      cardExpiryError
                        ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                        : cardTouched.expiry && !cardExpiryError
                        ? 'border-success/60!'
                        : ''
                    }`}
                  />
                  {cardTouched.expiry && !cardExpiryError && (
                    <CheckCircle2
                      aria-hidden="true"
                      className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                  )}
                </div>
                {cardExpiryError && (
                  <p
                    id="step3-card-expiry-error"
                    className="text-xs font-medium text-error mt-1"
                  >
                    {cardExpiryError}
                  </p>
                )}
              </div>

              {/* CVC with tooltip */}
              <div className="relative min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="step3-card-cvc"
                    className="block text-sm font-semibold text-ink"
                  >
                    CVC
                  </label>
                  <button
                    type="button"
                    onClick={() => setCvcTooltipOpen((v) => !v)}
                    onBlur={() => setCvcTooltipOpen(false)}
                    aria-label="Where to find your card CVC"
                    aria-expanded={cvcTooltipOpen}
                    className="inline-flex items-center gap-1 min-h-[44px] -my-3 px-2 text-xs font-semibold text-primary hover:underline kh-focus rounded cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>What&apos;s this?</span>
                  </button>
                </div>

                {cvcTooltipOpen && (
                  <div
                    role="tooltip"
                    className="absolute right-0 bottom-full mb-2 w-56 sm:w-60 max-w-full p-3 rounded-[12px] bg-ink-deep text-surface text-xs leading-relaxed shadow-raised z-20"
                  >
                    {cardBrand === 'Amex'
                      ? 'The 4-digit security code printed above the card number on the front.'
                      : 'The 3-digit security code printed on the signature strip on the back of your card.'}
                  </div>
                )}

                <div className="relative">
                  <input
                    id="step3-card-cvc"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    disabled={isProcessing}
                    value={cardCvc}
                    onChange={(e) =>
                      setCardCvc(stripNonDigits(e.target.value).slice(0, 4))
                    }
                    onBlur={() =>
                      setCardTouched((prev) => ({ ...prev, cvc: true }))
                    }
                    aria-invalid={Boolean(cardCvcError)}
                    aria-describedby="step3-card-cvc-error"
                    placeholder={cardBrand === 'Amex' ? '1234' : '123'}
                    className={`kh-input pr-10! tabular-nums ${
                      cardCvcError
                        ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                        : cardTouched.cvc && !cardCvcError
                        ? 'border-success/60!'
                        : ''
                    }`}
                  />
                  {cardTouched.cvc && !cardCvcError && (
                    <CheckCircle2
                      aria-hidden="true"
                      className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                  )}
                </div>
                {cardCvcError && (
                  <p
                    id="step3-card-cvc-error"
                    className="text-xs font-medium text-error mt-1"
                  >
                    {cardCvcError}
                  </p>
                )}
              </div>
            </div>

            {/* Name on card */}
            <div className="min-w-0">
              <label
                htmlFor="step3-card-name"
                className="block text-sm font-semibold text-ink mb-1.5"
              >
                Name on card
              </label>
              <div className="relative">
                <input
                  id="step3-card-name"
                  type="text"
                  autoComplete="cc-name"
                  disabled={isProcessing}
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  onBlur={() =>
                    setCardTouched((prev) => ({ ...prev, name: true }))
                  }
                  aria-invalid={Boolean(cardNameError)}
                  aria-describedby="step3-card-name-error"
                  placeholder="Amina Otieno"
                  className={`kh-input pr-10! ${
                    cardNameError
                      ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                      : cardTouched.name && !cardNameError
                      ? 'border-success/60!'
                      : ''
                  }`}
                />
                {cardTouched.name && !cardNameError && (
                  <CheckCircle2
                    aria-hidden="true"
                    className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                )}
              </div>
              {cardNameError && (
                <p
                  id="step3-card-name-error"
                  className="text-xs font-medium text-error mt-1"
                >
                  {cardNameError}
                </p>
              )}
            </div>
          </div>
        )}

        {method === 'paypal' && (
          <div className="p-4 rounded-[14px] bg-surface-tint/60 border border-primary/25 space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-ink">
              <Wallet className="w-4 h-4 text-primary shrink-0" />
              <span>PayPal Express Checkout</span>
            </div>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              When you click the Pay button below, PayPal authorizes{' '}
              <strong className="text-ink tabular-nums whitespace-nowrap">
                {formattedTotalDue}
              </strong>{' '}
              using your PayPal balance or saved funding source. Covered by
              PayPal Buyer Protection with instant hosting activation.
            </p>
          </div>
        )}

        {method === 'bank' && (
          <div className="p-4 rounded-[14px] bg-canvas border border-border-subtle space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 font-display font-bold text-sm text-ink min-w-0">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span>PesaLink / Corporate Bank EFT Instructions</span>
              </div>
              <button
                type="button"
                onClick={handleCopyBankRef}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full bg-surface border border-border-subtle text-xs font-semibold text-ink hover:text-primary kh-focus cursor-pointer shrink-0"
              >
                {copiedBankRef ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success shrink-0" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    <span>Copy ref</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs text-secondary bg-surface p-3 rounded-[10px] border border-border-subtle">
              <div className="min-w-0">
                Bank: <strong className="text-ink">KCB Bank Kenya (Upper Hill)</strong>
              </div>
              <div className="min-w-0">
                Account:{' '}
                <strong className="text-ink tabular-nums">1294820194</strong>
              </div>
              <div className="min-w-0">
                SWIFT: <strong className="text-ink">KCBLKENX</strong>
              </div>
              <div className="min-w-0 overflow-anywhere">
                Reference: <strong className="text-ink">KILELE-EFT-2026</strong>
              </div>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              PesaLink transfers settle within minutes; standard SWIFT/EFT
              clears in 1 business day. Completing this step records your
              proforma invoice and queues provisioning.
            </p>
          </div>
        )}

        {/* REQUIRED TERMS CHECKBOX */}
        <div className="pt-2 border-t border-divider">
          <label className="flex items-start gap-3 min-h-[44px] p-3.5 rounded-[14px] bg-surface-warm border border-border-subtle cursor-pointer select-none">
            <input
              id="step3-terms-checkbox"
              type="checkbox"
              disabled={isProcessing}
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
            />
            <span className="text-xs sm:text-[13px] text-ink leading-relaxed font-medium min-w-0">
              I agree to the Terms of Service and understand my services renew
              automatically at the prices shown above. I can turn off auto-renew
              anytime.
            </span>
          </label>
        </div>
      </section>

      {/* Desktop Navigation & Accent Pay CTA */}
      {!isMobileLayout && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={goToPreviousStep}
            className="kh-btn kh-btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Account</span>
          </button>

          <div
            className="relative"
            onMouseEnter={() => {
              if (!termsAccepted) setDisabledTooltipOpen(true);
            }}
            onMouseLeave={() => setDisabledTooltipOpen(false)}
            onFocus={() => {
              if (!termsAccepted) setDisabledTooltipOpen(true);
            }}
            onBlur={() => setDisabledTooltipOpen(false)}
          >
            <button
              type="button"
              disabled={!termsAccepted || isProcessing}
              onClick={handlePayAndComplete}
              aria-describedby={
                !termsAccepted ? 'step3-complete-disabled-tip' : undefined
              }
              title={
                !termsAccepted
                  ? 'Agree to the Terms of Service above to continue'
                  : undefined
              }
              className="kh-btn kh-btn-accent"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing payment…</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay {formattedTotalDue} and complete order</span>
                </>
              )}
            </button>

            {disabledTooltipOpen && !termsAccepted && (
              <div
                id="step3-complete-disabled-tip"
                role="tooltip"
                className="absolute right-0 bottom-full mb-2 w-64 p-3 rounded-[12px] bg-ink-deep text-surface text-xs leading-relaxed shadow-raised z-30 pointer-events-none"
              >
                Check the Terms of Service agreement above to enable payment.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewBlockSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading order review"
      className="kh-card p-5 space-y-4 animate-pulse"
    >
      <div className="flex items-center justify-between pb-3 border-b border-divider">
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-divider rounded" />
          <div className="h-5 w-40 bg-divider rounded" />
        </div>
        <div className="h-9 w-24 bg-canvas rounded-full" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-48 bg-divider rounded" />
            <div className="h-3 w-64 bg-canvas rounded" />
          </div>
          <div className="h-4 w-20 bg-divider rounded" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          <div className="h-14 bg-canvas rounded-[12px]" />
          <div className="h-14 bg-canvas rounded-[12px]" />
        </div>
      </div>
    </section>
  );
}
