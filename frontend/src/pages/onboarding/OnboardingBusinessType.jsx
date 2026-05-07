import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ArrowLeft, ArrowRight, Shirt, Smartphone, ShoppingCart, Sparkles, Wrench, Pill, Check, Loader2 } from 'lucide-react';

const BUSINESS_TYPES = [
  {
    id: 'clothing',
    name: 'Clothing Boutique',
    subtitle: 'Fashion & apparel',
    icon: Shirt,
    categories: ['Trousers', 'Shirts', 'Dresses', 'Jackets', 'Shoes', 'Accessories'],
    attributes: ['Size', 'Color', 'Material', 'Brand'],
  },
  {
    id: 'electronics',
    name: 'Electronics Shop',
    subtitle: 'Phones & gadgets',
    icon: Smartphone,
    categories: ['Phones', 'Laptops', 'Accessories', 'Parts', 'Cables', 'Audio'],
    attributes: ['Brand', 'Model', 'Condition', 'Warranty'],
  },
  {
    id: 'grocery',
    name: 'Grocery & Duka',
    subtitle: 'Food & essentials',
    icon: ShoppingCart,
    categories: ['Beverages', 'Dry Foods', 'Fresh Produce', 'Dairy', 'Snacks', 'Household'],
    attributes: ['Weight/Volume', 'Brand', 'Expiry Date', 'Organic'],
  },
  {
    id: 'cosmetics',
    name: 'Cosmetics Shop',
    subtitle: 'Beauty & makeup',
    icon: Sparkles,
    categories: ['Makeup', 'Skincare', 'Hair', 'Fragrance', 'Nails', 'Tools'],
    attributes: ['Shade', 'Skin Type', 'Expiry Date', 'Brand'],
  },
  {
    id: 'hardware',
    name: 'Hardware Store',
    subtitle: 'Tools & supplies',
    icon: Wrench,
    categories: ['Tools', 'Paint', 'Electrical', 'Plumbing', 'Fasteners', 'Building'],
    attributes: ['Material', 'Size/Dimensions', 'Unit', 'Brand'],
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    subtitle: 'Medicines & health',
    icon: Pill,
    categories: ['Prescription', 'OTC', 'First Aid', 'Vitamins', 'Personal Care', 'Baby'],
    attributes: ['Strength/Dosage', 'Form', 'Expiry Date', 'Prescription Required'],
  },
];

const OnboardingBusinessType = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [selected, setSelected] = useState('');
  const [shopName, setShopName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
      setErrors({ businessType: 'Please select a business type' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const step1 = JSON.parse(localStorage.getItem('onboarding_step1') || '{}');
      const businessType = BUSINESS_TYPES.find(t => t.id === selected);

      // Build shop data for API
      const shopData = {
        shopName: step1.shopName,
        slug: step1.subdomain,
        businessType: selected,
        ownerId: user?.id,
        settings: {
          categories: businessType?.categories || [],
          attributes: businessType?.attributes || [],
        },
      };

      // Save complete onboarding data
      localStorage.setItem('onboarding_step2', JSON.stringify({
        shopName: step1.shopName,
        subdomain: step1.subdomain,
        businessType: selected,
        categories: shopData.settings.categories,
        attributes: shopData.settings.attributes,
      }));

      // Attempt API call — fail gracefully if backend unavailable
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const token = await user?.getToken();
        await fetch(`${API_URL}/api/shops`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(shopData),
        });
      } catch (apiErr) {
        console.warn('Backend not reachable — proceeding with local data:', apiErr.message);
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Save error:', err);
      setErrors({ submit: 'Unable to create shop. Please try again.' });
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
      <div className="w-full max-w-[560px] tablet:max-w-[480px] bg-white rounded-3xl shadow-2xl p-5 sm:p-7 md:p-10 animate-fade-in"
        style={{ borderRadius: '24px', animation: 'fadeIn 0.3s ease' }}>

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
        <p className="text-[14px] sm:text-[15px] text-neutral-500 text-center mb-6 sm:mb-8">
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
          {BUSINESS_TYPES.map((type) => {
            const isSelected = selected === type.id;
            const Icon = type.icon;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setSelected(type.id);
                  setErrors({});
                }}
                className={`relative p-3 sm:p-5 md:p-6 rounded-2xl text-center cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'border-2 border-[#312E81] bg-[#EEF2FF] shadow-md'
                    : 'border-[1.5px] border-neutral-300 bg-white hover:border-[#6366F1] hover:bg-[#EEF2FF] hover:scale-[1.02] md:hover:scale-[1.03]'
                }`}
                style={{ borderRadius: '16px' }}
              >
                {/* Checkmark */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#312E81] flex items-center justify-center animate-bounce-in"
                    style={{ animation: 'bounceIn 0.4s ease' }}>
                    <Check size={12} className="sm:size-14 text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Icon */}
                <Icon
                  size={28}
                  className="mx-auto mb-2 sm:mb-3 md:size-36"
                  style={{ color: isSelected ? '#312E81' : '#64748B' }}
                />

                {/* Title */}
                <p className={`text-[14px] sm:text-base font-medium mb-0.5 sm:mb-1 ${
                  isSelected ? 'text-[#312E81]' : 'text-neutral-900'
                }`}>
                  {type.name}
                </p>

                {/* Subtitle */}
                <p className="text-[11px] sm:text-xs text-neutral-500 leading-tight">
                  {type.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {errors.businessType && (
          <p className="mt-3 text-xs text-red-600 text-center">{errors.businessType}</p>
        )}

        {/* Network Error with Retry */}
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center" role="alert">
            <p className="text-sm text-red-700 mb-3">{errors.submit}</p>
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="h-[48px] sm:h-[52px] px-4 sm:px-6 border-[1.5px] border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 hover:border-[#312E81] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 sm:order-first"
            style={{ borderRadius: '12px' }}
          >
            <ArrowLeft size={18} />
            <span>Back</span>
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
                Creating your duka…
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
