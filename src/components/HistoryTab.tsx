import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  Trash2,
  Clock,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileImage,
  RefreshCw,
  X
} from 'lucide-react';

export interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  originalSize: number;
  compressedSize: number;
  originalWidth: number;
  originalHeight: number;
  compressedWidth: number;
  compressedHeight: number;
  savingsPercent: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  dataUrl: string;
}

interface HistoryTabProps {
  history: HistoryItem[];
  isDark: boolean;
  onReDownload: (item: HistoryItem) => void;
  onShare: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onOpenInCompressor: (item: HistoryItem) => void;
  onGoToCompressor: () => void;
  formatFileSize: (bytes: number) => string;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  isDark,
  onReDownload,
  onShare,
  onDelete,
  onClearAll,
  onOpenInCompressor,
  onGoToCompressor,
  formatFileSize
}) => {
  const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatTime = (ts: number): string => {
    const diffMs = Date.now() - ts;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return new Date(ts).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  const getFormatLabel = (fmt: string) => {
    if (fmt === 'image/webp') return 'WEBP';
    if (fmt === 'image/png') return 'PNG';
    return 'JPEG';
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div
        className={`border rounded-2xl p-4 transition-colors duration-200 ${
          isDark ? 'bg-slate-800/70 border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`text-base font-bold flex items-center space-x-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <span>Compression History</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 font-semibold border border-blue-500/30">
                  {history.length} / 10
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                محفوظ شدہ تصاویر • فوری ڈاؤن لوڈ اور شیئر کریں
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <div>
              {showClearConfirm ? (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      onClearAll();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold rounded-lg shadow"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className={`p-1 rounded-lg border ${
                      isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center space-x-1 transition ${
                    isDark
                      ? 'border-slate-700/80 text-slate-400 hover:text-red-400 hover:border-red-500/40 bg-slate-800/40'
                      : 'border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-400 bg-slate-50'
                  }`}
                  title="Clear all history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`border rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-colors duration-200 ${
            isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-3">
            <FileImage className="w-8 h-8 opacity-80" />
          </div>
          <h3 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
            No History Yet
          </h3>
          <p
            className={`text-xs mt-1.5 max-w-[260px] leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            آپ کی کمپریس کردہ آخری 10 تصاویر یہاں خودکار محفوظ ہوں گی تاکہ آپ بعد میں دوبارہ ڈاؤن لوڈ یا شیئر کر سکیں۔
          </p>
          <button
            onClick={onGoToCompressor}
            className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-blue-600/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Compress an Image Now</span>
          </button>
        </motion.div>
      ) : (
        /* History Item Cards with Animated Slide-in */
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout" initial={true}>
            {history.map((item, index) => {
              const savedBytes = Math.max(0, item.originalSize - item.compressedSize);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -32, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 32, scale: 0.95 }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 26,
                    delay: Math.min(index * 0.05, 0.3)
                  }}
                  className={`border rounded-2xl p-3.5 transition-colors duration-200 ${
                    isDark
                      ? 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                <div className="flex space-x-3">
                  {/* Thumbnail with Click to preview */}
                  <div
                    onClick={() => setPreviewItem(item)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border shrink-0 cursor-pointer group flex items-center justify-center ${
                      isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
                    }`}
                    title="Click to view full preview"
                  >
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 text-white px-1 py-0.5 rounded font-mono">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Metadata and Stats */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                          title={item.name}
                        >
                          {item.name}
                        </h4>
                        <span
                          className={`text-[10px] font-medium shrink-0 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {formatTime(item.timestamp)}
                        </span>
                      </div>

                      {/* Size & Savings Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            isDark
                              ? 'bg-slate-700/50 text-slate-300 border-slate-600/50'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {getFormatLabel(item.format)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          -{item.savingsPercent}%
                        </span>
                        <span
                          className={`text-[10px] ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {item.compressedWidth} × {item.compressedHeight} px
                        </span>
                      </div>
                    </div>

                    {/* Size Comparison Bar */}
                    <div className="mt-1.5 flex items-center space-x-1.5 text-[11px]">
                      <span className={`line-through ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatFileSize(item.originalSize)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatFileSize(item.compressedSize)}
                      </span>
                      <span
                        className={`text-[10px] ml-auto ${
                          isDark ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      >
                        (Saved {formatFileSize(savedBytes)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div
                  className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-1.5 ${
                    isDark ? 'border-slate-700/60' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    {/* Re-Download Button */}
                    <button
                      onClick={() => onReDownload(item)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
                      title="Re-download this compressed image"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Re-Download</span>
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => onShare(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition ${
                        isDark
                          ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 border-slate-600/60'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                      title="Share this compressed image"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Re-open in compressor */}
                    <button
                      onClick={() => onOpenInCompressor(item)}
                      className={`p-1.5 rounded-lg border transition ${
                        isDark
                          ? 'border-slate-700/80 text-slate-400 hover:text-blue-400 hover:border-blue-500/40 bg-slate-800/40'
                          : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400 bg-slate-50'
                      }`}
                      title="Edit / re-compress this image in compressor"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete single item */}
                    <button
                      onClick={() => onDelete(item.id)}
                      className={`p-1.5 rounded-lg border transition ${
                        isDark
                          ? 'border-slate-700/80 text-slate-400 hover:text-red-400 hover:border-red-500/40 bg-slate-800/40'
                          : 'border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-400 bg-slate-50'
                      }`}
                      title="Delete from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Full Preview Modal with Smooth Motion */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className={`w-full max-w-sm rounded-2xl p-4 border space-y-3 shadow-2xl transition-colors duration-200 ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="truncate pr-2">
                  <h4 className="text-xs font-bold truncate">{previewItem.name}</h4>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {previewItem.compressedWidth} × {previewItem.compressedHeight} •{' '}
                    {formatFileSize(previewItem.compressedSize)} (-{previewItem.savingsPercent}%)
                  </p>
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className={`p-1.5 rounded-lg border ${
                    isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-xl overflow-hidden bg-black/50 border border-slate-700/50 aspect-video flex items-center justify-center">
                <img
                  src={previewItem.dataUrl}
                  alt={previewItem.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onReDownload(previewItem);
                    setPreviewItem(null);
                  }}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Re-Download</span>
                </button>
                <button
                  onClick={() => {
                    onShare(previewItem);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border transition ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
