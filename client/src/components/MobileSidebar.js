import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  BarChart3,
  Tag,
  CreditCard,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const MobileSidebar = ({ isOpen, onClose }) => {
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
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AgriBusiness
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-6 py-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    <item.icon
                      className={`h-6 w-6 shrink-0 ${
                        window.location.pathname === item.href
                          ? 'text-white'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
            
            {/* Language Switcher */}
            <div className="mt-6 px-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
