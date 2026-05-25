import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import {
  Store, ArrowRight, ArrowLeft, Check, Loader2, Shirt, Smartphone,
  ShoppingCart, Sparkles, Wrench, Pill, MapPin,
  ChevronRight,
} from 'lucide-react';

/* ──────────────────────────────────────────────
   BUSINESS TYPE CONFIG (with preset categories & attributes)
   ────────────────────────────────────────────── */
const BUSINESS_TYPES = [
  { id: 'clothing', name: 'Clothing Boutique', subtitle: 'Fashion & apparel', icon: Shirt,
    categories: ['Trousers', 'Shirts', 'Dresses', 'Jackets', 'Shoes', 'Accessories'],
    attributes: ['Size', 'Color', 'Material', 'Brand'] },
  { id: 'electronics', name: 'Electronics Shop', subtitle: 'Phones & gadgets', icon: Smartphone,
    categories: ['Phones', 'Laptops', 'Accessories', 'Parts', 'Cables', 'Audio'],
    attributes: ['Brand', 'Model', 'Condition', 'Warranty'] },
  { id: 'grocery', name: 'Grocery & Duka', subtitle: 'Food & essentials', icon: ShoppingCart,
    categories: ['Beverages', 'Dry Foods', 'Fresh Produce', 'Dairy', 'Snacks', 'Household'],
    attributes: ['Weight/Volume', 'Brand', 'Expiry Date', 'Organic'] },
  { id: 'cosmetics', name: 'Cosmetics Shop', subtitle: 'Beauty & makeup', icon: Sparkles,
    categories: ['Makeup', 'Skincare', 'Hair', 'Fragrance', 'Nails', 'Tools'],
    attributes: ['Shade', 'Skin Type', 'Expiry Date', 'Brand'] },
  { id: 'hardware', name: 'Hardware Store', subtitle: 'Tools & supplies', icon: Wrench,
    categories: ['Tools', 'Paint', 'Electrical', 'Plumbing', 'Fasteners', 'Building'],
    attributes: ['Material', 'Size/Dimensions', 'Unit', 'Brand'] },
  { id: 'pharmacy', name: 'Pharmacy', subtitle: 'Medicines & health', icon: Pill,
    categories: ['Prescription', 'OTC', 'First Aid', 'Vitamins', 'Personal Care', 'Baby'],
    attributes: ['Strength/Dosage', 'Form', 'Expiry Date', 'Prescription Required'] },
];

/* ──────────────────────────────────────────────
   STEP DEFINITIONS
   ────────────────────────────────────────────── */
const STEPS = [
  { key: 'shopName', label: 'Shop Name', required: true },
  { key: 'businessType', label: 'Business Type', required: true },
  { key: 'confirmation', label: 'Confirmation', required: true },
  { key: 'location', label: 'Shop Location', required: false },
  { key: 'source', label: 'How You Heard', required: false },
  { key: 'size', label: 'Shop Size', required: false },
];

const SOURCE_OPTIONS = [
  { id: 'friend', label: 'From a friend' },
  { id: 'facebook', label: 'Facebook / Instagram' },
  { id: 'whatsapp', label: 'WhatsApp group' },
  { id: 'google', label: 'Google search' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'other', label: 'Other' },
];

const SIZE_OPTIONS = [
  { id: 'lt100', label: 'Less than 100 products' },
  { id: '100-500', label: '100 - 500 products' },
  { id: '500-2000', label: '500 - 2,000 products' },
  { id: 'gt2000', label: 'More than 2,000 products' },
];

const PLAN_RECOMMENDATIONS = {
  'lt100': 'Starta Plan (KSh 750/mo) would be perfect for you!',
  '100-500': 'Kuuza Plan (KSh 1,500/mo) is ideal for your size',
  '500-2000': 'Kuuza Plan (KSh 1,500/mo) works well',
  'gt2000': 'Biashara Plan (KSh 3,000/mo) is best for large inventory',
};

/* ──────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────── */
const slugify = (text) => text
  .toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20);

const takenSlugs = ['admin', 'test', 'demo', 'shop', 'store', 'www', 'api', 'help', 'support'];

/* ──────────────────────────────────────────────
   PROGRESS INDICATOR
   ────────────────────────────────────────────── */
const ProgressBar = ({ current, stepKeys }) => {
  const currentIdx = stepKeys.indexOf(current);
  return (
    <div className="mb-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#64748B]">Step {currentIdx + 1} of {stepKeys.length}</span>
        <span className="text-xs text-neutral-400">
          {STEPS[currentIdx].required ? 'Required' : 'Optional'} step
        </span>
      </div>

      {/* Dots row — continuous line with dots placed on it */}
      <div className="relative mb-1">
        {/* Continuous line behind dots */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[10px] right-[10px] h-[2px] bg-neutral-200 rounded-full" />

        {/* Dots */}
        <div className="relative flex justify-between">
          {stepKeys.map((key, i) => {
            const isCompleted = i < currentIdx;
            const isActive = i === currentIdx;
            return (
              <div key={key} className="flex flex-col items-center" style={{ width: '20px' }}>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isCompleted ? 'bg-[#10B981]' : isActive ? 'bg-[#312E81] ring-4 ring-[#312E81]/20' : 'bg-neutral-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={10} className="text-white" strokeWidth={3} />
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels row */}
      <div className="hidden sm:flex justify-between">
        {stepKeys.map((key, i) => {
          const stepDef = STEPS.find(s => s.key === key);
          const isCompleted = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={key} className="flex flex-col items-center" style={{ width: '64px', marginLeft: i === 0 ? '0' : '0', marginRight: i === stepKeys.length - 1 ? '0' : '0' }}>
              <span
                className="text-[10px] font-medium text-center leading-tight"
                style={{ color: isCompleted ? '#10B981' : isActive ? '#312E81' : '#94A3B8' }}
              >
                {stepDef?.label}
              </span>
              {!stepDef?.required && (
                <span className="text-[9px] text-neutral-400">Optional</span>
              )}
              {stepDef?.required && (
                <span className="text-[9px]" style={{ color: isCompleted ? '#10B981' : isActive ? '#312E81' : '#94A3B8' }}>
                  Required
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────────────── */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const firstName = user?.firstName || '';

  const [currentStep, setCurrentStep] = useState('shopName');
  const [shopName, setShopName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainStatus, setSubdomainStatus] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState([]);
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('');
  const [shopSize, setShopSize] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  const debounceRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  /* ── Initialization ── */
  useEffect(() => {
    let cancelled = false;

    // Check backend: is user already onboarded?
    const checkOnboarding = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/auth/onboarding-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.onboarded) {
            navigate('/dashboard', { replace: true });
            return;
          }
        }
      } catch {
        // Backend unreachable — fall through to show onboarding
      }

      if (cancelled) return;

      // Restore progress from localStorage
      const progress = localStorage.getItem('onboarding_progress');
      if (progress) {
        const saved = JSON.parse(progress);
        if (saved.shopName) setShopName(saved.shopName);
        if (saved.subdomain) setSubdomain(saved.subdomain);
        if (saved.businessTypes) setSelectedBusinessTypes(saved.businessTypes);
        if (saved.location) setLocation(saved.location);
        if (saved.source) setSource(saved.source);
        if (saved.shopSize) setShopSize(saved.shopSize);
        if (saved.currentStep) setCurrentStep(saved.currentStep);
      }

      // Default shop name from Clerk
      if (firstName && !shopName) {
        const defaultName = `${firstName}'s Shop`;
        setShopName(defaultName);
        setSubdomain(slugify(defaultName));
      }
    };

    checkOnboarding();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Persist progress ── */
  useEffect(() => {
    localStorage.setItem('onboarding_progress', JSON.stringify({
      shopName, subdomain, businessTypes: selectedBusinessTypes,
      location, source, shopSize, currentStep,
    }));
  }, [shopName, subdomain, selectedBusinessTypes, location, source, shopSize, currentStep]);

  /* ── Subdomain availability check ── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus(null);
      setSuggestions([]);
      return;
    }
    setSubdomainStatus('checking');
    setSuggestions([]);
    debounceRef.current = setTimeout(() => {
      const available = !takenSlugs.includes(subdomain);
      setSubdomainStatus(available ? 'available' : 'taken');
      if (!available) {
        setSuggestions(
          [`${subdomain}-ke`, `${subdomain}254`, `my-${subdomain}`, `${subdomain}-shop`]
            .map(s => s.slice(0, 20))
        );
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [subdomain]);

  /* ── Shop name change ── */
  const handleShopNameChange = (e) => {
    const v = e.target.value;
    setShopName(v);
    setSubdomain(slugify(v));
    if (errors.shopName) setErrors(prev => ({ ...prev, shopName: '' }));
    setShowErrorBanner(false);
  };

  const handleSubdomainChange = (e) => {
    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
    setSubdomain(v);
    if (errors.subdomain) setErrors(prev => ({ ...prev, subdomain: '' }));
    setShowErrorBanner(false);
  };

  /* ── Business type toggle ── */
  const toggleBusinessType = (id) => {
    setSelectedBusinessTypes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setShowErrorBanner(false);
    setErrors(prev => ({ ...prev, businessType: '' }));
  };

  /* ── Validation ── */
  const validateStep = useCallback(() => {
    const errs = {};
    if (currentStep === 'shopName') {
      if (!shopName.trim() || shopName.trim().length < 3) errs.shopName = 'Shop name must be at least 3 characters';
      else if (shopName.trim().length > 50) errs.shopName = 'Shop name must be 50 characters or less';
      if (!subdomain.trim()) errs.subdomain = 'Web address is required';
      else if (subdomain.length < 3) errs.subdomain = 'At least 3 characters';
      else if (subdomainStatus === 'taken') errs.subdomain = 'This address is already taken';
      else if (subdomainStatus === 'checking') errs.subdomain = 'Wait — checking availability…';
    }
    if (currentStep === 'businessType') {
      if (selectedBusinessTypes.length === 0) errs.businessType = 'Select at least one business type';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [currentStep, shopName, subdomain, subdomainStatus, selectedBusinessTypes]);

  /* ── Navigation ── */
  const goNext = () => {
    if (currentStep === 'shopName' || currentStep === 'businessType') {
      if (!validateStep()) { setShowErrorBanner(true); return; }
    }
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
  };

  const goBack = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].key);
  };

  const handleSkip = () => goNext();

  /* ── Final submit ── */
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const types = BUSINESS_TYPES.filter(t => selectedBusinessTypes.includes(t.id));
      const allCategories = [...new Set(types.flatMap(t => t.categories))];
      const allAttributes = [...new Set(types.flatMap(t => t.attributes))];
      const shopSlug = subdomain || slugify(shopName);

      const shopData = {
        shopName: shopName.trim(),
        slug: shopSlug,
        businessType: selectedBusinessTypes[0] || 'other',
        businessTypes: selectedBusinessTypes,
        ownerId: user?.id,
        location: location || '',
        source: source || '',
        shopSize: shopSize || '',
        settings: { categories: allCategories, attributes: allAttributes },
      };

      // Save step 1 & 2 for backward compatibility
      localStorage.setItem('onboarding_step1', JSON.stringify({ shopName: shopName.trim(), subdomain: shopSlug }));
      localStorage.setItem('onboarding_step2', JSON.stringify({ shopName: shopName.trim(), subdomain: shopSlug, businessType: selectedBusinessTypes[0] || 'other', categories: allCategories, attributes: allAttributes }));
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_completed_at', new Date().toISOString());
      localStorage.setItem('welcome_toast', JSON.stringify({ name: firstName, message: `Welcome to DukaFlow, ${firstName}! 🎉` }));
      localStorage.removeItem('onboarding_progress');

      // API call
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/shop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            name: shopData.shopName,
            slug: shopData.slug,
            businessType: shopData.businessType,
            businessTypes: shopData.businessTypes,
            location: shopData.location || undefined,
            source: shopData.source || undefined,
            shopSize: shopData.shopSize || undefined,
            settings: shopData.settings,
          }),
        });
        if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Shop creation failed'); }
      } catch (apiErr) {
        console.warn('Backend not reachable — proceeding:', apiErr.message);
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Completion error:', err);
      setErrors({ submit: 'Failed to create shop. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Derive state ── */
  const canContinueShopName = shopName.trim().length >= 3 && subdomain.length >= 3 && subdomainStatus === 'available';
  const canContinueBusinessType = selectedBusinessTypes.length > 0;
  const typesData = BUSINESS_TYPES.filter(t => selectedBusinessTypes.includes(t.id));

  /* ── Step index ── */
  const stepKeys = STEPS.map(s => s.key);
  const currentIdx = stepKeys.indexOf(currentStep);

  /* ── Card component ── */
  const Card = ({ children, className = '' }) => (
    <div className={`w-full max-w-[560px] bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 ${className}`}
      style={{ borderRadius: '24px' }}>
      {children}
    </div>
  );

  /* ── Common button row ── */
  const ButtonRow = ({ canContinue, onContinue, continueLabel, showSkip, isLast, skipLabel }) => (
    <div className="flex flex-col sm:flex-row gap-3 mt-8">
      {currentIdx > 0 && (
        <button type="button" onClick={goBack} disabled={isSubmitting}
          className="h-[48px] sm:h-[52px] px-6 border-[1.5px] border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
          style={{ borderRadius: '12px' }}>
          <ArrowLeft size={18} /> Back
        </button>
      )}
      {showSkip && (
        <button type="button" onClick={handleSkip}
          className="h-[48px] sm:h-[52px] px-6 text-neutral-500 font-medium rounded-xl hover:bg-neutral-50 transition-all">
          {skipLabel || 'Skip'} <ChevronRight size={16} className="inline" />
        </button>
      )}
      <button type="button" onClick={isLast ? handleComplete : onContinue}
        disabled={!canContinue || isSubmitting}
        className={`flex-1 h-[48px] sm:h-[52px] font-semibold text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
          canContinue && !isSubmitting
            ? 'bg-[#312E81] hover:bg-[#1E1B4B] text-white shadow-md hover:shadow-lg'
            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
        }`} style={{ borderRadius: '12px' }}>
        {isSubmitting && isLast ? (
          <><Loader2 size={18} className="animate-spin" /> Creating…</>
        ) : (
          <>{continueLabel || 'Continue'} <ArrowRight size={18} /></>
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 50%, #FDF2EC 100%)' }}>
      <Card>
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-[28px] font-bold text-[#312E81]">
            Duka<span style={{ color: '#E8835C' }}>Flow</span>
          </h1>
        </div>

        {/* Progress Bar */}
        <ProgressBar current={currentStep} stepKeys={stepKeys} />

        {/* Error Banner */}
        {showErrorBanner && Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6" role="alert" aria-live="polite">
            <p className="text-sm font-semibold text-red-800 mb-1">Please fix the following:</p>
            <ul className="text-xs text-red-700 space-y-0.5 ml-5 list-disc">
              {Object.values(errors).map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </div>
        )}

        {/* ═══════════════ STEP 1: SHOP NAME ═══════════════ */}
        {currentStep === 'shopName' && (
          <>
            <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1E293B] text-center mb-2">Name Your Shop</h2>
            <p className="text-[14px] sm:text-[15px] text-[#64748B] text-center mb-6">This is how your duka will appear</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Shop Name</label>
                <div className="relative">
                  <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input type="text" value={shopName} onChange={handleShopNameChange}
                    placeholder={`${firstName ? `${firstName}'s Shop` : 'Enter shop name'}`}
                    className={`w-full h-[48px] sm:h-[52px] pl-[44px] pr-4 bg-white border-[1.5px] rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-[#312E81]/10 transition-all ${
                      errors.shopName ? 'border-red-500' : 'border-[#CBD5E1] focus:border-[#312E81]'
                    }`} style={{ borderRadius: '12px', fontSize: '16px' }} />
                </div>
                {errors.shopName && <p className="mt-1.5 text-xs text-red-600">{errors.shopName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#334155] mb-1.5">Your DukaFlow Web Address</label>
                <div className="flex rounded-xl overflow-hidden border-[1.5px] border-[#CBD5E1] focus-within:border-[#312E81] transition-all"
                  style={{ borderRadius: '12px' }}>
                  <input type="text" value={subdomain} onChange={handleSubdomainChange}
                    placeholder="your-shop"
                    className="flex-1 h-[48px] sm:h-[52px] px-4 bg-white text-base focus:outline-none"
                    style={{ fontSize: '16px' }} />
                  <span className="flex items-center px-4 bg-[#F8FAFC] border-l border-neutral-200 text-sm text-[#64748B] whitespace-nowrap">
                    .dukaflow.com
                  </span>
                </div>
                {subdomainStatus === 'checking' && (
                  <p className="mt-2 text-xs text-[#64748B] flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> Checking availability…
                  </p>
                )}
                {subdomainStatus === 'available' && (
                  <p className="mt-2 text-xs text-[#10B981] flex items-center gap-1.5">
                    <Check size={14} /> ✓ {subdomain}.dukaflow.com is yours!
                  </p>
                )}
                {subdomainStatus === 'taken' && (
                  <div className="mt-2">
                    <p className="text-xs text-[#EF4444] mb-2">✗ Taken — Try these:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s, i) => (
                        <button key={i} type="button" onClick={() => setSubdomain(s)}
                          className="px-3 py-1.5 text-xs bg-[#EEF2FF] text-[#312E81] rounded-lg hover:bg-[#E0E7FF] font-medium">
                          {s}.dukaflow.com
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {errors.subdomain && <p className="mt-1.5 text-xs text-red-600">{errors.subdomain}</p>}
              </div>
            </div>

            <ButtonRow canContinue={canContinueShopName} onContinue={goNext} continueLabel="Continue" />
          </>
        )}

        {/* ═══════════════ STEP 2: BUSINESS TYPE ═══════════════ */}
        {currentStep === 'businessType' && (
          <>
            <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1E293B] text-center mb-2">
              What type of duka do you run?
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#64748B] text-center mb-6">
              Select all that apply
            </p>

            {/* Selected count summary */}
            {selectedBusinessTypes.length > 0 && (
              <p className="text-[13px] sm:text-sm text-[#312E81] font-medium text-center mb-5">
                {selectedBusinessTypes.length} selected{selectedBusinessTypes.length > 1 ? ': ' : ' — '}
                {BUSINESS_TYPES.filter(t => selectedBusinessTypes.includes(t.id))
                  .map(t => t.name).join(' + ')}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUSINESS_TYPES.map((type) => {
                const IconComp = type.icon;
                const isSelected = selectedBusinessTypes.includes(type.id);
                return (
                  <button key={type.id} type="button" onClick={() => toggleBusinessType(type.id)}
                    className={`relative p-3.5 sm:p-5 rounded-xl text-center transition-all duration-150 ${
                      isSelected
                        ? 'border-2 border-[#312E81] bg-[#EEF2FF]'
                        : 'border-[1.5px] border-[#CBD5E1] bg-white hover:border-[#312E81] hover:bg-[#EEF2FF]'
                    }`} style={{ borderRadius: '12px' }}>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 rounded-full bg-[#312E81] flex items-center justify-center">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    <IconComp size={24} className="mx-auto mb-1.5 sm:mb-2 sm:size-8"
                      style={{ color: isSelected ? '#312E81' : '#64748B' }} />
                    <p className={`text-[14px] sm:text-[15px] font-medium ${isSelected ? 'text-[#312E81]' : 'text-[#1E293B]'}`}>
                      {type.name}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">{type.subtitle}</p>
                  </button>
                );
              })}
            </div>

            {errors.businessType && <p className="mt-3 text-xs text-[#EF4444] text-center">{errors.businessType}</p>}

            <ButtonRow canContinue={canContinueBusinessType} onContinue={goNext} continueLabel="Continue" />
          </>
        )}

        {/* ═══════════════ STEP 3: CONFIRMATION ═══════════════ */}
        {currentStep === 'confirmation' && (() => {
          const allCategories = [...new Set(typesData.flatMap(t => t.categories))];
          const allAttributes = [...new Set(typesData.flatMap(t => t.attributes))];
          const title = typesData.length === 1
            ? `Your ${typesData[0].name} is Ready!`
            : 'Your Shop is Ready!';
          return (
          <>
            {/* Success checkmark with scale-bounce */}
            <div className="flex justify-center mb-5">
              <div
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#10B981] flex items-center justify-center"
                style={{ animation: 'onboardingBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <Check size={28} className="text-white sm:size-10" strokeWidth={3} />
              </div>
            </div>

            <h2 className="text-[22px] sm:text-2xl font-bold text-[#1E293B] text-center mb-6">
              {title}
            </h2>

            {/* Categories Created */}
            {allCategories.length > 0 && (
              <div className="mb-5">
                <p className="text-[15px] sm:text-base font-semibold text-[#1E293B] mb-3">
                  📦 Categories Created
                </p>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat, i) => (
                    <span key={i}
                      className="px-3 py-1.5 text-[12px] sm:text-[13px] bg-neutral-100 text-neutral-700 rounded-full font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attributes Ready */}
            {allAttributes.length > 0 && (
              <div className="mb-5">
                <p className="text-[15px] sm:text-base font-semibold text-[#1E293B] mb-3">
                  📋 Attributes Ready
                </p>
                <div className="flex flex-wrap gap-2">
                  {allAttributes.map((attr, i) => (
                    <span key={i}
                      className="px-3 py-1.5 text-[12px] sm:text-[13px] bg-neutral-100 text-neutral-700 rounded-full font-medium"
                    >
                      {attr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info text */}
            <p className="text-[12px] sm:text-[13px] text-[#64748B] text-center mb-6">
              You can customize these anytime in Settings →
            </p>

            {/* Go to Dashboard button — full width */}
            <button type="button" onClick={handleComplete}
              disabled={isSubmitting}
              className="w-full h-[48px] sm:h-[52px] bg-[#312E81] hover:bg-[#1E1B4B] text-white font-semibold text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '12px' }}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Creating…</>
              ) : (
                <>🚀 Go to Dashboard</>
              )}
            </button>
          </>
          );
        })()}

        {/* ═══════════════ STEP 4: SHOP LOCATION (OPTIONAL) ═══════════════ */}
        {currentStep === 'location' && (
          <>
            <h2 className="text-[22px] sm:text-2xl font-bold text-[#1E293B] text-center mb-2">
              📍 Where is your shop located?
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#64748B] text-center mb-6">
              This helps with local supplier recommendations
            </p>

            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input type="text" value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="CBD, Nairobi"
                className="w-full h-[48px] sm:h-[52px] pl-[44px] pr-4 bg-white border-[1.5px] border-[#CBD5E1] rounded-xl text-base focus:outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#312E81]/10 transition-all"
                style={{ borderRadius: '12px', fontSize: '16px' }} />
            </div>

            <ButtonRow canContinue={true} onContinue={goNext} continueLabel="Continue" showSkip={true} skipLabel="Skip for now" />
          </>
        )}

        {/* ═══════════════ STEP 5: HOW DID YOU HEAR? (OPTIONAL) ═══════════════ */}
        {currentStep === 'source' && (
          <>
            <h2 className="text-[22px] sm:text-2xl font-bold text-[#1E293B] text-center mb-6">
              💬 How did you hear about DukaFlow?
            </h2>

            <div className="space-y-2">
              {SOURCE_OPTIONS.map((opt) => {
                const isSelected = source === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setSource(opt.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-[#312E81] bg-[#EEF2FF]'
                        : 'border-neutral-200 hover:border-[#312E81] bg-white'
                    }`} style={{ borderRadius: '12px' }}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-[#312E81] bg-[#312E81]' : 'border-[#CBD5E1]'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-[14px] sm:text-[15px] font-medium text-[#1E293B]">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <ButtonRow canContinue={true} onContinue={goNext} continueLabel="Continue" showSkip={true} />
          </>
        )}

        {/* ═══════════════ STEP 6: SHOP SIZE (OPTIONAL) ═══════════════ */}
        {currentStep === 'size' && (
          <>
            <h2 className="text-[22px] sm:text-2xl font-bold text-[#1E293B] text-center mb-2">
              📏 How many products do you have?
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#64748B] text-center mb-6">
              This helps us recommend the right plan for you
            </p>

            <div className="space-y-2 mb-5">
              {SIZE_OPTIONS.map((opt) => {
                const isSelected = shopSize === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setShopSize(opt.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-[#312E81] bg-[#EEF2FF]'
                        : 'border-neutral-200 hover:border-[#312E81] bg-white'
                    }`} style={{ borderRadius: '12px' }}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-[#312E81] bg-[#312E81]' : 'border-[#CBD5E1]'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-[14px] sm:text-[15px] font-medium text-[#1E293B]">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Plan recommendation */}
            {shopSize && PLAN_RECOMMENDATIONS[shopSize] && (
              <div className="p-4 bg-[#EEF2FF] rounded-xl border border-[#312E81]/20 mb-2">
                <p className="text-[13px] sm:text-sm font-medium text-[#312E81]">
                  {PLAN_RECOMMENDATIONS[shopSize]}
                </p>
              </div>
            )}

            <ButtonRow canContinue={true} onContinue={handleComplete} continueLabel="Go to Dashboard"
              showSkip={true} isLast={true} />
          </>
        )}

        {/* Terms */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-[#312E81] hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[#312E81] hover:underline">Privacy Policy</a>
        </p>
      </Card>
    </div>
  );
}
