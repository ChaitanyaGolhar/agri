import React from 'react';
// --- MODIFIED: Removed unused icons and added ChevronDown ---
import { Menu, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
// useTheme is no longer needed since the toggle is removed, but we keep dark mode classes
// import { useTheme } from '../contexts/ThemeContext';

const Header = ({ onMenuClick }) => {
  const { user } = useAuth(); // We don't need logout here directly anymore

  // Placeholder for user avatar - you can replace this with a real user avatar URL if available
  const userAvatar = `https://api.dicebear.com/8.x/initials/svg?seed=${user?.businessName || 'B'}`;

  return (
    // --- MODIFIED: Cleaner header style with just a bottom border ---
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side: Mobile Menu Button and Welcome Message */}
          <div className="flex items-center gap-x-4">
            {/* Mobile menu button (retained from original code) */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-300"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* --- MODIFIED: Welcome Message using businessName --- */}
            <h1 className="text-lg font-medium text-gray-800 dark:text-white hidden sm:block">
              Welcome Back, {user?.businessName || 'Owner'} 👋
            </h1>
          </div>

          {/* Right Side: Notifications & Profile */}
          <div className="flex items-center space-x-4">
            
            {/* Notifications Button (retained) */}
            <button
              type="button"
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              <Bell className="h-6 w-6" />
            </button>
            
            {/* --- NEW: Vertical Separator for visual structure --- */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 hidden sm:block" />

            {/* --- MODIFIED: User Menu to show Avatar, Business Name, Email, and Dropdown Arrow --- */}
            <div className="flex items-center space-x-3 cursor-pointer group">
              <img 
                src={userAvatar} 
                alt="User Avatar" 
                className="h-9 w-9 rounded-full object-cover"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary">
                  {user?.businessName || 'Business Owner'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-primary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;