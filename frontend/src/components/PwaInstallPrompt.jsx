import { useEffect, useState, useCallback, useRef } from 'react';
import { X, CheckCircle2, Download, Share2, ArrowRight } from 'lucide-react';

// ─── Reusable DukaFlow icon mark (inline SVG) ─────────────────────────────
function DukaIcon({ size = 48, className = '' }) {
  const s = size;
  return (
    <svg
      width={s} height={s} viewBox="0 0 48 48" fill="none"
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="48" height="48" rx="12" fill="#312E81" />
      <polygon points="7,18 24,6 41,18" fill="white" />
      <rect x="12" y="18" width="24" height="17" rx="2" fill="white" opacity="0.92" />
      <path d="M19 35 L19 28 Q19 22 24 22 Q29 22 29 28 L29 35 Z" fill="#312E81" />
      <rect x="22.5" y="27" width="3" height="6" rx="1.5" fill="white" opacity="0.30" />
      <path d="M6 39.5 C14 34, 20 42, 24 39.5 C28 37, 34 42, 42 39.5"
        stroke="#E8835C" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Benefits list (reused across layouts) ────────────────────────────────
function BenefitsList() {
  const items = [
    'One-tap access from home screen',
    'Faster than typing the URL',
    'Works offline for basic tasks',
  ];
  return (
    <div className="space-y-2">
      {items.map((text, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-[#10B981] mt-0.5 flex-shrink-0" />
          <span className="text-[13px] text-[#475569] leading-[1.5]">{text}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Animation keyframes (injected once) ──────────────────────────────────
const ANIM_STYLES = `
@keyframes df-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes df-slide-down{from{transform:translateY(0)}to{transform:translateY(100%)}}
@keyframes df-fade-in{from{opacity:0}to{opacity:1}}
@keyframes df-fade-out{from{opacity:1}to{opacity:0}}
@keyframes df-scale-in{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
@keyframes df-scale-out{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.92)}}
@keyframes df-slide-up-subtle{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes df-slide-down-subtle{from{transform:translateY(0);opacity:1}to{transform:translateY(16px);opacity:0}}
`;

// ══════════════════════════════════════════════════════════════════════════════
// HOOK — manages enter/exit animation with a closing delay
// ══════════════════════════════════════════════════════════════════════════════
function useExitAnimation(onDismiss, exitMs = 200) {
  const [closing, setClosing] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const triggerDismiss = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onDismissRef.current(), exitMs);
  }, [closing, exitMs]);

  return { closing, triggerDismiss };
}

// ══════════════════════════════════════════════════════════════════════════════
// ANDROID / DESKTOP — MOBILE bottom sheet
// ══════════════════════════════════════════════════════════════════════════════
function MobileSheet({ closing, onDismiss, onInstall }) {
  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        style={{ animation: closing ? 'df-fade-out 0.15s ease-in both' : 'df-fade-in 0.3s ease-out both' }}
        onClick={onDismiss}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[110] rounded-t-[24px] bg-white px-6 pt-8 pb-6 shadow-2xl"
        style={{ animation: closing ? 'df-slide-down 0.25s ease-in both' : 'df-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <div className="flex justify-center -mt-4 mb-6">
          <div className="w-10 h-1 bg-[#CBD5E1] rounded-full" />
        </div>
        <button onClick={onDismiss} className="absolute right-5 top-5 rounded-full p-1.5 text-[#94A3B8] hover:bg-neutral-100 hover:text-[#475569] transition-colors" aria-label="Dismiss">
          <X size={20} />
        </button>
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-xl bg-[#312E81] flex items-center justify-center shadow-lg shadow-[#312E81]/25">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <polygon points="7,18 24,6 41,18" fill="white" />
              <rect x="12" y="18" width="24" height="17" rx="2" fill="white" opacity="0.92" />
              <path d="M19 35 L19 28 Q19 22 24 22 Q29 22 29 28 L29 35 Z" fill="#312E81" />
              <path d="M6 39.5 C14 34, 20 42, 24 39.5 C28 37, 34 42, 42 39.5" stroke="#E8835C" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
        <h2 className="text-lg font-bold text-[#1E293B] text-center mb-2">Install DukaFlow App</h2>
        <p className="text-sm text-[#64748B] text-center mb-5 leading-relaxed">Quick access to your duka — no typing URLs</p>
        <div className="mb-6 pl-4"><BenefitsList /></div>
        <button onClick={onInstall} className="w-full h-[52px] bg-[#312E81] text-white font-semibold text-[15px] rounded-[14px] flex items-center justify-center gap-2.5 shadow-md hover:bg-[#1E1B4B] hover:shadow-lg active:scale-[0.98] transition-all">
          <Download size={18} />Install App
        </button>
        <button onClick={onDismiss} className="w-full py-3 mt-2 text-sm text-[#94A3B8] font-medium hover:text-[#64748B] transition-colors">Maybe Later</button>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLET — centered card
// ══════════════════════════════════════════════════════════════════════════════
function TabletCard({ closing, onDismiss, onInstall }) {
  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
        style={{ animation: closing ? 'df-fade-out 0.15s ease-in both' : 'df-fade-in 0.3s ease-out both' }}
        onClick={onDismiss}
      />
      <div
        className="fixed z-[110] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] bg-white rounded-[24px] px-8 pt-9 pb-8 shadow-2xl"
        style={{ animation: closing ? 'df-scale-out 0.2s ease-in both' : 'df-scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onDismiss} className="absolute right-5 top-5 rounded-full p-1.5 text-[#94A3B8] hover:bg-neutral-100 hover:text-[#475569] transition-colors" aria-label="Dismiss">
          <X size={20} />
        </button>
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-xl bg-[#312E81] flex items-center justify-center shadow-lg shadow-[#312E81]/25">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <polygon points="7,18 24,6 41,18" fill="white" />
              <rect x="12" y="18" width="24" height="17" rx="2" fill="white" opacity="0.92" />
              <path d="M19 35 L19 28 Q19 22 24 22 Q29 22 29 28 L29 35 Z" fill="#312E81" />
              <path d="M6 39.5 C14 34, 20 42, 24 39.5 C28 37, 34 42, 42 39.5" stroke="#E8835C" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#1E293B] text-center mb-2">Install DukaFlow App</h2>
        <p className="text-sm text-[#64748B] text-center mb-6 leading-relaxed">Quick access to your duka — no typing URLs</p>
        <div className="mb-7 px-2"><BenefitsList /></div>
        <button onClick={onInstall} className="w-full h-[52px] bg-[#312E81] text-white font-semibold text-[15px] rounded-[14px] flex items-center justify-center gap-2.5 shadow-md hover:bg-[#1E1B4B] hover:shadow-lg active:scale-[0.98] transition-all mb-3">
          <Download size={18} />Install App
        </button>
        <button onClick={onDismiss} className="w-full py-2 text-sm text-[#94A3B8] font-medium hover:text-[#64748B] transition-colors">Maybe Later</button>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DESKTOP — subtle bottom banner
// ══════════════════════════════════════════════════════════════════════════════
function DesktopBanner({ closing, onDismiss, onInstall }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] bg-white border-t border-[#E2E8F0] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      style={{ animation: closing ? 'df-slide-down-subtle 0.2s ease-in both' : 'df-slide-up-subtle 0.35s ease-out both' }}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center gap-4 px-6 py-4">
        <DukaIcon size={40} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#1E293B] leading-tight">Install DukaFlow App</p>
          <p className="text-[13px] text-[#64748B] leading-tight mt-0.5">Quick access to your duka — no typing URLs. One-tap from your desktop.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={onInstall} className="h-10 px-5 bg-[#312E81] text-white font-semibold text-sm rounded-[10px] flex items-center gap-2 hover:bg-[#1E1B4B] hover:shadow-md active:scale-[0.97] transition-all">
            <Download size={16} />Install
          </button>
          <button onClick={onDismiss} className="w-9 h-9 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-neutral-100 hover:text-[#475569] transition-colors flex-shrink-0" aria-label="Dismiss">
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// iOS — visual Share sheet instructions
// ══════════════════════════════════════════════════════════════════════════════

/** Visual flow card: Share icon → Share Button → Arrow → Scroll → Arrow → Add to Home */
function IosVisualSteps() {
  return (
    <div className="bg-[#EEF2FF] rounded-xl p-5 mb-5">
      {/* Share icon above */}
      <div className="flex justify-center mb-3">
        <Share2 size={24} className="text-[#312E81]" />
      </div>

      {/* Horizontal flow: Share Button → Scroll → Add to Home */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* Share Button box */}
        <div className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 shadow-sm">
          <span className="text-[13px] font-semibold text-[#1E293B] whitespace-nowrap">Share Button</span>
        </div>

        <ArrowRight size={16} className="text-[#312E81]/40 flex-shrink-0" />

        <span className="text-[13px] font-medium text-[#475569] whitespace-nowrap">Scroll down</span>

        <ArrowRight size={16} className="text-[#312E81]/40 flex-shrink-0" />

        {/* Add to Home Screen */}
        <div className="bg-white border border-[#10B981]/30 rounded-lg px-3 py-2 shadow-sm">
          <span className="text-[13px] font-semibold text-[#10B981] whitespace-nowrap">Add to Home Screen</span>
        </div>
      </div>

      {/* Subtext */}
      <p className="text-xs text-[#64748B] text-center mt-3 leading-relaxed">
        The DukaFlow icon will appear on your iPhone home screen
      </p>
    </div>
  );
}

function IosSheet({ closing, onDismiss, isTablet }) {
  const inner = <IosInner closing={closing} onDismiss={onDismiss} />;

  if (isTablet) {
    return (
      <>
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          style={{ animation: closing ? 'df-fade-out 0.15s ease-in both' : 'df-fade-in 0.3s ease-out both' }}
          onClick={onDismiss}
        />
        <div
          className="fixed z-[110] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] bg-white rounded-[24px] px-8 pt-9 pb-8 shadow-2xl"
          style={{ animation: closing ? 'df-scale-out 0.2s ease-in both' : 'df-scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onDismiss} className="absolute right-5 top-5 rounded-full p-1.5 text-[#94A3B8] hover:bg-neutral-100 hover:text-[#475569] transition-colors" aria-label="Dismiss">
            <X size={20} />
          </button>
          {inner}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        style={{ animation: closing ? 'df-fade-out 0.15s ease-in both' : 'df-fade-in 0.3s ease-out both' }}
        onClick={onDismiss}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[110] rounded-t-[24px] bg-white px-6 pt-8 pb-6 shadow-2xl"
        style={{ animation: closing ? 'df-slide-down 0.25s ease-in both' : 'df-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <div className="flex justify-center -mt-4 mb-6">
          <div className="w-10 h-1 bg-[#CBD5E1] rounded-full" />
        </div>
        <button onClick={onDismiss} className="absolute right-5 top-5 rounded-full p-1.5 text-[#94A3B8] hover:bg-neutral-100 hover:text-[#475569] transition-colors" aria-label="Dismiss">
          <X size={20} />
        </button>
        {inner}
      </div>
    </>
  );
}

function IosInner({ onDismiss }) {
  return (
    <>
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-xl bg-[#312E81] flex items-center justify-center shadow-lg shadow-[#312E81]/25">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <polygon points="7,18 24,6 41,18" fill="white" />
            <rect x="12" y="18" width="24" height="17" rx="2" fill="white" opacity="0.92" />
            <path d="M19 35 L19 28 Q19 22 24 22 Q29 22 29 28 L29 35 Z" fill="#312E81" />
            <path d="M6 39.5 C14 34, 20 42, 24 39.5 C28 37, 34 42, 42 39.5" stroke="#E8835C" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>
      <h2 className="text-lg font-bold text-[#1E293B] text-center mb-2">Add DukaFlow to Home Screen</h2>
      <p className="text-sm text-[#64748B] text-center mb-5 leading-relaxed">Get one-tap access to your duka on your iPhone</p>

      <IosVisualSteps />

      <button onClick={onDismiss} className="w-full h-[48px] bg-[#312E81] text-white font-semibold text-[15px] rounded-[14px] flex items-center justify-center gap-2 shadow-md hover:bg-[#1E1B4B] hover:shadow-lg active:scale-[0.98] transition-all">
        <CheckCircle2 size={18} />Got it, thanks!
      </button>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function useDeviceClass() {
  const [cls, setCls] = useState(() => getClass());
  useEffect(() => {
    const onResize = () => setCls(getClass());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return cls;
}

function getClass() {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export default function PwaInstallPrompt({ show, platform, onDismiss, onInstall }) {
  const device = useDeviceClass();
  const { closing, triggerDismiss } = useExitAnimation(onDismiss, 250);

  if (!show && !closing) return null;
  if (!show) return null;

  const isIos = platform === 'ios';
  const handleDismiss = triggerDismiss;

  return (
    <>
      <style>{ANIM_STYLES}</style>

      {isIos ? (
        <IosSheet closing={closing} onDismiss={handleDismiss} isTablet={device === 'tablet' || device === 'desktop'} />
      ) : device === 'desktop' ? (
        <DesktopBanner closing={closing} onDismiss={handleDismiss} onInstall={onInstall} />
      ) : device === 'tablet' ? (
        <TabletCard closing={closing} onDismiss={handleDismiss} onInstall={onInstall} />
      ) : (
        <MobileSheet closing={closing} onDismiss={handleDismiss} onInstall={onInstall} />
      )}
    </>
  );
}
