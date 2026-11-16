import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Globe,
  HardDrive,
  MailCheck,
  RotateCcw,
  Server,
} from 'lucide-react';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';
import { CompletedOrderReceipt } from '../types/checkout';
import { formatCurrency } from '../utils/pricing';

interface ConfirmationScreenProps {
  receipt: CompletedOrderReceipt;
}

export function ConfirmationScreen({ receipt }: ConfirmationScreenProps) {
  const { resetCheckout, notifyActionToast } = useCart();
  const { isMobileLayout } = useViewport();
  const [dashboardBannerOpen, setDashboardBannerOpen] = useState(false);

  const firstName =
    receipt.customerName.trim().split(/\s+/)[0] || 'there';

  const handleDownloadInvoice = () => {
    const lines = [
      `KILELE HOST — TAX INVOICE / RECEIPT`,
      `Order Number: ${receipt.orderRef}`,
      `Date: ${new Date(receipt.completedAtIso).toLocaleString()}`,
      `Customer: ${receipt.customerName} (${receipt.customerEmail})`,
      `Payment Method: ${receipt.paymentMethodLabel}`,
      `----------------------------------------`,
      ...receipt.summary.lineItems.map((li) => {
        const amount = formatCurrency(li.upfrontTotalUSD, receipt.currency);
        return `${li.item.name} — ${amount}`;
      }),
      `----------------------------------------`,
      `Plans subtotal: ${formatCurrency(receipt.summary.plansSubtotalUSD, receipt.currency)}`,
      ...(receipt.summary.setupFeesTotalUSD > 0
        ? [
            `Setup fees: ${formatCurrency(
              receipt.summary.setupFeesTotalUSD,
              receipt.currency
            )}`,
          ]
        : []),
      ...(receipt.summary.promoDiscountUSD > 0
        ? [
            `Promo discount: -${formatCurrency(
              receipt.summary.promoDiscountUSD,
              receipt.currency
            )}`,
          ]
        : []),
      `${receipt.summary.taxLabel}: ${formatCurrency(
        receipt.summary.estimatedTaxUSD,
        receipt.currency
      )}`,
      `TOTAL PAID: ${formatCurrency(
        receipt.summary.totalDueTodayUSD,
        receipt.currency
      )}`,
    ];

    try {
      const blob = new Blob([lines.join('\n')], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KileleHost-Invoice-${receipt.orderRef}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Safe fallback in restricted sandboxes
    }

    notifyActionToast(`Invoice ${receipt.orderRef} downloaded`);
  };

  const timelineSteps: Array<{
    id: string;
    title: string;
    eta: string;
    detail: string;
    icon: React.ReactNode;
    status: 'done' | 'active';
  }> = [
    ...(receipt.hasDomainRegistration
      ? [
          {
            id: 'domain',
            title: 'Domain registration',
            eta: 'Usually minutes',
            detail:
              'DNS zones and WHOIS records are propagating across East African & global resolvers.',
            icon: <Globe className="w-4 h-4 text-primary shrink-0" />,
            status: 'active' as const,
          },
        ]
      : []),
    ...(receipt.hasHosting || !receipt.hasDedicated
      ? [
          {
            id: 'hosting',
            title: 'Hosting account ready',
            eta: 'Under 5 min',
            detail:
              'NVMe storage, SSL certificates, and control panel credentials are provisioning automatically.',
            icon: <Server className="w-4 h-4 text-primary shrink-0" />,
            status: 'active' as const,
          },
        ]
      : []),
    ...(receipt.hasDedicated
      ? [
          {
            id: 'dedicated',
            title: 'Dedicated server rack & OS install',
            eta: '4–24 hours',
            detail:
              'Our Nairobi datacenter engineers are allocating hardware, RAID, and IPMI access for your bare-metal node.',
            icon: <HardDrive className="w-4 h-4 text-primary shrink-0" />,
            status: 'active' as const,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-[820px] space-y-5 sm:space-y-6 min-w-0">
      {/* Hero Success Banner */}
      <section className="kh-card p-5 sm:p-8 text-center space-y-4 min-w-0">
        <motion.div
          initial={{ scale: 0.72, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-16 h-16 mx-auto rounded-full bg-success-tint text-success flex items-center justify-center border border-success/30"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-success"
          />
          <CheckCircle2 className="w-9 h-9" strokeWidth={2.2} />
        </motion.div>

        <div className="space-y-1.5 min-w-0">
          <p className="eyebrow-label">Order Confirmed</p>
          <h1
            className={`font-display font-bold text-ink tracking-tight ${
              isMobileLayout ? 'text-[26px]' : 'text-[34px]'
            } leading-tight`}
          >
            You&apos;re all set, {firstName}!
          </h1>
          <p className="text-[15px] text-secondary overflow-anywhere">
            Order{' '}
            <strong className="font-display font-bold text-ink tabular-nums overflow-anywhere">
              {receipt.orderRef}
            </strong>{' '}
            via{' '}
            <strong className="text-ink">{receipt.paymentMethodLabel}</strong>
          </p>
        </div>

        <div className="inline-flex items-start sm:items-center gap-2 max-w-full px-4 py-2.5 rounded-[16px] sm:rounded-full bg-surface-tint border border-primary/20 text-xs sm:text-sm font-medium text-ink text-left sm:text-center">
          <MailCheck className="w-4 h-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <span className="min-w-0 overflow-anywhere">
            Receipt sent to{' '}
            <strong className="font-semibold overflow-anywhere">
              {receipt.customerEmail}
            </strong>
          </span>
        </div>

        {/* Action buttons */}
        <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setDashboardBannerOpen((prev) => !prev)}
            className="kh-btn kh-btn-primary w-full sm:w-auto"
          >
            <span>Go to my dashboard</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="kh-btn kh-btn-secondary w-full sm:w-auto"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download invoice (PDF)</span>
          </button>
        </div>

        {dashboardBannerOpen && (
          <div
            role="status"
            className="mt-3 p-4 rounded-[14px] bg-surface-warm border border-border-subtle text-left text-xs sm:text-sm text-ink flex items-start gap-2.5"
          >
            <ExternalLink className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-bold overflow-anywhere">
                Kilele Host Client Console ({receipt.orderRef})
              </p>
              <p className="text-secondary mt-0.5 overflow-anywhere">
                Provisioning has started for {receipt.customerEmail}. In this
                interactive prototype, service management opens in preview mode.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Receipt Summary & Timeline Grid */}
      <div
        className={`grid gap-5 sm:gap-6 ${
          isMobileLayout ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12 items-start'
        }`}
      >
        {/* Receipt Summary */}
        <section
          aria-labelledby="receipt-summary-heading"
          className={`kh-card p-4 sm:p-6 space-y-4 min-w-0 ${
            isMobileLayout ? '' : 'lg:col-span-7'
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-divider">
            <div className="min-w-0 flex-1">
              <p className="eyebrow-label">Official Receipt</p>
              <h2
                id="receipt-summary-heading"
                className="font-display font-bold text-lg text-ink mt-0.5 overflow-anywhere"
              >
                Order {receipt.orderRef}
              </h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-success-tint text-success text-xs font-bold shrink-0">
              Paid
            </span>
          </div>

          <ul className="divide-y divide-divider">
            {receipt.summary.lineItems.map((li) => {
              const termLabel = li.isExistingDomain
                ? 'External DNS'
                : li.item.domainConfig
                ? li.item.domainConfig.years === 1
                  ? '1 year'
                  : `${li.item.domainConfig.years} years`
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
                      <p className="text-xs text-secondary mt-0.5">
                        Term: {termLabel}
                        {li.setupFeeTotalUSD > 0 && (
                          <span>
                            {' '}
                            · Setup:{' '}
                            <span className="whitespace-nowrap">
                              {formatCurrency(
                                li.setupFeeTotalUSD,
                                receipt.currency
                              )}
                            </span>
                          </span>
                        )}
                      </p>
                      {!li.isExistingDomain && (
                        <p className="text-[11px] text-muted mt-0.5 tabular-nums">
                          Renews {li.renewalDateFormatted} at{' '}
                          <span className="whitespace-nowrap">
                            {formatCurrency(li.renewalTermUSD, receipt.currency)}
                            {li.isYearlyOnly ? '/yr' : ''}
                          </span>
                        </p>
                      )}
                    </div>
                    <span className="font-display font-bold text-sm text-ink tabular-nums shrink-0 whitespace-nowrap">
                      {formatCurrency(li.upfrontTotalUSD, receipt.currency)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="pt-3 border-t border-divider space-y-2 text-sm">
            <div className="flex justify-between gap-2 text-secondary">
              <span className="min-w-0">Plans subtotal</span>
              <span className="font-medium text-ink tabular-nums whitespace-nowrap shrink-0">
                {formatCurrency(
                  receipt.summary.plansSubtotalUSD,
                  receipt.currency
                )}
              </span>
            </div>

            {receipt.summary.setupFeesTotalUSD > 0 && (
              <div className="flex justify-between gap-2 text-secondary">
                <span className="min-w-0">One-time setup fees</span>
                <span className="font-medium text-ink tabular-nums whitespace-nowrap shrink-0">
                  {formatCurrency(
                    receipt.summary.setupFeesTotalUSD,
                    receipt.currency
                  )}
                </span>
              </div>
            )}

            {receipt.summary.promoDiscountUSD > 0 && (
              <div className="flex justify-between gap-2 text-success font-medium">
                <span className="min-w-0">Promo savings</span>
                <span className="tabular-nums whitespace-nowrap shrink-0">
                  −
                  {formatCurrency(
                    receipt.summary.promoDiscountUSD,
                    receipt.currency
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between gap-2 text-secondary">
              <span className="min-w-0">{receipt.summary.taxLabel}</span>
              <span className="font-medium text-ink tabular-nums whitespace-nowrap shrink-0">
                {formatCurrency(
                  receipt.summary.estimatedTaxUSD,
                  receipt.currency
                )}
              </span>
            </div>

            <div className="pt-2.5 border-t border-divider flex items-baseline justify-between gap-2">
              <span className="font-display font-bold text-base text-ink">
                Total paid
              </span>
              <span className="font-display font-extrabold text-[24px] text-ink tabular-nums whitespace-nowrap shrink-0">
                {formatCurrency(
                  receipt.summary.totalDueTodayUSD,
                  receipt.currency
                )}
              </span>
            </div>
          </div>
        </section>

        {/* What Happens Next Timeline */}
        <section
          aria-labelledby="what-happens-next-heading"
          className={`kh-card p-4 sm:p-6 space-y-4 min-w-0 ${
            isMobileLayout ? '' : 'lg:col-span-5'
          }`}
        >
          <div>
            <p className="eyebrow-label">Provisioning</p>
            <h2
              id="what-happens-next-heading"
              className="font-display font-bold text-lg text-ink mt-0.5"
            >
              What happens next
            </h2>
          </div>

          <ol className="space-y-4">
            {timelineSteps.map((step, idx) => (
              <li key={step.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-full bg-surface-tint border border-primary/25 flex items-center justify-center">
                    {step.icon}
                  </div>
                  {idx < timelineSteps.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="w-px h-6 bg-divider mt-1"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-sm text-ink">
                      {step.title}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-canvas border border-border-subtle text-[11px] font-semibold text-primary whitespace-nowrap">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{step.eta}</span>
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="pt-3 border-t border-divider">
            <button
              type="button"
              onClick={resetCheckout}
              className="kh-btn kh-btn-secondary w-full min-h-[44px]! py-2.5! text-sm"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Start a new order</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
