import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Search, PlusCircle, CheckCircle2, Clock, Eye, Trash2, Check, X, FileText, Image as ImageIcon } from 'lucide-react';

export default function Collections() {
  const { collections, members, currentUser, approveCollection, rejectCollection, deleteCollection } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState('monthly'); // 'monthly' (default) or 'yearly'
  const [filterYear, setFilterYear] = useState(location.state?.year || 'ALL');
  const [filterMonth, setFilterMonth] = useState(location.state?.month || 'ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to resolve member name safely (from collection field or members array lookup)
  const getMemberName = (item) => {
    if (item.memberName) return item.memberName;
    const uid = item.userId || item.memberId;
    const found = members.find(m => m.id === uid || m.uid === uid);
    return found ? found.name : 'সদস্য';
  };

  const getFormatDate = (item) => {
    if (item.date) return item.date;
    if (item.time) return new Date(Number(item.time)).toISOString().split('T')[0];
    return 'অনির্দিষ্ট';
  };

  const filteredCollections = collections.filter(c => {
    const memberName = getMemberName(c);
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase());

    // Payment Type matching
    const isYearly = c.paymentType === 'yearly';
    if (filterPaymentType === 'monthly' && isYearly) return false;
    if (filterPaymentType === 'yearly' && !isYearly) return false;

    // Year matching (handling string vs number and fallback from date)
    let matchesYear = true;
    if (filterYear !== 'ALL') {
      let colYear = c.year ? String(c.year).trim() : '';
      if (!colYear && c.date) {
        colYear = c.date.split('-')[0] || c.date.split('/')[0] || '';
      }
      matchesYear = !colYear || colYear === String(filterYear);
    }

    // Month matching (Only applicable for monthly payment type)
    let matchesMonth = true;
    if (filterPaymentType === 'monthly' && filterMonth !== 'ALL') {
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
      if (!colMonth) {
        matchesMonth = false;
      } else {
        const selMonthStr = String(filterMonth).trim().toLowerCase();
        matchesMonth = colMonth === selMonthStr ||
          colMonth.startsWith(selMonthStr.substring(0, 3)) ||
          selMonthStr.startsWith(colMonth.substring(0, 3));
      }
    }

    const matchesStatus = filterStatus === 'ALL' || (c.status && String(c.status).toLowerCase() === String(filterStatus).toLowerCase());
    return matchesSearch && matchesYear && matchesMonth && matchesStatus;
  });

  const totalFilteredAmount = filteredCollections
    .filter(c => !c.status || String(c.status).toLowerCase() === 'approved')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-bengali flex items-center space-x-2">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <span>সঞ্চয় কালেকশন তালিকা</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-bengali">
            সমিতির সকল সদস্যের জমাকৃত সঞ্চয় ফি এর তালিকা ও রসিদ বিবরণী
          </p>
        </div>

        <button
          onClick={() => navigate('/add-collection')}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all font-bengali self-start sm:self-auto"
        >
          <PlusCircle className="w-5 h-5" />
          <span>নতুন জমা এন্ট্রি</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3 font-bengali">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="সদস্যের নাম খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Payment Type Dropdown */}
        <select
          value={filterPaymentType}
          onChange={(e) => setFilterPaymentType(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-emerald-400 text-sm font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="monthly">মাসিক পেমেন্ট</option>
          <option value="yearly">বাৎসরিক পেমেন্ট</option>
        </select>

        {/* Year Filter (2026 to 2030) */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="ALL">সকল বছর</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
          <option value="2028">2028</option>
          <option value="2029">2029</option>
          <option value="2030">2030</option>
        </select>

        {/* Month Filter (Hides when paymentType is 'yearly') */}
        {filterPaymentType === 'monthly' && (
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">সকল মাস</option>
            {monthsList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="ALL">সকল স্ট্যাটাস</option>
          <option value="approved">অনুমোদিত</option>
          <option value="pending">পেন্ডিং</option>
        </select>

      </div>

      {/* Summary Filter Pill */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-bengali">
          মোট ফিল্টারকৃত অনুমোদিত কালেকশন:
        </span>
        <span className="text-lg font-bold text-emerald-400 font-bengali">
          ৳ {totalFilteredAmount.toLocaleString('bn-BD')}
        </span>
      </div>

      {/* Collections Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-bold font-bengali border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">সদস্যের নাম</th>
                <th className="px-6 py-4">মাস ও বছর</th>
                <th className="px-6 py-4">পেমেন্ট মেথড</th>
                <th className="px-6 py-4">তারিখ</th>
                <th className="px-6 py-4">পরিমাণ (৳)</th>
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-bengali">
              {filteredCollections.length > 0 ? (
                filteredCollections.map((item) => {
                  const name = getMemberName(item);
                  const dateStr = getFormatDate(item);
                  const methodStr = item.method || (item.paymentType === 'yearly' ? 'বাৎসরিক' : 'মাসিক');

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        {name}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {item.month ? `${item.month} ${item.year}` : item.year}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          methodStr === 'Bank' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {methodStr}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {dateStr}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400 text-base">
                        ৳ {Number(item.amount || 0).toLocaleString('bn-BD')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.status === 'approved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {item.status === 'approved' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              <span>অনুমোদিত</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              <span>পেন্ডিং</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {item.receiptUrl && (
                            <button
                              onClick={() => setSelectedReceipt(item)}
                              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                              title="রসিদ ছবি দেখুন"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                          {currentUser?.role === 'admin' && (
                            <>
                              {item.status === 'pending' && (
                                <button
                                  onClick={() => approveCollection(item.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                                  title="অনুমোদন করুন"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteCollection(item.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 font-bengali">
                    কোন কালেকশন তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 max-w-lg w-full space-y-4 font-bengali">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">জমা রসিদ বিবরণী</h3>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="text-xs space-y-2 text-slate-300">
              <p><span className="text-slate-500">সদস্য:</span> {getMemberName(selectedReceipt)}</p>
              <p><span className="text-slate-500">পরিমাণ:</span> ৳ {Number(selectedReceipt.amount).toLocaleString('bn-BD')}</p>
              <p><span className="text-slate-500">মাস/বছর:</span> {selectedReceipt.month} {selectedReceipt.year}</p>
            </div>
            {selectedReceipt.receiptUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-700 max-h-80 flex items-center justify-center bg-slate-900">
                <img src={selectedReceipt.receiptUrl} alt="Receipt" className="max-h-72 object-contain" />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
