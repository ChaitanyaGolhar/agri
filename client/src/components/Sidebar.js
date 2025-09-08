import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  AlertTriangle,
  Sun,
  Moon,
  User,
  BarChart3,
  Tag,
  CreditCard,
  Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('navigation.customers'), href: '/customers', icon: Users },
    { name: t('navigation.products'), href: '/products', icon: Package },
    { name: t('navigation.orders'), href: '/orders', icon: FileText },
    { name: t('navigation.cart'), href: '/cart', icon: ShoppingCart },
    { name: t('navigation.analytics'), href: '/analytics', icon: BarChart3 },
    { name: t('navigation.promotions'), href: '/promotions', icon: Tag },
    { name: t('navigation.ledger'), href: '/ledger', icon: CreditCard },
    { name: t('navigation.profile'), href: '/profile', icon: Settings },
  ];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#1C2434] px-6 pb-4">
        
        {/* --- MODIFIED: Header styled to match image's title --- */}
        <div className="flex h-16 shrink-0 items-center">
          <h2 className="text-2xl font-bold text-white">
            AgriBusiness
          </h2>
        </div>
        
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      // --- MODIFIED: ClassName logic for new active/inactive/hover styles ---
                      className={({ isActive }) =>
                        `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors ${
                          isActive
                            ? 'bg-gray-700/50 text-white' // Active link style
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50' // Inactive link style
                        }`
                      }
                    >
                      <item.icon
                        // --- MODIFIED: Icon color logic to match ---
                        className={({ isActive }) =>
                          `h-6 w-6 shrink-0 ${
                            isActive 
                              ? 'text-white' 
                              : 'text-gray-500 group-hover:text-white'
                          }`
                        }
                        aria-hidden="true"
                      />
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
            
            {/* --- MODIFIED: Low stock alert styled for dark theme --- */}
            <li className="mt-auto">
              {/* <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 mb-3">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-200">
                      Low Stock Alert
                    </p>
                    <p className="text-xs text-yellow-400">
                      5 products need restocking
                    </p>
                  </div>
                </div>
              </div> */}
              {/* --- Theme toggle, language switcher and logout buttons --- */}
              <br></br>
              <div className="flex flex-col gap-2">
                <LanguageSwitcher />
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 p-2 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
                  title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span className="text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 p-2 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;