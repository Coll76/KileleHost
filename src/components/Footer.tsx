import React from 'react';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';

export function Footer() {
  const { state } = useCart();
  const { isMobileLayout } = useViewport();
  const needsBottomBarSpace = isMobileLayout && !state.completedOrderReceipt;

  return (
    <footer className="bg-ink-deep text-surface/85 mt-10 w-full">
      <div
        className={`mx-auto max-w-[1200px] ${
          needsBottomBarSpace
            ? 'px-4 pt-6 pb-page-mobile'
            : isMobileLayout
            ? 'px-4 py-6'
            : 'px-6 py-7'
        } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs`}
      >
        <div className="space-y-1 min-w-0">
          <p className="font-display font-bold text-sm text-surface">
            Kilele Host
          </p>
          <p className="text-surface/70">
            East African Web Hosting &amp; Cloud Infrastructure · Nairobi &amp;
            Mombasa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-surface/75">
          <span>30-day money-back guarantee</span>
          <span aria-hidden="true">·</span>
          <span>Terms of Service</span>
          <span aria-hidden="true">·</span>
          <span>Privacy Policy</span>
        </div>
      </div>
    </footer>
  );
}
