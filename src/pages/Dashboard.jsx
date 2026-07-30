import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Calendar, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles,
  Users,
  User
} from 'lucide-react';

export default function Dashboard() {
  const { 
    currentUser, 
    collections, 
    members, 
    expenses, 
    profits, 
    bank, 
    investments = [], 
    bankCharges = [], 
    dpsEntries = [] 
  } = useAuth();
  const navigate = useNavigate();

  // Filters state (matching HomeFragment.java)
  const currentYear = new Date().getFullYear().toString();
  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = monthsList[new Date().getMonth()];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Filtered collections for selected month & year (strict matching)
  const monthlyCollections = collections.filter(c => {
    // 1. Status must be approved
    const isApproved = !c.status || String(c.status).toLowerCase() === 'approved';
    if (!isApproved) return false;

    // 2. Determine Collection Year
    let colYear = c.year ? String(c.year).trim() : '';
    if (!colYear && c.date) {
      colYear = c.date.split('-')[0] || c.date.split('/')[0] || '';
    }
    if (colYear && colYear !== String(selectedYear)) return false;

    // 3. Determine Collection Month
    let colMonth = c.month ? String(c.month).trim().toLowerCase() : '';
    if (!colMonth && c.date) {
      const parts = c.date.split('-');
      if (parts.length >= 2) {
        const mNum = parseInt(parts[1], 10);
        if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
          colMonth = monthsList[mNum - 1].toLowerCase();
        }
      }
    }

    if (!colMonth) return false;

    const selMonthStr = String(selectedMonth).trim().toLowerCase();
    const isMonthMatch = colMonth === selMonthStr ||
      colMonth.startsWith(selMonthStr.substring(0, 3)) ||
      selMonthStr.startsWith(colMonth.substring(0, 3));

    return isMonthMatch;
  });

  const totalPaidMonth = monthlyCollections.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalAllTime = collections
    .filter(c => !c.status || String(c.status).toLowerCase() === 'approved')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalProfit = profits.reduce((sum, p) => sum + Number(p.totalProfitAmount || p.amount || 0), 0);
  const totalInvestmentAmt = investments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalBankChargeAmt = bankCharges.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalDpsAmt = dpsEntries.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  // Total outflows = Expenses + Investments + Bank Charges + DPS
  const totalOutflows = totalExpense + totalInvestmentAmt + totalBankChargeAmt + totalDpsAmt;

  // Somiti Net Cash Balance = (Total Collections + Total Profit) - Total Outflows
  const somitiRemainingCash = (totalAllTime + totalProfit) - totalOutflows;

  // Final Bank Cash Balance to display
  const displayBankBalance = (bank && bank.balance > 0) ? bank.balance : somitiRemainingCash;

  // Target matching HomeFragment.java MONTHLY_TARGET = 50000
  const MONTHLY_TARGET = 50000;
  const progressPercent = Math.min(100, Math.round((totalPaidMonth / MONTHLY_TARGET) * 100));

  // Pending collections for admin alert banner
  const pendingItems = collections.filter(c => c.status && String(c.status).toLowerCase() === 'pending');

  // Due calculation: general members (non-admins) who haven't paid approved contribution for selected month
  const generalMembers = members.filter(m => m.role !== 'admin');

  const isPaid = (member) => {
    return monthlyCollections.some(c => {
      const mId = String(member.id || member.uid || '');
      const cUser = String(c.userId || c.memberId || c.addedBy || c.uid || '');
      return (mId && cUser && mId === cUser) ||
        (c.memberName && member.name && c.memberName.trim().toLowerCase() === member.name.trim().toLowerCase());
    });
  };

  const dueCount = generalMembers.filter(m => !isPaid(m)).length;
  const estimatedDueAmount = dueCount * 5000; // monthly installment 5000 BDT per member

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4 sm:space-x-5">
            {/* Logged-in User Profile Picture (Circular - Larger Size) */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-slate-900 border-4 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {currentUser?.profileImage ? (
                <img 
                  src={currentUser.profileImage} 
                  alt={currentUser.name || 'Profile'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>একসাথে স্বপ্ন ডিজিটাল ড্যাশবোর্ড</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-bengali">
                স্বাগতম, {currentUser?.name || 'ব্যবহারকারী'}!
              </h1>
              <p className="text-slate-400 text-sm mt-1 font-bengali">
                আপনার সমিতির আর্থিক হিসাব ও কালেকশনের সর্বশেষ আপডেট দেখুন।
              </p>
            </div>
          </div>

          {/* Month & Year Selection Dropdowns (matching HomeFragment.java) */}
          <div className="flex items-center space-x-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 self-start md:self-auto">
            <Calendar className="w-5 h-5 text-emerald-400 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer pr-2"
            >
              {monthsList.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-emerald-400 text-sm font-bold focus:outline-none cursor-pointer"
            >
              <option value="2026" className="bg-slate-900 text-white">2026</option>
              <option value="2027" className="bg-slate-900 text-white">2027</option>
              <option value="2028" className="bg-slate-900 text-white">2028</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin Pending Approvals Alert Banner (matching HomeFragment.java cardAlert) */}
      {currentUser?.role === 'admin' && pendingItems.length > 0 && (
        <div className="glass-amber p-5 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300 font-bengali">
                অনুমোদনের জন্য {pendingItems.length} টি কালেকশন পেন্ডিং আছে!
              </h3>
              <p className="text-xs text-amber-400/80 font-bengali mt-0.5">
                সদস্যদের জমাকৃত টাকা যাচাই করে অতিদ্রুত অ্যাপ্রুভ করুন।
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/pending')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            এখনই দেখুন
          </button>
        </div>
      )}

      {/* Main Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Paid This Month */}
        <div 
          onClick={() => navigate('/collections', { state: { month: selectedMonth, year: selectedYear } })}
          className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 font-bengali">
              মাসিক সংগৃহীত টাকা ({selectedMonth} {selectedYear})
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2 font-bengali">
            ৳ {totalPaidMonth.toLocaleString('bn-BD')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-bengali">
            অনুমোদিত কালেকশনসমূহ
          </p>
        </div>

        {/* Total Due This Month */}
        <div 
          onClick={() => navigate('/due-members')}
          className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 font-bengali">
              মাসিক বকেয়া ({selectedMonth} {selectedYear})
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2 font-bengali">
            ৳ {estimatedDueAmount.toLocaleString('bn-BD')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-bengali">
            বকেয়া সদস্য: {dueCount} জন
          </p>
        </div>

        {/* All-time Total Collections */}
        <div 
          onClick={() => navigate('/collections')}
          className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-teal-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 font-bengali">
              সর্বমোট সঞ্চয় কালেকশন
            </span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-teal-300 mt-2 font-bengali">
            ৳ {totalAllTime.toLocaleString('bn-BD')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-bengali">
            সর্বমোট সংগৃহীত তহবিল
          </p>
        </div>

        {/* Bank Cash Balance Card */}
        <div 
          onClick={() => navigate('/bank')}
          className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 font-bengali">
              ব্যাংক ক্যাশ স্থিতি
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-300 mt-2 font-bengali">
            ৳ {displayBankBalance.toLocaleString('bn-BD')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-bengali">
            সমিতির অবশিষ্ট ক্যাশ স্থিতি
          </p>
        </div>

      </div>

      {/* Monthly Target Progress Section (matching HomeFragment progressMonthly) */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-white font-bengali">
              মাসিক টার্গেট প্রগ্রেস ({selectedMonth} {selectedYear})
            </h3>
            <p className="text-xs text-slate-400 font-bengali mt-0.5">
              টার্গেট: ৳ {MONTHLY_TARGET.toLocaleString('bn-BD')}
            </p>
          </div>
          <span className="text-lg font-extrabold text-emerald-400">
            {progressPercent}%
          </span>
        </div>

        {/* Custom Glowing Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Action Grid & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Collections Feed (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-bengali">
              সাম্প্রতিক কালেকশন এন্ট্রি
            </h3>
            <button
              onClick={() => navigate('/collections')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>সব দেখুন</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {collections.slice(0, 5).map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${
                    item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {item.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-bengali">{item.memberName}</p>
                    <p className="text-xs text-slate-400 font-bengali">
                      {item.month} {item.year} • {item.method} ({item.date})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400 font-bengali">
                    + ৳ {Number(item.amount).toLocaleString('bn-BD')}
                  </p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {item.status === 'approved' ? 'অনুমোদিত' : 'পেন্ডিং'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white font-bengali">
            দ্রুত অ্যাকশন
          </h3>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/add-collection')}
              className="w-full p-3.5 rounded-xl glass-emerald font-semibold text-sm flex items-center justify-between transition-all font-bengali group"
            >
              <div className="flex items-center space-x-3">
                <PlusCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-emerald-300">নতুন জমা এন্ট্রি দিন</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={() => navigate('/expenses')}
              className="w-full p-3.5 rounded-xl glass-rose font-semibold text-sm flex items-center justify-between transition-all font-bengali group"
            >
              <div className="flex items-center space-x-3">
                <TrendingDown className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-rose-300">ব্যয়/বিনিয়োগ</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </button>

            <button
              onClick={() => navigate('/profits')}
              className="w-full p-3.5 rounded-xl glass-amber font-semibold text-sm flex items-center justify-between transition-all font-bengali group"
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-amber-300">মুনাফা বন্টন হিসাব</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={() => navigate('/members')}
              className="w-full p-3.5 rounded-xl glass-indigo font-semibold text-sm flex items-center justify-between transition-all font-bengali group"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-indigo-300">সদস্যবৃন্দ দেখতে ক্লিক করুন</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
