import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, PlusCircle, Coins, Calendar, Users, Edit3, Trash2, Shield, Lock } from 'lucide-react';
import { toBengaliDigits } from '../utils/bengaliNumbers';

export default function Profits() {
  const { profits, addProfit, updateProfit, deleteProfit, members, currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const generalMembers = members.filter(m => m.role !== 'admin');
  const targetMemberCount = generalMembers.length > 0 ? generalMembers.length : 10;

  // Helper to extract numeric amount safely
  const getProfitAmount = (p) => Number(p.amount || p.totalProfitAmount || 0);

  // Helper to extract title/description safely
  const getProfitTitle = (p) => p.description || p.title || 'বিনিয়োগ মুনাফা';

  // Helper to extract date safely
  const getProfitDate = (p) => {
    if (p.date && typeof p.date === 'string') return p.date;
    if (p.date?.seconds) return new Date(p.date.seconds * 1000).toISOString().split('T')[0];
    if (p.timestamp?.seconds) return new Date(p.timestamp.seconds * 1000).toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  };

  const totalProfit = profits.reduce((sum, p) => sum + getProfitAmount(p), 0);
  const perMemberAverage = targetMemberCount > 0 ? Math.floor(totalProfit / targetMemberCount) : 0;

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setTitle(getProfitTitle(p));
    setAmount(String(getProfitAmount(p)));
    setDate(getProfitDate(p));
    setNote(p.note || p.comment || '');
    setShowModal(true);
  };

  const handleSaveProfit = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    const numAmount = Number(amount);
    const perMember = Math.floor(numAmount / targetMemberCount);

    if (editingId) {
      await updateProfit(editingId, {
        title,
        description: title,
        amount: numAmount,
        totalProfitAmount: numAmount,
        perMemberAmount: perMember,
        memberCount: targetMemberCount,
        date,
        note
      });
    } else {
      await addProfit({
        title,
        description: title,
        amount: numAmount,
        totalProfitAmount: numAmount,
        distributedAmount: perMember * targetMemberCount,
        perMemberAmount: perMember,
        memberCount: targetMemberCount,
        date,
        note
      });
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-bengali flex items-center space-x-2">
            <TrendingUp className="w-7 h-7 text-amber-400" />
            <span>মুনাফা ও লাভ হিসাব</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-bengali">
            সমিতির বিনিয়োগ থেকে প্রাপ্ত লভ্যাংশ ও সদস্যদের মাঝে জনপ্রতি বন্টন হিসাব
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-2 transition-all font-bengali self-start sm:self-auto"
          >
            <PlusCircle className="w-5 h-5" />
            <span>নতুন মুনাফা এন্ট্রি</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-amber p-5 rounded-2xl border border-amber-500/30">
          <span className="text-xs text-amber-300 font-semibold font-bengali">সর্বমোট প্রাপ্ত মুনাফা</span>
          <p className="text-2xl font-extrabold text-white font-bengali mt-1">
            ৳ {totalProfit.toLocaleString('bn-BD')}
          </p>
        </div>
        <div className="glass-emerald p-5 rounded-2xl border border-emerald-500/30">
          <span className="text-xs text-emerald-300 font-semibold font-bengali">জনপ্রতি আনুমানিক বন্টন</span>
          <p className="text-2xl font-extrabold text-white font-bengali mt-1">
            ৳ {perMemberAverage.toLocaleString('bn-BD')}
          </p>
        </div>
        <div className="glass-indigo p-5 rounded-2xl border border-indigo-500/30">
          <span className="text-xs text-indigo-300 font-semibold font-bengali">সাধারণ সদস্য সংখ্যা</span>
          <p className="text-2xl font-extrabold text-white font-bengali mt-1">
            {targetMemberCount} জন
          </p>
        </div>
      </div>

      {/* Profit History */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white font-bengali">মুনাফা ও বন্টন ইতিহাস</h3>
          <span className="text-xs text-slate-400 font-bengali bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            মোট এন্ট্রি: {profits.length} টি
          </span>
        </div>

        {profits.length === 0 ? (
          <div className="p-12 text-center">
            <Coins className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-bengali">এখনও কোন মুনাফা এন্ট্রি যুক্ত হয়নি।</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {profits.map((p) => {
              const pAmt = getProfitAmount(p);
              const pTitle = getProfitTitle(p);
              const pDate = getProfitDate(p);
              const perMember = Math.floor(pAmt / targetMemberCount);

              return (
                <div key={p.id} className="p-5 hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-white font-bengali">{pTitle}</h4>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400 font-bengali">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{pDate}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{targetMemberCount} জন সদস্য</span>
                        </span>
                      </div>
                      {(p.note || p.comment) && (
                        <p className="text-xs text-slate-400 italic mt-1 font-bengali">
                          নোট: {p.note || p.comment}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center">
                      <div className="text-right space-y-0.5 font-bengali">
                        <p className="text-xl font-bold text-amber-400">
                          ৳ {pAmt.toLocaleString('bn-BD')}
                        </p>
                        <p className="text-xs text-emerald-400 font-semibold">
                          জনপ্রতি: ৳ {perMember.toLocaleString('bn-BD')}
                        </p>
                      </div>

                      {currentUser?.role === 'admin' && (
                        <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProfit(p.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Profit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-bengali">
                {editingId ? 'মুনাফা সম্পাদনা করুন' : 'নতুন মুনাফা যুক্ত করুন'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveProfit} className="space-y-4 font-bengali">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">মুনাফার শিরোনাম / বিবরণী *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: জমি বিনিয়োগ লাভ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">মোট মুনাফার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  placeholder="১৫০০০"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
                {amount && (
                  <p className="text-xs text-amber-400 mt-1">
                    জনপ্রতি বন্টন: ৳ {Math.floor(Number(amount) / targetMemberCount).toLocaleString('bn-BD')} ({toBengaliDigits(targetMemberCount)} জন সাধারণ সদস্য)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">তারিখ *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">অতিরিক্ত নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="বিবরণী"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30"
                >
                  {editingId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
