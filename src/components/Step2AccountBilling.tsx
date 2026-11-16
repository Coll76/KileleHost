import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  MailCheck,
  UserCheck,
} from 'lucide-react';
import {
  AddressSuggestion,
  evaluatePasswordStrength,
  PHONE_COUNTRY_CODES,
  validateEmailValue,
  validatePhoneValue,
} from '../config/billingConfig';
import { COUNTRY_TAX_RULES } from '../config/pricingConfig';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { SearchableCountrySelect } from './SearchableCountrySelect';

type FieldKey =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'password'
  | 'loginEmail'
  | 'loginPassword'
  | 'address'
  | 'city'
  | 'postalCode';

interface ValidationErrorItem {
  field: FieldKey;
  elementId: string;
  label: string;
  message: string;
}

function GoogleGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 shrink-0 text-ink"
      fill="currentColor"
    >
      <path d="M21.8 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.4 3.05-7.48Z" />
      <path d="M12 22c2.76 0 5.07-.91 6.76-2.47l-3.3-2.56c-.91.61-2.08.98-3.46.98-2.66 0-4.92-1.8-5.73-4.22H2.86v2.64A10 10 0 0 0 12 22Z" />
      <path d="M6.27 13.73a6.01 6.01 0 0 1 0-3.46V7.63H2.86a10 10 0 0 0 0 8.74l3.41-2.64Z" />
      <path d="M12 6.05c1.5 0 2.85.52 3.91 1.53l2.93-2.93C17.06 2.99 14.75 2 12 2A10 10 0 0 0 2.86 7.63l3.41 2.64C7.08 7.85 9.34 6.05 12 6.05Z" />
    </svg>
  );
}

function GitHubGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 shrink-0 text-ink"
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.64-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.59.69.49A10.27 10.27 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
    </svg>
  );
}

const PREFILL_DEFAULTS = {
  fullName: 'Amina Otieno',
  phoneCountryCode: '+254',
  phone: '712 345 678',
  country: 'Kenya',
  address: 'Argwings Kodhek Road, Kilimani',
  city: 'Nairobi',
  postalCode: '00100',
};

export function Step2AccountBilling() {
  const {
    state,
    updateCustomerInfo,
    goToNextStep,
    goToPreviousStep,
    registerStep2Submit,
  } = useCart();
  const { isMobileLayout } = useViewport();
  const { customerInfo } = state;

  // Local transient auth state (never stored in cart persistence)
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginFailures, setLoginFailures] = useState(0);

  // Forgot password inline panel
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState(customerInfo.email);
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  // OAuth & SSO state
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<
    'google' | 'github' | 'sso' | null
  >(null);
  const [ssoOpen, setSsoOpen] = useState(false);
  const [ssoWorkEmail, setSsoWorkEmail] = useState('');
  const [ssoError, setSsoError] = useState<string | null>(null);

  // Field touched & submit state
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  // Refs for focus + scroll to first invalid field
  const fullNameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const loginEmailRef = useRef<HTMLInputElement | null>(null);
  const loginPasswordRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLInputElement | null>(null);
  const cityRef = useRef<HTMLInputElement | null>(null);
  const postalCodeRef = useRef<HTMLInputElement | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  const activeTaxRule =
    COUNTRY_TAX_RULES[customerInfo.country] ?? COUNTRY_TAX_RULES.Kenya;

  const passwordReport = useMemo(
    () => evaluatePasswordStrength(newPassword),
    [newPassword]
  );

  const markTouched = useCallback((key: FieldKey) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const prefillSignedInBilling = useCallback(
    (
      provider: 'google' | 'github' | 'sso' | 'password',
      emailOverride?: string
    ) => {
      const targetEmail =
        emailOverride && emailOverride.trim().length > 0
          ? emailOverride.trim()
          : 'amina@example.com';

      updateCustomerInfo({
        accountMode: 'login',
        signedInUser: {
          name: 'Amina Otieno',
          email: targetEmail,
          provider,
        },
        fullName: customerInfo.fullName.trim() || PREFILL_DEFAULTS.fullName,
        email: targetEmail,
        phoneCountryCode:
          customerInfo.phoneCountryCode || PREFILL_DEFAULTS.phoneCountryCode,
        phone: customerInfo.phone.trim() || PREFILL_DEFAULTS.phone,
        country: customerInfo.country || PREFILL_DEFAULTS.country,
        address: customerInfo.address.trim() || PREFILL_DEFAULTS.address,
        city: customerInfo.city.trim() || PREFILL_DEFAULTS.city,
        postalCode:
          customerInfo.postalCode.trim() || PREFILL_DEFAULTS.postalCode,
      });

      setTouched((prev) => ({
        ...prev,
        fullName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
      }));
      setSubmitAttempted(false);
    },
    [
      customerInfo.address,
      customerInfo.city,
      customerInfo.country,
      customerInfo.fullName,
      customerInfo.phone,
      customerInfo.phoneCountryCode,
      customerInfo.postalCode,
      updateCustomerInfo,
    ]
  );

  const handleOAuthClick = (provider: 'google' | 'github') => {
    if (oauthLoadingProvider) return;
    setSsoOpen(false);
    setOauthLoadingProvider(provider);
    window.setTimeout(() => {
      setOauthLoadingProvider(null);
      prefillSignedInBilling(provider, 'amina@example.com');
    }, 1000);
  };

  const handleSsoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmailValue(ssoWorkEmail);
    if (err) {
      setSsoError('Enter your work email like amina@company.co.ke');
      return;
    }
    setSsoError(null);
    setOauthLoadingProvider('sso');
    window.setTimeout(() => {
      setOauthLoadingProvider(null);
      setSsoOpen(false);
      prefillSignedInBilling('sso', ssoWorkEmail.trim());
    }, 1000);
  };

  const handleSignOut = () => {
    updateCustomerInfo({
      signedInUser: null,
      accountMode: customerInfo.authTab === 'existing' ? 'login' : 'guest',
    });
    setLoginPassword('');
    setLoginError(null);
  };

  const handleExistingSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    markTouched('loginEmail');
    markTouched('loginPassword');

    const emailErr = validateEmailValue(customerInfo.email);
    if (emailErr || !loginPassword) {
      if (!emailErr && !loginPassword) {
        setLoginError('Enter your password to sign in');
      }
      return;
    }

    setLoginError(null);
    setLoginLoading(true);

    window.setTimeout(() => {
      setLoginLoading(false);
      if (loginPassword === 'Password123!') {
        setLoginFailures(0);
        setLoginError(null);
        prefillSignedInBilling('password', customerInfo.email.trim());
      } else {
        setLoginFailures((prev) => prev + 1);
        setLoginError('Email or password is incorrect');
      }
    }, 650);
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmailValue(resetEmail);
    if (err) {
      setResetEmailError(err);
      return;
    }
    setResetEmailError(null);
    setResetSentTo(resetEmail.trim());
  };

  // Pure field validation map
  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<FieldKey, string>> = {};
    const isSignedIn = Boolean(customerInfo.signedInUser);
    const isNewCustomerForm = !isSignedIn && customerInfo.authTab === 'new';
    const isExistingForm = !isSignedIn && customerInfo.authTab === 'existing';

    if (isExistingForm) {
      const emailErr = validateEmailValue(customerInfo.email);
      if (emailErr) {
        errors.loginEmail = emailErr;
      }
      if (loginError) {
        errors.loginPassword = loginError;
      } else {
        errors.loginPassword =
          'Sign in to your account above or switch to New customer';
      }
    }

    if (isNewCustomerForm || isSignedIn) {
      if (customerInfo.fullName.trim().length < 2) {
        errors.fullName = 'Enter your full name';
      }
      const emailErr = validateEmailValue(customerInfo.email);
      if (emailErr) {
        errors.email = emailErr;
      }
      const phoneErr = validatePhoneValue(customerInfo.phone);
      if (phoneErr) {
        errors.phone = phoneErr;
      }
    }

    if (isNewCustomerForm && customerInfo.createAccount) {
      if (!passwordReport.allPassed) {
        errors.password =
          'Use 8+ characters with uppercase, lowercase, a number, and a symbol';
      }
    }

    if (customerInfo.address.trim().length < 4) {
      errors.address = 'Enter your street address or building';
    }
    if (customerInfo.city.trim().length < 2) {
      errors.city = 'Enter your city or town';
    }
    if (customerInfo.postalCode.trim().length < 2) {
      errors.postalCode = 'Enter your postal or ZIP code';
    }

    return errors;
  }, [
    customerInfo.address,
    customerInfo.authTab,
    customerInfo.city,
    customerInfo.createAccount,
    customerInfo.email,
    customerInfo.fullName,
    customerInfo.phone,
    customerInfo.postalCode,
    customerInfo.signedInUser,
    loginError,
    loginPassword,
    passwordReport.allPassed,
  ]);

  const orderedErrors = useMemo((): ValidationErrorItem[] => {
    const isSignedIn = Boolean(customerInfo.signedInUser);
    const orderedKeys: Array<{
      key: FieldKey;
      id: string;
      label: string;
    }> = [
      ...(!isSignedIn && customerInfo.authTab === 'existing'
        ? [
            {
              key: 'loginEmail' as FieldKey,
              id: 'step2-login-email',
              label: 'Account email',
            },
            {
              key: 'loginPassword' as FieldKey,
              id: 'step2-login-password',
              label: 'Sign in',
            },
          ]
        : [
            {
              key: 'fullName' as FieldKey,
              id: 'step2-fullname',
              label: 'Full name',
            },
            {
              key: 'email' as FieldKey,
              id: 'step2-email',
              label: 'Email address',
            },
            {
              key: 'phone' as FieldKey,
              id: 'step2-phone',
              label: 'Phone number',
            },
          ]),
      ...(!isSignedIn &&
      customerInfo.authTab === 'new' &&
      customerInfo.createAccount
        ? [
            {
              key: 'password' as FieldKey,
              id: 'step2-password',
              label: 'Password',
            },
          ]
        : []),
      {
        key: 'address' as FieldKey,
        id: 'step2-address',
        label: 'Street address',
      },
      {
        key: 'city' as FieldKey,
        id: 'step2-city',
        label: 'City',
      },
      {
        key: 'postalCode' as FieldKey,
        id: 'step2-postal',
        label: 'Postal code',
      },
    ];

    return orderedKeys
      .filter((item) => Boolean(fieldErrors[item.key]))
      .map((item) => ({
        field: item.key,
        elementId: item.id,
        label: item.label,
        message: fieldErrors[item.key]!,
      }));
  }, [
    customerInfo.authTab,
    customerInfo.createAccount,
    customerInfo.signedInUser,
    fieldErrors,
  ]);

  const focusFieldByKey = useCallback((key: FieldKey) => {
    const refMap: Record<FieldKey, React.RefObject<HTMLInputElement | null>> = {
      fullName: fullNameRef,
      email: emailRef,
      phone: phoneRef,
      password: passwordRef,
      loginEmail: loginEmailRef,
      loginPassword: loginPasswordRef,
      address: addressRef,
      city: cityRef,
      postalCode: postalCodeRef,
    };
    const el = refMap[key]?.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        el.focus();
      }, 120);
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (state.items.length === 0 || isContinuing) return;

    setSubmitAttempted(true);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      loginEmail: true,
      loginPassword: true,
      address: true,
      city: true,
      postalCode: true,
    });

    if (orderedErrors.length > 0) {
      const first = orderedErrors[0];
      focusFieldByKey(first.field);
      return;
    }

    setIsContinuing(true);
    window.setTimeout(() => {
      setIsContinuing(false);
      goToNextStep();
    }, 450);
  }, [
    focusFieldByKey,
    goToNextStep,
    isContinuing,
    orderedErrors,
    state.items.length,
  ]);

  useEffect(() => {
    registerStep2Submit(handleContinue);
    return () => registerStep2Submit(null);
  }, [handleContinue, registerStep2Submit]);

  const getFieldStatus = (key: FieldKey) => {
    const isTouched = Boolean(touched[key]);
    const error = isTouched ? fieldErrors[key] : undefined;
    const isValid = isTouched && !fieldErrors[key];
    return { error, isValid };
  };

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    updateCustomerInfo({
      address: suggestion.street,
      city: suggestion.city,
      postalCode: suggestion.postalCode,
      country: suggestion.country,
    });
    setTouched((prev) => ({
      ...prev,
      address: true,
      city: true,
      postalCode: true,
    }));
  };

  const fullNameStatus = getFieldStatus('fullName');
  const emailStatus = getFieldStatus('email');
  const phoneStatus = getFieldStatus('phone');
  const passwordStatus = getFieldStatus('password');
  const loginEmailStatus = getFieldStatus('loginEmail');
  const loginPasswordStatus = getFieldStatus('loginPassword');
  const addressStatus = getFieldStatus('address');
  const cityStatus = getFieldStatus('city');
  const postalStatus = getFieldStatus('postalCode');

  const isSignedIn = Boolean(customerInfo.signedInUser);

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      <div>
        {isMobileLayout && (
          <button
            type="button"
            onClick={goToPreviousStep}
            className="inline-flex items-center gap-1 min-h-[44px] -ml-1.5 pr-3 mb-1 text-sm font-semibold text-primary hover:text-primary-hover kh-focus rounded-lg cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span>Back</span>
          </button>
        )}

        <p className="eyebrow-label">Step 2 · Account &amp; Billing</p>
        <h1
          className={`font-display font-bold text-ink mt-1 tracking-tight ${
            isMobileLayout
              ? 'text-[26px] leading-tight'
              : 'text-[32px] leading-tight'
          }`}
        >
          Account &amp; billing details
        </h1>
        <p className="text-[15px] text-secondary mt-1.5">
          Check out quickly as a new customer or sign in to link services to
          your Kilele Host console.
        </p>
      </div>

      {/* Top Error Summary Banner (shown on submit attempt when invalid) */}
      {submitAttempted && orderedErrors.length > 0 && (
        <div
          ref={errorSummaryRef}
          role="alert"
          aria-live="assertive"
          className="rounded-[18px] border border-error/40 bg-error-tint p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-error">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Please fix {orderedErrors.length}{' '}
              {orderedErrors.length === 1 ? 'issue' : 'issues'} before
              continuing:
            </span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc">
            {orderedErrors.map((err) => (
              <li key={err.field} className="text-xs text-ink">
                <button
                  type="button"
                  onClick={() => focusFieldByKey(err.field)}
                  className="text-left font-semibold underline decoration-error/60 hover:text-error cursor-pointer kh-focus rounded py-0.5"
                >
                  {err.label}: {err.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* INLINE AUTH SECTION */}
      <section className="kh-card p-4 sm:p-5 space-y-5 min-w-0" aria-label="Account sign in">
        {isSignedIn && customerInfo.signedInUser ? (
          <div className="rounded-[14px] border border-success/40 bg-success-tint px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-surface text-success flex items-center justify-center shrink-0 border border-success/30">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink overflow-anywhere">
                  Signed in as {customerInfo.signedInUser.name}
                </p>
                <p className="text-xs text-secondary overflow-anywhere">
                  {customerInfo.signedInUser.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-semibold text-primary hover:text-primary-hover underline underline-offset-2 min-h-[44px] px-2.5 kh-focus rounded cursor-pointer shrink-0"
            >
              Not you?
            </button>
          </div>
        ) : (
          <>
            {/* Two-tab switch */}
            <div
              role="tablist"
              aria-label="Customer type"
              className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1.5 rounded-[18px] sm:rounded-full bg-canvas border border-border-subtle"
            >
              <button
                type="button"
                role="tab"
                aria-selected={customerInfo.authTab === 'new'}
                onClick={() => {
                  updateCustomerInfo({ authTab: 'new', accountMode: 'guest' });
                  setSubmitAttempted(false);
                }}
                className={`inline-flex items-center justify-center min-w-0 min-h-[44px] px-2.5 sm:px-3 py-2 rounded-[14px] sm:rounded-full text-[13px] sm:text-sm font-semibold text-center leading-tight transition-all kh-focus cursor-pointer ${
                  customerInfo.authTab === 'new'
                    ? 'bg-primary text-surface shadow-card'
                    : 'text-secondary hover:text-ink'
                }`}
              >
                New customer
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={customerInfo.authTab === 'existing'}
                onClick={() => {
                  updateCustomerInfo({
                    authTab: 'existing',
                    accountMode: 'login',
                  });
                  setSubmitAttempted(false);
                }}
                className={`inline-flex items-center justify-center min-w-0 min-h-[44px] px-2.5 sm:px-3 py-2 rounded-[14px] sm:rounded-full text-[13px] sm:text-sm font-semibold text-center leading-tight transition-all kh-focus cursor-pointer ${
                  customerInfo.authTab === 'existing'
                    ? 'bg-primary text-surface shadow-card'
                    : 'text-secondary hover:text-ink'
                }`}
              >
                I already have an account
              </button>
            </div>

            {/* OAuth row (shown on both tabs) */}
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={Boolean(oauthLoadingProvider)}
                onClick={() => handleOAuthClick('google')}
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border-strong bg-surface hover:bg-canvas text-sm font-semibold text-ink inline-flex items-center justify-center gap-2.5 transition-colors kh-focus cursor-pointer disabled:opacity-60 kh-touch-surface"
              >
                {oauthLoadingProvider === 'google' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Connecting with Google…</span>
                  </>
                ) : (
                  <>
                    <GoogleGlyph />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={Boolean(oauthLoadingProvider)}
                onClick={() => handleOAuthClick('github')}
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border-strong bg-surface hover:bg-canvas text-sm font-semibold text-ink inline-flex items-center justify-center gap-2.5 transition-colors kh-focus cursor-pointer disabled:opacity-60 kh-touch-surface"
              >
                {oauthLoadingProvider === 'github' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Connecting with GitHub…</span>
                  </>
                ) : (
                  <>
                    <GitHubGlyph />
                    <span>Continue with GitHub</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={Boolean(oauthLoadingProvider)}
                aria-expanded={ssoOpen}
                onClick={() => {
                  setSsoOpen((prev) => !prev);
                  setSsoError(null);
                }}
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border-strong bg-surface hover:bg-canvas text-sm font-semibold text-ink inline-flex items-center justify-center gap-2.5 transition-colors kh-focus cursor-pointer disabled:opacity-60 kh-touch-surface"
              >
                <KeyRound className="w-4 h-4 text-primary shrink-0" />
                <span>Sign in with SSO</span>
              </button>

              {ssoOpen && (
                <form
                  onSubmit={handleSsoSubmit}
                  className="p-3.5 rounded-[14px] bg-surface-tint border border-primary/20 space-y-2.5"
                >
                  <label
                    htmlFor="step2-sso-email"
                    className="block text-xs font-semibold text-ink"
                  >
                    Enter your company work email
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      id="step2-sso-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={ssoWorkEmail}
                      onChange={(e) => {
                        setSsoWorkEmail(e.target.value);
                        if (ssoError) setSsoError(null);
                      }}
                      placeholder="amina@company.co.ke"
                      aria-invalid={Boolean(ssoError)}
                      className={`kh-input flex-1 min-w-0 ${
                        ssoError ? 'border-error!' : ''
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={oauthLoadingProvider === 'sso'}
                      className="kh-btn kh-btn-primary min-h-[48px]! py-2.5! px-5! text-sm shrink-0 w-full sm:w-auto"
                    >
                      {oauthLoadingProvider === 'sso' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Redirecting…</span>
                        </>
                      ) : (
                        <span>Continue</span>
                      )}
                    </button>
                  </div>
                  {ssoError && (
                    <p className="text-xs font-medium text-error">{ssoError}</p>
                  )}
                </form>
              )}
            </div>

            {/* "or" divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-divider" />
              <span className="px-3 bg-surface text-xs font-semibold uppercase tracking-wider text-muted">
                or
              </span>
            </div>

            {/* NEW CUSTOMER FORM */}
            {customerInfo.authTab === 'new' ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  {/* Full name */}
                  <div className="min-w-0">
                    <label
                      htmlFor="step2-fullname"
                      className="block text-sm font-semibold text-ink mb-1.5"
                    >
                      Full name
                    </label>
                    <div className="relative">
                      <input
                        ref={fullNameRef}
                        id="step2-fullname"
                        type="text"
                        autoComplete="name"
                        value={customerInfo.fullName}
                        onChange={(e) =>
                          updateCustomerInfo({ fullName: e.target.value })
                        }
                        onBlur={() => markTouched('fullName')}
                        aria-invalid={Boolean(fullNameStatus.error)}
                        aria-describedby={
                          fullNameStatus.error
                            ? 'step2-fullname-error'
                            : undefined
                        }
                        placeholder="Amina Otieno"
                        className={`kh-input pr-10! ${
                          fullNameStatus.error
                            ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                            : fullNameStatus.isValid
                            ? 'border-success/60!'
                            : ''
                        }`}
                      />
                      {fullNameStatus.isValid && (
                        <CheckCircle2
                          aria-hidden="true"
                          className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                      )}
                    </div>
                    {fullNameStatus.error && (
                      <p
                        id="step2-fullname-error"
                        className="text-xs font-medium text-error mt-1"
                      >
                        {fullNameStatus.error}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="min-w-0">
                    <label
                      htmlFor="step2-email"
                      className="block text-sm font-semibold text-ink mb-1.5"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <input
                        ref={emailRef}
                        id="step2-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          updateCustomerInfo({ email: e.target.value })
                        }
                        onBlur={() => markTouched('email')}
                        aria-invalid={Boolean(emailStatus.error)}
                        aria-describedby={
                          emailStatus.error ? 'step2-email-error' : undefined
                        }
                        placeholder="amina@example.com"
                        className={`kh-input pr-10! ${
                          emailStatus.error
                            ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                            : emailStatus.isValid
                            ? 'border-success/60!'
                            : ''
                        }`}
                      />
                      {emailStatus.isValid && (
                        <CheckCircle2
                          aria-hidden="true"
                          className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                      )}
                    </div>
                    {emailStatus.error && (
                      <p
                        id="step2-email-error"
                        className="text-xs font-medium text-error mt-1"
                      >
                        {emailStatus.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone with country code selector */}
                <div className="min-w-0">
                  <label
                    htmlFor="step2-phone"
                    className="block text-sm font-semibold text-ink mb-1.5"
                  >
                    Phone number (M-Pesa &amp; account recovery)
                  </label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Phone country code"
                      value={customerInfo.phoneCountryCode}
                      onChange={(e) =>
                        updateCustomerInfo({ phoneCountryCode: e.target.value })
                      }
                      className="kh-input w-[112px]! sm:w-[132px]! shrink-0 text-[16px]! px-2.5! font-medium"
                    >
                      {PHONE_COUNTRY_CODES.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.flag} {item.label}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1 min-w-0">
                      <input
                        ref={phoneRef}
                        id="step2-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          updateCustomerInfo({ phone: e.target.value })
                        }
                        onBlur={() => markTouched('phone')}
                        aria-invalid={Boolean(phoneStatus.error)}
                        aria-describedby={
                          phoneStatus.error ? 'step2-phone-error' : undefined
                        }
                        placeholder="712 345 678"
                        className={`kh-input pr-10! ${
                          phoneStatus.error
                            ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                            : phoneStatus.isValid
                            ? 'border-success/60!'
                            : ''
                        }`}
                      />
                      {phoneStatus.isValid && (
                        <CheckCircle2
                          aria-hidden="true"
                          className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                      )}
                    </div>
                  </div>
                  {phoneStatus.error && (
                    <p
                      id="step2-phone-error"
                      className="text-xs font-medium text-error mt-1"
                    >
                      {phoneStatus.error}
                    </p>
                  )}
                </div>

                {/* Create account checkbox */}
                <label className="flex items-start gap-3 min-h-[44px] p-3 rounded-[12px] bg-canvas border border-border-subtle cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={customerInfo.createAccount}
                    onChange={(e) =>
                      updateCustomerInfo({ createAccount: e.target.checked })
                    }
                    className="mt-0.5 w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-ink block">
                      Create an account so I can manage my services
                    </span>
                    <span className="text-xs text-secondary">
                      {customerInfo.createAccount
                        ? 'Set a password below to access your hosting dashboard right after payment.'
                        : 'Guest checkout selected — you will receive login links by email after payment.'}
                    </span>
                  </div>
                </label>

                {/* Password field + strength meter */}
                {customerInfo.createAccount && (
                  <div className="space-y-2.5">
                    <div>
                      <label
                        htmlFor="step2-password"
                        className="block text-sm font-semibold text-ink mb-1.5"
                      >
                        Create password
                      </label>
                      <div className="relative">
                        <input
                          ref={passwordRef}
                          id="step2-password"
                          type={showNewPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onBlur={() => markTouched('password')}
                          aria-invalid={Boolean(passwordStatus.error)}
                          aria-describedby="step2-password-strength step2-password-error"
                          placeholder="Create a strong password"
                          className={`kh-input pr-20! ${
                            passwordStatus.error
                              ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                              : passwordStatus.isValid
                              ? 'border-success/60!'
                              : ''
                          }`}
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                          {passwordStatus.isValid && (
                            <CheckCircle2
                              aria-hidden="true"
                              className="w-4 h-4 text-success pointer-events-none"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((v) => !v)}
                            aria-label={
                              showNewPassword
                                ? 'Hide password'
                                : 'Show password'
                            }
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-secondary hover:text-ink kh-focus cursor-pointer"
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      {passwordStatus.error && (
                        <p
                          id="step2-password-error"
                          className="text-xs font-medium text-error mt-1"
                        >
                          {passwordStatus.error}
                        </p>
                      )}
                    </div>

                    {/* 4-segment strength meter + live checklist */}
                    <div
                      id="step2-password-strength"
                      className="p-3.5 rounded-[14px] bg-canvas border border-border-subtle space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-secondary">
                          Password strength
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            passwordReport.score <= 1
                              ? 'text-error'
                              : passwordReport.score === 2
                              ? 'text-warning-ink'
                              : passwordReport.score === 3
                              ? 'text-primary'
                              : 'text-success'
                          }`}
                        >
                          {passwordReport.label}
                        </span>
                      </div>

                      <div
                        className="grid grid-cols-4 gap-1.5"
                        aria-hidden="true"
                      >
                        {[1, 2, 3, 4].map((segment) => {
                          const active = passwordReport.score >= segment;
                          const colorClass = !active
                            ? 'bg-divider'
                            : passwordReport.score <= 1
                            ? 'bg-error'
                            : passwordReport.score === 2
                            ? 'bg-warning'
                            : passwordReport.score === 3
                            ? 'bg-primary'
                            : 'bg-success';
                          return (
                            <span
                              key={segment}
                              className={`h-1.5 rounded-full transition-colors ${colorClass}`}
                            />
                          );
                        })}
                      </div>

                      <ul className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        {[
                          {
                            ok: passwordReport.checks.minLength,
                            text: '8+ characters',
                          },
                          {
                            ok: passwordReport.checks.upperAndLower,
                            text: 'Upper & lowercase',
                          },
                          {
                            ok: passwordReport.checks.hasNumber,
                            text: 'At least 1 number',
                          },
                          {
                            ok: passwordReport.checks.hasSymbol,
                            text: 'At least 1 symbol',
                          },
                        ].map((item) => (
                          <li
                            key={item.text}
                            className={`flex items-center gap-1.5 ${
                              item.ok
                                ? 'text-success font-semibold'
                                : 'text-secondary'
                            }`}
                          >
                            <Check
                              aria-hidden="true"
                              className={`w-3.5 h-3.5 shrink-0 ${
                                item.ok ? 'text-success' : 'text-muted/50'
                              }`}
                            />
                            <span>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* EXISTING CUSTOMER FORM */
              <div className="space-y-4">
                <form onSubmit={handleExistingSignIn} className="space-y-3 sm:space-y-4">
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label
                        htmlFor="step2-login-email"
                        className="block text-sm font-semibold text-ink mb-1.5"
                      >
                        Account email
                      </label>
                      <div className="relative">
                        <input
                          ref={loginEmailRef}
                          id="step2-login-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={customerInfo.email}
                          onChange={(e) => {
                            updateCustomerInfo({ email: e.target.value });
                            if (loginError) setLoginError(null);
                          }}
                          onBlur={() => markTouched('loginEmail')}
                          aria-invalid={Boolean(loginEmailStatus.error)}
                          aria-describedby={
                            loginEmailStatus.error
                              ? 'step2-login-email-error'
                              : undefined
                          }
                          placeholder="amina@example.com"
                          className={`kh-input pr-10! ${
                            loginEmailStatus.error
                              ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                              : loginEmailStatus.isValid
                              ? 'border-success/60!'
                              : ''
                          }`}
                        />
                        {loginEmailStatus.isValid && (
                          <CheckCircle2
                            aria-hidden="true"
                            className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          />
                        )}
                      </div>
                      {loginEmailStatus.error && (
                        <p
                          id="step2-login-email-error"
                          className="text-xs font-medium text-error mt-1"
                        >
                          {loginEmailStatus.error}
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label
                          htmlFor="step2-login-password"
                          className="block text-sm font-semibold text-ink"
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotOpen((v) => !v);
                            setResetEmail(customerInfo.email);
                            setResetEmailError(null);
                            setResetSentTo(null);
                          }}
                          className="min-h-[44px] -my-3 px-1 text-xs font-semibold text-primary hover:text-primary-hover underline underline-offset-2 kh-focus rounded cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          ref={loginPasswordRef}
                          id="step2-login-password"
                          type={showLoginPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            if (loginError) setLoginError(null);
                          }}
                          onBlur={() => markTouched('loginPassword')}
                          aria-invalid={Boolean(
                            loginError || loginPasswordStatus.error
                          )}
                          aria-describedby="step2-login-password-error"
                          placeholder="Enter your password"
                          className={`kh-input pr-12! ${
                            loginError || loginPasswordStatus.error
                              ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                              : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((v) => !v)}
                          aria-label={
                            showLoginPassword
                              ? 'Hide password'
                              : 'Show password'
                          }
                          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-secondary hover:text-ink absolute right-1 top-1/2 -translate-y-1/2 kh-focus cursor-pointer"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {(loginError || loginPasswordStatus.error) && (
                        <p
                          id="step2-login-password-error"
                          className="text-xs font-medium text-error mt-1"
                        >
                          {loginError ?? loginPasswordStatus.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {loginFailures >= 3 && (
                    <div className="p-3 rounded-[12px] bg-surface-warm border border-warning/40 text-xs text-ink">
                      Having trouble signing in? Use{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setForgotOpen(true);
                          setResetEmail(customerInfo.email);
                        }}
                        className="font-bold text-primary underline cursor-pointer"
                      >
                        Forgot password?
                      </button>{' '}
                      to get a quick reset link, or switch to New customer to
                      continue with guest checkout.
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="kh-btn kh-btn-primary min-h-[48px]! py-2.5! px-6! text-sm w-full sm:w-auto"
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing in…</span>
                        </>
                      ) : (
                        <span>Sign in</span>
                      )}
                    </button>
                    <span className="text-xs text-muted">
                      Demo password: <strong className="text-ink">Password123!</strong>
                    </span>
                  </div>
                </form>

                {/* Inline Forgot Password mini-form */}
                {forgotOpen && (
                  <form
                    onSubmit={handleSendResetLink}
                    className="p-4 rounded-[14px] bg-surface-tint border border-primary/20 space-y-2.5"
                  >
                    <p className="text-sm font-semibold text-ink">
                      We&apos;ll email you a reset link
                    </p>

                    {resetSentTo ? (
                      <div className="flex items-start gap-2 text-xs font-medium text-success bg-success-tint border border-success/30 rounded-[10px] p-3">
                        <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="min-w-0 overflow-anywhere">
                          Reset link sent to <strong>{resetSentTo}</strong>.
                          Check your inbox or continue as a new customer.
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <input
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={resetEmail}
                            onChange={(e) => {
                              setResetEmail(e.target.value);
                              if (resetEmailError) setResetEmailError(null);
                            }}
                            aria-label="Account email for password reset"
                            placeholder="amina@example.com"
                            className={`kh-input flex-1 min-w-0 ${
                              resetEmailError ? 'border-error!' : ''
                            }`}
                          />
                          <button
                            type="submit"
                            className="kh-btn kh-btn-primary min-h-[48px]! py-2.5! px-5! text-sm shrink-0 w-full sm:w-auto"
                          >
                            Send reset link
                          </button>
                        </div>
                        {resetEmailError && (
                          <p className="text-xs font-medium text-error">
                            {resetEmailError}
                          </p>
                        )}
                      </>
                    )}
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* BILLING DETAILS SECTION */}
      <section className="kh-card p-4 sm:p-5 space-y-5 min-w-0" aria-label="Billing details">
        <div>
          <h2 className="font-display font-bold text-lg text-ink">
            Billing details
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Used for tax calculation and official invoices.
          </p>
        </div>

        {/* Contact summary inputs when signed in so prefilled details remain visible & editable */}
        {isSignedIn && (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 pb-4 border-b border-divider">
            <div className="min-w-0">
              <label
                htmlFor="step2-fullname"
                className="block text-sm font-semibold text-ink mb-1.5"
              >
                Full name
              </label>
              <div className="relative">
                <input
                  ref={fullNameRef}
                  id="step2-fullname"
                  type="text"
                  autoComplete="name"
                  value={customerInfo.fullName}
                  onChange={(e) =>
                    updateCustomerInfo({ fullName: e.target.value })
                  }
                  onBlur={() => markTouched('fullName')}
                  aria-invalid={Boolean(fullNameStatus.error)}
                  aria-describedby={
                    fullNameStatus.error ? 'step2-fullname-error' : undefined
                  }
                  className={`kh-input pr-10! ${
                    fullNameStatus.error
                      ? 'border-error!'
                      : fullNameStatus.isValid
                      ? 'border-success/60!'
                      : ''
                  }`}
                />
                {fullNameStatus.isValid && (
                  <CheckCircle2
                    aria-hidden="true"
                    className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                )}
              </div>
              {fullNameStatus.error && (
                <p
                  id="step2-fullname-error"
                  className="text-xs font-medium text-error mt-1"
                >
                  {fullNameStatus.error}
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label
                htmlFor="step2-email"
                className="block text-sm font-semibold text-ink mb-1.5"
              >
                Billing email
              </label>
              <div className="relative">
                <input
                  ref={emailRef}
                  id="step2-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={customerInfo.email}
                  onChange={(e) =>
                    updateCustomerInfo({ email: e.target.value })
                  }
                  onBlur={() => markTouched('email')}
                  aria-invalid={Boolean(emailStatus.error)}
                  aria-describedby={
                    emailStatus.error ? 'step2-email-error' : undefined
                  }
                  className={`kh-input pr-10! ${
                    emailStatus.error
                      ? 'border-error!'
                      : emailStatus.isValid
                      ? 'border-success/60!'
                      : ''
                  }`}
                />
                {emailStatus.isValid && (
                  <CheckCircle2
                    aria-hidden="true"
                    className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                )}
              </div>
              {emailStatus.error && (
                <p
                  id="step2-email-error"
                  className="text-xs font-medium text-error mt-1"
                >
                  {emailStatus.error}
                </p>
              )}
            </div>

            <div className="sm:col-span-2 min-w-0">
              <label
                htmlFor="step2-phone"
                className="block text-sm font-semibold text-ink mb-1.5"
              >
                Phone number
              </label>
              <div className="flex gap-2">
                <select
                  aria-label="Phone country code"
                  value={customerInfo.phoneCountryCode}
                  onChange={(e) =>
                    updateCustomerInfo({ phoneCountryCode: e.target.value })
                  }
                  className="kh-input w-[112px]! sm:w-[132px]! shrink-0 text-[16px]! px-2.5! font-medium"
                >
                  {PHONE_COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.flag} {item.label}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1 min-w-0">
                  <input
                    ref={phoneRef}
                    id="step2-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      updateCustomerInfo({ phone: e.target.value })
                    }
                    onBlur={() => markTouched('phone')}
                    aria-invalid={Boolean(phoneStatus.error)}
                    aria-describedby={
                      phoneStatus.error ? 'step2-phone-error' : undefined
                    }
                    className={`kh-input pr-10! ${
                      phoneStatus.error
                        ? 'border-error!'
                        : phoneStatus.isValid
                        ? 'border-success/60!'
                        : ''
                    }`}
                  />
                  {phoneStatus.isValid && (
                    <CheckCircle2
                      aria-hidden="true"
                      className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                  )}
                </div>
              </div>
              {phoneStatus.error && (
                <p
                  id="step2-phone-error"
                  className="text-xs font-medium text-error mt-1"
                >
                  {phoneStatus.error}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {/* Country (searchable select) */}
          <div className="sm:col-span-2 min-w-0">
            <label
              htmlFor="step2-country"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              Country / region
            </label>
            <SearchableCountrySelect
              id="step2-country"
              value={customerInfo.country}
              ariaDescribedBy="step2-country-tax"
              onChange={(country) => updateCustomerInfo({ country })}
            />
            <p id="step2-country-tax" className="text-xs text-muted mt-1">
              {activeTaxRule.label}
              {activeTaxRule.note ? ` · ${activeTaxRule.note}` : ''} — updates
              order summary live.
            </p>
          </div>

          {/* Address with autocomplete */}
          <div className="sm:col-span-2 min-w-0">
            <label
              htmlFor="step2-address"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              Street address
            </label>
            <AddressAutocompleteInput
              id="step2-address"
              inputRef={addressRef}
              value={customerInfo.address}
              country={customerInfo.country}
              hasError={Boolean(addressStatus.error)}
              isValid={addressStatus.isValid}
              ariaDescribedBy={
                addressStatus.error ? 'step2-address-error' : undefined
              }
              onChange={(val) => updateCustomerInfo({ address: val })}
              onBlur={() => markTouched('address')}
              onSelectSuggestion={handleSelectAddressSuggestion}
            />
            {addressStatus.error && (
              <p
                id="step2-address-error"
                className="text-xs font-medium text-error mt-1"
              >
                {addressStatus.error}
              </p>
            )}
          </div>

          {/* City */}
          <div className="min-w-0">
            <label
              htmlFor="step2-city"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              City / town
            </label>
            <div className="relative">
              <input
                ref={cityRef}
                id="step2-city"
                type="text"
                autoComplete="address-level2"
                value={customerInfo.city}
                onChange={(e) => updateCustomerInfo({ city: e.target.value })}
                onBlur={() => markTouched('city')}
                aria-invalid={Boolean(cityStatus.error)}
                aria-describedby={
                  cityStatus.error ? 'step2-city-error' : undefined
                }
                placeholder="Nairobi"
                className={`kh-input pr-10! ${
                  cityStatus.error
                    ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                    : cityStatus.isValid
                    ? 'border-success/60!'
                    : ''
                }`}
              />
              {cityStatus.isValid && (
                <CheckCircle2
                  aria-hidden="true"
                  className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
              )}
            </div>
            {cityStatus.error && (
              <p
                id="step2-city-error"
                className="text-xs font-medium text-error mt-1"
              >
                {cityStatus.error}
              </p>
            )}
          </div>

          {/* Postal code */}
          <div className="min-w-0">
            <label
              htmlFor="step2-postal"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              Postal / ZIP code
            </label>
            <div className="relative">
              <input
                ref={postalCodeRef}
                id="step2-postal"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                value={customerInfo.postalCode}
                onChange={(e) =>
                  updateCustomerInfo({ postalCode: e.target.value })
                }
                onBlur={() => markTouched('postalCode')}
                aria-invalid={Boolean(postalStatus.error)}
                aria-describedby={
                  postalStatus.error ? 'step2-postal-error' : undefined
                }
                placeholder="00100"
                className={`kh-input pr-10! ${
                  postalStatus.error
                    ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
                    : postalStatus.isValid
                    ? 'border-success/60!'
                    : ''
                }`}
              />
              {postalStatus.isValid && (
                <CheckCircle2
                  aria-hidden="true"
                  className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
              )}
            </div>
            {postalStatus.error && (
              <p
                id="step2-postal-error"
                className="text-xs font-medium text-error mt-1"
              >
                {postalStatus.error}
              </p>
            )}
          </div>
        </div>

        {/* Business purchase checkbox + optional fields */}
        <div className="pt-2 border-t border-divider space-y-4">
          <label className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={customerInfo.isBusinessPurchase}
              onChange={(e) =>
                updateCustomerInfo({ isBusinessPurchase: e.target.checked })
              }
              className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
            />
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span>This is a business purchase</span>
            </span>
          </label>

          {customerInfo.isBusinessPurchase && (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 p-4 rounded-[14px] bg-canvas border border-border-subtle">
              <div className="min-w-0">
                <label
                  htmlFor="step2-company"
                  className="block text-sm font-semibold text-ink mb-1.5"
                >
                  Company name{' '}
                  <span className="text-xs font-normal text-muted">
                    (optional)
                  </span>
                </label>
                <input
                  id="step2-company"
                  type="text"
                  autoComplete="organization"
                  value={customerInfo.companyName}
                  onChange={(e) =>
                    updateCustomerInfo({ companyName: e.target.value })
                  }
                  placeholder="Biashara Digital Ltd"
                  className="kh-input"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="step2-taxid"
                  className="block text-sm font-semibold text-ink mb-1.5"
                >
                  KRA PIN / VAT number{' '}
                  <span className="text-xs font-normal text-muted">
                    (optional)
                  </span>
                </label>
                <input
                  id="step2-taxid"
                  type="text"
                  value={customerInfo.taxId}
                  onChange={(e) =>
                    updateCustomerInfo({ taxId: e.target.value })
                  }
                  placeholder="P051234567X"
                  className="kh-input"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-divider flex items-center gap-2 text-xs text-secondary">
          <Lock className="w-3.5 h-3.5 text-success shrink-0" />
          <span>
            Encrypted checkout. Changing your billing country updates VAT in the
            order summary immediately.
          </span>
        </div>
      </section>

      {/* Desktop navigation */}
      {!isMobileLayout && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="kh-btn kh-btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Configure</span>
          </button>

          <button
            type="button"
            disabled={state.items.length === 0 || isContinuing}
            onClick={handleContinue}
            className="kh-btn kh-btn-accent"
          >
            {isContinuing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving details…</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
