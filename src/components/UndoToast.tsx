import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { useViewport } from '../store/ViewportContext';

export function UndoToast() {
  const {
    state,
    removedItemNotice,
    actionToast,
    undoRemove,
    dismissUndo,
    dismissActionToast,
  } = useCart();
  const { isMobileLayout } = useViewport();

  const hasBottomBar = isMobileLayout && !state.completedOrderReceipt;
  const positionClass = isMobileLayout
    ? hasBottomBar
      ? 'fixed bottom-[88px] left-4 right-4'
      : 'fixed bottom-4 left-4 right-4'
    : 'fixed bottom-6 right-6 max-w-sm';

  return (
    <>
      <AnimatePresence>
        {removedItemNotice && (
          <motion.div
            key={removedItemNotice.removedAt}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={
              hasBottomBar
                ? { bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))' }
                : undefined
            }
            className={`${positionClass} z-50 bg-ink-deep text-surface rounded-[14px] px-4 py-3 shadow-summary flex items-center justify-between gap-2`}
          >
            <p className="text-xs sm:text-sm font-medium min-w-0 truncate">
              Removed{' '}
              <span className="font-bold">{removedItemNotice.item.name}</span>
            </p>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={undoRemove}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full bg-accent text-accent-ink text-xs font-bold active:scale-95 transition-transform kh-focus cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={dismissUndo}
                aria-label="Dismiss notification"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full text-surface/80 hover:text-surface hover:bg-surface/10 kh-focus cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actionToast && !removedItemNotice && (
          <motion.div
            key={actionToast.id}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={
              hasBottomBar
                ? { bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))' }
                : undefined
            }
            className={`${positionClass} z-50 bg-ink text-surface rounded-[14px] px-4 py-2.5 shadow-summary flex items-center justify-between gap-2`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <p className="text-xs sm:text-sm font-medium min-w-0 truncate">
                {actionToast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissActionToast}
              aria-label="Dismiss message"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full text-surface/80 hover:text-surface hover:bg-surface/10 kh-focus cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
