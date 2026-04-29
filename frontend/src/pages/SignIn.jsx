import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const SignInPage = () => {
  const navigate = useNavigate();
  const { signIn, isLoaded, setActive } = useSignIn();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (!isLoaded) return;

      // Start sign-in process
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/dashboard');
      } else {
        console.log('Sign-in result:', result);
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      // Show toast-style error
      setError(err.errors?.[0]?.message || 'Invalid email or password. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!isLoaded) return;
      
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Failed to sign in with Google.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      if (!isLoaded) return;
      
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('Apple sign-in error:', err);
      setError('Failed to sign in with Apple.');
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#312E81]">
            Duka<span style={{ color: '#E8835C' }}>Flow</span>
          </h1>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-bold text-neutral-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-[15px] text-neutral-500">
            Sign in to your duka dashboard
          </p>
        </div>

        {/* Error Message (Toast-style) */}
        {error && (
          <div 
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Authentication Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">
          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full h-[52px] bg-white border-[1.5px] border-neutral-300 rounded-xl font-medium text-[16px] text-neutral-700 flex items-center justify-center gap-3 hover:border-[#312E81] hover:bg-neutral-50 transition-all duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18.1713 8.36791H17.5001V8.33325H10.0001V11.6666H14.7096C14.0225 13.607 12.1763 14.9999 10.0001 14.9999C7.23882 14.9999 5.00007 12.7612 5.00007 9.99992C5.00007 7.23867 7.23882 4.99992 10.0001 4.99992C11.2746 4.99992 12.4342 5.48075 13.3171 6.26617L15.6742 3.909C14.1859 2.52217 12.1951 1.66659 10.0001 1.66659C5.39799 1.66659 1.66675 5.39784 1.66675 9.99992C1.66675 14.602 5.39799 18.3333 10.0001 18.3333C14.6021 18.3333 18.3334 14.602 18.3334 9.99992C18.3334 9.44117 18.2763 8.89575 18.1713 8.36791Z" fill="#FFC107"/>
              <path d="M2.62756 6.12117L5.36548 8.12909C6.10631 6.29534 7.90048 4.99992 10.0001 4.99992C11.2747 4.99992 12.4343 5.48075 13.3172 6.26617L15.6743 3.909C14.186 2.52217 12.1952 1.66659 10.0001 1.66659C6.79923 1.66659 4.02339 3.47367 2.62756 6.12117Z" fill="#FF3D00"/>
              <path d="M10.0001 18.3333C12.1526 18.3333 14.1084 17.5095 15.5871 16.1708L13.0076 13.9874C12.1439 14.6452 11.0859 15.0008 10.0001 14.9999C7.83256 14.9999 5.99215 13.6178 5.2984 11.6891L2.58215 13.7833C3.96048 16.4816 6.76131 18.3333 10.0001 18.3333Z" fill="#4CAF50"/>
              <path d="M18.1713 8.36797H17.5V8.33331H10V11.6666H14.7096C14.3809 12.5902 13.7889 13.3972 13.0067 13.988L13.0076 13.9874L15.5871 16.1708C15.4046 16.3366 18.3333 14.1666 18.3333 9.99998C18.3333 9.44123 18.2762 8.89581 18.1713 8.36797Z" fill="#1976D2"/>
            </svg>
            Continue with Google
          </button>

          {/* Apple Button */}
          <button
            onClick={handleAppleSignIn}
            className="w-full h-[52px] bg-black border-[1.5px] border-neutral-800 rounded-xl font-medium text-[16px] text-white flex items-center justify-center gap-3 hover:bg-neutral-900 hover:border-neutral-700 transition-all duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-sm text-neutral-400 uppercase">or</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                Email address
                {validationErrors.email && (
                  <AlertCircle size={16} className="text-red-500" />
                )}
              </span>
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (validationErrors.email) {
                    setValidationErrors({ ...validationErrors, email: '' });
                  }
                }}
                placeholder="cecilia@fashions.co.ke"
                className={`w-full h-[52px] pl-12 pr-4 bg-white border-[1.5px] rounded-xl text-[16px] focus:outline-none transition-all duration-200 ${
                  validationErrors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-neutral-300 focus:border-[#312E81] focus:ring-4 focus:ring-[#312E81]/10'
                }`}
                aria-invalid={!!validationErrors.email}
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
                autoComplete="email"
                required
              />
            </div>
            {validationErrors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle size={14} />
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                Password
                {validationErrors.password && (
                  <AlertCircle size={16} className="text-red-500" />
                )}
              </span>
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (validationErrors.password) {
                    setValidationErrors({ ...validationErrors, password: '' });
                  }
                }}
                placeholder="••••••••"
                className={`w-full h-[52px] pl-12 pr-12 bg-white border-[1.5px] rounded-xl text-[16px] focus:outline-none transition-all duration-200 ${
                  validationErrors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-neutral-300 focus:border-[#312E81] focus:ring-4 focus:ring-[#312E81]/10'
                }`}
                aria-invalid={!!validationErrors.password}
                aria-describedby={validationErrors.password ? 'password-error' : undefined}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle size={14} />
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-[18px] h-[18px] border border-neutral-300 rounded accent-[#312E81]"
              />
              <span className="text-sm text-neutral-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-[#312E81] hover:underline font-medium">
              Forgot password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-[#312E81] hover:bg-[#1E1B4B] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold text-[16px] rounded-xl shadow-md hover:shadow-lg disabled:shadow-none transition-all duration-200 hover:scale-[1.01] disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-[14px] text-neutral-500 mt-6 mb-6">
          Don't have a duka?{' '}
          <Link 
            to="/sign-up" 
            className="text-[#312E81] font-medium hover:underline"
          >
            Sign up free →
          </Link>
        </p>

        {/* Footer */}
        <div className="text-center text-[12px] text-neutral-400 pt-6 border-t border-neutral-100">
          <p>🔒 Protected by Clerk • Terms • Privacy</p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
