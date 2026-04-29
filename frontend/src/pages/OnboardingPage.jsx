import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Smartphone, ShoppingCart, Sparkles, Wrench, Pill,
  Upload, Check, ArrowRight, ArrowLeft
} from 'lucide-react';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    shopName: '',
    subdomain: '',
    businessType: '',
    logo: null,
  });
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const businessTypes = [
    { id: 'clothing', name: 'Clothing Boutique', icon: Store, color: '#312E81' },
    { id: 'electronics', name: 'Electronics Shop', icon: Smartphone, color: '#6366F1' },
    { id: 'grocery', name: 'Grocery & Duka', icon: ShoppingCart, color: '#10B981' },
    { id: 'cosmetics', name: 'Cosmetics Shop', icon: Sparkles, color: '#E8835C' },
    { id: 'hardware', name: 'Hardware Store', icon: Wrench, color: '#F59E0B' },
    { id: 'pharmacy', name: 'Pharmacy', icon: Pill, color: '#EF4444' },
  ];

  const handleSubdomainChange = (value) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, subdomain: sanitized });
    
    // Simulate availability check
    if (sanitized.length >= 3) {
      setIsChecking(true);
      setTimeout(() => {
        setSubdomainAvailable(!['admin', 'test', 'demo'].includes(sanitized));
        setIsChecking(false);
      }, 500);
    } else {
      setSubdomainAvailable(null);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.shopName && formData.subdomain && subdomainAvailable;
      case 2:
        return formData.businessType;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF2FF] via-white to-white">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-[#312E81]">
            Duka<span style={{ color: '#E8835C' }}>Flow</span>
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-neutral-600">
              Step {currentStep} of 3
            </span>
            <span className="text-sm text-neutral-500">
              {currentStep === 1 && 'Shop Identity'}
              {currentStep === 2 && 'Business Type'}
              {currentStep === 3 && 'Welcome'}
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="h-2 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: step <= currentStep ? '#312E81' : '#D1D5DB',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Shop Identity */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Set Up Your Shop
            </h2>
            <p className="text-sm text-neutral-500 mb-8">
              Let's create your duka's digital presence
            </p>

            <div className="space-y-6">
              {/* Shop Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Shop Name *
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  placeholder="e.g., Cecilia Fashions"
                  className="w-full h-12 px-4 rounded-lg border border-neutral-300 focus:border-[#312E81] focus:ring-2 focus:ring-[#312E81]/20 transition-all duration-200"
                />
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Your DukaFlow URL *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    placeholder="your-shop"
                    className="flex-1 h-12 px-4 rounded-lg border border-neutral-300 focus:border-[#312E81] focus:ring-2 focus:ring-[#312E81]/20 transition-all duration-200"
                  />
                  <span className="text-sm text-neutral-500 whitespace-nowrap">
                    .dukaflow.com
                  </span>
                </div>
                {isChecking && (
                  <p className="mt-2 text-xs text-neutral-500">Checking availability...</p>
                )}
                {subdomainAvailable === true && (
                  <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <Check size={14} /> Available!
                  </p>
                )}
                {subdomainAvailable === false && (
                  <p className="mt-2 text-xs text-red-600">
                    Sorry, this subdomain is already taken
                  </p>
                )}
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Shop Logo (Optional)
                </label>
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-[#312E81] transition-colors duration-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-neutral-400" size={24} />
                    <p className="text-sm text-neutral-600">
                      {formData.logo ? formData.logo.name : 'Click to upload logo'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Type */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              What Type of Business Do You Run?
            </h2>
            <p className="text-sm text-neutral-500 mb-8">
              This helps us customize your dashboard
            </p>

            <div className="grid grid-cols-2 gap-4">
              {businessTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.businessType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, businessType: type.id })}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'border-[#312E81] bg-[#EEF2FF]'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? type.color : '#F3F4F6',
                      }}
                    >
                      <Icon
                        size={24}
                        style={{
                          color: isSelected ? 'white' : type.color,
                        }}
                      />
                    </div>
                    <p
                      className={`text-sm font-medium text-center ${
                        isSelected ? 'text-[#312E81]' : 'text-neutral-700'
                      }`}
                    >
                      {type.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Welcome */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success Animation */}
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
              <Check size={40} className="text-green-600" />
            </div>

            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              You're All Set! 🎉
            </h2>
            <p className="text-lg text-neutral-600 mb-8">
              Welcome to DukaFlow, <strong>{formData.shopName || 'User'}</strong>!
            </p>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/dashboard/inventory')}
                className="w-full h-12 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Add Your First Product
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full h-12 bg-white border-2 border-[#312E81] text-[#312E81] font-semibold rounded-lg hover:bg-[#EEF2FF] transition-all duration-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 px-6 h-12 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-all duration-200"
              >
                <ArrowLeft size={20} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex-1 flex items-center justify-center gap-2 h-12 font-semibold rounded-lg transition-all duration-200 ${
                isStepValid()
                  ? 'bg-[#312E81] hover:bg-[#1E1B4B] text-white shadow-md hover:shadow-lg'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {currentStep === 2 ? 'Complete Setup' : 'Continue'}
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Terms Agreement */}
        {currentStep < 3 && (
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
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
