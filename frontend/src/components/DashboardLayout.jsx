import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import MobileNav from '../components/MobileNav';

const DashboardLayout = () => {
  return (
    <div className="flex bg-neutral-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default DashboardLayout;
