import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Store, ArrowRight, Check, Loader2 } from 'lucide-react';

const OnboardingShopName = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  // Get first name from Clerk
  const firstName = user?.firstName || '';

  const [shopName, setShopName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [errors, setErrors] = useState({});
  const [subdomainStatus, setSubdomainStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [suggestions, setSuggestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default shop name from Clerk first name
  useEffect(() => {
    if (firstName && !shopName) {
      const defaultName = `${firstName}'s Shop`;
      setShopName(defaultName);
      setSubdomain(slugify(defaultName));
    }
  }, [firstName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progress saving: if step 2 already done, redirect there
  useEffect(() => {
    const step2 = localStorage.getItem('onboarding_step2');
    if (step2) {
      const parsed = JSON.parse(step2);
      if (parsed.businessType) {
        navigate('/dashboard', { replace: true });
        return;
      }
    }
    // If step 1 already saved but not step 2, restore
    const saved = localStorage.getItem('onboarding_step1');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.shopName) setShopName(data.shopName);
      if (data.subdomain) setSubdomain(data.subdomain);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Slugify: lowercase, replace spaces/special chars with hyphens, remove apostrophes
  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/['']/g, '')                   // remove apostrophes
      .replace(/[^a-z0-9\s-]/g, '')           // remove special chars
      .replace(/\s+/g, '-')                    // spaces → hyphens
      .replace(/-+/g, '-')                     // collapse hyphens
      .replace(/^-|-$/g, '')                   // trim leading/trailing hyphens
      .slice(0, 20);                           // max 20 chars
  };

  // Auto-generate subdomain from shop name
  const handleShopNameChange = (e) => {
    const value = e.target.value;
    setShopName(value);
    const slug = slugify(value);
    setSubdomain(slug);
    if (errors.shopName) setErrors(prev => ({ ...prev, shopName: '' }));
  };

  // Handle subdomain input (enforce rules)
  const handleSubdomainChange = (e) => {
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20);
    setSubdomain(value);
    if (errors.subdomain) setErrors(prev => ({ ...prev, subdomain: '' }));
  };

  // Check subdomain availability — 500ms debounce after typing stops
  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus(null);
      setSuggestions([]);
      return;
    }

    setSubdomainStatus('checking');
    setSuggestions([]);

    const timer = setTimeout(() => {
      // Simulated availability check
      const taken = ['admin', 'test', 'demo', 'shop', 'store', 'www', 'api', 'help', 'support'];
      const isAvailable = !taken.includes(subdomain);

      setSubdomainStatus(isAvailable ? 'available' : 'taken');

      if (!isAvailable) {
        setSuggestions([
          `${subdomain}-ke`,
          `${subdomain}254`,
          `my-${subdomain}`,
          `${subdomain}-shop`,
        ].map(s => s.slice(0, 20)));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain]);

  // Validation
  const validate = useCallback(() => {
    const errs = {};

    if (!shopName.trim() || shopName.trim().length < 3) {
      errs.shopName = 'Shop name must be at least 3 characters';
    } else if (shopName.trim().length > 50) {
      errs.shopName = 'Shop name must be 50 characters or less';
    }

    if (!subdomain.trim()) {
      errs.subdomain = 'Web address is required';
    } else if (subdomain.length < 3) {
      errs.subdomain = 'Web address must be at least 3 characters';
    } else if (!/^[a-z0-9-]+$/.test(subdomain)) {
      errs.subdomain = 'Only letters, numbers, and hyphens allowed';
    } else if (subdomainStatus === 'taken') {
      errs.subdomain = 'This address is already taken — pick another';
    } else if (subdomainStatus === 'checking') {
      errs.subdomain = 'Wait — checking availability…';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [shopName, subdomain, subdomainStatus]);

  const canContinue = shopName.trim().length >= 3 && subdomain.length >= 3 && subdomainStatus === 'available';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!canContinue) return;

    setIsSubmitting(true);

    try {
      // Save to localStorage for step 2
      localStorage.setItem('onboarding_step1', JSON.stringify({
        shopName: shopName.trim(),
        subdomain: subdomain.trim(),
      }));

      navigate('/onboarding/business-type');
    } catch (err) {
      console.error('Save error:', err);
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 50%, #FDF2EC 100%)' }}
    >
      {/* Card */}
      <div className="w-full max-w-[520px] tablet:max-w-[480px] bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 animate-fade-in"
        style={{ borderRadius: '24px', animation: 'fadeIn 0.3s ease' }}>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-medium text-neutral-500">Step 1 of 2</span>
          <div className="flex gap-1.5">
            <div className="w-8 h-1.5 rounded-full bg-[#312E81]" />
            <div className="w-8 h-1.5 rounded-full bg-neutral-200" />
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#312E81]">
            Duka<span style={{ color: '#E8835C' }}>Flow</span>
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-[22px] sm:text-[28px] font-bold text-neutral-900 text-center mb-2">
          Name Your Shop
        </h2>
        <p className="text-[14px] sm:text-[15px] text-neutral-500 text-center mb-8">
          This is how your duka will appear
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Form-level Error Banner */}
          {Object.keys(errors).filter(k => k !== 'submit').length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl" role="alert" aria-live="polite">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Please fix the following errors:
              </p>
              <ul className="text-xs text-red-700 space-y-1 ml-5 list-disc">
                {Object.entries(errors).filter(([k]) => k !== 'submit').map(([_, msg]) => (
                  <li key={_}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Shop Name
            </label>
            <div className="relative">
              <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={shopName}
                onChange={handleShopNameChange}
                placeholder={`${firstName ? `${firstName}'s Shop` : 'Enter shop name'}`}
                className={`w-full h-[48px] sm:h-[52px] pl-[44px] pr-4 bg-white border-[1.5px] rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-[#312E81]/10 transition-all duration-200 ${
                  errors.shopName
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-neutral-300 focus:border-[#312E81]'
                }`}
                style={{ borderRadius: '12px', fontSize: '16px' }}
              />
            </div>
            {errors.shopName && (
              <p className="mt-1.5 text-xs text-red-600">{errors.shopName}</p>
            )}
          </div>

          {/* Subdomain */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Your DukaFlow Web Address
            </label>
            <div className="flex rounded-xl overflow-hidden border-[1.5px] border-neutral-300 focus-within:border-[#312E81] focus-within:ring-4 focus-within:ring-[#312E81]/10 transition-all duration-200"
              style={{ borderRadius: '12px' }}>
              <input
                type="text"
                value={subdomain}
                onChange={handleSubdomainChange}
                placeholder="your-shop"
                className={`flex-1 h-[48px] sm:h-[52px] px-4 bg-white text-base focus:outline-none ${
                  errors.subdomain ? 'border-red-500' : ''
                }`}
                style={{ fontSize: '16px', border: 'none', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}
              />
              <span className="flex items-center px-4 bg-neutral-50 border-l border-neutral-200 text-sm text-neutral-600 whitespace-nowrap"
                style={{ borderLeft: '1.5px solid #E2E8F0' }}>
                .dukaflow.com
              </span>
            </div>

            {/* Availability Status */}
            {subdomainStatus === 'checking' && (
              <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin text-neutral-400" />
                Checking availability…
              </p>
            )}
            {subdomainStatus === 'available' && (
              <p className="mt-2 text-xs text-green-600 flex items-center gap-1.5">
                <Check size={14} />
                <span className="font-medium">✓ Available</span> — {subdomain}.dukaflow.com is yours!
              </p>
            )}
            {subdomainStatus === 'taken' && (
              <div className="mt-2">
                <p className="text-xs text-red-600 flex items-center gap-1.5 mb-2">
                  <span className="font-bold">✗</span> Taken — Try these alternatives:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSubdomain(sug)}
                      className="px-3 py-1.5 text-xs bg-[#EEF2FF] text-[#312E81] rounded-lg hover:bg-[#E0E7FF] transition-colors duration-200 font-medium"
                    >
                      {sug}.dukaflow.com
                    </button>
                  ))}
                </div>
              </div>
            )}
            {errors.subdomain && (
              <p className="mt-1.5 text-xs text-red-600">{errors.subdomain}</p>
            )}
          </div>

          {/* Error Summary */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Continue Button */}
          <button
            type="submit"
            disabled={!canContinue || isSubmitting}
            className={`w-full h-[48px] sm:h-[52px] mt-8 font-semibold text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
              canContinue && !isSubmitting
                ? 'bg-[#312E81] hover:bg-[#1E1B4B] text-white shadow-md hover:shadow-lg'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
            style={{ borderRadius: '12px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Terms */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-[#312E81] hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[#312E81] hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default OnboardingShopName;
