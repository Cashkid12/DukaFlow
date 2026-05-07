import { ClerkProvider } from '@clerk/clerk-react';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Missing key fallback — shows a helpful message in the UI instead of white-screen crash
export const ClerkAuthProvider = ({ children }) => {
  if (!publishableKey) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #EEF2FF, #FFFFFF, #FDF2EC)',
        fontFamily: 'Inter, sans-serif',
        padding: '24px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '48px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
            🔧 Configuration Required
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, marginBottom: '20px' }}>
            The <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>VITE_CLERK_PUBLISHABLE_KEY</code> environment variable is missing.
          </p>
          <div style={{
            background: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'left',
            fontSize: '13px',
            color: '#9A3412',
            lineHeight: 1.7,
          }}>
            <strong>How to fix on Render:</strong>
            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Go to your Render Dashboard → Frontend service</li>
              <li>Click <strong>Environment</strong> tab</li>
              <li>Add: <code style={{ background: '#FED7AA', padding: '1px 5px', borderRadius: '3px' }}>VITE_CLERK_PUBLISHABLE_KEY</code></li>
              <li>Value: <code style={{ background: '#FED7AA', padding: '1px 5px', borderRadius: '3px' }}>pk_test_Z2FtZS1ncnViLTIyLmNsZXJrLmFjY291bnRzLmRldiQ</code></li>
              <li>Click <strong>Save Changes</strong> &amp; redeploy</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      forceRedirectUrl="/onboarding/shop-name"
      signUpFallbackRedirectUrl="/onboarding/shop-name"
      signInFallbackRedirectUrl="/onboarding/shop-name"
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
