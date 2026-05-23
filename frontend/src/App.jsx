import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import TestOnboarding from './pages/TestOnboarding';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
      <PwaInit>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />
        
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
            <SignedIn>
              <BranchProvider>
                <DashboardLayout />
              </BranchProvider>
            </SignedIn>
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

        {/* Redirect to sign-in if not authenticated */}
        <Route
          path="/dashboard/*"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
      </Routes>
      </PwaInit>
    </Router>
    </QueryClientProvider>
  );
}

export default App;
