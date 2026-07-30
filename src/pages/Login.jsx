import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, automatically redirect to Dashboard
  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      // Firebase error messages in Bengali
      const errorMap = {
        'auth/user-not-found': 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই।',
        'auth/wrong-password': 'পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।',
        'auth/invalid-email': 'সঠিক ইমেইল দিন।',
        'auth/too-many-requests': 'অনেকবার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।',
        'auth/invalid-credential': 'ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে।',
        'auth/network-request-failed': 'ইন্টারনেট সংযোগ নেই। চেক করুন।',
      };
      const code = err.code || '';
      setError(errorMap[code] || err.message || 'লগইনে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-bengali">
      {isLoading && <LoadingSpinner text="লগইন করা হচ্ছে..." fullScreen={true} />}
      
      {/* Decorative Gradient Background Circles */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl relative z-10">
        
        {/* App Branding */}
        <div className="text-center mb-8">
          <img
            src="/logo_somiti.png"
            alt="একসাথে স্বপ্ন সমিতি"
            className="mx-auto w-24 h-24 object-contain mb-4 filter drop-shadow-xl animate-bounce-short"
          />
          <h2 className="text-2xl font-bold text-white font-bengali tracking-tight">
            একসাথে স্বপ্ন সমিতি
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1 font-bengali">
            সঞ্চয় ও ঋণদান সমিতি ম্যানেজমেন্ট
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center font-bengali">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-bengali">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-bengali">
              ইমেইল
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল দিন"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-bengali">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all font-bengali mt-6 cursor-pointer"
          >
            <span>লগইন করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 font-bengali">
          একসাথে স্বপ্ন সমিতি • ড্যাশবোর্ড প্যানেল
        </div>

      </div>
    </div>
  );
}
