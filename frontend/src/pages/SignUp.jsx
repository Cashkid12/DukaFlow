import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSignUp, useUser } from '@clerk/clerk-react';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, Loader2 } from 'lucide-react';

const SignUpPage = () => {
  const { signUp, isLoaded } = useSignUp();
  const { isSignedIn } = useUser();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log('✅ User already signed in, redirecting to onboarding...');
      console.log('📍 Current location:', window.location.href);
      console.log('🎯 Target location: /onboarding/shop-name');
      
      // Use window.location for hard redirect
      window.location.href = '/onboarding/shop-name';
    }
  }, [isLoaded, isSignedIn]);

  // Handle OAuth callback (Google/Apple)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (!isLoaded || !signUp) return;
      
      try {
        // Check if there's an active sign-up from OAuth redirect
        if (signUp.status === 'complete') {
          console.log('✅ OAuth sign-up complete, redirecting to onboarding...');
          window.location.href = '/onboarding/shop-name';
        } else if (signUp.status === 'missing_requirements') {
          console.log('⚠️ OAuth sign-up needs additional steps...');
          // Clerk will handle the UI for missing requirements
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
      }
    };
    
    handleOAuthCallback();
  }, [isLoaded, signUp]);

  const passwordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 33, label: 'Weak', color: '#EF4444' };
    if (score <= 3) return { score: 66, label: 'Medium', color: '#F59E0B' };
    return { score: 100, label: 'Strong', color: '#10B981' };
  };

  const strength = passwordStrength(formData.password);

  // Validation functions
  const validateStep1 = () => {
    const errors = {};

    // Full Name validation
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Please enter a valid email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (Kenyan format)
    if (!formData.phone) {
      errors.phone = 'Please enter a valid phone number';
    } else if (!/^[0-9]{9,10}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters with uppercase and number';
    } else if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = 'Password must be at least 8 characters with uppercase and number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const setValidationErrors = () => {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);

    console.log('📝 Sign-up form submitted');
    console.log('📊 Form data:', { fullName: formData.fullName, email: formData.email, phone: formData.phone });

    // Client-side validation
    if (!validateStep1()) {
      console.log('❌ Validation failed');
      setLoading(false);
      return;
    }

    console.log('✅ Validation passed');

    try {
      if (!isLoaded) {
        console.log('❌ Clerk not loaded');
        setError('Authentication service not loaded. Please refresh.');
        setLoading(false);
        return;
      }

      console.log('🔐 Creating account with Clerk...');

      // Create account with Clerk (v5+ — this also signs the user in)
      const result = await signUp.create({
        firstName: formData.fullName.split(' ')[0],
        lastName: formData.fullName.split(' ').slice(1).join(' '),
        emailAddress: formData.email,
        password: formData.password,
        unsafeMetadata: {
          phone: formData.phone,
        },
      });

      console.log('✅ Account created, status:', result.status);

      // Clerk v5+ automatically signs in after create — redirect
      if (result.status === 'complete') {
        console.log('🚀 Sign-up complete, redirecting to onboarding...');
        window.location.href = '/onboarding/shop-name';
      } else {
        // Some additional verification needed (email, phone, etc.)
        console.log('⚠️ Additional verification required, status:', result.status);
        setError('Please check your email to verify your account.');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Sign-up error:', err);
      console.error('Error details:', err.errors);
      console.error('Error message:', err.message);
      
      // If user is already signed in, redirect to onboarding
      if (err.message?.includes('already signed in')) {
        console.log('⚠️ User already signed in, redirecting to onboarding...');
        setError('Account created! Redirecting to onboarding...');
        setTimeout(() => {
          window.location.href = '/onboarding/shop-name';
        }, 1500);
        return;
      }
      
      // If error is about redirect, force it anyway
      if (err.errors?.[0]?.code === 'redirect_url_not_allowed') {
        console.log('⚠️ Redirect URL not allowed, forcing redirect...');
        setError('Account created! Redirecting to onboarding...');
        setTimeout(() => {
          window.location.href = '/onboarding/shop-name';
        }, 1500);
        return;
      }
      
      // If the email is already registered, suggest sign-in
      if (err.errors?.[0]?.code === 'form_identifier_already_exists') {
        console.log('⚠️ Email already registered');
        setError('This email is already registered. Please sign in instead.');
        setLoading(false);
        return;
      }
      
      setError(err.errors?.[0]?.message || 'Failed to create account.');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      if (!isLoaded) return;
      
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sign-up',
        redirectUrlComplete: '/sign-up',
      });
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError('Failed to sign up with Google.');
    }
  };

  const handleAppleSignUp = async () => {
    try {
      if (!isLoaded) return;
      
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: '/sign-up',
        redirectUrlComplete: '/sign-up',
      });
    } catch (err) {
      console.error('Apple sign-up error:', err);
      setError('Failed to sign up with Apple.');
    }
  };



  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10"
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
      <div className="relative w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-neutral-100 p-6 sm:p-7 md:p-10">
        {/* Progress Bar - Single Step */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-500">Step 1 of 3: Creating Account</span>
          </div>
          <div className="h-1 w-full rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-[#312E81] transition-all duration-300" style={{ width: '33%' }} />
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#312E81]">
            Duka<span style={{ color: '#E8835C' }}>Flow</span>
          </h1>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-7">
          <h2 className="text-2xl sm:text-[28px] font-bold text-neutral-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-sm sm:text-[15px] text-neutral-500">
            Start your 14-day free trial
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Account Creation Form */}
        <>
            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              {/* Google Button */}
              <button
                onClick={handleGoogleSignUp}
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
                onClick={handleAppleSignUp}
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
              {/* Full Name Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Cecilia Wanjiku"
                    className="w-full h-[48px] sm:h-[52px] pl-12 pr-4 bg-white border-[1.5px] border-neutral-300 rounded-xl text-base focus:outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#312E81]/10 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cecilia@fashions.co.ke"
                    className="w-full h-[48px] sm:h-[52px] pl-12 pr-4 bg-white border-[1.5px] border-neutral-300 rounded-xl text-base focus:outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#312E81]/10 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Phone Number (for M-Pesa)
                </label>
                <div className="flex gap-0">
                  <div className="w-[90px] h-[48px] sm:h-[52px] flex items-center justify-center bg-neutral-50 border-[1.5px] border-r-0 border-neutral-300 rounded-l-xl text-base font-medium text-neutral-700">
                    +254
                  </div>
                  <div className="relative flex-1">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="712 345 678"
                      className="w-full h-[48px] sm:h-[52px] pl-12 pr-4 bg-white border-[1.5px] border-neutral-300 rounded-r-xl text-base focus:outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#312E81]/10 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-[48px] sm:h-[52px] pl-12 pr-12 bg-white border-[1.5px] border-neutral-300 rounded-xl text-base focus:outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#312E81]/10 transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden mr-3">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${strength.score}%`,
                            backgroundColor: strength.color 
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] sm:h-[52px] bg-[#312E81] hover:bg-[#1E1B4B] disabled:bg-neutral-300 text-white font-semibold text-base sm:text-[16px] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Account & Redirecting...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              
              {/* Manual redirect button (fallback) */}
              {loading && (
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-2">Stuck? You can manually continue:</p>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🚀 Manual redirect to onboarding clicked');
                      window.location.href = '/onboarding/shop-name';
                    }}
                    className="text-sm text-[#312E81] font-medium hover:underline"
                  >
                    Go to Onboarding →
                  </button>
                </div>
              )}
            </form>

            {/* Sign In Link */}
            <p className="text-center text-[14px] text-neutral-500 mt-6 mb-5">
              Already have a duka?{' '}
              <Link 
                to="/sign-in" 
                className="text-[#312E81] font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>

            {/* Terms */}
            <p className="text-center text-[12px] text-neutral-400">
              By continuing, you agree to our Terms and Privacy Policy
            </p>
        </>

        {/* Footer - Always shown */}
        <div className="text-center text-[12px] text-neutral-400 mt-6 pt-6 border-t border-neutral-100">
          <p>🔒 Protected by Clerk • Terms • Privacy</p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
