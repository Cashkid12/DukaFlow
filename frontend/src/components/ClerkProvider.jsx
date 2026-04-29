import { ClerkProvider } from '@clerk/clerk-react';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}

export const ClerkAuthProvider = ({ children }) => {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      forceRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
      signInFallbackRedirectUrl="/onboarding"
      appearance={{
        variables: {
          colorPrimary: '#312E81',
          colorAccent: '#E8835C',
          colorBackground: '#FFFFFF',
          colorInputBackground: '#FFFFFF',
          colorInputBorder: '#E2E8F0',
          colorInputText: '#1E293B',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'shadow-xl border-0',
          formButtonPrimary: 'bg-[#312E81] hover:bg-[#1E1B4B] text-white transition-all duration-200',
          socialButtonsBlockButton:
            'border border-[#E2E8F0] rounded-lg hover:bg-neutral-50 transition-all duration-200',
          formFieldInput: 'rounded-lg h-12 border-[#E2E8F0] focus:border-[#312E81]',
          headerTitle: 'text-2xl font-bold text-neutral-900',
          headerSubtitle: 'text-sm text-neutral-500',
          formFieldLabel: 'text-sm font-medium text-neutral-700',
          footerActionLink: 'text-[#312E81] hover:text-[#1E1B4B]',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
};
