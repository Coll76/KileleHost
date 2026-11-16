import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useViewport } from '../store/ViewportContext';

export function ViewportPreviewToggle() {
  const { previewMode, setPreviewMode, isIframePreview } = useViewport();

  if (isIframePreview) {
    return null;
  }

  return (
    <div
      aria-label="Viewport preview mode"
      className="fixed bottom-4 left-4 z-50 hidden lg:flex items-center gap-1.5 p-1 rounded-full bg-ink-deep/95 text-surface shadow-summary border border-surface/15 backdrop-blur-sm"
    >
      <span className="pl-2.5 pr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-surface/70">
        Preview:
      </span>
      <button
        type="button"
        onClick={() => setPreviewMode('desktop')}
        aria-pressed={previewMode === 'desktop'}
        className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full text-xs font-semibold transition-colors kh-focus cursor-pointer ${
          previewMode === 'desktop'
            ? 'bg-primary text-surface'
            : 'text-surface/80 hover:text-surface hover:bg-surface/10'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Desktop</span>
      </button>

      <button
        type="button"
        onClick={() => setPreviewMode('mobile')}
        aria-pressed={previewMode === 'mobile'}
        className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full text-xs font-semibold transition-colors kh-focus cursor-pointer ${
          previewMode === 'mobile'
            ? 'bg-primary text-surface'
            : 'text-surface/80 hover:text-surface hover:bg-surface/10'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Mobile</span>
      </button>
    </div>
  );
}
