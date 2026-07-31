import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigateWithLoading } from '../context/NavigationContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, User, Shield, LogOut, Menu, Sun, Moon } from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import { toBengaliDigits } from '../utils/bengaliNumbers';

export default function Navbar({ onOpenMobileMenu }) {
  const { currentUser, logout, collections, notifications } = useAuth();
  const navigateWithLoading = useNavigateWithLoading();
  const { theme, toggleTheme } = useTheme();

  // Pending count for admin
  const pendingCount = collections.filter(c => c.status === 'pending').length;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Mobile Menu Button & Branding */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div 
            onClick={() => navigateWithLoading('/')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <img
              src="/logo_somiti.png"
              alt="একসাথে স্বপ্ন সমিতি"
              className="w-10 h-10 object-contain rounded-xl group-hover:scale-105 transition-transform duration-200"
            />
            <div>
              <h1 className="text-lg font-bold text-white leading-tight font-bengali group-hover:text-emerald-400 transition-colors">
                একসাথে স্বপ্ন সমিতি
              </h1>
              <p className="text-xs text-emerald-400/80 font-medium tracking-wide">
                Somiti Management App
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Theme Toggle, Notifications, User Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 border border-slate-700/60 shadow-sm transition-all flex items-center justify-center cursor-pointer"
            title={theme === 'dark' ? "লাইট মোডে সুইচ করুন" : "ডার্ক মোডে সুইচ করুন"}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => navigateWithLoading('/notifications')}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="নোটিফিকেশন তালিকা"
          >
            <Bell className="w-5 h-5" />
            {(notifications?.length > 0 || (currentUser?.role === 'admin' && pendingCount > 0)) && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
                {toBengaliDigits(currentUser?.role === 'admin' ? (pendingCount + (notifications?.length || 0)) : notifications?.length)}
              </span>
            )}
          </button>

          {/* Profile Dropdown / User Details */}
          {currentUser ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div 
                onClick={() => navigateWithLoading('/profile')} 
                className="flex items-center space-x-2.5 cursor-pointer group"
              >
                <ProfileAvatar
                  src={currentUser.profileImage}
                  name={currentUser.name}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 group-hover:border-emerald-500 transition-colors"
                  iconClassName="w-5 h-5"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate max-w-[120px]">
                    {currentUser.name}
                  </p>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    currentUser.role === 'admin' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {currentUser.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigateWithLoading('/login');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="লগ আউট"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigateWithLoading('/login')}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              লগইন
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
