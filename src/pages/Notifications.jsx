import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle2, Clock, AlertTriangle, Info, Edit, Trash2, X, Save, CheckSquare, Square } from 'lucide-react';
import { toBengaliDigits, formatDateTime } from '../utils/bengaliNumbers';

export default function Notifications() {
  const { currentUser, collections, notifications: firebaseNotifications, members, updateNotification, deleteNotification } = useAuth();

  const [editingNotif, setEditingNotif] = useState(null); // { id, title, body }
  const [deletingNotifId, setDeletingNotifId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); // Array of selected notification IDs
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const getMemberName = (uid, defaultName) => {
    if (defaultName) return defaultName;
    const found = members.find(m => m.id === uid || m.uid === uid);
    return found ? found.name : 'সদস্য';
  };

  // Combine real notifications from Firestore "notifications" collection + pending/recent collections
  const displayNotifications = [];
  const addedIds = new Set();

  // 1. Real Firebase Notifications Collection Items
  if (firebaseNotifications && firebaseNotifications.length > 0) {
    firebaseNotifications.forEach(n => {
      addedIds.add(n.id);
      const name = getMemberName(n.userId, n.memberName);
      displayNotifications.push({
        id: n.id,
        rawId: n.id,
        isRealDoc: true,
        title: n.title || 'নোটিফিকেশন',
        message: n.body || n.message || n.reason || n.comment || 'নতুন তথ্য যুক্ত হয়েছে।',
        type: n.type || 'info',
        time: formatDateTime(n),
        amount: n.amount ? Number(n.amount) : null,
        timestamp: n.createdAt?.seconds ? n.createdAt.seconds * 1000 : (n.time ? Number(n.time) : Date.now())
      });
    });
  }

  // 2. Pending Collections Alert Notifications (if not already in notifications collection)
  const pendingItems = collections.filter(c => c.status && String(c.status).toLowerCase() === 'pending');
  pendingItems.forEach(item => {
    const notifId = 'pending_' + item.id;
    if (!addedIds.has(notifId)) {
      const name = getMemberName(item.userId || item.memberId, item.memberName);
      displayNotifications.push({
        id: notifId,
        rawId: item.id,
        isRealDoc: false,
        title: 'নতুন টাকা জমা 📥',
        message: `${name} ${item.month || ''} ${toBengaliDigits(item.year)} মাসের ${Number(item.amount || 0)} টাকা জমা করেছেন`,
        type: 'pending',
        time: formatDateTime(item),
        amount: item.amount,
        timestamp: Date.now()
      });
    }
  });

  // 3. Sort notifications by timestamp descending (newest first) and deduplicate in UI
  displayNotifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const uniqueDisplayNotifications = [];
  const seenNotificationKeys = new Set();

  displayNotifications.forEach(n => {
    const key = `${n.title}_${n.message}`;
    if (!seenNotificationKeys.has(key)) {
      seenNotificationKeys.add(key);
      uniqueDisplayNotifications.push(n);
    }
  });

  // List of real doc IDs for bulk selection
  const realDocIds = uniqueDisplayNotifications.filter(n => n.isRealDoc).map(n => n.id);

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === realDocIds.length && realDocIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(realDocIds);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pending': return Clock;
      case 'approved':
      case 'collection_approved':
      case 'success': return CheckCircle2;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getTypeColors = (type) => {
    switch (type) {
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'approved':
      case 'collection_approved':
      case 'success': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warning': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'info': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const handleOpenEdit = (notif) => {
    setEditingNotif({
      id: notif.id,
      title: notif.title,
      body: notif.message
    });
  };

  const handleSaveEdit = async () => {
    if (!editingNotif || !editingNotif.id) return;
    setIsSubmitting(true);
    try {
      if (editingNotif.id.startsWith('pending_')) {
        alert('পেন্ডিং জমাদানের নোটিফিকেশন সরাসরি এডিট করা যাবে না। কালেকশন পেজ থেকে এডিট করুন।');
      } else {
        await updateNotification(editingNotif.id, {
          title: editingNotif.title,
          body: editingNotif.body,
          message: editingNotif.body
        });
      }
      setEditingNotif(null);
    } catch (err) {
      console.error('Error updating notification:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNotifId) return;
    setIsSubmitting(true);
    try {
      if (deletingNotifId.startsWith('pending_')) {
        alert('পেন্ডিং জমার নোটিফিকেশন পেন্ডিং অনুমোদন পেজ থেকে প্রসেস করুন।');
      } else {
        await deleteNotification(deletingNotifId);
      }
      setDeletingNotifId(null);
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await Promise.all(selectedIds.map(id => deleteNotification(id)));
      setSelectedIds([]);
      setIsBulkDeleting(false);
    } catch (err) {
      console.error('Error performing bulk delete:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      
      {/* Header & Admin Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-bengali flex items-center space-x-2">
            <Bell className="w-7 h-7 text-amber-400" />
            <span>নোটিফিকেশন সেন্টার</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-bengali">
            সমিতির সকল গুরুত্বপূর্ণ আপডেট, অ্যালার্ট এবং বিজ্ঞপ্তি
          </p>
        </div>

        {/* Admin Bulk Selection Controls */}
        {isAdmin && realDocIds.length > 0 && (
          <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {selectedIds.length === realDocIds.length && realDocIds.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>সব সিলেক্ট করুন</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={() => setIsBulkDeleting(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center space-x-1.5 transition-all cursor-pointer animate-fade-in"
              >
                <Trash2 className="w-4 h-4" />
                <span>সিলেক্ট করা ({toBengaliDigits(selectedIds.length)}) টি মুছুন</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {uniqueDisplayNotifications.length > 0 ? (
          uniqueDisplayNotifications.map((notif) => {
            const IconComp = getTypeIcon(notif.type);
            const isSelected = selectedIds.includes(notif.id);

            return (
              <div 
                key={notif.id} 
                className={`glass-card p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected 
                    ? 'border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/5' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  
                  {/* Checkbox for Admin */}
                  {isAdmin && notif.isRealDoc && (
                    <button
                      onClick={() => handleToggleSelect(notif.id)}
                      className="mt-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>
                  )}

                  <div className={`p-3 rounded-xl border ${getTypeColors(notif.type)} shrink-0`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 font-bengali">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white truncate">{notif.title}</h4>
                      {notif.amount && (
                        <span className="text-xs font-bold text-emerald-400 shrink-0 ml-2">
                          ৳ {Number(notif.amount).toLocaleString('bn-BD')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[11px] text-slate-500 mt-2 inline-block font-mono">{notif.time}</span>
                  </div>
                </div>

                {/* Admin Actions: Edit & Delete Buttons */}
                {isAdmin && notif.isRealDoc && (
                  <div className="flex items-center space-x-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <button
                      onClick={() => handleOpenEdit(notif)}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                      title="সম্পাদনা করুন"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">সম্পাদনা</span>
                    </button>
                    <button
                      onClick={() => setDeletingNotifId(notif.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">মুছুন</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3 font-bengali">
            <Bell className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">কোন নোটিফিকেশন নেই</h3>
            <p className="text-xs text-slate-400">বর্তমানে কোনো নোটিফিকেশন পাওয়া যায়নি।</p>
          </div>
        )}
      </div>

      {/* Edit Notification Modal */}
      {editingNotif && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 border border-slate-800 space-y-5 font-bengali">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <span>নোটিফিকেশন সম্পাদনা করুন</span>
              </h3>
              <button 
                onClick={() => setEditingNotif(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-bengali">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  শিরোনাম (Title)
                </label>
                <input
                  type="text"
                  value={editingNotif.title}
                  onChange={(e) => setEditingNotif({ ...editingNotif, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  বিবরণ / বার্তা (Message)
                </label>
                <textarea
                  rows="3"
                  value={editingNotif.body}
                  onChange={(e) => setEditingNotif({ ...editingNotif, body: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800 font-bengali">
              <button
                onClick={() => setEditingNotif(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {deletingNotifId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-bengali">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">নোটিফিকেশন মুছুন</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              আপনি কি নিশ্চিত যে এই নোটিফিকেশনটি ফায়ারবেস ডাটাবেজ থেকে মুছে ফেলতে চান? এই প্রক্রিয়াটির আর কোনো পরিবর্তন করা যাবে না।
            </p>

            <div className="flex items-center justify-center space-x-3 pt-4">
              <button
                onClick={() => setDeletingNotifId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-bengali">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">একসাথে একাধিক নোটিফিকেশন মুছুন</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              আপনি কি নিশ্চিত যে নির্বাচিত <span className="text-rose-400 font-bold">{toBengaliDigits(selectedIds.length)}</span> টি নোটিফিকেশন ফায়ারবেস ডাটাবেজ থেকে একসাথে মুছে ফেলতে চান?
            </p>

            <div className="flex items-center justify-center space-x-3 pt-4">
              <button
                onClick={() => setIsBulkDeleting(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, সবগুলো মুছে ফেলুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
