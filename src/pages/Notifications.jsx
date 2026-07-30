import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle2, Clock, AlertTriangle, Info } from 'lucide-react';

export default function Notifications() {
  const { currentUser, collections, notifications: firebaseNotifications, members } = useAuth();

  // Helper to format date / timestamp
  const getNotifTime = (item) => {
    if (item.date) return item.date;
    if (item.createdAt?.seconds) {
      return new Date(item.createdAt.seconds * 1000).toISOString().split('T')[0];
    }
    if (item.time) return new Date(Number(item.time)).toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  };

  const getMemberName = (uid, defaultName) => {
    if (defaultName) return defaultName;
    const found = members.find(m => m.id === uid || m.uid === uid);
    return found ? found.name : 'সদস্য';
  };

  // Combine real notifications from Firestore "notifications" collection + pending/recent collections
  const displayNotifications = [];
  const addedIds = new Set();

  // 1. Real Firebase Notifications Collection Items (Excluding read: false items)
  if (firebaseNotifications && firebaseNotifications.length > 0) {
    firebaseNotifications.forEach(n => {
      // User directive: "read: false jegulo oigulo dekhabe na"
      if (n.read === false) return;

      addedIds.add(n.id);
      displayNotifications.push({
        id: n.id,
        title: n.title || 'নোটিফিকেশন',
        message: n.body || n.message || n.reason || n.comment || 'নতুন তথ্য যুক্ত হয়েছে।',
        type: n.type || 'info',
        time: getNotifTime(n),
        amount: n.amount ? Number(n.amount) : null
      });
    });
  }

  // 2. Pending Collections Alert Notifications (for both Admin and Members)
  const pendingItems = collections.filter(c => c.status && String(c.status).toLowerCase() === 'pending');
  pendingItems.forEach(item => {
    const notifId = 'pending_' + item.id;
    if (!addedIds.has(notifId)) {
      const name = getMemberName(item.userId || item.memberId, item.memberName);
      displayNotifications.push({
        id: notifId,
        title: 'নতুন পেমেন্ট অনুমোদনের অপেক্ষায়',
        message: `${name} - ${item.month || ''} ${item.year} - ৳ ${Number(item.amount || 0).toLocaleString('bn-BD')}`,
        type: 'pending',
        time: item.date || 'পেন্ডিং',
        amount: item.amount
      });
    }
  });

  // 3. Approved Collections Notifications
  const recentApproved = collections.filter(c => !c.status || String(c.status).toLowerCase() === 'approved').slice(0, 10);
  recentApproved.forEach(item => {
    const notifId = 'app_' + item.id;
    if (!addedIds.has(notifId)) {
      const name = getMemberName(item.userId || item.memberId, item.memberName);
      displayNotifications.push({
        id: notifId,
        title: 'পেমেন্ট অনুমোদিত',
        message: `${name} এর ${item.month ? item.month + ' ' : ''}${item.year} এর ৳ ${Number(item.amount || 0).toLocaleString('bn-BD')} টাকা অনুমোদিত হয়েছে।`,
        type: 'approved',
        time: item.date || 'অনুমোদিত',
        amount: item.amount
      });
    }
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pending': return Clock;
      case 'approved':
      case 'success': return CheckCircle2;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getTypeColors = (type) => {
    switch (type) {
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'approved':
      case 'success': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warning': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'info': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-bengali flex items-center space-x-2">
          <Bell className="w-7 h-7 text-amber-400" />
          <span>নোটিফিকেশন সেন্টার (Real-time)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-bengali">
          আপনার ফায়ারবেস ডেটাবেজ ও কালেকশনের সর্বশেষ আপডেট ও নোটিফিকেশনসমূহ
        </p>
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {displayNotifications.length > 0 ? (
          displayNotifications.map((notif) => {
            const IconComp = getTypeIcon(notif.type);
            return (
              <div key={notif.id} className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl border ${getTypeColors(notif.type)}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 font-bengali">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                      {notif.amount && (
                        <span className="text-xs font-bold text-emerald-400">
                          ৳ {Number(notif.amount).toLocaleString('bn-BD')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                    <span className="text-[11px] text-slate-500 mt-2 inline-block font-mono">{notif.time}</span>
                  </div>
                </div>
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

    </div>
  );
}
