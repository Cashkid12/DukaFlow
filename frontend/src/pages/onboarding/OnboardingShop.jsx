import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Store, Check, Upload } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const OnboardingShop = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shopName: '',
    subdomain: '',
    businessType: '',
    location: '',
    logo: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Load saved draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('onboarding_step2');
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
    }

    // Check if step 1 is completed
    const step1 = localStorage.getItem('onboarding_step1');
    if (!step1) {
      navigate('/onboarding');
    }
  }, [navigate]);

  // Auto-save draft
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('onboarding_step2', JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timeout);
  }, [formData]);

  // Auto-generate subdomain from shop name
  useEffect(() => {
    if (formData.shopName) {
      const slug = formData.shopName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      setFormData(prev => ({ ...prev, subdomain: slug }));
    }
  }, [formData.shopName]);

  // Check subdomain availability with debounce
  useEffect(() => {
    if (formData.subdomain.length >= 3) {
      setIsChecking(true);
      setSuggestions([]);
      
      // Simulate API check with 500ms debounce
      const timeout = setTimeout(() => {
        const taken = ['admin', 'test', 'demo', 'shop', 'store', 'www', 'api'];
        const isAvailable = !taken.includes(formData.subdomain);
        
        setSubdomainAvailable(isAvailable);
        setIsChecking(false);
        
        // Generate suggestions if taken
        if (!isAvailable) {
          const base = formData.subdomain;
          setSuggestions([
            `${base}-nbo`,
            `${base}254`,
            `${base}-shop`,
            `my-${base}`,
          ]);
        }
      }, 500);
      
      return () => clearTimeout(timeout);
    } else {
      setSubdomainAvailable(null);
      setSuggestions([]);
    }
  }, [formData.subdomain]);

  // Enforce lowercase, letters, numbers, hyphens only
  const handleSubdomainChange = (e) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setFormData({ ...formData, subdomain: value });
  };

  const businessTypes = [
    { id: 'clothing', name: 'Clothing Boutique', icon: '👗', color: '#312E81' },
    { id: 'electronics', name: 'Electronics Shop', icon: '📱', color: '#6366F1' },
    { id: 'grocery', name: 'Grocery & Duka', icon: '🛒', color: '#10B981' },
    { id: 'cosmetics', name: 'Cosmetics Shop', icon: '💄', color: '#E8835C' },
    { id: 'hardware', name: 'Hardware Store', icon: '🔧', color: '#F59E0B' },
    { id: 'pharmacy', name: 'Pharmacy', icon: '💊', color: '#EF4444' },
  ];

  const validate = () => {
    const newErrors = {};

    if (!formData.shopName.trim() || formData.shopName.trim().length < 3) {
      newErrors.shopName = 'Shop name must be at least 3 characters';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Web address is required';
    } else if (formData.subdomain.length < 3 || formData.subdomain.length > 20) {
      newErrors.subdomain = 'Web address must be 3-20 characters';
    } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Only letters, numbers, and hyphens allowed';
    } else if (subdomainAvailable === false) {
      newErrors.subdomain = 'This web address is already taken';
    }

    if (!formData.businessType) {
      newErrors.businessType = 'Please select a business type';
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
      // await api.post('/onboarding/step2', formData);
      
      // Save to localStorage for now
      localStorage.setItem('onboarding_step2', JSON.stringify(formData));
      
      // Navigate to next step
      navigate('/onboarding/ready');
    } catch (error) {
      console.error('Error saving shop details:', error);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding');
  };

  return (
    <OnboardingLayout currentStep={2}>
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
            <Store size={20} style={{ color: '#312E81' }} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Shop Details
          </h2>
        </div>
        <p className="text-sm text-neutral-500 mb-6 sm:mb-8">
          Tell us about your business
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

          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Shop Name *
            </label>
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              placeholder="Enter your shop name"
              className={`w-full h-12 px-4 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 text-base ${
                errors.shopName 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-neutral-300 focus:border-[#312E81]'
              }`}
            />
            {errors.shopName && (
              <p className="mt-2 text-xs text-red-600">{errors.shopName}</p>
            )}
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              DukaFlow Web Address *
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={formData.subdomain}
                onChange={handleSubdomainChange}
                placeholder="your-shop"
                className={`flex-1 h-12 px-4 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#312E81]/20 text-base ${
                  errors.subdomain 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-neutral-300 focus:border-[#312E81]'
                }`}
              />
              <span className="text-sm text-neutral-500 whitespace-nowrap flex items-center justify-center sm:justify-start">
                .dukaflow.com
              </span>
            </div>
            
            {/* Checking Status */}
            {isChecking && (
              <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
                <span className="inline-block w-3 h-3 border-2 border-neutral-300 border-t-[#312E81] rounded-full animate-spin"></span>
                Checking availability...
              </p>
            )}
            
            {/* Available */}
            {subdomainAvailable === true && !isChecking && (
              <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <Check size={14} /> Available — {formData.subdomain}.dukaflow.com is yours!
              </p>
            )}
            
            {/* Taken with Suggestions */}
            {subdomainAvailable === false && !isChecking && (
              <div className="mt-2">
                <p className="text-xs text-red-600 flex items-center gap-1 mb-2">
                  <span className="font-semibold">✗</span> Taken — Try these alternatives:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, subdomain: suggestion })}
                      className="px-3 py-1.5 text-xs bg-[#EEF2FF] text-[#312E81] rounded-lg hover:bg-[#E0E7FF] transition-colors duration-200 font-medium"
                    >
                      {suggestion}.dukaflow.com
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {errors.subdomain && (
              <p className="mt-2 text-xs text-red-600">{errors.subdomain}</p>
            )}
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              What type of duka do you run? *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {businessTypes.map((type) => {
                const isSelected = formData.businessType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, businessType: type.id })}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'border-[#312E81] bg-[#EEF2FF] shadow-md'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#312E81] flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                    
                    <div className={`text-2xl sm:text-3xl mb-2 transition-transform duration-200 ${
                      isSelected ? 'scale-110' : ''
                    }`}>
                      {type.icon}
                    </div>
                    <p
                      className={`text-xs sm:text-sm font-medium text-center ${
                        isSelected ? 'text-[#312E81]' : 'text-neutral-700'
                      }`}
                    >
                      {type.name}
                    </p>
                    
                    {/* Hover Effect Border */}
                    {isSelected && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-[#312E81] ring-offset-2 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
            {errors.businessType && (
              <p className="mt-2 text-xs text-red-600">{errors.businessType}</p>
            )}
          </div>

          {/* Shop Location (Optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Shop Location <span className="text-neutral-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., CBD, Nairobi"
              className="w-full h-12 px-4 rounded-lg border border-neutral-300 focus:border-[#312E81] focus:ring-2 focus:ring-[#312E81]/20 transition-all duration-200 text-base"
            />
          </div>

          {/* Logo Upload (Optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Shop Logo <span className="text-neutral-400">(Optional)</span>
            </label>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-[#312E81] transition-colors duration-200">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFormData({ ...formData, logo: file.name });
                  }
                }}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload" className="cursor-pointer">
                <Upload className="mx-auto mb-2 text-neutral-400" size={24} />
                <p className="text-sm text-neutral-600">
                  {formData.logo ? formData.logo : 'Click to upload logo'}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  PNG, JPG up to 5MB
                </p>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-6 h-12 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-all duration-200"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 h-12 font-semibold rounded-lg transition-all duration-200 ${
                isSubmitting
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#312E81] hover:bg-[#1E1B4B] text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
              <ArrowRight size={20} />
            </button>
          </div>
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

export default OnboardingShop;
