import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Shirt, Smartphone, ShoppingCart, Sparkles, Wrench, Pill, Check, Loader2 } from 'lucide-react';

const BUSINESS_TYPES = [
  {
    id: 'clothing',
    name: 'Clothing Boutique',
    subtitle: 'Fashion, shoes & accessories',
    icon: Shirt,
  },
  {
    id: 'electronics',
    name: 'Electronics Shop',
    subtitle: 'Phones, gadgets & accessories',
    icon: Smartphone,
  },
  {
    id: 'grocery',
    name: 'Grocery & Duka',
    subtitle: 'Food, drinks & household items',
    icon: ShoppingCart,
  },
  {
    id: 'cosmetics',
    name: 'Cosmetics Shop',
    subtitle: 'Beauty, skincare & fragrance',
    icon: Sparkles,
  },
  {
    id: 'hardware',
    name: 'Hardware Store',
    subtitle: 'Tools, paint & building supplies',
    icon: Wrench,
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    subtitle: 'Medicine & health products',
    icon: Pill,
  },
];

const OnboardingBusinessType = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');
  const [shopName, setShopName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load step 1 data
  useEffect(() => {
    const step1 = localStorage.getItem('onboarding_step1');
    if (!step1) {
      navigate('/onboarding/shop-name');
      return;
    }
    const data = JSON.parse(step1);
    setShopName(data.shopName || '');
  }, [navigate]);

  const handleBack = () => {
    navigate('/onboarding/shop-name');
  };

  const handleCreate = async () => {
    if (!selected) {
      setError('Please select a business type');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const step1 = JSON.parse(localStorage.getItem('onboarding_step1') || '{}');

      // Save complete onboarding data
      localStorage.setItem('onboarding_step2', JSON.stringify({
        shopName: step1.shopName,
        subdomain: step1.subdomain,
        businessType: selected,
      }));

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Save error:', err);
      setError('Something went wrong. Please try again.');
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
      <div className="w-full max-w-[560px] tablet:max-w-[480px] bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10"
        style={{ borderRadius: '24px' }}>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-medium text-neutral-500">Step 2 of 2</span>
          <div className="flex gap-1.5">
            <div className="w-8 h-1.5 rounded-full bg-green-500" />
            <div className="w-8 h-1.5 rounded-full bg-[#312E81]" />
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
          What type of duka do you run?
        </h2>
        <p className="text-[14px] sm:text-[15px] text-neutral-500 text-center mb-8">
          We'll customize DukaFlow for you
        </p>

        {/* Shop Name Preview */}
        {shopName && (
          <div className="mb-6 px-4 py-3 bg-[#EEF2FF] rounded-xl text-center">
            <p className="text-xs text-neutral-500 mb-0.5">Setting up</p>
            <p className="text-sm font-semibold text-[#312E81]">{shopName}</p>
          </div>
        )}

        {/* Business Type Grid */}
        <div className="grid grid-cols-3 gap-3">
          {BUSINESS_TYPES.map((type) => {
            const isSelected = selected === type.id;
            const Icon = type.icon;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setSelected(type.id);
                  setError('');
                }}
                className={`relative p-4 sm:p-6 rounded-2xl text-center cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'border-2 border-[#312E81] bg-[#EEF2FF] shadow-md'
                    : 'border-[1.5px] border-neutral-300 bg-white hover:border-[#6366F1] hover:bg-[#EEF2FF] hover:scale-[1.03]'
                }`}
                style={{ borderRadius: '16px' }}
              >
                {/* Checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#312E81] flex items-center justify-center">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Icon */}
                <Icon
                  size={36}
                  className="mx-auto mb-3"
                  style={{ color: isSelected ? '#312E81' : '#64748B' }}
                />

                {/* Title */}
                <p className={`text-sm sm:text-base font-medium mb-1 ${
                  isSelected ? 'text-[#312E81]' : 'text-neutral-900'
                }`}>
                  {type.name}
                </p>

                {/* Subtitle */}
                <p className="text-xs text-neutral-500 leading-tight">
                  {type.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-xs text-red-600 text-center">{error}</p>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="h-[48px] sm:h-[52px] px-4 sm:px-6 border-[1.5px] border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 hover:border-[#312E81] transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            style={{ borderRadius: '12px' }}
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!selected || isSubmitting}
            className={`flex-1 h-[48px] sm:h-[52px] font-semibold text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
              selected && !isSubmitting
                ? 'bg-[#312E81] hover:bg-[#1E1B4B] text-white shadow-md hover:shadow-lg'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
            style={{ borderRadius: '12px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating…
              </>
            ) : (
              <>
                Create My Duka
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

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

export default OnboardingBusinessType;
