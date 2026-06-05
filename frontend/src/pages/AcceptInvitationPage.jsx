import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Loader2, CheckCircle, AlertCircle, Clock, Store, Mail, Shield, User } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_STORAGE_KEY = 'dukaflow_invitation_token';

const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const { isLoaded: userLoaded } = useUser();

  const token = searchParams.get('token');
  const mode = searchParams.get('mode'); // 'complete' means after Clerk sign-up

  const [state, setState] = useState('loading'); // loading | error | valid | accepting | accepted | expired | already_accepted
  const [invitation, setInvitation] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [acceptError, setAcceptError] = useState('');

  // Store token in sessionStorage when present in URL
  useEffect(() => {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }, [token]);

  // Step 1: Verify invitation token
  useEffect(() => {
    const currentToken = token || sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!currentToken) {
      setState('error');
      setErrorMessage('No invitation token found. Please use the link from your invitation email.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/workers/verify-invitation?token=${currentToken}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          if (res.status === 410) {
            setState('expired');
            setErrorMessage(data.message);
          } else if (res.status === 400 && data.message?.includes('already been accepted')) {
            setState('already_accepted');
            setErrorMessage(data.message);
          } else {
            setState('error');
            setErrorMessage(data.message || 'Invalid invitation link.');
          }
          return;
        }

        setInvitation(data.data);
        setState('valid');
      } catch {
        setState('error');
        setErrorMessage('Unable to verify invitation. Please check your connection and try again.');
      }
    };

    verify();
  }, [token]);

  // Step 2: If user is signed in and mode is 'complete', accept the invitation
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    if (!isSignedIn) return;
    if (!invitation) return;

    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) return;

    // Auto-accept if signed in (either on first visit or after sign-up redirect)
    const accept = async () => {
      setState('accepting');
      setAcceptError('');
      try {
        const clerkToken = await getToken();
        const res = await fetch(`${API_BASE_URL}/workers/accept-invitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${clerkToken}`,
          },
          body: JSON.stringify({ invitationToken: storedToken }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setAcceptError(data.message || 'Failed to accept invitation.');
          setState('valid'); // Go back to valid state so they can retry
          return;
        }

        // Success!
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setState('accepted');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2500);
      } catch {
        setAcceptError('Unable to accept invitation. Please try again.');
        setState('valid');
      }
    };

    accept();
  }, [authLoaded, userLoaded, isSignedIn, invitation, getToken, navigate]);

  // Handle sign up redirect
  const handleSignUp = () => {
    // Clerk's ClerkProvider will handle the redirect
    // We redirect to sign-up and after sign-up Clerk sends to /auth-resolve
    // But we want them to come back here with mode=complete
    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const returnUrl = storedToken
      ? `/accept-invitation?token=${storedToken}&mode=complete`
      : '/dashboard';
    
    // Store the return URL for after sign-up
    sessionStorage.setItem('dukaflow_post_signup_redirect', returnUrl);
    window.location.href = '/sign-up';
  };

  const handleSignIn = () => {
    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const returnUrl = storedToken
      ? `/accept-invitation?token=${storedToken}&mode=complete`
      : '/dashboard';
    sessionStorage.setItem('dukaflow_post_signup_redirect', returnUrl);
    window.location.href = '/sign-in';
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (state === 'loading' || state === 'accepting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] via-white to-[#FDF2EC] p-4">
        <div className="text-center">
          <Loader2 size={40} className="text-[#312E81] animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-[#1E293B]">
            {state === 'accepting' ? 'Accepting your invitation...' : 'Verifying your invitation...'}
          </p>
          <p className="text-sm text-[#64748B] mt-1">Just a moment</p>
        </div>
      </div>
    );
  }

  // ─── Accepted (success) ──────────────────────────────────────────────────
  if (state === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] via-white to-[#FDF2EC] p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-[420px] w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">Welcome to the Team! 🎉</h2>
          <p className="text-sm text-[#64748B] mb-1">
            You've been added to <strong>{invitation?.shopName}</strong>
          </p>
          <p className="text-xs text-neutral-400 mb-6">Redirecting to your dashboard...</p>
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Invitation Card ─────────────────────────────────────────────────────
  const roleIcon = invitation?.role === 'Admin' ? Shield 
    : invitation?.role === 'Manager' ? Shield 
    : User;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] via-white to-[#FDF2EC] p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-[480px] w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <p className="text-3xl mb-1">🏪</p>
          <h1 className="text-2xl font-bold text-[#1E293B]">DukaFlow</h1>
        </div>

        {/* State 3: Expired Invitation */}
        {state === 'expired' && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-[#F59E0B]" />
            </div>
            <h2 className="text-lg font-bold text-[#1E293B] text-center mb-2">
              This Invitation Has Expired
            </h2>
            <p className="text-sm text-[#64748B] text-center mb-6">
              Please ask your admin to send you a new invitation.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-colors"
            >
              Back to Home
            </button>
          </>
        )}

        {/* State 4: Already Accepted */}
        {state === 'already_accepted' && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-[#10B981]" />
            </div>
            <h2 className="text-lg font-bold text-[#1E293B] text-center mb-2">
              You've Already Accepted This Invitation
            </h2>
            <p className="text-sm text-[#64748B] text-center mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-colors"
            >
              Go to Dashboard →
            </button>
          </>
        )}

        {/* State 5: Invalid Token */}
        {state === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-[#EF4444]" />
            </div>
            <h2 className="text-lg font-bold text-[#1E293B] text-center mb-2">
              Invalid Invitation Link
            </h2>
            <p className="text-sm text-[#64748B] text-center mb-6">
              This link is not valid. Please check the URL or ask your admin for a new invitation.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-colors"
            >
              Back to Home
            </button>
          </>
        )}

        {/* Valid invitation */}
        {state === 'valid' && invitation && (
          <>
            <h2 className="text-xl font-bold text-[#1E293B] text-center mb-1">You've Been Invited!</h2>
            <p className="text-sm text-[#64748B] text-center mb-6">
              Someone wants you to join their shop on DukaFlow
            </p>

            {/* Invitation Details Card */}
            <div className="bg-[#F8FAFC] rounded-xl p-5 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                  <Store size={18} className="text-[#312E81]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B]">Shop</p>
                  <p className="text-sm font-semibold text-[#1E293B] truncate">{invitation.shopName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-[#312E81]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B]">Invited as</p>
                  <p className="text-sm font-semibold text-[#1E293B]">{invitation.workerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                  <roleIcon size={18} className="text-[#312E81]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B]">Role</p>
                  <p className="text-sm font-semibold text-[#1E293B]">{invitation.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-[#312E81]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B]">Email</p>
                  <p className="text-sm font-semibold text-[#1E293B] truncate">{invitation.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-[#312E81]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#64748B]">Invited by</p>
                  <p className="text-sm font-semibold text-[#1E293B]">{invitation.invitedBy}</p>
                </div>
              </div>
            </div>

            {/* Accept error */}
            {acceptError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-[#EF4444]">
                {acceptError}
              </div>
            )}

            {/* CTA Buttons */}
            <button
              onClick={handleSignUp}
              className="w-full py-3.5 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-colors mb-3"
            >
              Accept & Create Account →
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-[#E2E8F0]" />
              <span className="text-xs text-[#94A3B8]">or</span>
              <div className="flex-1 h-px bg-[#E2E8F0]" />
            </div>

            <p className="text-sm text-[#64748B] text-center mb-2">
              Already have a DukaFlow account?
            </p>
            <button
              onClick={handleSignIn}
              className="w-full py-3 border border-[#CBD5E1] text-[#1E293B] rounded-xl font-semibold text-sm hover:bg-neutral-50 transition-colors"
            >
              Sign In to Accept →
            </button>

            <p className="text-xs text-[#94A3B8] text-center mt-4">
              ⓘ This invitation expires in 7 days
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
