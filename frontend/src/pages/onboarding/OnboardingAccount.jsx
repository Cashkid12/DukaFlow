import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ArrowRight, Phone, User } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { validateKenyanPhone, formatKenyanPhone, validateFullName } from '../../utils/onboarding';

const OnboardingAccount = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'owner',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill data from Clerk
  useEffect(() => {
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        phone: user.unsafeMetadata?.phone || '',
      }));
    }
  }, [isLoaded, user]);

  // Load saved draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('onboarding_step1');
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('onboarding_step1', JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timeout);
  }, [formData]);

  const validate = () => {
    const newErrors = {};

    if (!validateFullName(formData.fullName)) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateKenyanPhone(formData.phone)) {
      newErrors.phone = 'Enter a valid Kenyan phone number (e.g., +254712345678)';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // TODO: Save to backend API
      // await api.post('/onboarding/step1', formData);
      
      // Save to localStorage for now
      localStorage.setItem('onboarding_step1', JSON.stringify(formData));
      
      // Navigate to next step
      navigate('/onboarding/shop');
    } catch (error) {
      console.error('Error saving account details:', error);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingLayout currentStep={1}>
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
            <User size={20} style={{ color: '#312E81' }} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Account Details
          </h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 sm:mb-8">
          Almost done! Just confirm your details and select your role
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div 
              className="p-4 bg-red-50 border border-red-200 rounded-lg animate-shake"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                <span>⚠️</span> Please fill in all required fields
              </p>
              <ul className="text-xs text-red-700 space-y-1 ml-6 list-disc">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Your full name"
              className={`w-full h-12 sm:h-12 px-4 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 text-base ${
                errors.fullName 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-neutral-300 focus:border-[#312E81]'
              }`}
            />
            {errors.fullName && (
              <p className="mt-2 text-xs text-red-600">{errors.fullName}</p>
            )}
            {formData.fullName && (
              <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                ✓ Pre-filled from your account
              </p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full h-12 px-4 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 cursor-not-allowed text-base"
            />
            <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
              ✓ Verified email from your account
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone 
                size={18} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" 
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  phone: formatKenyanPhone(e.target.value) 
                })}
                placeholder="+254712345678"
                className={`w-full h-12 pl-11 pr-4 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 text-base ${
                  errors.phone 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-neutral-300 focus:border-[#312E81]'
                }`}
              />
              {formData.phone && (
                <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  ✓ Pre-filled from your account
                </p>
              )}
            </div>
            {errors.phone && (
              <p className="mt-2 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Your Role *
            </label>
            <div className="space-y-3">
              {[
                { 
                  value: 'owner', 
                  label: 'Shop Owner', 
                  desc: 'Full access to all features and settings' 
                },
                { 
                  value: 'manager', 
                  label: 'Manager', 
                  desc: 'Can manage inventory, sales, and workers' 
                },
                { 
                  value: 'staff', 
                  label: 'Staff', 
                  desc: 'Sales and basic inventory access only' 
                },
              ].map((role) => (
                <label
                  key={role.value}
                  className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                    formData.role === role.value
                      ? 'border-[#312E81] bg-[#EEF2FF]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1"
                  />
                  <div>
                    <p className={`text-sm font-semibold ${
                      formData.role === role.value ? 'text-[#312E81]' : 'text-neutral-900'
                    }`}>
                      {role.label}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{role.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="mt-2 text-xs text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Continue Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-12 sm:h-12 flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 text-base ${
              isSubmitting
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-[#312E81] hover:bg-[#1E1B4B] text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
            <ArrowRight size={20} />
          </button>
        </form>

        {/* Terms Agreement */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-[#312E81] hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-[#312E81] hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </OnboardingLayout>
  );
};

export default OnboardingAccount;
