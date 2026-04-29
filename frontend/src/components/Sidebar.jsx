import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  ChevronDown,
  Store
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useUser();
  
  // Get shop name from onboarding data
  const shopName = useMemo(() => {
    const onboardingData = localStorage.getItem('onboarding_step2');
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      return data.shopName || 'Your Shop';
    }
    return 'Your Shop';
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
    { icon: ShoppingCart, label: 'Sales', path: '/dashboard/sales' },
    { icon: Users, label: 'Workers', path: '/dashboard/workers' },
    { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <aside 
      className="hidden lg:flex flex-col bg-white border-r border-neutral-200 h-screen sticky top-0 transition-all duration-300"
      style={{ 
        width: isCollapsed ? '72px' : '260px'
      }}
    >
      {/* Logo Area */}
      <div 
        className="flex items-center justify-center border-b border-neutral-200"
        style={{ 
          height: '72px', 
          padding: '16px'
        }}
      >
        {isCollapsed ? (
          <div 
            className="w-10 h-10 rounded-lg bg-[#312E81] flex items-center justify-center"
            onClick={() => setIsCollapsed(false)}
          >
            <span className="text-white font-bold text-xl">D</span>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-[#312E81]">
            Duka<span style={{ color: '#E8835C' }}>Flow</span>
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => {
              const baseStyle = {
                display: 'flex',
                alignItems: 'center',
                gap: isCollapsed ? '0' : '12px',
                padding: isCollapsed ? '0 24px' : '0 16px',
                margin: '4px 8px',
                height: '48px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderLeft: isActive ? '3px solid #E8835C' : '3px solid transparent',
                backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                color: isActive ? '#312E81' : '#6B7280',
              };
              
              return baseStyle;
            }}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? '0' : '12px',
              padding: isCollapsed ? '0 24px' : '0 16px',
              margin: '4px 8px',
              height: '48px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderLeft: isActive ? '3px solid #E8835C' : '3px solid transparent',
              backgroundColor: isActive ? '#EEF2FF' : 'transparent',
              color: isActive ? '#312E81' : '#6B7280',
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} style={{ color: isActive ? '#312E81' : '#6B7280' }} />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-4 border-t border-neutral-200" />

      {/* Shop Switcher */}
      {!isCollapsed && (
        <div className="px-3 py-3">
          <div 
            className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors duration-200"
            style={{ backgroundColor: '#F9FAFB' }}
          >
            <div className="flex items-center gap-3">
              <Store size={20} style={{ color: '#6B7280' }} />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{shopName}</p>
                <p className="text-xs text-neutral-500">Main Branch</p>
              </div>
            </div>
            <ChevronDown size={16} style={{ color: '#6B7280' }} />
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 my-4 border-t border-neutral-200" />

      {/* User Profile */}
      <div className="p-3">
        {isCollapsed ? (
          <div className="flex justify-center">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10',
                },
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10',
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {user?.fullName || 'User'}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-xs text-neutral-500">Admin • Online</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
