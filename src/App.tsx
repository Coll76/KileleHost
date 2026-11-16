import React, { useMemo } from 'react';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { Footer } from './components/Footer';
import { MobileSummaryBar } from './components/MobileSummaryBar';
import { OrderSummaryPanel } from './components/OrderSummaryPanel';
import { Step1Configure } from './components/Step1Configure';
import { Step2AccountBilling } from './components/Step2AccountBilling';
import { Step3Payment } from './components/Step3Payment';
import { StepIndicator } from './components/StepIndicator';
import { TopStripAndHeader } from './components/TopStripAndHeader';
import { UndoToast } from './components/UndoToast';
import { ViewportPreviewToggle } from './components/ViewportPreviewToggle';
import { CartProvider, useCart } from './store/CartContext';
import { useViewport, ViewportProvider } from './store/ViewportContext';

function CheckoutShell() {
  const { state } = useCart();
  const { previewMode, isIframePreview, isMobileLayout } = useViewport();
  const completedReceipt = state.completedOrderReceipt;

  const iframePreviewUrl = useMemo(() => {
    if (typeof window === 'undefined') return '?frame=1';
    const url = new URL(window.location.href);
    url.searchParams.set('frame', '1');
    return url.toString();
  }, []);

  if (previewMode === 'mobile' && !isIframePreview) {
    return (
      <div className="min-h-screen bg-divider/60 py-6 px-4 flex flex-col items-center justify-center">
        <div className="mb-3 text-xs font-semibold text-secondary">
          Mobile Preview Frame (375 × 812)
        </div>
        <div className="relative rounded-[36px] border-[8px] border-ink-deep bg-canvas shadow-summary overflow-hidden flex flex-col">
          <div
            aria-hidden="true"
            className="h-5 bg-ink-deep flex items-center justify-center shrink-0"
          >
            <div className="w-16 h-1.5 rounded-full bg-surface/25" />
          </div>
          <iframe
            title="Kilele Host Mobile Checkout Preview (375×812)"
            src={iframePreviewUrl}
            className="w-[375px] h-[812px] max-h-[84vh] border-0 bg-canvas block"
          />
        </div>
        <ViewportPreviewToggle />
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <Step1Configure />;
      case 2:
        return <Step2AccountBilling />;
      case 3:
        return <Step3Payment />;
      default:
        return <Step1Configure />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas w-full max-w-full">
      <TopStripAndHeader />
      {!completedReceipt && <StepIndicator />}

      <main
        className={`flex-1 w-full mx-auto max-w-[1200px] min-w-0 ${
          isMobileLayout ? 'px-4 py-4 pb-6' : 'px-6 py-8'
        }`}
      >
        {completedReceipt ? (
          <ConfirmationScreen receipt={completedReceipt} />
        ) : isMobileLayout ? (
          <div className="space-y-5 min-w-0">{renderCurrentStep()}</div>
        ) : (
          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-8 min-w-0">{renderCurrentStep()}</div>
            <div className="col-span-4 min-w-0">
              <OrderSummaryPanel />
            </div>
          </div>
        )}
      </main>

      <Footer />
      {!completedReceipt && <MobileSummaryBar />}
      <UndoToast />
      <ViewportPreviewToggle />
    </div>
  );
}

export default function App() {
  return (
    <ViewportProvider>
      <CartProvider>
        <CheckoutShell />
      </CartProvider>
    </ViewportProvider>
  );
}
