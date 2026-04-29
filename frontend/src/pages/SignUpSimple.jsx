import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import { AlertCircle } from 'lucide-react';

const SignUpPage = () => {
  const { signUp, isLoaded } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleGoogleSignUp = async () => {
    try {
      if (!isLoaded) return;
      
      setLoading(true);
      setLoadingProvider('google');
      setError('');
      
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sign-up',
        redirectUrlComplete: '/sign-up',
      });
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError('Failed to sign up with Google.');
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleAppleSignUp = async () => {
    try {
      if (!isLoaded) return;
      
      setLoading(true);
      setLoadingProvider('apple');
      setError('');
      
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: '/sign-up',
        redirectUrlComplete: '/sign-up',
      });
    } catch (err) {
      console.error('Apple sign-up error:', err);
      setError('Failed to sign up with Apple.');
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 md:p-10"
      style={{
        background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 50%, #FDF2EC 100%)',
      }}
    >
      {/* Subtle Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, #312E81 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Auth Card */}
      <div className="relative w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-neutral-100 p-7 md:p-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-[28px] font-bold text-[#312E81]">
            Duka<span style={{ color: '#E8835C' }}>Flow</span>
          </h1>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-bold text-neutral-900 mb-2">
            Create Your Duka
          </h2>
          <p className="text-[15px] text-neutral-500">
            Start your 14-day free trial
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-8">
          {/* Google Button */}
          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full h-[52px] bg-white border-[1.5px] border-neutral-300 rounded-xl font-medium text-[16px] text-neutral-700 flex items-center justify-center gap-3 hover:border-[#312E81] hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18.1713 8.36791H17.5001V8.33325H10.0001V11.6666H14.7096C14.0225 13.607 12.1763 14.9999 10.0001 14.9999C7.23882 14.9999 5.00007 12.7612 5.00007 9.99992C5.00007 7.23867 7.23882 4.99992 10.0001 4.99992C11.2746 4.99992 12.4342 5.48075 13.3171 6.26617L15.6742 3.909C14.1859 2.52217 12.1951 1.66659 10.0001 1.66659C5.39799 1.66659 1.66675 5.39784 1.66675 9.99992C1.66675 14.602 5.39799 18.3333 10.0001 18.3333C14.6021 18.3333 18.3334 14.602 18.3334 9.99992C18.3334 9.44117 18.2763 8.89575 18.1713 8.36791Z" fill="#FFC107"/>
              <path d="M2.62756 6.12117L5.36548 8.12909C6.10631 6.29534 7.90048 4.99992 10.0001 4.99992C11.2747 4.99992 12.4343 5.48075 13.3172 6.26617L15.6743 3.909C14.186 2.52217 12.1952 1.66659 10.0001 1.66659C6.79923 1.66659 4.02339 3.47367 2.62756 6.12117Z" fill="#FF3D00"/>
              <path d="M10.0001 18.3333C12.1526 18.3333 14.1084 17.5095 15.5871 16.1708L13.0076 13.9874C12.1439 14.6452 11.0859 15.0008 10.0001 14.9999C7.83256 14.9999 5.99215 13.6178 5.2984 11.6891L2.58215 13.7833C3.96048 16.4816 6.76131 18.3333 10.0001 18.3333Z" fill="#4CAF50"/>
              <path d="M18.1713 8.36797H17.5V8.33331H10V11.6666H14.7096C14.3809 12.5902 13.7889 13.3972 13.0067 13.988L13.0076 13.9874L15.5871 16.1708C15.4046 16.3366 18.3333 14.1666 18.3333 9.99998C18.3333 9.44123 18.2762 8.89581 18.1713 8.36797Z" fill="#1976D2"/>
            </svg>
            {loading && loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
          </button>

          {/* Apple Button */}
          <button
            onClick={handleAppleSignUp}
            disabled={loading}
            className="w-full h-[52px] bg-black border-[1.5px] border-neutral-800 rounded-xl font-medium text-[16px] text-white flex items-center justify-center gap-3 hover:bg-neutral-900 hover:border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            {loading && loadingProvider === 'apple' ? 'Connecting...' : 'Continue with Apple'}
          </button>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-[14px] text-neutral-500 mb-6">
          Already have a duka?{' '}
          <Link 
            to="/sign-in" 
            className="text-[#312E81] font-medium hover:underline"
          >
            Sign in →
          </Link>
        </p>

        {/* Terms */}
        <p className="text-center text-[12px] text-neutral-400">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
