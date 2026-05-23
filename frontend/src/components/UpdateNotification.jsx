import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

/**
 * Banner that appears at the top of the page when a new SW version is available.
 */
export default function UpdateNotification() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Listen for the sw-update-available custom event dispatched by index.html
  useEffect(() => {
    const handler = () => {
      if (!dismissed) setVisible(true);
    };
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, [dismissed]);

  const refresh = useCallback(() => {
    // Tell the new SW to activate immediately, then reload
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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2rem)] max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-[#312E81]/10 p-4 animate-in slide-in-from-top">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#312E81]/10 flex items-center justify-center">
            <Sparkles size={18} className="text-[#312E81]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1E293B]">
              New version available
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">
              Refresh to get the latest features
            </p>
          </div>

          {/* Close */}
          <button
            onClick={dismiss}
            className="flex-shrink-0 rounded-full p-1 text-[#94A3B8] hover:bg-neutral-100 hover:text-[#64748B] transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={refresh}
          className="mt-3 w-full py-2.5 rounded-xl bg-[#312E81] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1E1B4B] transition-colors active:scale-[0.98]"
        >
          <RefreshCw size={16} />
          Refresh Now
        </button>
      </div>

      <style>{`
        @keyframes slide-in-from-top {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to   { transform: translate(-50%, 0); opacity: 1; }
        }
        .slide-in-from-top { animation-name: slide-in-from-top; }
      `}</style>
    </div>
  );
}
