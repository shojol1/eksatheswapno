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

  const generalMembers = members.filter(m => m.role !== 'admin');

  // Robust check if member has an approved collection for selected month & year
  const isPaid = (member) => {
    return collections.some(c => {
      // 1. User match (userId, memberId, addedBy, uid, or name)
      const mId = String(member.id || member.uid || '');
      const cUser = String(c.userId || c.memberId || c.addedBy || c.uid || '');
      const isUserMatch = (mId && cUser && mId === cUser) ||
        (c.memberName && member.name && c.memberName.trim().toLowerCase() === member.name.trim().toLowerCase());

      if (!isUserMatch) return false;

      // 2. Year match (handles string vs number)
      const isYearMatch = !c.year || String(c.year) === String(selectedYear);
      if (!isYearMatch) return false;

      // 3. Month match (handles "July", "july", "Jul", yearly payment)
      if (c.paymentType === 'yearly') return true;
      if (!c.month) return true;

      const cMonthStr = String(c.month).trim().toLowerCase();
      const selMonthStr = String(selectedMonth).trim().toLowerCase();

      const isMonthMatch = cMonthStr === selMonthStr ||
        cMonthStr.startsWith(selMonthStr.substring(0, 3)) ||
        selMonthStr.startsWith(cMonthStr.substring(0, 3));

      if (!isMonthMatch) return false;

      // 4. Approved Status match
      const isApproved = !c.status || String(c.status).toLowerCase() === 'approved';
      return isApproved;
    });
  };

  const dueMembersList = generalMembers.filter(m => !isPaid(m));

  return (
    <div className="space-y-6">
      
      {/* Header & Month/Year Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-bengali flex items-center space-x-2">
            <AlertCircle className="w-7 h-7 text-rose-400" />
            <span>মাসিক বকেয়া সদস্য তালিকা</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-bengali">
            যে সকল সদস্য নির্ধারিত মাসে ৫,০০০ টাকা সঞ্চয় কিস্তি পরিশোধ করেননি
          </p>
        </div>

        {/* Filter selectors */}
        <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 self-start sm:self-auto font-bengali">
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
            <option value="2027" className="bg-slate-900 text-white">2027</option>
            <option value="2028" className="bg-slate-900 text-white">2028</option>
          </select>
        </div>
      </div>

      {/* Summary Card */}
      <div className="glass-rose p-5 rounded-2xl border border-rose-500/30 flex items-center justify-between">
        <div>
          <p className="text-xs text-rose-300 font-bengali font-semibold">
            {selectedMonth} {selectedYear} এর মোট বকেয়া সদস্য
          </p>
          <p className="text-2xl font-extrabold text-white font-bengali mt-1">
            {dueMembersList.length} জন
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-rose-300 font-bengali font-semibold">
            আনুমানিক মোট বকেয়া টাকা (জনপ্রতি ৳৫,০০০)
          </p>
          <p className="text-xl font-bold text-rose-300 font-bengali mt-1">
            ৳ {(dueMembersList.length * 5000).toLocaleString('bn-BD')}
          </p>
        </div>
      </div>

      {/* Due Members List */}
      {dueMembersList.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white font-bengali">
            {selectedMonth} মাসে কোন বকেয়া নেই!
          </h3>
          <p className="text-xs text-slate-400 font-bengali">
            সকল সদস্য তাদের নির্ধারিত কিস্তি সময়মতো পরিশোধ করেছেন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dueMembersList.map((member) => (
            <div key={member.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-rose-500/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold font-bengali text-lg">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-bengali">{member.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{member.phone}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-rose-950 text-rose-400 border border-rose-800 rounded-lg text-xs font-bold font-bengali">
                  বকেয়া
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl text-xs flex items-center justify-between font-bengali border border-slate-800">
                <span className="text-slate-400">নির্ধারিত মাসিক কিস্তি:</span>
                <span className="font-bold text-rose-400 text-sm">৳ ৫,০০০</span>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <a
                  href={`tel:${member.phone}`}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors font-bengali"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>কল দিন</span>
                </a>
                <a
                  href={`sms:${member.phone}?body=প্রিয় ${member.name}, একসাথে স্বপ্ন সমিতির ${selectedMonth} ${selectedYear} মাসের ৫০০০ টাকা সঞ্চয় কিস্তি বাকি আছে। দয়া করে প্রদান করুন।`}
                  className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors font-bengali"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SMS রিমাইন্ডার</span>
                </a>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
