import React, { useEffect, useRef, useState } from 'react';
import { CurrencyCode } from '../types/checkout';
import { convertCurrencyAmount, formatConvertedNumber } from '../utils/pricing';

interface AnimatedPriceProps {
  amountUSD: number;
  currency: CurrencyCode;
  className?: string;
}

export function AnimatedPrice({
  amountUSD,
  currency,
  className = '',
}: AnimatedPriceProps) {
  const targetConverted = convertCurrencyAmount(amountUSD, currency);
  const [displayValue, setDisplayValue] = useState<number>(targetConverted);
  const prevTargetRef = useRef<number>(targetConverted);
  const prevCurrencyRef = useRef<CurrencyCode>(currency);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Snap immediately on currency switch or reduced-motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (
      prevCurrencyRef.current !== currency ||
      prefersReducedMotion ||
      prevTargetRef.current === targetConverted
    ) {
      prevCurrencyRef.current = currency;
      prevTargetRef.current = targetConverted;
      setDisplayValue(targetConverted);
      return;
    }

    const startValue = prevTargetRef.current;
    const endValue = targetConverted;
    const duration = 200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const nextVal = startValue + (endValue - startValue) * eased;
      setDisplayValue(nextVal);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevTargetRef.current = endValue;
        setDisplayValue(endValue);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetConverted, currency]);

  return (
    <span className={`tabular-nums ${className}`}>
      {formatConvertedNumber(displayValue, currency)}
    </span>
  );
}
