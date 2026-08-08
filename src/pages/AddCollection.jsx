import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, CheckCircle2, Wallet, Upload, X, AlertCircle, Users, User, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toBengaliDigits } from '../utils/bengaliNumbers';

export default function AddCollection() {
  const { currentUser, collections, members, addCollection } = useAuth();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'admin';

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear().toString();

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState('');
  const [amount, setAmount] = useState('5000');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Initialize selectedMemberId: if admin, set to first member or current user; if regular member, set to currentUser.uid
  useEffect(() => {
    if (isAdmin) {
      if (!selectedMemberId && members && members.length > 0) {
        setSelectedMemberId(members[0].id || members[0].uid || '');
      }
    } else {
      setSelectedMemberId(currentUser?.uid || '');
    }
  }, [members, currentUser, isAdmin]);

  // Target member object selected for payment
  const targetMember = members.find(m => 
    (m.id && String(m.id) === String(selectedMemberId)) || 
    (m.uid && String(m.uid) === String(selectedMemberId))
  ) || (isAdmin && members.length > 0 ? members[0] : currentUser);

  const targetUid = String(targetMember?.id || targetMember?.uid || selectedMemberId || currentUser?.uid || '');
  const targetName = String(targetMember?.name || '').trim().toLowerCase();

  // Find paid months for selected target member for selected year
  const targetPaidMonths = new Set(
    collections
      .filter(c => {
        const uId = String(c.userId || c.memberId || c.uid || c.addedBy || '');
        const isUserMatch = (uId && targetUid && uId === targetUid) ||
          (c.memberName && targetName && c.memberName.trim().toLowerCase() === targetName);
        
        const isYearMatch = !c.year || String(c.year) === String(year);
        const isApprovedOrPending = !c.status || String(c.status).toLowerCase() === 'approved' || String(c.status).toLowerCase() === 'pending';
        
        return isUserMatch && isYearMatch && isApprovedOrPending && c.month;
      })
      .map(c => String(c.month).trim().toLowerCase())
  );

  // Auto-select the first unpaid month whenever year, selectedMemberId, or collections change
  useEffect(() => {
    const firstUnpaid = monthsList.find(m => !targetPaidMonths.has(m.toLowerCase()));
    if (firstUnpaid) {
      setMonth(firstUnpaid);
    } else {
      setMonth(''); // All 12 months paid for this year
    }
  }, [year, selectedMemberId, collections, currentUser]);

  // Handle receipt image file selection with canvas compression (prevents Firestore 1MB doc size limit overflow)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB limit
      if (file.size > MAX_SIZE_BYTES) {
        alert(`⚠️ রসিদের ছবির সাইজ সর্বোচ্চ ২ এমবি (২MB) হতে পারবে! আপনার নির্বাচন করা ফাইলের সাইজ ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        e.target.value = '';
        return;
      }

      setReceiptName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setReceiptUrl(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReceiptUrl('');
    setReceiptName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!month) {
      alert('এই বছরের সকল মাসের টাকা পরিশোধিত। অন্য বছর নির্বাচন করুন।');
      return;
    }

    setIsSubmitting(true);

    try {
      const mUid = targetUid || currentUser?.uid || '';
      const mName = targetMember?.name || targetMember?.email || currentUser?.name || 'সদস্য';
      const amountNum = Math.round(Number(amount));

      const newCollectionItem = {
        userId: mUid,
        memberId: mUid,
        memberName: mName,
        amount: amountNum,
        year: String(year),
        month: String(month),
        paymentType: 'monthly',
        receiptUrl: receiptUrl || '',
        status: isAdmin ? 'approved' : 'pending',
        date: new Date().toISOString().split('T')[0],
        addedBy: currentUser?.uid || '',
        addedByAdmin: isAdmin,
        skipFunctionNotification: isAdmin
      };

      await addCollection(newCollectionItem);

      // If Admin deposits on behalf of a member, write notification to Firestore database
      if (isAdmin) {
        try {
          const rawAdminName = currentUser?.name?.trim() || '';
          const isGenericAdminName = !rawAdminName || rawAdminName.toLowerCase() === 'admin' || rawAdminName.toLowerCase() === 'অ্যাডমিন';
          const adminDisplayName = isGenericAdminName ? '' : rawAdminName;

          const notifMsg = adminDisplayName
            ? `অ্যাডমিন ${adminDisplayName} ${mName} এর ${month} ${toBengaliDigits(year)} মাসের ${amountNum.toLocaleString('bn-BD')} টাকা জমা করেছেন`
            : `অ্যাডমিন ${mName} এর ${month} ${toBengaliDigits(year)} মাসের ${amountNum.toLocaleString('bn-BD')} টাকা জমা করেছেন`;
          
          await addDoc(collection(db, 'notifications'), {
            title: 'অ্যাডমিন টাকা জমা করেছেন',
            body: notifMsg,
            message: notifMsg,
            type: 'approved',
            amount: amountNum,
            userId: mUid,
            memberName: mName,
            month: String(month),
            year: String(year),
            createdAt: serverTimestamp(),
            time: serverTimestamp()
          });
        } catch (notifErr) {
          console.warn('Could not write notification document:', notifErr);
        }
      }

      setSubmittedData(newCollectionItem);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Error submitting collection:', err);
      if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
        alert('⚠️ ফায়ারবেস সিকিউরিটি রুলস (Rules) দ্বারা অনুমতি পাওয়া যায়নি (Missing or insufficient permissions)। অনুগ্রহ করে ফায়ারবেস কনসোলে Rules পেজে অনুমতি দিন।');
      } else {
        alert('জমা এন্ট্রি সংরক্ষণ করতে সমস্যা হয়েছে: ' + (err.message || 'সাময়িক সমস্যা, আবার চেষ্টা করুন।'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setShowSuccessDialog(false);
    setReceiptUrl('');
    setReceiptName('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isSubmitting && <LoadingSpinner text="জমা এন্ট্রি সংরক্ষণ করা হচ্ছে..." fullScreen={true} />}
      
      {/* Back Button & Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white font-bengali">
            {isAdmin ? 'সঞ্চয় কালেকশন জমা দিন (অ্যাডমিন প্যানেল)' : 'নতুন কালেকশন জমা দিন'}
          </h1>
          <p className="text-xs text-slate-400 font-bengali mt-0.5">
            {isAdmin ? 'সদস্যের পক্ষ থেকে সঞ্চয় টাকা জমা দিন' : 'সমিতির ৫,০০০ টাকা সঞ্চয় জমা এন্ট্রি করুন'}
          </p>
        </div>
      </div>

      {/* Member Selection Header Card */}
      {isAdmin ? (
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-3 font-bengali shadow-lg">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-400 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>সদস্য নির্বাচন করুন (মেম্বার লিস্ট) *</span>
            </label>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>অ্যাডমিন এন্ট্রি</span>
            </span>
          </div>

          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-emerald-500/50 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer shadow-inner"
          >
            {members.map((m, idx) => {
              const mId = m.id || m.uid;
              const posStr = m.position !== undefined && m.position !== null && m.position !== '' ? `পজিশন ${toBengaliDigits(m.position)} - ` : '';
              return (
                <option key={mId || idx} value={mId} className="bg-slate-900 text-white">
                  {posStr}{m.name} ({m.phone || m.email || 'সদস্য'})
                </option>
              );
            })}
          </select>

          {targetMember && (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  {(targetMember.name || 'M')[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">নির্বাচিত সদস্য</span>
                  <span className="text-white font-bold">{targetMember.name}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                {targetMember.phone || targetMember.email}
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 leading-relaxed">
            💡 অ্যাডমিন হিসেবে আপনি যেকোনো সদস্যের সঞ্চয় জমা দিতে পারেন। সদস্য পরিবর্তন করলে তার সর্বশেষ পরিশোধিত মাস অনুযায়ী পরবর্তী বকেয়া মাস স্বয়ংক্রিয়ভাবে সিলেক্ট হয়ে যাবে।
          </p>
        </div>
      ) : (
        /* Logged in User Card for General Member */
        <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between font-bengali">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              {(currentUser?.name || 'S')[0].toUpperCase()}
            </div>
            <div>
              <span className="text-[11px] text-emerald-400 font-semibold block">জমাদানকারী সদস্য</span>
              <h3 className="text-sm font-bold text-white">{currentUser?.name || currentUser?.email}</h3>
            </div>
          </div>
          <span className="px-3 py-1 bg-slate-900 text-xs text-slate-400 rounded-full border border-slate-800 font-mono">
            {currentUser?.email}
          </span>
        </div>
      )}

      {/* Form Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5 font-bengali">

          {/* Month & Year Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Year Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                বছর নির্বাচন করুন *
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="2026">২০২৬</option>
                <option value="2027">২০২৭</option>
                <option value="2028">২০২৮</option>
                <option value="2029">২০২৯</option>
                <option value="2030">২০৩০</option>
              </select>
            </div>

            {/* Month Selector (Paid months are hidden for selected member) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                মাস নির্বাচন করুন (বকেয়া মাসসমূহ) *
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {month === '' && (
                  <option value="" disabled>সকল মাসের টাকা পরিশোধিত</option>
                )}
                {monthsList.map(m => {
                  const isPaidForThisMonth = targetPaidMonths.has(m.toLowerCase());
                  if (isPaidForThisMonth) return null; // Hide already paid months for target member
                  return (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  );
                })}
              </select>
              {month === '' && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{targetMember?.name || 'এই সদস্যের'} {year} সালের সকল মাসের টাকা পরিশোধ করা হয়েছে।</span>
                </p>
              )}
            </div>

          </div>

          {/* Amount (Default 5000 BDT) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              টাকার পরিমাণ (৳) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="৫০০০"
                required
                className="w-full pl-4 pr-16 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-base font-bold focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="absolute right-4 top-3.5 text-xs text-emerald-400 font-bold">
                BDT
              </span>
            </div>
          </div>

          {/* Receipt File Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              পেমেন্ট রসিদের ছবি (Choose File) {isAdmin ? '(ঐচ্ছিক)' : '*'}
            </label>
            
            <input
              type="file"
              accept="image/*"
              id="receiptInput"
              className="hidden"
              onChange={handleImageChange}
            />

            {!receiptUrl ? (
              <label
                htmlFor="receiptInput"
                className="w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all text-slate-400 hover:text-white"
              >
                <Upload className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-semibold">রসিদ ফাইল নির্বাচন করুন (Choose File)</span>
                <span className="text-[10px] text-slate-500">JPG, PNG বা ব্যাংকের রসিদের ছবি (সর্বোচ্চ ২ MB)</span>
              </label>
            ) : (
              <div className="relative p-3 bg-slate-900 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <img
                    src={receiptUrl}
                    alt="Receipt Preview"
                    className="w-12 h-12 object-cover rounded-xl border border-slate-700"
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">{receiptName || 'Receipt Image'}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">সংযুক্ত করা হয়েছে ✓</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                  title="ছবি সরান"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Status Note */}
          <p className="text-xs text-slate-400 italic">
            {isAdmin 
              ? '💡 অ্যাডমিন হিসেবে জমা দেওয়ায় এটি সরাসরি অনুমোদিত (Approved) হিসেবে যুক্ত হবে এবং নোটিফিকেশন সেন্টারে প্রকাশিত হবে।'
              : '💡 সদস্য হিসেবে জমা দেওয়ায় এটি অ্যাডমিন অনুমোদনের (Pending) অপেক্ষায় থাকবে।'}
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !month}
            className={`w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all ${
              isSubmitting || !month ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>{isSubmitting ? 'প্রসেসিং হচ্ছে...' : (isAdmin ? `${targetMember?.name || 'সদস্যের'} টাকা জমা দিন` : 'জমা অনুরোধ পাঠান')}</span>
          </button>

        </form>
      </div>

      {/* Success Dialog Modal */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/40 w-full max-w-md space-y-6 text-center font-bengali relative animate-in fade-in zoom-in duration-200">
            
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            {/* Dialog Title */}
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white">
                {isAdmin ? 'টাকা সফলভাবে জমা হয়েছে!' : 'জমা অনুরোধ পাঠানো হয়েছে!'}
              </h3>
              <p className="text-xs text-slate-300">
                {isAdmin 
                  ? 'সদস্যের কালেকশন এন্ট্রি সফলভাবে ডাটাবেজে জমা ও অনুমোদিত হয়েছে।'
                  : 'আপনার কালেকশন এন্ট্রি সফলভাবে ডাটাবেজে সংরক্ষণ করা হয়েছে।'}
              </p>
            </div>

            {/* Details Summary Grid */}
            {submittedData && (
              <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">সদস্যের নাম:</span>
                  <span className="text-white font-bold">{submittedData.memberName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">মাস ও বছর:</span>
                  <span className="text-white font-bold">{submittedData.month} {submittedData.year}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">জমাকৃত পরিমাণ:</span>
                  <span className="text-emerald-400 font-extrabold font-mono">৳ {Number(submittedData.amount).toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-400">স্ট্যাটাস:</span>
                  <span className="text-emerald-400 font-bold">
                    {submittedData.status === 'approved' ? 'অনুমোদিত (Approved)' : 'পেন্ডিং (অনুমোদনের অপেক্ষায়)'}
                  </span>
                </div>
              </div>
            )}

            {/* Dialog Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleResetForm}
                className="w-full sm:flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
              >
                আরও জমা দিন
              </button>
              <button
                onClick={() => navigate('/collections')}
                className="w-full sm:flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              >
                কালেকশন তালিকায় যান
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
