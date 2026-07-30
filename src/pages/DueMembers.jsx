import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Phone, MessageSquare, Calendar, CheckCircle2, UserX } from 'lucide-react';

export default function DueMembers() {
  const { members, collections } = useAuth();

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = monthsList[new Date().getMonth()];
  const currentYear = new Date().getFullYear().toString();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Helper to convert any month string/number/Bengali into 0-indexed month (0 = Jan, 11 = Dec)
  const getMonthIndex = (monthVal) => {
    if (!monthVal) return -1;
    const str = String(monthVal).trim().toLowerCase();

    // 1. Numeric check (1-12 or "01"-"12")
    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      return num - 1;
    }

    // 2. English names & short names
    const englishMonths = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    const engIdx = englishMonths.findIndex(m => m === str || m.startsWith(str.substring(0, 3)) || str.startsWith(m.substring(0, 3)));
    if (engIdx !== -1) return engIdx;

    // 3. Bengali month names
    const bengaliMonths = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];
    const bnIdx = bengaliMonths.findIndex(m => m === str || m.startsWith(str) || str.startsWith(m));
    if (bnIdx !== -1) return bnIdx;

    return -1;
  };

  const selectedMonthIndex = monthsList.findIndex(m => m.toLowerCase() === selectedMonth.toLowerCase());

  // STEP 1: Find all paid user IDs and paid member names for selected year and month (matching Android DueMembersActivity.java)
  const paidUserIds = new Set();
  const paidUserNames = new Set();

  collections.forEach(c => {
    // 1. Status check: approved
    const isApproved = !c.status || String(c.status).toLowerCase() === 'approved';
    if (!isApproved) return;

    // 2. Year check
    let colYear = c.year ? String(c.year).trim() : '';
    if (!colYear && c.date) {
      colYear = String(c.date).split('-')[0] || String(c.date).split('/')[0] || '';
    }
    if (!colYear || colYear !== String(selectedYear)) return;

    // 3. Month check strictly for selected month (matching Android DueMembersActivity.java)
    let colMonthIndex = -1;
    if (c.month) {
      colMonthIndex = getMonthIndex(c.month);
    }
    if (colMonthIndex === -1 && c.date) {
      const parts = String(c.date).split('-');
      if (parts.length >= 2) {
        const mNum = parseInt(parts[1], 10);
        if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
          colMonthIndex = mNum - 1;
        }
      }
    }

    // Must strictly match the selected month index
    if (colMonthIndex !== selectedMonthIndex) return;

    const uid = String(c.userId || c.memberId || c.uid || '').trim();
    if (uid) paidUserIds.add(uid);

    const name = String(c.memberName || '').trim().toLowerCase();
    if (name) paidUserNames.add(name);
  });

  // STEP 2: Filter users in "users" collection where role != "admin" (matching Android db.collection("users").whereEqualTo("role", "member"))
  // Also harvest members from collections if users collection is sparse
  const memberMap = new Map();

  members.forEach(m => {
    const role = String(m.role || '').toLowerCase();
    if (role !== 'admin') {
      const id = String(m.id || m.uid || m.name || '').trim();
      if (id) {
        memberMap.set(id, m);
      }
    }
  });

  collections.forEach(c => {
    const cName = String(c.memberName || '').trim();
    const cId = String(c.userId || c.memberId || c.uid || '').trim();

    if (cName || cId) {
      let exists = false;
      if (cId && memberMap.has(cId)) exists = true;
      if (cName) {
        for (const m of memberMap.values()) {
          if (m.name && m.name.trim().toLowerCase() === cName.toLowerCase()) {
            exists = true;
            break;
          }
        }
      }
      if (!exists) {
        const key = cId || `col-${cName.toLowerCase()}`;
        memberMap.set(key, {
          id: key,
          uid: cId || key,
          name: cName || 'অজ্ঞাত সদস্য',
          phone: c.phone || c.memberPhone || '',
          role: 'member'
        });
      }
    }
  });

  const generalMembers = Array.from(memberMap.values());

  // STEP 3: Due members list = general members who have NOT paid for this specific month & year (matching Android loadAllMembersExcept)
  const dueMembersList = generalMembers.filter(member => {
    const uid = String(member.id || member.uid || '').trim();
    const name = String(member.name || '').trim().toLowerCase();

    const isPaidById = Boolean(uid && paidUserIds.has(uid));
    const isPaidByName = Boolean(name && paidUserNames.has(name));

    return !isPaidById && !isPaidByName;
  });

  return (
    <div className="space-y-6 font-bengali">
      
      {/* Header & Month/Year Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <AlertCircle className="w-7 h-7 text-rose-400" />
            <span>মাসিক বকেয়া সদস্য তালিকা</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            যে সকল সদস্য নির্ধারিত মাসে ৫,০০০ টাকা সঞ্চয় কিস্তি পরিশোধ করেননি
          </p>
        </div>

        {/* Filter selectors */}
        <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-emerald-400 ml-2" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
          >
            {monthsList.map(m => (
              <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent text-emerald-400 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="2026" className="bg-slate-900 text-white">2026</option>
            <option value="2027" className="bg-slate-900 text-white">2028</option>
            <option value="2028" className="bg-slate-900 text-white">2028</option>
          </select>
        </div>
      </div>

      {/* Summary Card */}
      <div className="glass-rose p-5 rounded-2xl border border-rose-500/30 flex items-center justify-between">
        <div>
          <p className="text-xs text-rose-300 font-semibold">
            {selectedMonth} {selectedYear} এর মোট বকেয়া সদস্য
          </p>
          <p className="text-2xl font-extrabold text-white mt-1">
            {dueMembersList.length} জন
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-rose-300 font-semibold">
            মোট বকেয়া পরিমাণ (জনপ্রতি ৳৫,০০০)
          </p>
          <p className="text-xl font-bold text-rose-300 mt-1">
            ৳ {(dueMembersList.length * 5000).toLocaleString('bn-BD')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      {generalMembers.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <UserX className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            কোন সাধারণ সদস্যের তথ্য পাওয়া যায়নি!
          </h3>
          <p className="text-xs text-slate-400">
            ডাটাবেজে কোনো সাধারণ সদস্য নিবন্ধিত নেই। 'সদস্যবৃন্দের তালিকা' পেজে গিয়ে সদস্য যুক্ত করুন।
          </p>
        </div>
      ) : dueMembersList.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            {selectedMonth} {selectedYear} মাসে কোন বকেয়া নেই!
          </h3>
          <p className="text-xs text-slate-400">
            সকল সাধারণ সদস্য ({generalMembers.length} জন) তাদের নির্ধারিত কিস্তি সময়মতো পরিশোধ করেছেন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dueMembersList.map((member) => (
            <div key={member.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-rose-500/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-lg overflow-hidden">
                    {member.profileImage ? (
                      <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name ? member.name.charAt(0) : 'স'
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{member.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{member.phone || 'মোবাইল নম্বর নেই'}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-rose-950 text-rose-400 border border-rose-800 rounded-lg text-xs font-bold">
                  বকেয়া
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl text-xs flex items-center justify-between border border-slate-800">
                <span className="text-slate-400">অবস্থা / সঞ্চয় কিস্তি:</span>
                <span className="font-bold text-rose-400 text-sm">৳ ৫,০০০ (জমা দেয়নি)</span>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                {member.phone && member.phone !== 'অনির্দিষ্ট' && member.phone !== 'মোবাইল নম্বর নেই' ? (
                  <>
                    <a
                      href={`tel:${member.phone}`}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>কল দিন</span>
                    </a>
                    <a
                      href={`sms:${member.phone}?body=প্রিয় ${member.name}, একসাথে স্বপ্ন সমিতির ${selectedMonth} ${selectedYear} মাসের ৫০০০ টাকা সঞ্চয় কিস্তি বাকি আছে। দয়া করে প্রদান করুন।`}
                      className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SMS রিমাইন্ডার</span>
                    </a>
                  </>
                ) : (
                  <div className="w-full text-center py-2 bg-slate-900 rounded-xl text-xs text-slate-500">
                    ফোন নম্বর সংরক্ষিত নেই
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
