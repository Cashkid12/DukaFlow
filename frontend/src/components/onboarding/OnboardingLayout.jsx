import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OnboardingLayout = ({ currentStep, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const headingRef = useRef(null);

  // Auto-focus heading on step change for accessibility
  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [location.pathname]);

  const steps = [
    { number: 1, title: 'Account', path: '/onboarding' },
    { number: 2, title: 'Shop Details', path: '/onboarding/shop' },
    { number: 3, title: 'Ready', path: '/onboarding/ready' },
  ];

  const progress = (currentStep / steps.length) * 100;

  // Prevent skipping ahead
  React.useEffect(() => {
    const step1Completed = localStorage.getItem('onboarding_step1');
    const step2Completed = localStorage.getItem('onboarding_step2');

    if (currentStep === 2 && !step1Completed) {
      navigate('/onboarding');
    } else if (currentStep === 3 && (!step1Completed || !step2Completed)) {
      navigate('/onboarding');
    }
  }, [currentStep, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF2FF] via-white to-white">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <h1 
            className="text-xl sm:text-2xl font-bold cursor-pointer"
            onClick={() => navigate('/')}
          >
            Duka<span style={{ color: '#E8835C' }}>Flow</span>
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress Bar */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm font-medium text-neutral-600">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-xs sm:text-sm text-neutral-500 hidden sm:block">
              {steps[currentStep - 1]?.title}
            </span>
          </div>
          
          {/* Progress Track - Desktop (with labels) */}
          <div className="hidden sm:flex gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3} aria-label="Onboarding progress">
            {steps.map((step) => (
              <div
                key={step.number}
                className="h-2 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: step.number <= currentStep ? '#312E81' : '#D1D5DB',
                }}
                aria-label={`Step ${step.number}: ${step.title} ${step.number < currentStep ? '(completed)' : step.number === currentStep ? '(current)' : '(pending)'}`}
              />
            ))}
          </div>

          {/* Progress Track - Mobile (dots only) */}
          <div className="flex sm:hidden justify-center gap-3" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3} aria-label="Onboarding progress">
            {steps.map((step) => (
              <div
                key={step.number}
                className="w-3 h-3 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: step.number <= currentStep ? '#312E81' : '#D1D5DB',
                }}
                aria-label={`Step ${step.number} ${step.number < currentStep ? 'completed' : step.number === currentStep ? 'current' : 'pending'}`}
              />
            ))}
          </div>

          {/* Step Labels - Desktop Only */}
          <div className="hidden sm:flex gap-2 mt-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex-1 text-center"
              >
                <p className={`text-xs font-medium ${
                  step.number === currentStep 
                    ? 'text-[#312E81]' 
                    : step.number < currentStep 
                    ? 'text-green-600' 
                    : 'text-neutral-400'
                }`}>
                  {step.number === currentStep ? '●' : step.number < currentStep ? '✓' : '○'} {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {children}

        {/* Progress Percentage */}
        <div className="text-center mt-8">
          <p className="text-xs text-neutral-400">
            {Math.round(progress)}% complete
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;
