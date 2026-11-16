import React from 'react';
import { Check } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { CheckoutStep } from '../types/checkout';

const STEPS: { step: CheckoutStep; label: string; shortLabel: string }[] = [
  { step: 1, label: 'Configure', shortLabel: 'Configure' },
  { step: 2, label: 'Account & billing', shortLabel: 'Account & billing' },
  { step: 3, label: 'Payment & confirmation', shortLabel: 'Payment' },
];

export function StepIndicator() {
  const { state, goToStep } = useCart();
  const { isMobileLayout } = useViewport();
  const { currentStep, maxReachedStep } = state;

  if (isMobileLayout) {
    const activeMeta = STEPS.find((s) => s.step === currentStep) ?? STEPS[0];
    return (
      <nav
        aria-label="Checkout progress"
        className="bg-surface border-b border-border-subtle px-4 py-2.5"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-ink tabular-nums">
            Step {currentStep} of 3 · {activeMeta.shortLabel}
          </span>
          <span className="text-[11px] font-semibold text-muted tabular-nums">
            {Math.round((currentStep / 3) * 100)}%
          </span>
        </div>

        <div
          className="grid grid-cols-3 gap-1.5"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={3}
        >
          {STEPS.map((item) => {
            const filled = item.step <= currentStep;
            return (
              <span
                key={item.step}
                className={`h-1.5 rounded-full transition-colors ${
                  filled ? 'bg-primary' : 'bg-divider'
                }`}
              />
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Checkout progress"
      className="bg-surface border-b border-border-subtle"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-3.5">
        <ol className="flex items-center gap-4">
          {STEPS.map((item, idx) => {
            const isCompleted = item.step < currentStep;
            const isActive = item.step === currentStep;
            const isFutureLocked =
              item.step > currentStep && item.step > maxReachedStep;
            const isClickable = !isFutureLocked && !isActive;

            return (
              <React.Fragment key={item.step}>
                <li className="flex items-center min-w-0">
                  <button
                    type="button"
                    disabled={isFutureLocked || isActive}
                    onClick={() => {
                      if (isClickable) goToStep(item.step);
                    }}
                    aria-current={isActive ? 'step' : undefined}
                    className={`inline-flex items-center gap-2.5 min-h-[44px] px-3 py-2 rounded-full text-sm transition-colors kh-focus whitespace-nowrap ${
                      isActive
                        ? 'text-ink font-bold cursor-default'
                        : isCompleted
                        ? 'text-primary font-semibold hover:bg-primary-tint/60 cursor-pointer'
                        : isClickable
                        ? 'text-secondary font-medium hover:bg-canvas cursor-pointer'
                        : 'text-muted font-medium opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold tabular-nums shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-primary text-surface'
                          : isActive
                          ? 'bg-primary text-surface ring-4 ring-primary-tint'
                          : 'bg-canvas border border-divider text-muted'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      ) : (
                        item.step
                      )}
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </button>
                </li>

                {idx < STEPS.length - 1 && (
                  <li
                    aria-hidden="true"
                    className="flex-1 h-[1.5px] bg-divider min-w-[12px]"
                  >
                    <div
                      className={`h-full transition-all duration-200 ${
                        item.step < currentStep ? 'bg-primary w-full' : 'w-0'
                      }`}
                    />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
