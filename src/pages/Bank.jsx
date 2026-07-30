import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowDownLeft, ArrowUpRight, CreditCard, Landmark, Copy, Check, Share2 } from 'lucide-react';

export default function Bank() {
  const { 
    collections = [], 
    expenses = [], 
    profits = [], 
    bank = {}, 
    investments = [], 
    bankCharges = [], 
    dpsEntries = [] 
  } = useAuth();
  const [copiedField, setCopiedField] = useState(null);

  // Compute Somiti net remaining balance (matching HomeFragment.java)
  const totalAllTime = collections
    .filter(c => !c.status || String(c.status).toLowerCase() === 'approved')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalProfit = profits.reduce((sum, p) => sum + Number(p.totalProfitAmount || p.amount || 0), 0);
  const totalInvestmentAmt = investments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalBankChargeAmt = bankCharges.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalDpsAmt = dpsEntries.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const totalOutflows = totalExpense + totalInvestmentAmt + totalBankChargeAmt + totalDpsAmt;
  const somitiRemainingCash = (totalAllTime + totalProfit) - totalOutflows;

  const displayBalance = (bank && bank.balance > 0) ? bank.balance : somitiRemainingCash;

  // Exact account details from Android project (fragment_bank.xml)
  const bankData = {
    accountHolder: bank.accountName || 'Shariful Islam Shojol, Manik Mia, Md. Saiful Islam',
    accountNumber: bank.accountNumber || '1101008927613',
    bankName: bank.bankName || 'Jamuna Bank PLC',
    routingNumber: bank.routingNumber || '130591276',
    balance: displayBalance,
    transactions: bank.transactions || []
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-bengali flex items-center space-x-2">
          <Building2 className="w-7 h-7 text-indigo-400" />
          <span>ব্যাংক হিসাব</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-bengali">
          সমিতির সম্পূর্ণ ব্যাংক অ্যাকাউন্ট তথ্য ও ট্রান্সফার নির্দেশিকা
        </p>
      </div>

      {/* Bank Account Details Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-indigo-500/30 relative overflow-hidden space-y-6">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bengali font-semibold">ব্যাংকের নাম</p>
              <h2 className="text-xl font-extrabold text-white font-bengali">{bankData.bankName}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-bold font-bengali">
                ● সক্রিয় ব্যাংক হিসাব
              </span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs text-indigo-300 font-semibold font-bengali mb-1">স্থিতি (ব্যালেন্স)</p>
            <p className="text-3xl font-black text-white font-bengali">
              ৳ {bankData.balance.toLocaleString('bn-BD')}
            </p>
          </div>
        </div>

        {/* Bank Account Fields with Copy Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-bengali relative z-10">
          
          {/* Holder Name */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Account Holder Name</span>
              <p className="text-white font-bold text-sm mt-0.5">{bankData.accountHolder}</p>
            </div>
            <button
              onClick={() => copyToClipboard(bankData.accountHolder, 'holder')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition-colors ml-2"
              title="কপি করুন"
            >
              {copiedField === 'holder' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Account Number */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Account Number</span>
              <p className="text-white font-mono font-extrabold text-base mt-0.5">{bankData.accountNumber}</p>
            </div>
            <button
              onClick={() => copyToClipboard(bankData.accountNumber, 'account')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition-colors ml-2"
              title="কপি করুন"
            >
              {copiedField === 'account' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Bank Name */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Bank Name</span>
              <p className="text-white font-bold text-sm mt-0.5">{bankData.bankName}</p>
            </div>
            <button
              onClick={() => copyToClipboard(bankData.bankName, 'bank')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition-colors ml-2"
              title="কপি করুন"
            >
              {copiedField === 'bank' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Routing Number */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Routing Number</span>
              <p className="text-white font-mono font-extrabold text-base mt-0.5">{bankData.routingNumber}</p>
            </div>
            <button
              onClick={() => copyToClipboard(bankData.routingNumber, 'routing')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition-colors ml-2"
              title="কপি করুন"
            >
              {copiedField === 'routing' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Bank Deposit Instructions (Matching fragment_bank.xml) */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 font-bengali">
        <h3 className="text-base font-bold text-indigo-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Landmark className="w-5 h-5" />
          <span>🏦 ব্যাংকের মাধ্যমে জমা নির্দেশিকা</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Jamuna to Jamuna */}
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm text-indigo-300">
              🔹 Jamuna Bank → Jamuna Bank Transfer
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Jamuna Bank অ্যাপ বা Internet Banking এ লগইন করুন।</li>
              <li>‘Fund Transfer’ অপশন নির্বাচন করুন।</li>
              <li>সমিতির Account Number: <strong className="font-mono text-white">1101008927613</strong> লিখুন।</li>
              <li>টাকার পরিমাণ দিয়ে Confirm করুন।</li>
              <li>সফল হলে ট্রানজেকশন রসিদের স্ক্রিনশট রাখুন।</li>
            </ol>
          </div>

          {/* Other Bank NPSB */}
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm text-indigo-300">
              🔹 অন্যান্য ব্যাংক (NPSB Transfer)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>আপনার ব্যাংকের Mobile Banking বা Internet Banking এ লগইন করুন।</li>
              <li>‘NPSB / Interbank Transfer’ অপশন নির্বাচন করুন।</li>
              <li>Bank Name: <strong>Jamuna Bank PLC</strong> নির্বাচন করুন।</li>
              <li>Account Number ও Routing Number: <strong className="font-mono text-white">130591276</strong> দিন।</li>
              <li>পরিমাণ লিখে Confirm করুন।</li>
            </ol>
          </div>

        </div>

        <p className="text-xs text-rose-400 italic pt-2">
          ⚠️ বিশেষ দ্রষ্টব্য: ভুল অ্যাকাউন্ট নম্বর দিলে ট্রানজেকশন ব্যর্থ হতে পারে। টাকা জমা দেওয়ার পর রসিদের ছবি আপলোড করুন।
        </p>
      </div>

    </div>
  );
}
