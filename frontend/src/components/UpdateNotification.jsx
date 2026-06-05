import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

/**
 * Bottom banner — appears when a new service worker version is detected.
 * Desktop: horizontal row   Mobile: stacked, above bottom nav (bottom-16)
 */
export default function UpdateNotification() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (!dismissed) setVisible(true);
    };
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, [dismissed]);

  const refresh = useCallback(() => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
    window.location.reload();
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Desktop */}
      <div
        className="hidden sm:flex items-center gap-3.5 fixed bottom-0 left-0 right-0 z-[45] bg-white border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-6 py-3.5 animate-slide-up"
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
          <Sparkles size={20} className="text-[#312E81]" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-neutral-900 leading-snug">
            A new version of DukaFlow is available
          </p>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Update now to get the latest features and improvements
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={refresh}
          className="flex-shrink-0 h-[38px] px-5 rounded-lg bg-[#312E81] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#1E1B4B] transition-colors active:scale-[0.98]"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
        <button
          onClick={dismiss}
          className="flex-shrink-0 p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>
      </div>

      {/* Mobile */}
      <div
        className="sm:hidden fixed bottom-16 left-0 right-0 z-[45] bg-white border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] p-4 animate-slide-up"
      >
        {/* Top row: icon + text + close */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
            <Sparkles size={20} className="text-[#312E81]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-neutral-900 leading-snug">
              New version available
            </p>
            <p className="text-[13px] text-neutral-500 mt-0.5">
              Update for the latest features
            </p>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Dismiss"
          >
            <X size={20} />
          </button>
        </div>

        {/* Full-width refresh button */}
        <button
          onClick={refresh}
          className="w-full h-[42px] rounded-lg bg-[#312E81] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1E1B4B] transition-colors active:scale-[0.98]"
        >
          <RefreshCw size={16} />
          Refresh Now
        </button>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </>
  );
}
