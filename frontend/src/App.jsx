import React, { useEffect, Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import TestOnboarding from './pages/TestOnboarding';
import AuthResolve from './pages/AuthResolve';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardLayout from './components/DashboardLayout';
import { BranchProvider } from './context/BranchContext';
import DashboardOverview from './pages/DashboardOverview';
import InventoryPage from './pages/InventoryPage';
import AddProductPage from './pages/AddProductPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SalesPage from './pages/SalesPage';
import WorkersPage from './pages/WorkersPage';
import WorkerDetailPage from './pages/WorkerDetailPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import SuperAdminPanel from './pages/SuperAdminPanel';
import UpdateNotification from './components/UpdateNotification';
import { trackVisit, trackInteraction } from './hooks/usePwaInstall';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: true,
    },
  },
});

// ─── PWA initialisation wrapper ──────────────────────────────────────────────
// Tracks visits & interactions for the install prompt trigger logic.
function PwaInit({ children }) {
  useEffect(() => {
    trackVisit();

    const onInteract = () => trackInteraction();
    window.addEventListener('click', onInteract);
    window.addEventListener('keydown', onInteract);
    window.addEventListener('touchstart', onInteract, { passive: true });

    return () => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('touchstart', onInteract);
    };
  }, []);

  return (
    <>
      <UpdateNotification />
      {children}
    </>
  );
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
// Catches React render errors and shows a friendly recovery UI instead of white screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[DukaFlow] Render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
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
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, marginBottom: '24px' }}>
              DukaFlow encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              style={{
                background: '#312E81',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 32px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1E1B4B'}
              onMouseLeave={e => e.currentTarget.style.background = '#312E81'}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Clerk Loading Screen ────────────────────────────────────────────────────
// Shows a branded loading state while Clerk initializes auth
function ClerkLoadingGuard({ children }) {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 50%, #FDF2EC 100%)',
        fontFamily: 'Inter, sans-serif',
      }}>
        <svg width="56" height="56" viewBox="0 0 48 48" fill="none" style={{ marginBottom: '16px' }}>
          <rect x="0" y="0" width="48" height="48" rx="12" fill="#312E81" />
          <polygon points="7,18 24,6 41,18" fill="white" />
          <rect x="12" y="18" width="24" height="17" rx="2" fill="white" opacity="0.92" />
          <path d="M19 35 L19 28 Q19 22 24 22 Q29 22 29 28 L29 35 Z" fill="#312E81" />
          <path d="M6 39.5 C14 34, 20 42, 24 39.5 C28 37, 34 42, 42 39.5" stroke="#E8835C" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.5px' }}>
          Duka<span style={{ color: '#E8835C' }}>Flow</span>
        </span>
        <div style={{
          marginTop: '24px',
          width: '32px',
          height: '32px',
          border: '3px solid #E0E7FF',
          borderTopColor: '#312E81',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Router>
      <PwaInit>
      <ClerkLoadingGuard>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />

        {/* Accept Invitation — public page, handles both pre and post sign-up */}
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

        {/* Auth Resolution — post-auth, checks onboarding status */}
        <Route
          path="/auth-resolve"
          element={
            <SignedIn>
              <AuthResolve />
            </SignedIn>
          }
        />
        
        {/* Test Route */}
        <Route path="/test" element={<TestOnboarding />} />
        
        {/* Redirect /signup to /sign-up (avoid double-hop: render directly) */}
        <Route path="/signup" element={<SignUp />} />
        
        {/* Super Admin Panel */}
        <Route path="/admin" element={<SuperAdminPanel />} />

        {/* Onboarding Route — Post-Signup, First-time only */}
        <Route
          path="/onboarding/*"
          element={
            <SignedIn>
              <OnboardingPage />
            </SignedIn>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <BranchProvider>
                  <DashboardLayout />
                </BranchProvider>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/add" element={<AddProductPage />} />
          <Route path="inventory/:productId" element={<ProductDetailPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="workers/:workerId" element={<WorkerDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<div className="p-6"><h1 className="h2">Notifications</h1><p className="text-neutral-600 mt-2">Coming soon...</p></div>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      </ClerkLoadingGuard>
      </PwaInit>
    </Router>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
