import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigateWithLoading } from '../context/NavigationContext';
import { toBengaliDigits } from '../utils/bengaliNumbers';
import { 
  LayoutDashboard, 
  Wallet, 
  PlusCircle, 
  Clock, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  Building2, 
  Users, 
  Bell, 
  UserCheck, 
  X
} from 'lucide-react';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { currentUser, collections } = useAuth();
  const location = useLocation();
  const navigateWithLoading = useNavigateWithLoading();

  const pendingCount = collections.filter(c => c.status === 'pending').length;

  const navItems = [
    { path: '/', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { path: '/collections', label: 'কালেকশন তালিকা', icon: Wallet },
    { path: '/add-collection', label: 'নতুন জমা দিন', icon: PlusCircle, memberOnly: true },
    { 
      path: '/pending', 
      label: 'পেন্ডিং অ্যাপ্রুভাল', 
      icon: Clock, 
      badge: currentUser?.role === 'admin' && pendingCount > 0 ? pendingCount : null,
      adminOnly: true 
    },
    { path: '/due-members', label: 'বকেয়া সদস্য তালিকা', icon: AlertCircle },
    { path: '/expenses', label: 'ব্যয় ও বিনিয়োগ', icon: TrendingDown },
    { path: '/profits', label: 'মুনাফা ও লাভ', icon: TrendingUp },
    { path: '/bank', label: 'ব্যাংক হিসাব', icon: Building2 },
    { path: '/members', label: 'সদস্যবৃন্দ', icon: Users },
    { path: '/profile', label: 'আমার প্রোফাইল', icon: UserCheck },
  ];

  const content = (
    <div className="flex flex-col h-full py-4 px-3">
      {/* Title / Section Header */}
      <div className="px-3 mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-bengali">
          মেনু নেভিগেশন
        </span>
        {mobileOpen && (
          <button onClick={onCloseMobile} className="text-slate-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && currentUser?.role !== 'admin') return null;
          if (item.memberOnly && currentUser?.role === 'admin') return null;

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                onCloseMobile();
                navigateWithLoading(item.path);
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 opacity-90" />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-bold text-white bg-rose-500 rounded-full">
                  {toBengaliDigits(item.badge)}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Footer Info inside Sidebar */}
      <div className="mt-auto pt-4 border-t border-slate-800 px-3">
        <div className="glass-panel p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-emerald-400">একসাথে স্বপ্ন সমিতি</p>
          <p className="text-[11px] text-slate-500">ভার্সন ১.০.০ (ওয়েব)</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 glass-panel border-r border-slate-800 min-h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            onClick={onCloseMobile} 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
