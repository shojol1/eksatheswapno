import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingDown, PlusCircle, Search, Calendar, Building2, Wallet, Trash2, Shield, Lock } from 'lucide-react';
import { toBengaliDigits } from '../utils/bengaliNumbers';

export default function Expenses() {
  const {
    collections = [],
    expenses = [], addExpense, deleteExpense,
    investments = [], addInvestment, deleteInvestment,
    bankCharges = [], addBankCharge, deleteBankCharge,
    dpsEntries = [], addDpsEntry, deleteDpsEntry,
    profits = [],
    currentUser
  } = useAuth();

  const isAdmin = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'investments', 'bank_charges', 'dps_entries'
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState(null); // null, 'investment', 'bank', 'dps'

  // Generic Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [month, setMonth] = useState('January');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Merge all real-time items (investments, bank_charges, dps_entries) into a single list
  const allItems = [
    ...investments.map(i => ({
      id: i.id,
      docType: 'investments',
      title: i.title || 'সমিতি বিনিয়োগ',
      amount: Number(i.amount || 0),
      date: i.date || 'আজ',
      details: i.comment ? `মন্তব্য: ${i.comment}` : 'বিনিয়োগ খাত',
      badge: 'বিনিয়োগ',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    })),
    ...bankCharges.map(b => ({
      id: b.id,
      docType: 'bank_charges',
      title: b.reason || 'ব্যাংক সার্ভিস চার্জ',
      amount: Number(b.amount || 0),
      date: b.date || 'আজ',
      details: b.reason ? `কারণ: ${b.reason}` : 'ব্যাংক চার্জ',
      badge: 'ব্যাংক চার্জ',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    })),
    ...dpsEntries.map(d => ({
      id: d.id,
      docType: 'dps_entries',
      title: `${d.year || ''} ${d.month || ''} DPS জমা`,
      amount: Number(d.amount || 0),
      date: d.date || 'আজ',
      details: `মাস: ${d.month || ''}, বছর: ${d.year || ''}`,
      badge: 'DPS সঞ্চয়',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }))
  ];

  // Filter items based on activeTab and searchTerm
  const filteredItems = allItems.filter(item => {
    if (activeTab !== 'all' && item.docType !== activeTab) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(term) ||
        item.details.toLowerCase().includes(term) ||
        item.badge.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Summary Totals
  const totalApprovedCollectionsSum = collections
    .filter(c => !c.status || String(c.status).toLowerCase() === 'approved')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalInvestmentsSum = investments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalBankChargesSum = bankCharges.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalDpsSum = dpsEntries.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalProfitsSum = profits.reduce((sum, p) => sum + Number(p.amount || p.totalProfitAmount || 0), 0);

  // Grand total expenses & Remaining Balance formula: (Total Collected + Profits) - Expenses
  const totalGrandSum = totalInvestmentsSum + totalBankChargesSum + totalDpsSum;
  const remainingBalance = (totalApprovedCollectionsSum + totalProfitsSum) - totalGrandSum;

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setComment('');
    setMonth('January');
    setYear(new Date().getFullYear().toString());
    setModalType(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || !isAdmin) return;

    if (modalType === 'investment') {
      await addInvestment({ title: title || 'নতুন বিনিয়োগ', amount, date, comment });
    } else if (modalType === 'bank') {
      await addBankCharge({ amount, date, reason: reason || title || 'ব্যাংক চার্জ' });
    } else if (modalType === 'dps') {
      await addDpsEntry({ amount, date, month, year });
    }

    resetForm();
  };

  const handleDelete = async (item) => {
    if (!isAdmin) return;
    if (!window.confirm('আপনি কি নিশ্চিত যে এই এন্ট্রিটি মুছে ফেলতে চান?')) return;
    if (item.docType === 'investments') await deleteInvestment(item.id);
    if (item.docType === 'bank_charges') await deleteBankCharge(item.id);
    if (item.docType === 'dps_entries') await deleteDpsEntry(item.id);
  };

  return (
    <div className="space-y-6 font-bengali">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <TrendingDown className="w-7 h-7 text-rose-400" />
            <span>ব্যয় ও বিনিয়োগ ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            সমিতির বিনিয়োগ, ব্যাংক চার্জ এবং ডিপিএস সঞ্চয় হিসাব
          </p>
        </div>

        {/* Action Buttons for Admin only */}
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { resetForm(); setModalType('investment'); }}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ বিনিয়োগ</span>
            </button>
            <button
              onClick={() => { resetForm(); setModalType('bank'); }}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ ব্যাংক চার্জ</span>
            </button>
            <button
              onClick={() => { resetForm(); setModalType('dps'); }}
              className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 flex items-center space-x-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ DPS এন্ট্রি</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>সদস্য ভিউ (শুধুমাত্র দেখার অনুমতি)</span>
          </div>
        )}
      </div>

      {/* Primary Financial Balance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Collected */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-xs text-emerald-400 font-semibold block">মোট জমাকৃত টাকা</span>
          <p className="text-2xl font-black text-white mt-1 font-mono">
            ৳ {totalApprovedCollectionsSum.toLocaleString('bn-BD')}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">সদস্য সঞ্চয় জমা</span>
        </div>

        {/* 2. Total Expense/Investment */}
        <div className="glass-card p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
          <span className="text-xs text-rose-400 font-semibold block">ব্যয় / বিনিয়োগ</span>
          <p className="text-2xl font-black text-white mt-1 font-mono">
            ৳ {totalGrandSum.toLocaleString('bn-BD')}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">বিনিয়োগ + ব্যাংক চার্জ + DPS</span>
        </div>

        {/* 3. Total Profits */}
        <div className="glass-card p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5">
          <span className="text-xs text-purple-400 font-semibold block">মোট লভ্যাংশ</span>
          <p className="text-2xl font-black text-white mt-1 font-mono">
            ৳ {totalProfitsSum.toLocaleString('bn-BD')}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">সমিতির অর্জিত লভ্যাংশ</span>
        </div>

        {/* 4. Remaining Balance */}
        <div className={`glass-card p-5 rounded-2xl border ${
          remainingBalance >= 0 ? 'border-sky-500/40 bg-sky-500/10' : 'border-rose-600/40 bg-rose-600/10'
        }`}>
          <span className="text-xs text-sky-300 font-bold block flex items-center justify-between">
            <span>অবশিষ্ট টাকা (ক্যাশ ব্যালেন্স)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/80 text-sky-400 border border-sky-500/20">
              অবশিষ্ট
            </span>
          </span>
          <p className={`text-2xl font-black mt-1 font-mono ${
            remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            ৳ {remainingBalance.toLocaleString('bn-BD')}
          </p>
          <span className="text-[10px] text-slate-300 mt-1 block">
            (মোট জমা + লভ্যাংশ) – ব্যয়/বিনিয়োগ
          </span>
        </div>

      </div>

      {/* Sub-Category Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-emerald p-4 rounded-2xl border border-emerald-500/20 text-xs space-y-1">
          <span className="text-emerald-300 font-semibold block">মোট বিনিয়োগ</span>
          <p className="text-xl font-bold text-white font-mono">৳ {totalInvestmentsSum.toLocaleString('bn-BD')}</p>
        </div>
        <div className="glass-indigo p-4 rounded-2xl border border-indigo-500/20 text-xs space-y-1">
          <span className="text-indigo-300 font-semibold block">ব্যাংক চার্জ</span>
          <p className="text-xl font-bold text-white font-mono">৳ {totalBankChargesSum.toLocaleString('bn-BD')}</p>
        </div>
        <div className="glass-amber p-4 rounded-2xl border border-amber-500/20 text-xs space-y-1">
          <span className="text-amber-300 font-semibold block">DPS সঞ্চয়</span>
          <p className="text-xl font-bold text-white font-mono">৳ {totalDpsSum.toLocaleString('bn-BD')}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'all' ? 'bg-slate-800 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            সব ({allItems.length})
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'investments' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            বিনিয়োগ ({investments.length})
          </button>
          <button
            onClick={() => setActiveTab('bank_charges')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'bank_charges' ? 'bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            ব্যাংক চার্জ ({bankCharges.length})
          </button>
          <button
            onClick={() => setActiveTab('dps_entries')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'dps_entries' ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            DPS সঞ্চয় ({dpsEntries.length})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Items List */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">কোন এন্ট্রি পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredItems.map((item) => (
              <div key={`${item.docType}_${item.id}`} className="p-5 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  </div>
                  {item.details && (
                    <p className="text-xs text-slate-400 italic pl-1">{item.details}</p>
                  )}
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1 font-mono">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{item.date}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  <span className="text-lg font-bold text-rose-400 font-mono">
                    ৳ {item.amount.toLocaleString('bn-BD')}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Entry Modals (Matching Android App ExpenseManagementActivity.java) */}
      {isAdmin && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 w-full max-w-md space-y-5 relative font-bengali">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {modalType === 'expense' && 'নতুন অফিস খরচ এন্ট্রি'}
                {modalType === 'investment' && 'নতুন বিনিয়োগ এন্ট্রি'}
                {modalType === 'bank' && 'নতুন ব্যাংক চার্জ এন্ট্রি'}
                {modalType === 'dps' && 'নতুন DPS সঞ্চয় এন্ট্রি'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {modalType === 'expense' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">অফিস খরচের খাত *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: অফিস ভাড়া / স্টেশনরি / নাস্তা খরচ"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {modalType === 'investment' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">বিনিয়োগের খাত / শিরোনাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: জমি ক্রয় / শেয়ার বিনিয়োগ"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">মন্তব্য (Comment) *</label>
                    <input
                      type="text"
                      required
                      placeholder="বিনিয়োগের সংক্ষিপ্ত বিবরণ"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </>
              )}

              {modalType === 'bank' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ব্যাংক চার্জের কারণ (Reason) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: জামুনা ব্যাংক এসি সার্ভিস ফি"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {modalType === 'dps' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">মাস *</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">বছর *</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {['2026', '2027', '2028', '2029', '2030'].map(y => (
                        <option key={y} value={y}>{toBengaliDigits(y)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  placeholder="৫০০০"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">তারিখ *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {modalType === 'expense' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">নোট (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="বিবরণী"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
