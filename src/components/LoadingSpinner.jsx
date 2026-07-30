import React from 'react';

export default function LoadingSpinner({ text = "লোড হচ্ছে...", fullScreen = true }) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center font-bengali">
      
      {/* Animated Logo Container with Glow Ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-30 blur-xl animate-pulse" />
        
        {/* Outer spinning border ring */}
        <div className="w-16 h-16 rounded-2xl border-2 border-transparent border-t-emerald-400 border-r-teal-400 animate-spin" />
        
        {/* Center Logo */}
        <div className="absolute w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700/80 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
          <img
            src="/logo_somiti.png"
            alt="একসাথে স্বপ্ন সমিতি"
            className="w-full h-full object-contain animate-bounce-short"
          />
        </div>
      </div>

      {/* Title & Loading Text */}
      <div className="space-y-0.5 z-10">
        <h3 className="text-sm font-bold text-white tracking-wide font-bengali">
          একসাথে স্বপ্ন সমিতি
        </h3>
        <p className="text-xs text-emerald-400 font-semibold tracking-wider font-bengali animate-pulse">
          {text}
        </p>
      </div>

      {/* Pulsing Dots Indicator */}
      <div className="flex space-x-1.5 pt-0.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping delay-150" />
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping delay-300" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-[2px] flex items-center justify-center animate-fade-in transition-all">
        <div className="p-6 rounded-3xl glass-card border border-slate-700/50 shadow-2xl flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
