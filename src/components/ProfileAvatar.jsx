import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

export default function ProfileAvatar({
  src,
  name = '',
  className = '',
  imgClassName = '',
  iconClassName = '',
  fallbackType = 'icon', // 'icon' | 'initial'
  fallbackIcon = null,
  sizeClass = '',
  textClass = ''
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const hasSrc = Boolean(src && typeof src === 'string' && src.trim() !== '');

  // Support backward compatibility with sizeClass
  const baseClasses = sizeClass 
    ? `${sizeClass} rounded-full bg-slate-900 border border-slate-700/80 shadow-sm ${className}` 
    : className;

  const showInitial = fallbackType === 'initial' || Boolean(textClass);

  return (
    <div className={`relative overflow-hidden flex items-center justify-center flex-shrink-0 ${baseClasses}`}>
      {hasSrc && !error ? (
        <>
          {/* Loading spinner overlay shown until profile picture is fully loaded */}
          {!loaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/90 backdrop-blur-[1px] animate-pulse">
              <div className="w-1/2 h-1/2 max-w-[24px] max-h-[24px] rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-400 animate-spin" />
            </div>
          )}
          <img
            src={src}
            alt={name || 'Profile'}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            } ${imgClassName}`}
          />
        </>
      ) : (
        /* Fallback icon / initial when no image or load error */
        <div className="w-full h-full flex items-center justify-center">
          {showInitial ? (
            <span className={`font-bold font-bengali text-emerald-400 ${textClass || iconClassName || 'text-base'}`}>
              {name ? name.charAt(0) : 'স'}
            </span>
          ) : (
            fallbackIcon || (
              <User className={`text-emerald-400 ${iconClassName || 'w-1/2 h-1/2'}`} />
            )
          )}
        </div>
      )}
    </div>
  );
}
