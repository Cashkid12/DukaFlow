import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Menu } from 'lucide-react';

const MobileNav = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
    { icon: ShoppingCart, label: 'Sales', path: '/dashboard/sales' },
    { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
    { icon: Menu, label: 'Menu', path: '/dashboard/settings' },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50"
      style={{ height: '64px' }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
          >
            {({ isActive }) => (
              <div
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                  isActive 
                    ? 'text-[#312E81]' 
                    : 'text-neutral-500'
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
