import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, RotateCw, Image as ImageIcon, Move, CheckCircle2, XCircle } from 'lucide-react';
import { toBengaliDigits } from '../utils/bengaliNumbers';

export default function ReceiptViewerModal({ 
  src, 
  title = 'পেমেন্ট রসিদ', 
  onClose,
  onApprove = null,
  onReject = null,
  approveText = 'অনুমোদন করুন',
  rejectText = 'বাতিল'
}) {
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  // Reset states when src changes
  useEffect(() => {
    setLoaded(false);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);

    if (src) {
      const img = new Image();
      img.src = src;
      // Only set loaded to true if the image is already completely downloaded and ready in cache
      if (img.complete && img.naturalWidth !== 0) {
        setLoaded(true);
      }
    }
  }, [src]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => {
    setZoom(prev => {
      const nextZoom = Math.max(prev - 0.25, 0.5);
      if (nextZoom === 1) setPosition({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Mouse drag events
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag events (Mobile Users)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + 0.15, 3.5));
    } else {
      setZoom(prev => {
        const nextZoom = Math.max(prev - 0.15, 0.5);
        if (nextZoom === 1) setPosition({ x: 0, y: 0 });
        return nextZoom;
      });
    }
  };

  if (!src) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md font-bengali animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/95 z-30">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-xs font-bengali">
              {title}
            </h3>
          </div>

          {/* Zoom & Controls Bar */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="ছোট করুন (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 px-1 min-w-[45px] text-center">
              {toBengaliDigits(Math.round(zoom * 100))}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3.5}
              className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="বড় করুন (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-300 dark:bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={handleRotate}
              className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="ঘোরান (Rotate)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="রিসেট (Reset)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container with Drag-Pan & High-Contrast Light/Dark Loading Spinner */}
        <div 
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative flex-1 overflow-hidden p-4 bg-slate-100/90 dark:bg-slate-950 flex items-center justify-center min-h-[360px] touch-none"
          style={{ cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
        >
          
          {/* High-Contrast Loading Spinner & Skeleton Overlay */}
          {!loaded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-md space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 dark:border-slate-800 border-t-emerald-600 dark:border-t-emerald-400 border-r-emerald-600 dark:border-r-emerald-400 animate-spin shadow-lg shadow-emerald-500/20" />
              <div className="text-center space-y-1 font-bengali">
                <p className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                  রসিদের পূর্ণাঙ্গ ছবি লোড হচ্ছে...
                </p>
                <p className="text-xs text-emerald-700 dark:text-slate-400 font-semibold animate-pulse">
                  ছবি সম্পূর্ণ লোড হওয়া পর্যন্ত অপেক্ষা করুন
                </p>
              </div>
            </div>
          )}

          {/* Pan Indicator Hint when Zoomed */}
          {loaded && (zoom > 1 || position.x !== 0 || position.y !== 0) && (
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5 pointer-events-none backdrop-blur-sm shadow-sm">
              <Move className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>মাউস বা আঙুল দিয়ে টেনে ছবি প্যান (Pan) করুন</span>
            </div>
          )}

          {/* Receipt Image Container */}
          <div 
            className="transition-transform duration-75 ease-out max-w-full flex items-center justify-center" 
            style={{ 
              transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${zoom}) rotate(${rotation}deg)` 
            }}
          >
            <img
              src={src}
              alt={title}
              draggable={false}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              className={`max-w-full max-h-[68vh] object-contain rounded-xl shadow-2xl transition-opacity duration-300 pointer-events-none ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 font-bengali">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
            ছবি জুম করার পর মাউস বা আঙুল দিয়ে টেনে (Pan) রসিদের যেকোনো অংশ স্পষ্ট দেখতে পারবেন।
          </p>

          {(onApprove || onReject) && (
            <div className="flex items-center space-x-2.5 w-full sm:w-auto flex-shrink-0">
              {onReject && (
                <button
                  type="button"
                  onClick={() => {
                    onReject();
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-400 border border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                >
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>{rejectText}</span>
                </button>
              )}
              {onApprove && (
                <button
                  type="button"
                  onClick={() => {
                    onApprove();
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{approveText}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
