import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import MobileNav from '../components/MobileNav';
import PwaInstallPrompt from '../components/PwaInstallPrompt';
import { usePwaInstall } from '../hooks/usePwaInstall';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { show, platform, dismiss, install } = usePwaInstall({ isDashboard: true });
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const checkedRef = useRef(false);

  // Onboarding guard: redirect to /onboarding if user has no shop
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    const verify = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/auth/onboarding-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.onboarded) {
            navigate('/onboarding', { replace: true });
          }
        }
      } catch {
        // Backend unreachable — allow dashboard access (shows empty state gracefully)
      }
    };

    verify();
  }, [isLoaded, isSignedIn, getToken, navigate]);

  return (
    <div className="flex bg-neutral-50 min-h-screen overflow-x-hidden">
      <Sidebar 
        isMobileOpen={mobileSidebarOpen} 
        onMobileClose={() => setMobileSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        <TopBar onMenuToggle={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <MobileNav />

      {/* PWA Install Prompt */}
      <PwaInstallPrompt
        show={show}
        platform={platform}
        onDismiss={dismiss}
        onInstall={install}
      />
    </div>
  );
};

export default DashboardLayout;
