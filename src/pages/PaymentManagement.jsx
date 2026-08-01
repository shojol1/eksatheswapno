import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Save, 
  AlertTriangle,
  Wallet,
  Calendar,
  Check,
  User,
  DollarSign,
  ImageIcon
} from 'lucide-react';
import ProfileAvatar from '../components/ProfileAvatar';
import ReceiptViewerModal from '../components/ReceiptViewerModal';
import { toBengaliDigits, formatDateTime } from '../utils/bengaliNumbers';

export default function PaymentManagement() {
  const { currentUser, collections, members, updateCollection, deleteCollection } = useAuth();

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const yearsList = ["2026", "2027", "2028", "2029", "2030"];

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal States
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Edit Modal
  const [editMemberId, setEditMemberId] = useState('');
  const [editAmount, setEditAmount] = useState('5000');
  const [editYear, setEditYear] = useState('2026');
  const [editMonth, setEditMonth] = useState('August');
  const [editStatus, setEditStatus] = useState('approved');
  const [editDate, setEditDate] = useState('');

  // Access check: Only Admin can access
  if (currentUser?.role !== 'admin') {
    return (
      <div className="glass-card p-8 rounded-3xl border border-slate-800 text-center max-w-lg mx-auto space-y-4 font-bengali">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white font-bengali">এক্সেস সংরক্ষিত</h2>
        <p className="text-sm text-slate-400 font-bengali">
          পেমেন্ট ম্যানেজমেন্ট সেকশনটি শুধুমাত্র অ্যাডমিনদের ব্যবহারের জন্য সংরক্ষিত।
        </p>
      </div>
    );
  }

  // Helper to get member info by ID or Name
  const getMemberInfo = (item) => {
    const mId = String(item.userId || item.memberId || item.uid || '');
    const mName = String(item.memberName || '').trim().toLowerCase();

    const found = members.find(m => 
      (mId && (m.id === mId || m.uid === mId)) || 
      (mName && m.name && m.name.trim().toLowerCase() === mName)
    );

    return {
      name: found ? found.name : (item.memberName || 'সদস্য'),
      phone: found ? found.phone : '',
      profileImage: found ? found.profileImage : ''
    };
  };

  // Filter collections
  const filteredCollections = collections.filter(c => {
    const info = getMemberInfo(c);
    const searchLower = searchTerm.toLowerCase().trim();

    const matchesSearch = 
      !searchLower ||
      info.name.toLowerCase().includes(searchLower) ||
      (info.phone && info.phone.includes(searchLower)) ||
      (c.note && c.note.toLowerCase().includes(searchLower));

    const matchesYear = selectedYear === 'ALL' || String(c.year) === String(selectedYear);
    const matchesMonth = selectedMonth === 'ALL' || (c.month && String(c.month).toLowerCase() === String(selectedMonth).toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || (c.status && String(c.status).toLowerCase() === String(selectedStatus).toLowerCase());

    return matchesSearch && matchesYear && matchesMonth && matchesStatus;
  });

  // Sort A-to-Z by Member Name
  const sortedCollections = [...filteredCollections].sort((a, b) => {
    const nameA = getMemberInfo(a).name.toLowerCase();
    const nameB = getMemberInfo(b).name.toLowerCase();
    return nameA.localeCompare(nameB, 'bn');
  });

  // Calculate totals
  const totalAmount = filteredCollections
    .filter(c => !c.status || String(c.status).toLowerCase() === 'approved')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    const info = getMemberInfo(item);
    setEditingItem(item);
    setEditMemberId(item.userId || item.memberId || '');
    setEditAmount(String(item.amount || '5000'));
    setEditYear(String(item.year || '2026'));
    setEditMonth(item.month || 'August');
    setEditStatus(item.status || 'approved');
    setEditDate(item.date || new Date().toISOString().split('T')[0]);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      const selectedMemberObj = members.find(m => m.id === editMemberId || m.uid === editMemberId);
      const updatedFields = {
        userId: editMemberId || editingItem.userId || '',
        memberId: editMemberId || editingItem.memberId || '',
        memberName: selectedMemberObj ? selectedMemberObj.name : editingItem.memberName || 'সদস্য',
        amount: Number(editAmount),
        year: editYear,
        month: editMonth,
        status: editStatus,
        date: editDate
      };

      await updateCollection(editingItem.id, updatedFields);
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating collection:', err);
      alert('আপডেট করতে ব্যর্থ হয়েছে! আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    setIsSubmitting(true);
    try {
      await deleteCollection(deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error('Error deleting collection:', err);
      alert('ডিলিট করতে ব্যর্থ হয়েছে! আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2.5">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            <span>পেমেন্ট ম্যানেজমেন্ট</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            সমিতির সকল পেমেন্ট এন্ট্রি (A-Z), ফিল্টারিং, নতুন সম্পাদনা ও মোছার অ্যাডমিন প্যানেল
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-semibold">মোট এন্ট্রি</span>
            <span className="text-sm font-bold text-white font-mono">{toBengaliDigits(sortedCollections.length)} টি</span>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
            <span className="text-[10px] text-emerald-400 block font-semibold">মোট জমাকৃত টাকা</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">৳ {totalAmount.toLocaleString('bn-BD')}</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Member Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="সদস্যের নাম বা নম্বর..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Year Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">সকল বছর</option>
              {yearsList.map(y => (
                <option key={y} value={y}>{toBengaliDigits(y)} (বছর)</option>
              ))}
            </select>
          </div>

          {/* Month Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">সকল মাস</option>
              {monthsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">সকল স্ট্যাটাস</option>
              <option value="approved">অনুমোদিত (Approved)</option>
              <option value="pending">পেন্ডিং (Pending)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Collections List */}
      <div className="space-y-3">
        {sortedCollections.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">কোন পেমেন্ট রেকর্ড পাওয়া যায়নি!</h3>
            <p className="text-xs text-slate-400">ফিল্টার পরিবর্তন করে বা নতুন সার্চ দিন।</p>
          </div>
        ) : (
          sortedCollections.map((item) => {
            const memberInfo = getMemberInfo(item);
            const isApproved = !item.status || String(item.status).toLowerCase() === 'approved';

            return (
              <div 
                key={item.id} 
                className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Member & Payment Details */}
                <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
                  <ProfileAvatar 
                    src={memberInfo.profileImage} 
                    name={memberInfo.name} 
                    sizeClass="w-11 h-11" 
                    textClass="text-base" 
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white truncate">{memberInfo.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isApproved ? 'অনুমোদিত' : 'পেন্ডিং'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 flex-wrap gap-y-1">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold">
                        {item.month ? `${item.month} ${toBengaliDigits(item.year)}` : `${toBengaliDigits(item.year)} (বার্ষিক)`}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        তারিখ ও সময়: {formatDateTime(item)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block font-semibold">পরিমাণ</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      ৳ {Number(item.amount || 0).toLocaleString('bn-BD')}
                    </span>
                  </div>

                  {/* Receipt button if available */}
                  {item.receiptUrl && (
                    <button
                      onClick={() => setViewingReceipt(item.receiptUrl)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="রসিদ দেখুন"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}

                  {/* Action Buttons: Edit & Delete */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all flex items-center space-x-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>সম্পাদনা</span>
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-all flex items-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 w-full max-w-md space-y-5 relative font-bengali">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit className="w-5 h-5 text-indigo-400" />
                <span>পেমেন্ট এন্ট্রি সম্পাদনা</span>
              </h3>
              <button 
                onClick={() => setEditingItem(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Member Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">সদস্য *</label>
                <select
                  value={editMemberId}
                  onChange={(e) => setEditMemberId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">সদস্য নির্বাচন করুন</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Month & Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">মাস *</label>
                  <select
                    value={editMonth}
                    onChange={(e) => setEditMonth(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">বছর *</label>
                  <select
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {yearsList.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">স্ট্যাটাস *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="approved">অনুমোদিত (Approved)</option>
                  <option value="pending">পেন্ডিং (Pending)</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">জমার তারিখ *</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card p-6 rounded-3xl border border-rose-500/40 w-full max-w-sm space-y-4 text-center font-bengali">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">এন্ট্রি ডিলিট নিশ্চিতকরণ</h3>
            <p className="text-xs text-slate-400">
              আপনি কি নিশ্চিত যে এই পেমেন্ট এন্ট্রিটি চিরতরে মুছে ফেলতে চান?
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30"
              >
                {isSubmitting ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Receipt Modal */}
      {viewingReceipt && (
        <ReceiptViewerModal
          src={viewingReceipt}
          title="পেমেন্ট রসিদের কপি"
          onClose={() => setViewingReceipt(null)}
        />
      )}

    </div>
  );
}
