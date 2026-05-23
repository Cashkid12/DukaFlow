import { useState, useEffect, useCallback } from 'react';

// ─── Installation trigger thresholds ────────────────────────────────────────
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DASHBOARD_DELAY_MS = 30_000;                    // 30 seconds on dashboard
const MIN_INTERACTIONS = 5;                            // 5+ clicks/key presses
const MIN_VISITS = 3;                                  // 3rd visit

// ─── Local storage keys ─────────────────────────────────────────────────────
const LS_DISMISSED = 'pwa_install_dismissed';
const LS_VISITS = 'pwa_visit_count';
const LS_FIRST_SALE = 'pwa_has_recorded_sale';
const LS_INTERACTIONS = 'pwa_interaction_count';

// ═══════════════════════════════════════════════════════════════════════════════
// Public helpers — call these from your app to trigger the prompt
// ═══════════════════════════════════════════════════════════════════════════════

/** Call this after a sale is successfully recorded. */
export function markFirstSale() {
  try { localStorage.setItem(LS_FIRST_SALE, 'true'); } catch { /* noop */ }
}

/** Call this on every user interaction (click, keypress, tap). */
export function trackInteraction() {
  try {
    const count = parseInt(localStorage.getItem(LS_INTERACTIONS) || '0', 10) + 1;
    localStorage.setItem(LS_INTERACTIONS, String(count));
  } catch { /* noop */ }
}

/** Call this once per session — increments visit count. */
export function trackVisit() {
  try {
    const count = parseInt(localStorage.getItem(LS_VISITS) || '0', 10) + 1;
    localStorage.setItem(LS_VISITS, String(count));
  } catch { /* noop */ }
}

// ═══════════════════════════════════════════════════════════════════════════════

function getPlatform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  return 'android'; // also covers desktop Chrome/Edge
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function isEligible() {
  const lastDismissed = localStorage.getItem(LS_DISMISSED);
  if (lastDismissed) {
    const elapsed = Date.now() - parseInt(lastDismissed, 10);
    if (elapsed < DISMISS_COOLDOWN_MS) return false; // Still in cooldown
  }

  const visits = parseInt(localStorage.getItem(LS_VISITS) || '0', 10);
  const hasSale = localStorage.getItem(LS_FIRST_SALE) === 'true';
  const interactions = parseInt(localStorage.getItem(LS_INTERACTIONS) || '0', 10);

  return visits >= MIN_VISITS || hasSale || interactions >= MIN_INTERACTIONS;
}

/** Returns true if the current route is one where we should suppress the prompt. */
function isSuppressedRoute() {
  const path = window.location.pathname;
  // Never show during onboarding or on the POS / sales checkout page
  if (path.startsWith('/onboarding')) return true;
  if (path.startsWith('/dashboard/sales')) return true;
  if (path === '/sign-in' || path === '/sign-up' || path === '/signup') return true;
  return false;
}

/**
 * Hook that determines whether to show the install prompt and provides
 * the necessary state & handlers.
 *
 * @param {object} options
 * @param {boolean} options.isDashboard  — if true, starts a 30-second timer
 * @returns {{ show: boolean, platform: 'android'|'ios'|null, dismiss: fn, install: fn }}
 */
export function usePwaInstall({ isDashboard = false } = {}) {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Platform is derived (not state) — safe to use in effects
  const platform = getPlatform();

  // Listen for the beforeinstallprompt event (Chrome / Android)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Evaluate triggers
  useEffect(() => {
    if (show) return; // Already showing
    if (isStandalone()) return; // Already installed
    if (isSuppressedRoute()) return; // Onboarding, POS, sign-in, etc.
    if (!isEligible()) return; // Not eligible yet

    // If on dashboard, wait 30 seconds before showing
    if (isDashboard) {
      const timer = setTimeout(() => {
        // Re-check suppression at show time (user may have navigated)
        if (!isSuppressedRoute()) setShow(true);
      }, DASHBOARD_DELAY_MS);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
    setShow(true);
  }, [show, isDashboard]);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(LS_DISMISSED, String(Date.now())); } catch { /* noop */ }
    setShow(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      dismiss();
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);
    setDeferredPrompt(null);
    dismiss();
  }, [deferredPrompt, dismiss]);

  return { show, platform, dismiss, install };
}
