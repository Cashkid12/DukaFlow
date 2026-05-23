import React, { useState } from 'react';
import { Bell, Search, Calendar, MessageCircle, Menu } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ROLES } from '../utils/permissions';
import BranchSwitcher from './BranchSwitcher';
import { useBranch } from '../context/BranchContext';

const ROLE_BADGE = {
  admin: { label: 'Admin', bg: '#EEF2FF', color: '#312E81' },
  manager: { label: 'Manager', bg: '#EEF2FF', color: '#312E81' },
  cashier: { label: 'Cashier', bg: '#FEF3C7', color: '#D97706' },
};

const TopBar = ({ onMenuToggle }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const { activeBranch, hasMultiBranch } = useBranch();
  const role = currentUser?.role || 'admin';
  const roleBadge = ROLE_BADGE[role] || ROLE_BADGE.admin;

  const branchLabel = hasMultiBranch && activeBranch
    ? (activeBranch.isMain ? 'Main Branch' : activeBranch.name)
    : 'Main Branch';

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header 
      className="bg-white border-b border-neutral-200 sticky top-0 z-10"
      style={{ height: '64px', padding: '0 12px' }}
    >
      <div className="flex items-center justify-between h-full max-w-full">
        {/* Left Section: Hamburger + Shop Name */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
          {/* Mobile Hamburger */}
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
          >
            <Menu size={20} style={{ color: '#6B7280' }} />
          </button>

          {/* Desktop: Shop Name + Branch Switcher */}
          <div className="hidden lg:flex items-center gap-2">
            <BranchSwitcher />
          </div>

          {/* Mobile: Shop Name + Branch Switcher */}
          <div className="lg:hidden flex items-center gap-1.5 min-w-0">
            <BranchSwitcher />
          </div>

          {/* Desktop: Online Status */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-neutral-500">{branchLabel}</span>
          </div>
        </div>

        {/* Center Section: Date & Search (Desktop Only) */}
        <div className="hidden lg:flex items-center gap-4 flex-1 justify-center">
          {/* Date Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
            >
              <Calendar size={18} style={{ color: '#6B7280' }} />
              <span className="text-sm text-neutral-700">{`Today, ${formattedDate}`}</span>
            </button>
            
            {/* Date Picker Dropdown (simplified) */}
            {showDatePicker && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-neutral-200 p-4 z-50">
                <p className="text-sm text-neutral-600">Date picker coming soon...</p>
              </div>
            )}
          </div>

          {/* Search Bar — Desktop Only */}
          <div className="relative hidden lg:block" style={{ width: '280px', maxWidth: '100%' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-50">
              <Search size={18} style={{ color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search products, transactions..."
                className="flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none"
              />
              <kbd className="hidden lg:inline-flex items-center px-2 py-1 rounded bg-white border border-neutral-200 text-xs text-neutral-400">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-neutral-50 transition-colors duration-200">
            <Bell size={20} style={{ color: '#6B7280' }} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Help/Chat */}
          <button className="p-2 rounded-lg hover:bg-neutral-50 transition-colors duration-200">
            <MessageCircle size={20} style={{ color: '#6B7280' }} />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-neutral-200" />

          {/* Role Badge */}
          <span
            className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: roleBadge.bg, color: roleBadge.color }}
          >
            {roleBadge.label}
          </span>

          {/* User Avatar */}
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
