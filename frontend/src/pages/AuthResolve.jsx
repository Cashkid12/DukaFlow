import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TIMEOUT_MS = 15_000;   // Show "Still working..." after 15s
const ERROR_MS = 45_000;     // Show error state after 45s

/**
 * AuthResolve — resolution page shown after Clerk OAuth (Google/Apple).
 *
 * Flow:
 *  1. Clerk redirects here after OAuth completes
 *  2. We check for pending invitation token → redirect to /accept-invitation
 *  3. We call /auth/onboarding-status → redirect to /dashboard or /onboarding
 *  4. If backend is slow (Render free tier), show progressive loading states:
 *     - 0–15s:  "Setting up your duka..."
 *     - 15–45s: "Still working..." (servers waking up)
 *     - 45s+:   Error state with retry
 */
export default function AuthResolve() {
  const navigate = useNavigate();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const resolvedRef = useRef(false);

  // UI state: 'loading' | 'timeout' | 'error'
  const [uiState, setUiState] = useState('loading');
  const timerRef = useRef(null);
  const errorTimerRef = useRef(null);

  // ── Core resolution logic ──────────────────────────────────────────
  const runResolution = useCallback(async () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    try {
      // Priority: Check for pending invitation acceptance
      const invitationToken = sessionStorage.getItem('dukaflow_invitation_token');
      if (invitationToken) {
        navigate(`/accept-invitation?token=${invitationToken}&mode=complete`, { replace: true });
        return;
      }

      const token = await getToken();
      if (!token) {
        // Clerk will handle redirect for unsigned users
        return;
      }

      const res = await fetch(`${API_BASE_URL}/auth/onboarding-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.onboarded) {
          navigate(data.redirectTo || '/dashboard', { replace: true });
          return;
        }
        navigate('/onboarding', { replace: true });
        return;
      }

      // Non-OK response — default to onboarding
      navigate('/onboarding', { replace: true });
    } catch {
      // Network error — backend may be waking up, default to onboarding
      console.warn('[AuthResolve] Backend unreachable, defaulting to onboarding');
      navigate('/onboarding', { replace: true });
    }
  }, [getToken, navigate]);

  // ── Retry: re-run the resolution logic ─────────────────────────────
  const retry = useCallback(() => {
    resolvedRef.current = false;
    setUiState('loading');

    // Clear timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);

    // Re-trigger resolution
    runResolution();
  }, [runResolution]);

  // ── Effects: timers + resolution ──────────────────────────────────
  useEffect(() => {
    // Wait for Clerk to finish loading
    if (!isLoaded) return;
    if (!isSignedIn) return;
    if (resolvedRef.current) return;

    // Start progressive timeout timers
    timerRef.current = setTimeout(() => {
      setUiState('timeout');
    }, TIMEOUT_MS);

    errorTimerRef.current = setTimeout(() => {
      setUiState('error');
    }, ERROR_MS);

    // Run resolution
    runResolution();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [isLoaded, isSignedIn, runResolution]);

  // ── Handle retry click ─────────────────────────────────────────────
  const handleRetry = () => {
    retry();
  };

  const handleBackToSignIn = () => {
    navigate('/sign-in', { replace: true });
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 animate-[fadeIn_0.3s_ease]">
      <div className="text-center max-w-[400px] w-full">

        {/* ── Logo Icon ─────────────────────────────────────────── */}
        <div className="mx-auto mb-6 w-14 h-14 sm:w-14 sm:h-14 rounded-xl bg-[#312E81] flex items-center justify-center relative overflow-hidden shadow-lg">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {/* Accent line */}
          <div className="absolute bottom-0 left-1 right-1 h-[3px] bg-[#E8835C] rounded-b-sm" />
        </div>

        {/* ── State 1: Loading (0–15s) ──────────────────────────── */}
        {uiState === 'loading' && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <h1 className="text-xl sm:text-[20px] font-semibold text-neutral-900 mb-4">
              Setting up your duka...
            </h1>
            <Loader2
              size={32}
              className="animate-spin text-[#312E81] mx-auto mb-3"
            />
            <p className="text-sm text-neutral-500">
              This may take a few moments
            </p>
          </div>
        )}

        {/* ── State 2: Timeout (15–45s) ─────────────────────────── */}
        {uiState === 'timeout' && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <h1 className="text-xl sm:text-[20px] font-semibold text-neutral-900 mb-4">
              Still working...
            </h1>
            <Loader2
              size={32}
              className="animate-spin text-[#312E81] mx-auto mb-4"
            />
            <p className="text-sm text-neutral-500 max-w-[380px] mx-auto leading-relaxed mb-6">
              Our servers are waking up. This is normal for first-time sign-ups and should only take a few more seconds.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center h-11 px-6 border-[1.5px] border-neutral-300 text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 hover:border-[#312E81] transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── State 3: Error (45s+) ─────────────────────────────── */}
        {uiState === 'error' && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-neutral-400" />
            </div>
            <h1 className="text-xl sm:text-[20px] font-semibold text-neutral-900 mb-3">
              Something went wrong
            </h1>
            <p className="text-sm text-neutral-500 max-w-[380px] mx-auto leading-relaxed mb-6">
              We couldn't set up your account. Please check your internet connection and try again.
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleRetry}
                className="w-full max-w-[280px] h-11 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToSignIn}
                className="text-sm text-neutral-500 hover:text-neutral-700 font-medium hover:underline transition-all duration-150"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
