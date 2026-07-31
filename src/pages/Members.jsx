import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, PlusCircle, Phone, Search, Shield, User, Wallet, Calendar, CheckCircle2, Clock, Eye, X, FileText } from 'lucide-react';
import ProfileAvatar from '../components/ProfileAvatar';
import { toBengaliDigits } from '../utils/bengaliNumbers';
import ReceiptViewerModal from '../components/ReceiptViewerModal';

export default function Members() {
  const { members, addMember, collections } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Filter out admins - show general members
  const generalMembers = members.filter(m => m.role !== 'admin');

  const filteredMembers = generalMembers.filter(m =>
    (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.phone || '').includes(searchTerm)
  );

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const posA = a.position !== undefined && a.position !== null && a.position !== '' ? Number(a.position) : 99999;
    const posB = b.position !== undefined && b.position !== null && b.position !== '' ? Number(b.position) : 99999;
    return posA - posB;
  });

  // Helper to match and filter member's collections
  const getMemberCollections = (member) => {
    if (!member) return [];
    const mId = String(member.id || member.uid || '');
    const mName = String(member.name || '').trim().toLowerCase();

    return collections.filter(c => {
      const cUserId = String(c.userId || c.memberId || c.uid || c.addedBy || '');
      const cMemberName = String(c.memberName || '').trim().toLowerCase();

      const isIdMatch = mId && cUserId && mId === cUserId;
      const isNameMatch = mName && cMemberName && mName === cMemberName;

      return isIdMatch || isNameMatch;
    });
  };

  // Calculate total deposit per member from approved collections
  const getMemberTotalPaid = (member) => {
    const memberCols = getMemberCollections(member);
    return memberCols
      .filter(c => !c.status || String(c.status).toLowerCase() === 'approved')
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    addMember({ name, phone, profileImage: '' });
    setName('');
    setPhone('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6 font-bengali">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-bengali flex items-center space-x-2">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>সদস্যবৃন্দের তালিকা</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-bengali">
            সমিতির সাধারণ সদস্যবৃন্দের প্রোফাইল ও সঞ্চয়ের বিস্তারিত হিসাব
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all font-bengali self-start sm:self-auto"
        >
          <PlusCircle className="w-5 h-5" />
          <span>নতুন সদস্য যুক্ত</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="সদস্যের নাম বা মোবাইল নম্বর..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-bengali"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMembers.map((member) => {
          const totalPaid = getMemberTotalPaid(member);
          return (
            <div 
              key={member.id} 
              onClick={() => setSelectedMember(member)}
              className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all cursor-pointer group hover:scale-[1.01]"
            >
              <div className="flex items-center space-x-3">
                <ProfileAvatar src={member.profileImage} name={member.name} sizeClass="w-12 h-12" textClass="text-lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white font-bengali truncate group-hover:text-indigo-300 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{toBengaliDigits(member.phone)}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bengali">
                  {member.position ? `পজিশন: ${toBengaliDigits(member.position)}` : 'সদস্য'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-bengali">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>মোট জমাকৃত:</span>
                </span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  ৳ {totalPaid.toLocaleString('bn-BD')}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${member.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition-colors font-bengali"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>কল করুন</span>
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMember(member);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>বিস্তারিত</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 relative font-bengali">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <ProfileAvatar src={selectedMember.profileImage} name={selectedMember.name} sizeClass="w-14 h-14" textClass="text-xl" />
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedMember.name}</h2>
                  <p className="text-xs text-slate-400 font-mono">{selectedMember.phone}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMember(null)} 
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Stats */}
            {(() => {
              const memberCols = getMemberCollections(selectedMember);
              const approvedCols = memberCols.filter(c => !c.status || String(c.status).toLowerCase() === 'approved');
              const totalPaid = approvedCols.reduce((sum, c) => sum + Number(c.amount || 0), 0);
              const monthsPaidCount = new Set(approvedCols.filter(c => c.month).map(c => `${c.month}-${c.year}`)).size;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="glass-emerald p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
                    <span className="text-xs text-emerald-300 font-semibold block">সর্বমোট জমাকৃত টাকা</span>
                    <p className="text-xl font-bold text-white font-mono">৳ {totalPaid.toLocaleString('bn-BD')}</p>
                  </div>
                  <div className="glass-indigo p-4 rounded-2xl border border-indigo-500/30 text-center space-y-1">
                    <span className="text-xs text-indigo-300 font-semibold block">পরিশোধিত মোট মাস</span>
                    <p className="text-xl font-bold text-white font-mono">{monthsPaidCount} মাস</p>
                  </div>
                  <div className="glass-amber p-4 rounded-2xl border border-amber-500/30 text-center space-y-1">
                    <span className="text-xs text-amber-300 font-semibold block">স্ট্যাটাস</span>
                    <p className="text-sm font-bold text-amber-400">● সক্রিয় সদস্য</p>
                  </div>
                </div>
              );
            })()}

            {/* Collections History Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>সদস্যের জমার ইতিহাস ({getMemberCollections(selectedMember).length} টি এন্ট্রি)</span>
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {getMemberCollections(selectedMember).length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                    এখনও কোনো জমা রেকর্ড পাওয়া যায়নি।
                  </div>
                ) : (
                  getMemberCollections(selectedMember).map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {item.month ? `${item.month} ${toBengaliDigits(item.year)}` : `${toBengaliDigits(item.year)} (বাৎসরিক)`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            !item.status || String(item.status).toLowerCase() === 'approved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {!item.status || String(item.status).toLowerCase() === 'approved' ? 'অনুমোদিত' : 'পেন্ডিং'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          তারিখ: {item.date || 'অনির্দিষ্ট'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        {item.receiptUrl && (
                          <button
                            onClick={() => setViewingReceipt(item.receiptUrl)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            title="রিসিট দেখুন"
                          >
                            <Eye className="w-4 h-4 text-emerald-400" />
                          </button>
                        )}
                        <span className="text-base font-bold text-emerald-400 font-mono">
                          ৳ {Number(item.amount || 0).toLocaleString('bn-BD')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Full Screen Receipt Modal with Zoom & Loading Spinner */}
      {viewingReceipt && (
        <ReceiptViewerModal
          src={viewingReceipt}
          title="সদস্য জমার রসিদ কপি"
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-bengali">নতুন সদস্য যুক্ত করুন</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 font-bengali">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">সদস্যের পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="মোঃ আবদুল্লাহ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  placeholder="০১৭১২৩৪৫৬৭৮"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
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
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
