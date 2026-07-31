import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, XCircle, ShieldAlert, Eye, Image as ImageIcon, X } from 'lucide-react';
import { toBengaliDigits } from '../utils/bengaliNumbers';
import ReceiptViewerModal from '../components/ReceiptViewerModal';

export default function PendingApprovals() {
  const { currentUser, collections, members, approveCollection, rejectCollection } = useAuth();
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const pendingItems = collections.filter(c => c.status && String(c.status).toLowerCase() === 'pending');

  const getMemberName = (item) => {
    if (item.memberName) return item.memberName;
    const uid = item.userId || item.memberId;
    const found = members.find(m => m.id === uid || m.uid === uid);
    return found ? found.name : 'সদস্য';
  };

  const getFormatDate = (item) => {
    if (item.date) return item.date;
    if (item.time) return new Date(Number(item.time)).toISOString().split('T')[0];
    return 'আজ';
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="glass-card p-8 rounded-3xl border border-slate-800 text-center max-w-lg mx-auto space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white font-bengali">এক্সেস সুরক্ষিত</h2>
        <p className="text-sm text-slate-400 font-bengali">
          পেন্ডিং অ্যাপ্রুভাল পেজটি শুধুমাত্র অ্যাডমিনদের জন্য সংরক্ষিত।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-bengali">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Clock className="w-7 h-7 text-amber-400" />
          <span>পেন্ডিং কালেকশন অনুমোদন</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          সদস্যদের জমাকৃত রসিদ যাচাই করে অনুমোদন (Approve) অথবা বাতিল (Reject) করুন
        </p>
      </div>

      {pendingItems.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">কোন পেন্ডিং পেমেন্ট নেই!</h3>
          <p className="text-xs text-slate-400">
            সকল জমাকৃত পেমেন্ট ইতোমধ্যেই অনুমোদিত হয়েছে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingItems.map((item) => {
            const name = getMemberName(item);
            const dateStr = getFormatDate(item);
            const hasReceipt = Boolean(item.receiptUrl);

            return (
              <div key={item.id} className="glass-card p-5 rounded-2xl border border-amber-500/30 space-y-4 hover:border-amber-500/50 transition-colors flex flex-col justify-between">
                
                <div className="space-y-3">
                  {/* Member Name & Amount */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{name}</h3>
                      <span className="inline-block px-2.5 py-0.5 mt-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {item.month ? `${item.month} ${toBengaliDigits(item.year)}` : `${toBengaliDigits(item.year)} (বার্ষিক)`}
                      </span>
                    </div>
                    <span className="text-xl font-extrabold text-emerald-400 font-mono">
                      ৳ {Number(item.amount || 0).toLocaleString('bn-BD')}
                    </span>
                  </div>

                  {/* Submission Date (Payment method removed as requested) */}
                  <div className="p-3 bg-slate-900/80 rounded-xl text-xs space-y-1 text-slate-300 border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">জমার তারিখ:</span>
                      <span className="font-mono text-white">{dateStr}</span>
                    </div>
                    {item.note && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                        <span className="text-slate-400">নোট:</span>
                        <span className="italic text-slate-300 truncate max-w-[150px]">{item.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Receipt Copy Viewer Thumbnail */}
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">জমাকৃত রসিদের কপি:</span>
                    {hasReceipt ? (
                      <div 
                        onClick={() => setSelectedReceipt({ id: item.id, url: item.receiptUrl, title: `${name} - ${item.month || ''} ${toBengaliDigits(item.year)}` })}
                        className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 cursor-pointer h-32 flex items-center justify-center"
                      >
                        <img
                          src={item.receiptUrl}
                          alt="Receipt Copy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold space-x-1">
                          <Eye className="w-4 h-4 text-amber-400" />
                          <span>বড় করে দেখুন</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 text-center text-slate-500 text-xs flex items-center justify-center space-x-1.5">
                        <ImageIcon className="w-4 h-4 text-slate-600" />
                        <span>কোন রসিদ সংযুক্ত নেই</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approve & Reject Actions */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => approveCollection(item.id)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>অনুমোদন করুন</span>
                  </button>
                  <button
                    onClick={() => rejectCollection(item.id)}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>বাতিল</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Image Modal Viewer with Zoom, Drag Pan & Direct Approval Actions */}
      {selectedReceipt && (
        <ReceiptViewerModal
          src={selectedReceipt.url}
          title={`পেমেন্ট রসিদের কপি (${selectedReceipt.title})`}
          onClose={() => setSelectedReceipt(null)}
          onApprove={selectedReceipt.id ? () => approveCollection(selectedReceipt.id) : null}
          onReject={selectedReceipt.id ? () => rejectCollection(selectedReceipt.id) : null}
        />
      )}

    </div>
  );
}
