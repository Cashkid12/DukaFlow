import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * AuthResolve — lightweight resolution page shown immediately after Clerk auth.
 * Checks whether the user has completed onboarding (has a shop in MongoDB),
 * then redirects to /onboarding or /dashboard accordingly.
 *
 * Max time: 1-2 seconds. Shows a branded spinner while checking.
 */
export default function AuthResolve() {
  const navigate = useNavigate();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const resolvedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Wait for Clerk to finish loading
    if (!isLoaded) return;

    // If not signed in, Clerk handles redirect — don't double-redirect
    if (!isSignedIn) return;

    // Prevent double-resolution (React 19 Strict Mode double-mount)
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    const resolve = async () => {
      try {
        // ── Priority: Check for pending invitation acceptance ──────────────
        const invitationToken = sessionStorage.getItem('dukaflow_invitation_token');
        if (invitationToken) {
          navigate(`/accept-invitation?token=${invitationToken}&mode=complete`, { replace: true });
          return;
        }

        const token = await getToken();
        if (!token) {
          // No token — Clerk redirect will handle it
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
          // Not onboarded — go to onboarding
          navigate('/onboarding', { replace: true });
          return;
        }
      } catch {
        // Network error — default to onboarding for safety
        console.warn('[AuthResolve] Backend unreachable, defaulting to onboarding');
      }
      // Fallback: go to onboarding
      navigate('/onboarding', { replace: true });
    };

    // Safety timeout: if resolution takes > 3s, redirect to onboarding
    timeoutRef.current = setTimeout(() => {
      if (!resolvedRef.current) return;
      navigate('/onboarding', { replace: true });
    }, 3000);

    resolve();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoaded, isSignedIn, getToken, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #EEF2FF, #FFFFFF, #FDF2EC)',
        fontFamily: 'Inter, sans-serif',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Logo */}
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            background: '#312E81',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <svg
            width="28"
            height="28"
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
          <div
            style={{
              position: 'absolute',
              bottom: '0px',
              left: '4px',
              right: '4px',
              height: '3px',
              background: '#E8835C',
              borderRadius: '0 0 3px 3px',
            }}
          />
        </div>

        {/* Text */}
        <p
          style={{
            fontSize: '16px',
            fontWeight: 500,
            color: '#334155',
            marginBottom: '16px',
          }}
        >
          Setting up your duka...
        </p>

        {/* Spinner */}
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: '#312E81', margin: '0 auto' }}
        />
      </div>
    </div>
  );
}
