import React from 'react';

export default function LoadingSpinner({ text = "লোড হচ্ছে...", fullScreen = true }) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center animate-fade-in font-bengali">
      
      {/* Animated Logo Container with Glow Ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-30 blur-xl animate-pulse" />
        
        {/* Outer spinning border ring */}
        <div className="w-20 h-20 rounded-2xl border-2 border-transparent border-t-emerald-400 border-r-teal-400 animate-spin" />
        
        {/* Center Logo */}
        <div className="absolute w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700/80 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
          <img
            src="/logo_somiti.png"
            alt="একসাথে স্বপ্ন সমিতি"
            className="w-full h-full object-contain animate-bounce-short"
          />
        </div>
      </div>

      {/* Title & Loading Text */}
      <div className="space-y-1 z-10">
        <h3 className="text-base font-bold text-white tracking-wide font-bengali">
          একসাথে স্বপ্ন সমিতি
        </h3>
        <p className="text-xs text-emerald-400 font-semibold tracking-wider font-bengali animate-pulse">
          {text}
        </p>
      </div>

      {/* Pulsing Dots Indicator */}
      <div className="flex space-x-1.5 pt-1">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping delay-150" />
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping delay-300" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
