import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronUp, Loader2, Lock, X } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { formatCurrency } from '../utils/pricing';
import { OrderSummaryPanel } from './OrderSummaryPanel';

function isTextEditableElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type.toLowerCase();
    return !['checkbox', 'radio', 'range', 'button', 'submit', 'reset'].includes(
      type
    );
  }
  return false;
}

export function MobileSummaryBar() {
  const {
    state,
    summary,
    goToNextStep,
    triggerStep2Submit,
    triggerStep3Submit,
    step3CtaState,
    summaryDrawerOpen,
    setSummaryDrawerOpen,
  } = useCart();
  const { isMobileLayout } = useViewport();
  const [disabledTipOpen, setDisabledTipOpen] = useState(false);
  const [keyboardOrInputOpen, setKeyboardOrInputOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const baseViewportHeightRef = useRef<number>(
    typeof window !== 'undefined'
      ? window.visualViewport?.height ?? window.innerHeight
      : 812
  );

  // Hide fixed bottom bar when a form input is focused or virtual keyboard shrinks viewport
  useEffect(() => {
    if (!isMobileLayout) {
      setKeyboardOrInputOpen(false);
      return;
    }

    const onFocusIn = (e: FocusEvent) => {
      if (isTextEditableElement(e.target)) {
        setKeyboardOrInputOpen(true);
      }
    };

    const onFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        const vpHeight = window.visualViewport?.height ?? window.innerHeight;
        const shrunk = vpHeight < baseViewportHeightRef.current * 0.82;
        if (!isTextEditableElement(active) && !shrunk) {
          setKeyboardOrInputOpen(false);
        }
      }, 60);
    };

    const onViewportResize = () => {
      const vpHeight = window.visualViewport?.height ?? window.innerHeight;
      if (vpHeight > baseViewportHeightRef.current) {
        baseViewportHeightRef.current = vpHeight;
      }
      const shrunk = vpHeight < baseViewportHeightRef.current * 0.82;
      if (shrunk) {
        setKeyboardOrInputOpen(true);
      } else if (!isTextEditableElement(document.activeElement)) {
        setKeyboardOrInputOpen(false);
      }
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.visualViewport?.addEventListener('resize', onViewportResize);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.visualViewport?.removeEventListener('resize', onViewportResize);
    };
  }, [isMobileLayout]);

  // Focus trap + Esc close on bottom sheet drawer
  useEffect(() => {
    if (!summaryDrawerOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = window.setTimeout(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 30);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSummaryDrawerOpen(false);
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [setSummaryDrawerOpen, summaryDrawerOpen]);

  if (!isMobileLayout || state.completedOrderReceipt) {
    return null;
  }

  const hasItems = state.items.length > 0;
  const formattedTotal = formatCurrency(
    summary.totalDueTodayUSD,
    state.currency
  );

  const isStep3 = state.currentStep === 3;
  const isPrimaryDisabled = isStep3
    ? !hasItems || step3CtaState.disabled
    : !hasItems;
  const isPrimaryLoading = isStep3 && step3CtaState.loading;

  const ctaLabel =
    state.currentStep === 1
      ? 'Continue to account'
      : state.currentStep === 2
      ? 'Continue to payment'
      : `Pay ${formattedTotal}`;

  const handlePrimaryCta = () => {
    if (state.currentStep === 1) {
      goToNextStep();
    } else if (state.currentStep === 2) {
      triggerStep2Submit();
    } else if (state.currentStep === 3) {
      triggerStep3Submit();
    }
  };

  return (
    <>
      {/* Bottom Sheet Drawer */}
      <AnimatePresence>
        {summaryDrawerOpen && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Order summary drawer"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSummaryDrawerOpen(false)}
              className="absolute inset-0 bg-ink-deep/45 backdrop-blur-[1px]"
            />

            <motion.div
              ref={drawerRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 260 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.y > 85 || info.velocity.y > 350) {
                  setSummaryDrawerOpen(false);
                }
              }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface rounded-t-[22px] max-h-[85vh] flex flex-col shadow-summary border-t border-border-subtle pb-safe-bar"
            >
              <div className="pt-2.5 px-4 pb-3 border-b border-divider shrink-0">
                <div
                  aria-hidden="true"
                  className="w-10 h-1 rounded-full bg-border-input mx-auto mb-2"
                />
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-base text-ink">
                    Order Summary
                  </span>
                  <button
                    type="button"
                    onClick={() => setSummaryDrawerOpen(false)}
                    aria-label="Close order summary"
                    className="min-w-[44px] min-h-[44px] -mr-1 inline-flex items-center justify-center rounded-full bg-canvas text-ink kh-focus cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-4 py-4">
                <OrderSummaryPanel
                  inDrawer
                  onBrowsePlans={() => setSummaryDrawerOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Bar — hidden while text input focused / on-screen keyboard open */}
      {!keyboardOrInputOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border-subtle shadow-summary px-4 pt-2.5 pb-safe-bar min-h-[72px] w-full max-w-full">
          <div className="flex items-center justify-between gap-2.5 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-secondary truncate">
                {hasItems ? (
                  <>
                    Total today{' '}
                    <span className="font-display font-extrabold text-[15px] text-ink tabular-nums whitespace-nowrap">
                      {formattedTotal}
                    </span>
                  </>
                ) : (
                  <span className="text-secondary font-medium">
                    Add a product to continue
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSummaryDrawerOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary min-h-[44px] -my-2 pr-2 kh-focus rounded cursor-pointer"
              >
                <span>View details</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            <div
              className="relative shrink-0 max-w-[60%]"
              onMouseEnter={() => {
                if (isStep3 && step3CtaState.disabledReason) {
                  setDisabledTipOpen(true);
                }
              }}
              onMouseLeave={() => setDisabledTipOpen(false)}
              onFocus={() => {
                if (isStep3 && step3CtaState.disabledReason) {
                  setDisabledTipOpen(true);
                }
              }}
              onBlur={() => setDisabledTipOpen(false)}
            >
              <button
                type="button"
                disabled={isPrimaryDisabled}
                onClick={handlePrimaryCta}
                title={
                  isStep3 && step3CtaState.disabledReason
                    ? step3CtaState.disabledReason
                    : undefined
                }
                className="kh-btn kh-btn-accent min-h-[48px]! py-2.5! px-4! text-sm w-full"
              >
                {isPrimaryLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Processing…</span>
                  </>
                ) : isStep3 ? (
                  <>
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{ctaLabel}</span>
                  </>
                ) : (
                  <span>{ctaLabel}</span>
                )}
              </button>

              {disabledTipOpen && isStep3 && step3CtaState.disabledReason && (
                <div
                  role="tooltip"
                  className="absolute right-0 bottom-full mb-2 w-56 p-2.5 rounded-[10px] bg-ink-deep text-surface text-xs leading-snug shadow-raised z-30 pointer-events-none"
                >
                  {step3CtaState.disabledReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
