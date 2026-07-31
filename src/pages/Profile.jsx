import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Shield, Edit3, Save, ArrowLeft, LogOut, Wallet, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from '../components/ProfileAvatar';
import { toBengaliDigits } from '../utils/bengaliNumbers';

export default function Profile() {
  const { currentUser, logout, collections, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  // Calculate user stats from collections (matching userId or memberId or addedBy or user email/name)
  const myCollections = collections.filter(c => 
    ((c.userId && c.userId === currentUser.uid) ||
     (c.memberId && c.memberId === currentUser.uid) ||
     (c.addedBy && c.addedBy === currentUser.uid) ||
     (c.memberName && currentUser.name && c.memberName.trim() === currentUser.name.trim())) &&
    (!c.status || String(c.status).toLowerCase() === 'approved')
  );

  const totalPaid = myCollections.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  // Filter Monthly vs Yearly collections
  const monthlyCollections = myCollections.filter(c => {
    const isYearly = c.paymentType === 'yearly' || String(c.month).toLowerCase() === 'yearly' || c.isYearly === true || (!c.month && c.year);
    return !isYearly && c.month;
  });

  const yearlyCollections = myCollections.filter(c => {
    return c.paymentType === 'yearly' || String(c.month).toLowerCase() === 'yearly' || c.isYearly === true || (!c.month && c.year);
  });

  const monthlyPaidCount = new Set(monthlyCollections.map(c => `${c.month}-${c.year}`)).size;
  const yearlyPaidCount = new Set(yearlyCollections.map(c => c.year)).size;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        name,
        phone,
        address
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Back button & Edit button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-bengali"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>পিছনে যান</span>
        </button>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors font-bengali"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'বাতিল' : 'সম্পাদনা করুন'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm text-center flex items-center justify-center space-x-2 font-bengali">
          <CheckCircle2 className="w-5 h-5" />
          <span>প্রোফাইল তথ্য আপডেট করা হয়েছে!</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="glass-card p-8 rounded-3xl border border-slate-800 text-center relative overflow-hidden">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Avatar */}
          <ProfileAvatar
            src={currentUser.profileImage}
            name={currentUser.name}
            className="mx-auto w-24 h-24 rounded-full bg-slate-800 border-4 border-emerald-500/40 shadow-xl shadow-emerald-500/10"
            iconClassName="w-12 h-12"
          />

          <div>
            <h2 className="text-2xl font-bold text-white font-bengali">{currentUser.name}</h2>
            <span className={`inline-flex items-center space-x-1 mt-2 px-3 py-1 rounded-full text-xs font-bold ${
              currentUser.role === 'admin'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}>
              <Shield className="w-3.5 h-3.5" />
              <span>{currentUser.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid (4 Cards: Total, Monthly, Yearly, Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-emerald p-5 rounded-2xl border border-emerald-500/30 text-center">
          <Wallet className="w-6 h-6 text-emerald-400 mx-auto" />
          <p className="text-xl font-bold text-white font-bengali mt-2 font-mono">
            ৳ {totalPaid.toLocaleString('bn-BD')}
          </p>
          <p className="text-xs text-emerald-300 font-bengali mt-0.5">মোট সঞ্চয় জমা</p>
        </div>

        <div className="glass-indigo p-5 rounded-2xl border border-indigo-500/30 text-center">
          <Calendar className="w-6 h-6 text-indigo-400 mx-auto" />
          <p className="text-xl font-bold text-white font-bengali mt-2 font-mono">
            {toBengaliDigits(monthlyPaidCount)} মাস
          </p>
          <p className="text-xs text-indigo-300 font-bengali mt-0.5">মাসিক পরিশোধ</p>
        </div>

        <div className="glass-purple p-5 rounded-2xl border border-purple-500/30 text-center">
          <Calendar className="w-6 h-6 text-purple-400 mx-auto" />
          <p className="text-xl font-bold text-white font-bengali mt-2 font-mono">
            {toBengaliDigits(yearlyPaidCount)} বছর
          </p>
          <p className="text-xs text-purple-300 font-bengali mt-0.5">বাৎসরিক পরিশোধ</p>
        </div>

        <div className="glass-amber p-5 rounded-2xl border border-amber-500/30 text-center">
          <User className="w-6 h-6 text-amber-400 mx-auto" />
          <p className="text-xl font-bold text-white font-bengali mt-2 font-mono">
            সক্রিয়
          </p>
          <p className="text-xs text-amber-300 font-bengali mt-0.5">অ্যাকাউন্ট স্ট্যাটাস</p>
        </div>
      </div>

      {/* Profile Details / Edit Form */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 font-bengali">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">ব্যক্তিগত তথ্য</h3>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">পূর্ণ নাম</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">মোবাইল নম্বর</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">ঠিকানা (Address)</label>
              <input
                type="text"
                placeholder="আপনার পূর্ণ ঠিকানা লিখুন"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>সংরক্ষণ করুন</span>
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="flex items-center space-x-2 text-xs text-slate-400">
                <User className="w-4 h-4" />
                <span>পূর্ণ নাম:</span>
              </span>
              <span className="text-sm font-semibold text-white">{currentUser.name || 'অনির্ধারিত'}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="flex items-center space-x-2 text-xs text-slate-400">
                <Mail className="w-4 h-4" />
                <span>ইমেইল:</span>
              </span>
              <span className="text-sm font-semibold text-white">{currentUser.email}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="flex items-center space-x-2 text-xs text-slate-400">
                <Phone className="w-4 h-4" />
                <span>মোবাইল:</span>
              </span>
              <span className="text-sm font-semibold text-white font-mono">{toBengaliDigits(currentUser.phone) || 'অনির্ধারিত'}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="flex items-center space-x-2 text-xs text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>ঠিকানা (Address):</span>
              </span>
              <span className="text-sm font-semibold text-white">{currentUser.address || 'তথ্য প্রদান করা হয়নি'}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="flex items-center space-x-2 text-xs text-slate-400">
                <Shield className="w-4 h-4" />
                <span>ভূমিকা:</span>
              </span>
              <span className={`text-sm font-bold ${currentUser.role === 'admin' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                {currentUser.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="w-full py-3.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all font-bengali"
      >
        <LogOut className="w-5 h-5" />
        <span>লগ আউট করুন</span>
      </button>

    </div>
  );
}
