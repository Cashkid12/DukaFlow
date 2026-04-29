import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import TestOnboarding from './pages/TestOnboarding';
import OnboardingAccount from './pages/onboarding/OnboardingAccount';
import OnboardingShop from './pages/onboarding/OnboardingShop';
import OnboardingReady from './pages/onboarding/OnboardingReady';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import SettingsPage from './pages/SettingsPage';
import SuperAdminPanel from './pages/SuperAdminPanel';

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />
        
        {/* Test Route */}
        <Route path="/test" element={<TestOnboarding />} />
        
        {/* Redirect /signup to /sign-up */}
        <Route path="/signup" element={<Navigate to="/sign-up" replace />} />
        
        {/* Super Admin Panel */}
        <Route path="/admin" element={<SuperAdminPanel />} />

        {/* Onboarding Routes - Protected, First-time only */}
        <Route
          path="/onboarding"
          element={
            <SignedIn>
              <OnboardingAccount />
            </SignedIn>
          }
        />
        <Route
          path="/onboarding/shop"
          element={
            <SignedIn>
              <OnboardingShop />
            </SignedIn>
          }
        />
        <Route
          path="/onboarding/ready"
          element={
            <SignedIn>
              <OnboardingReady />
            </SignedIn>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <SignedIn>
              <DashboardLayout />
            </SignedIn>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="workers" element={<div className="p-6"><h1 className="h2">Workers Management</h1><p className="text-neutral-600 mt-2">Coming soon...</p></div>} />
          <Route path="reports" element={<div className="p-6"><h1 className="h2">Reports</h1><p className="text-neutral-600 mt-2">Coming soon...</p></div>} />
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
    </Router>
    </QueryClientProvider>
  );
}

export default App;
