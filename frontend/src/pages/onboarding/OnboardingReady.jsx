import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Check, Package, Users, LayoutDashboard } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const OnboardingReady = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [isCompleting, setIsCompleting] = useState(false);
  const [shopData, setShopData] = useState(null);

  // Load data from previous steps
  useEffect(() => {
    const step1 = localStorage.getItem('onboarding_step1');
    const step2 = localStorage.getItem('onboarding_step2');

    if (!step1 || !step2) {
      // If previous steps are missing, redirect to start
      navigate('/onboarding');
      return;
    }

    setShopData({
      account: JSON.parse(step1),
      shop: JSON.parse(step2),
    });
  }, [navigate]);

  const handleComplete = async () => {
    setIsCompleting(true);

    try {
      // TODO: Send complete onboarding data to backend
      // await api.post('/onboarding/complete', {
      //   ...shopData,
      //   onboardingCompleted: true,
      //   onboardingCompletedAt: new Date().toISOString(),
      // });

      // Mark onboarding as complete
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_completed_at', new Date().toISOString());

      // Clear draft data
      localStorage.removeItem('onboarding_step1');
      localStorage.removeItem('onboarding_step2');

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAction = (action) => {
    switch (action) {
      case 'add-product':
        navigate('/dashboard/inventory?new=true');
        break;
      case 'invite-workers':
        navigate('/dashboard/workers?invite=true');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      default:
        break;
    }
  };

  if (!shopData) {
    return null;
  }

  const firstName = shopData.account.fullName?.split(' ')[0] || 'User';

  return (
    <OnboardingLayout currentStep={3}>
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
        {/* Success Animation */}
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-green-100 mx-auto mb-4 sm:mb-6 flex items-center justify-center animate-bounce">
          <Check size={28} className="sm:w-10 sm:h-10 text-green-600" />
        </div>

        <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 mb-2">
          You're All Set, {firstName}!
        </h2>
        <p className="text-sm sm:text-lg text-neutral-600 mb-6 sm:mb-8">
          Your duka is ready. What's next?
        </p>

        {/* Action Cards */}
        <div className="space-y-3 sm:space-y-4 max-w-lg mx-auto">
          {/* Add First Product */}
          <button
            onClick={() => handleAction('add-product')}
            className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 border-[#312E81] bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-all duration-200 text-left group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#312E81] flex items-center justify-center flex-shrink-0">
              <Package size={22} className="sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-[#312E81]">
                Add Your First Product
              </p>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                Start tracking inventory
              </p>
            </div>
            <div className="text-[#312E81] group-hover:translate-x-1 transition-transform duration-200">
              →
            </div>
          </button>

          {/* Invite Workers */}
          <button
            onClick={() => handleAction('invite-workers')}
            className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 border-neutral-200 hover:border-[#312E81] hover:bg-[#EEF2FF] transition-all duration-200 text-left group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Users size={22} className="sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-neutral-900 group-hover:text-[#312E81]">
                Invite Your Workers
              </p>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                Add staff to help manage
              </p>
            </div>
            <div className="text-neutral-400 group-hover:text-[#312E81] group-hover:translate-x-1 transition-all duration-200">
              →
            </div>
          </button>

          {/* Go to Dashboard */}
          <button
            onClick={() => handleAction('dashboard')}
            className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 border-neutral-200 hover:border-[#312E81] hover:bg-[#EEF2FF] transition-all duration-200 text-left group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard size={22} className="sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-neutral-900 group-hover:text-[#312E81]">
                Go to Dashboard
              </p>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                Skip and explore later
              </p>
            </div>
            <div className="text-neutral-400 group-hover:text-[#312E81] group-hover:translate-x-1 transition-all duration-200">
              →
            </div>
          </button>
        </div>

        {/* Complete Button (Alternative) */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className={`w-full h-12 font-semibold rounded-lg transition-all duration-200 ${
              isCompleting
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-[#312E81] hover:bg-[#1E1B4B] text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isCompleting ? 'Completing Setup...' : 'Complete Setup & Continue'}
          </button>
        </div>

        {/* Success Message */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ <strong>14-day free trial</strong> started! No credit card required.
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default OnboardingReady;
