import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Share2,
  Sliders,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  Shield,
  HelpCircle,
  Zap,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Play,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  Info,
  Smartphone,
  Crop as CropIcon,
  Sun,
  Moon,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CropModal, CropArea } from './components/CropModal';
import { HistoryTab, HistoryItem } from './components/HistoryTab';
import {
  loadHistoryFromStorage,
  addOrUpdateHistoryItem,
  deleteHistoryItem,
  clearAllHistory
} from './utils/historyStorage';

type CompressionPreset = 'high' | 'standard' | 'low' | 'custom';
type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

interface ImageStats {
  name: string;
  originalSize: number;
  compressedSize: number;
  originalWidth: number;
  originalHeight: number;
  compressedWidth: number;
  compressedHeight: number;
  savingsPercent: number;
  originalUrl: string;
  compressedUrl: string;
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('app_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      localStorage.setItem('app_theme', theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [activeTab, setActiveTab] = useState<'compressor' | 'history' | 'guide' | 'privacy' | 'terms'>('compressor');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preset, setPreset] = useState<CompressionPreset>('standard');
  const [qualityPercent, setQualityPercent] = useState<number>(65);
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [previewTab, setPreviewTab] = useState<'compressed' | 'original'>('compressed');
  const [actionCount, setActionCount] = useState<number>(0);
  const [compressionCount, setCompressionCount] = useState<number>(0);

  // History state persisted in localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistoryFromStorage());
  const currentSessionIdRef = useRef<string>('img_' + Date.now());
  const historyDebounceRef = useRef<any>(null);
  const latestDataUrlRef = useRef<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Ad states
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [rewardedCountdown, setRewardedCountdown] = useState(5);
  const [rewardEarned, setRewardEarned] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [interstitialCountdown, setInterstitialCountdown] = useState(3);
  const [interstitialCanClose, setInterstitialCanClose] = useState(false);
  const [adMuted, setAdMuted] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Preset changes
  const applyPreset = (newPreset: CompressionPreset) => {
    setPreset(newPreset);
    if (newPreset === 'high') {
      setQualityPercent(35);
      setScalePercent(75);
    } else if (newPreset === 'standard') {
      setQualityPercent(65);
      setScalePercent(100);
    } else if (newPreset === 'low') {
      setQualityPercent(85);
      setScalePercent(100);
    }
  };

  // Process image with HTML5 Canvas, respecting selected crop area
  const processImage = (
    file: File,
    targetQuality: number,
    targetFormat: OutputFormat,
    targetScale: number,
    currentCrop: CropArea | null
  ) => {
    setIsProcessing(true);
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      const srcUrl = e.target?.result as string;
      img.src = srcUrl;
      img.onload = () => {
        // Determine source rectangle from crop area or full image
        const sx = currentCrop ? Math.max(0, currentCrop.x) : 0;
        const sy = currentCrop ? Math.max(0, currentCrop.y) : 0;
        const sWidth = currentCrop
          ? Math.min(img.width - sx, currentCrop.width)
          : img.width;
        const sHeight = currentCrop
          ? Math.min(img.height - sy, currentCrop.height)
          : img.height;

        // Effective original dimensions after crop selection
        const effectiveOrigW = Math.max(1, Math.round(sWidth));
        const effectiveOrigH = Math.max(1, Math.round(sHeight));

        const scale = targetScale / 100;
        const newWidth = Math.max(1, Math.round(effectiveOrigW * scale));
        const newHeight = Math.max(1, Math.round(effectiveOrigH * scale));

        // Create canvas for the original cropped area display URL
        let originalPreviewUrl = srcUrl;
        if (currentCrop) {
          const origCanvas = document.createElement('canvas');
          origCanvas.width = effectiveOrigW;
          origCanvas.height = effectiveOrigH;
          const origCtx = origCanvas.getContext('2d');
          if (origCtx) {
            origCtx.drawImage(
              img,
              sx,
              sy,
              sWidth,
              sHeight,
              0,
              0,
              effectiveOrigW,
              effectiveOrigH
            );
            originalPreviewUrl = origCanvas.toDataURL(file.type || 'image/jpeg');
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        // If target format is JPEG, draw white background so PNG transparencies don't turn black
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, newWidth, newHeight);
        }

        // Draw cropped area scaled down to compressed canvas
        ctx.drawImage(
          img,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          newWidth,
          newHeight
        );

        const qualityFraction = targetFormat === 'image/png' ? 1.0 : targetQuality / 100;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setIsProcessing(false);
              return;
            }

            const compressedUrl = URL.createObjectURL(blob);
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savingsPercent = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            setStats({
              name: file.name,
              originalSize,
              compressedSize,
              originalWidth: effectiveOrigW,
              originalHeight: effectiveOrigH,
              compressedWidth: newWidth,
              compressedHeight: newHeight,
              savingsPercent,
              originalUrl: originalPreviewUrl,
              compressedUrl
            });
            setIsProcessing(false);
            setCompressionCount((c) => c + 1);

            // Debounced update to history so slider dragging remains silky smooth
            if (historyDebounceRef.current) {
              clearTimeout(historyDebounceRef.current);
            }
            historyDebounceRef.current = setTimeout(() => {
              try {
                const compressedDataUrl = canvas.toDataURL(targetFormat, qualityFraction);
                latestDataUrlRef.current = compressedDataUrl;
                const historyEntry: HistoryItem = {
                  id: currentSessionIdRef.current,
                  name: file.name,
                  timestamp: Date.now(),
                  originalSize,
                  compressedSize,
                  originalWidth: effectiveOrigW,
                  originalHeight: effectiveOrigH,
                  compressedWidth: newWidth,
                  compressedHeight: newHeight,
                  savingsPercent,
                  format: targetFormat,
                  dataUrl: compressedDataUrl
                };
                setHistory((prev) => addOrUpdateHistoryItem(historyEntry, prev));
              } catch (err) {
                console.warn('Failed to save to history:', err);
              }
            }, 350);
          },
          targetFormat,
          qualityFraction
        );
      };
    };

    reader.readAsDataURL(file);
  };

  // Re-compress whenever options or crop area change
  useEffect(() => {
    if (selectedFile) {
      processImage(selectedFile, qualityPercent, format, scalePercent, cropArea);
    }
  }, [selectedFile, qualityPercent, format, scalePercent, cropArea]);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const nextCount = actionCount + 1;
      setActionCount(nextCount);

      // On second and subsequent compression, show Interstitial Ad as requested
      if (nextCount >= 2 && nextCount % 2 === 0) {
        setShowInterstitialAd(true);
        setInterstitialCountdown(3);
        setInterstitialCanClose(false);
      }

      // Reset previous crop and create new unique session ID for history
      setCropArea(null);
      currentSessionIdRef.current = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const url = URL.createObjectURL(file);
      setRawImageUrl(url);
      setSelectedFile(file);
    }
  };

  // Countdown timer for Rewarded Ad
  useEffect(() => {
    let timer: any;
    if (showRewardedAd && rewardedCountdown > 0) {
      timer = setTimeout(() => {
        setRewardedCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showRewardedAd && rewardedCountdown === 0) {
      setRewardEarned(true);
    }
    return () => clearTimeout(timer);
  }, [showRewardedAd, rewardedCountdown]);

  // Countdown timer for Interstitial Ad
  useEffect(() => {
    let timer: any;
    if (showInterstitialAd && interstitialCountdown > 0) {
      timer = setTimeout(() => {
        setInterstitialCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showInterstitialAd && interstitialCountdown === 0) {
      setInterstitialCanClose(true);
    }
    return () => clearTimeout(timer);
  }, [showInterstitialAd, interstitialCountdown]);

  // Download Trigger -> Launches Rewarded Ad first as user mandated
  const handleDownloadClick = () => {
    if (!stats) return;
    setRewardedCountdown(5);
    setRewardEarned(false);
    setShowRewardedAd(true);
  };

  // Actual Download Execution upon watching Rewarded Ad
  const executeDownload = () => {
    if (!stats) return;
    setShowRewardedAd(false);

    const a = document.createElement('a');
    a.href = stats.compressedUrl;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
    const baseName = stats.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Make sure latest compressed state is refreshed in history with updated timestamp
    if (latestDataUrlRef.current) {
      const historyEntry: HistoryItem = {
        id: currentSessionIdRef.current,
        name: stats.name,
        timestamp: Date.now(),
        originalSize: stats.originalSize,
        compressedSize: stats.compressedSize,
        originalWidth: stats.originalWidth,
        originalHeight: stats.originalHeight,
        compressedWidth: stats.compressedWidth,
        compressedHeight: stats.compressedHeight,
        savingsPercent: stats.savingsPercent,
        format: format,
        dataUrl: latestDataUrlRef.current
      };
      setHistory((prev) => addOrUpdateHistoryItem(historyEntry, prev));
    }

    showToast('Image compressed & downloaded successfully!');
  };

  // History Quick Actions: Re-Download, Share, Delete, Clear, Open in Compressor
  const handleReDownloadHistoryItem = (item: HistoryItem) => {
    const a = document.createElement('a');
    a.href = item.dataUrl;
    const ext = item.format === 'image/jpeg' ? 'jpg' : item.format === 'image/png' ? 'png' : 'webp';
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded "${item.name}" from history!`);
  };

  const handleShareHistoryItem = async (item: HistoryItem) => {
    const ext = item.format === 'image/jpeg' ? 'jpg' : item.format === 'image/png' ? 'png' : 'webp';
    const fileName = `${item.name.replace(/\.[^/.]+$/, '')}_compressed.${ext}`;

    if (navigator.share) {
      try {
        const res = await fetch(item.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: item.format });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: item.name,
            text: `Compressed photo (${item.savingsPercent}% saved, ${formatFileSize(item.compressedSize)})`,
            files: [file]
          });
          showToast('Image shared successfully!');
          return;
        } else {
          await navigator.share({
            title: item.name,
            text: `Check out compressed photo: ${item.name} (${item.savingsPercent}% reduction)`
          });
          showToast('Image link shared!');
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User simply closed the share dialog
        console.warn('Web share failed, falling back:', err);
      }
    }

    // Fallback: trigger direct download
    handleReDownloadHistoryItem(item);
    showToast('Web Share not supported in this browser. Image downloaded instead.');
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => deleteHistoryItem(id, prev));
    showToast('Item removed from history.');
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setHistory([]);
    showToast('All compression history cleared.');
  };

  const handleOpenInCompressor = async (item: HistoryItem) => {
    try {
      const res = await fetch(item.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], item.name, { type: item.format });
      currentSessionIdRef.current = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      setCropArea(null);
      setRawImageUrl(item.dataUrl);
      setSelectedFile(file);
      setActiveTab('compressor');
      showToast(`Loaded "${item.name}" into compressor.`);
    } catch (err) {
      console.error('Failed to load image into compressor:', err);
      showToast('Could not load image into compressor.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = 2;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className={`min-h-screen flex flex-col items-center transition-colors duration-200 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top App Bar with Android styling */}
      <header className={`w-full max-w-md backdrop-blur border-b sticky top-0 z-40 px-4 py-3 flex items-center justify-between transition-colors duration-200 ${isDark ? 'bg-slate-900/90 border-slate-700/60 shadow-md' : 'bg-white/95 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-bold text-base tracking-tight flex items-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Image Compressor
              <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                PRO
              </span>
            </h1>
            <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              امیج کمپریسر اور فارمیٹ کنورٹر
            </p>
          </div>
        </div>

        {/* Tab Shortcuts & Theme Toggle */}
        <div className="flex items-center space-x-1">
          {/* History Shortcut Button */}
          <button
            onClick={() => setActiveTab('history')}
            title="Compression History"
            aria-label="Compression History"
            className={`p-2 rounded-lg transition relative flex items-center justify-center ${
              activeTab === 'history'
                ? 'text-blue-500 bg-blue-500/10'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            {history.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
            )}
          </button>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`p-2 rounded-lg transition flex items-center justify-center ${
              isDark
                ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                : 'text-amber-600 hover:text-amber-700 hover:bg-slate-100'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            title="Privacy Policy"
            className={`p-2 rounded-lg transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            title="Guide & Tips"
            className={`p-2 rounded-lg transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container / Mobile frame width */}
      <main className="w-full max-w-md flex-1 px-4 py-4 pb-28 space-y-4">
        {/* Navigation Tabs Header */}
        <div className={`flex p-1 rounded-xl border text-[11px] font-medium transition-colors duration-200 ${isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-200/80 border-slate-300/80'}`}>
          <button
            onClick={() => setActiveTab('compressor')}
            className={`flex-1 py-1.5 px-1 rounded-lg flex items-center justify-center space-x-1 transition ${
              activeTab === 'compressor'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Compress</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-1 rounded-lg flex items-center justify-center space-x-1 transition relative ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {history.length > 0 && (
              <span
                className={`ml-1 text-[9px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                  activeTab === 'history'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-500/20 text-blue-500'
                }`}
              >
                {history.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 px-1 rounded-lg flex items-center justify-center space-x-1 transition ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-1.5 px-1 rounded-lg flex items-center justify-center space-x-1 transition ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-1.5 px-1 rounded-lg flex items-center justify-center space-x-1 transition ${
              activeTab === 'terms'
                ? 'bg-blue-600 text-white font-semibold shadow'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms</span>
          </button>
        </div>

        {/* COMPRESSOR VIEW */}
        {activeTab === 'compressor' && (
          <div className="space-y-4">
            {/* Image Upload / Drop Box */}
            <div className={`border rounded-2xl p-4 shadow-sm transition-colors duration-200 ${isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-white border-slate-200'}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed transition rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer text-center group ${isDark ? 'border-slate-600/80 hover:border-blue-500/80 hover:bg-blue-500/5' : 'border-slate-300 hover:border-blue-500/80 hover:bg-blue-50/50'}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                    <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Select Any Photo
                  </h3>
                  <p className={`text-xs mt-1 max-w-[220px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    کوئی بھی تصویر منتخب کریں اور چند سیکنڈ میں سائز کم کریں
                  </p>
                  <button className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-blue-600/30">
                    <ImageIcon className="w-4 h-4" />
                    <span>Choose from Gallery</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="truncate max-w-[200px]">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedFile.name}
                      </p>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {stats ? `${stats.originalWidth} × ${stats.originalHeight} px` : 'Loading...'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setShowCropModal(true)}
                        className={`text-xs flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border transition ${
                          cropArea
                            ? 'bg-blue-600/30 text-blue-400 border-blue-500/50'
                            : isDark
                            ? 'bg-slate-700/50 text-slate-300 hover:text-white border-slate-600/50'
                            : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
                        }`}
                        title="Crop Image"
                      >
                        <CropIcon className="w-3.5 h-3.5" />
                        <span>{cropArea ? 'Cropped' : 'Crop'}</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`text-xs flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border transition ${
                          isDark
                            ? 'text-blue-400 hover:text-blue-300 bg-slate-700/50 border-slate-600/50'
                            : 'text-blue-600 hover:text-blue-700 bg-slate-100 border-slate-300'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Change</span>
                      </button>
                    </div>
                  </div>

                  {/* Image Preview Box with Before / After Tabs */}
                  <div className={`relative rounded-xl overflow-hidden aspect-video flex items-center justify-center border ${isDark ? 'bg-black/40 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
                    {stats && (
                      <img
                        src={previewTab === 'compressed' ? stats.compressedUrl : stats.originalUrl}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    )}

                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                        <RefreshCw className="w-7 h-7 text-blue-400 animate-spin mb-2" />
                        <span className="text-xs font-medium">Compressing Image...</span>
                      </div>
                    )}

                    {/* Preview Toggle Pills */}
                    <div className="absolute bottom-2 left-2 flex bg-black/60 backdrop-blur p-0.5 rounded-lg border border-white/10 text-[10px]">
                      <button
                        onClick={() => setPreviewTab('compressed')}
                        className={`px-2 py-0.5 rounded ${
                          previewTab === 'compressed'
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-slate-400'
                        }`}
                      >
                        Compressed
                      </button>
                      <button
                        onClick={() => setPreviewTab('original')}
                        className={`px-2 py-0.5 rounded ${
                          previewTab === 'original'
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-slate-400'
                        }`}
                      >
                        Original
                      </button>
                    </div>

                    {stats && (
                      <div className="absolute top-2 right-2 flex items-center space-x-1.5">
                        {cropArea && (
                          <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow flex items-center space-x-1">
                            <CropIcon className="w-3 h-3" />
                            <span>Cropped</span>
                          </span>
                        )}
                        <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                          -{stats.savingsPercent}% Space Saved
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedFile && stats && (
              <>
                {/* Stats Breakdown Card with animated expansion on task finish */}
                <AnimatePresence>
                  <motion.div
                    key="stats-card-wrapper"
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.94, y: -14 }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                      scale: 1,
                      y: 0,
                      transition: {
                        height: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.35, ease: 'easeOut' },
                        scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                        y: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                      }
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      scale: 0.94,
                      y: -14,
                      transition: { duration: 0.25, ease: 'easeIn' }
                    }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      key={`stats-card-inner-${compressionCount}`}
                      initial={{ scale: 0.97, opacity: 0.85 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className={`border rounded-2xl p-4 shadow-md transition-colors duration-200 ${
                        isDark
                          ? 'bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border-blue-500/30'
                          : 'bg-blue-50/80 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Compression Stats</span>
                        </span>
                        <motion.span
                          key={`savings-badge-${stats.savingsPercent}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-700 bg-emerald-100 border-emerald-300'
                          }`}
                        >
                          Save {formatFileSize(stats.originalSize - stats.compressedSize)}
                        </motion.span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08, duration: 0.25 }}
                          className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'}`}
                        >
                          <p className={`text-[10px] uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Original</p>
                          <p className={`text-sm font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {formatFileSize(stats.originalSize)}
                          </p>
                          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {stats.originalWidth}x{stats.originalHeight}
                          </p>
                        </motion.div>

                        <motion.div
                          key={`compressed-stat-${stats.compressedSize}`}
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.14, duration: 0.25 }}
                          className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/80 border-blue-500/40' : 'bg-white border-blue-300 shadow-sm'}`}
                        >
                          <p className="text-[10px] text-blue-500 uppercase font-medium">Compressed</p>
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                            {formatFileSize(stats.compressedSize)}
                          </p>
                          <p className="text-[10px] text-blue-500/80">
                            {stats.compressedWidth}x{stats.compressedHeight}
                          </p>
                        </motion.div>

                        <motion.div
                          key={`reduction-stat-${stats.savingsPercent}`}
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.25 }}
                          className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/80 border-emerald-500/40' : 'bg-white border-emerald-300 shadow-sm'}`}
                        >
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-medium">Reduction</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {stats.savingsPercent}%
                          </p>
                          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Saved</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                {/* Compression Level Presets as user specified */}
                <div className={`border rounded-2xl p-4 space-y-3 transition-colors duration-200 ${
                  isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Compression Level / کمپریشن موڈ
                    </h3>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      {preset === 'high'
                        ? 'High (80-90% smaller)'
                        : preset === 'standard'
                        ? 'Standard (Balanced)'
                        : preset === 'low'
                        ? 'Low (High Quality)'
                        : 'Custom Percentage'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* High Compression */}
                    <button
                      onClick={() => applyPreset('high')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        preset === 'high'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-600 dark:text-white shadow-md'
                          : isDark
                          ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold">High</span>
                        {preset === 'high' && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>زیادہ کمپریشن</p>
                      <span className="text-[9px] bg-red-500/20 text-red-500 dark:text-red-300 px-1.5 py-0.5 rounded mt-1.5 inline-block font-semibold">
                        ~80-90%
                      </span>
                    </button>

                    {/* Standard Compression */}
                    <button
                      onClick={() => applyPreset('standard')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        preset === 'standard'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-600 dark:text-white shadow-md'
                          : isDark
                          ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold">Standard</span>
                        {preset === 'standard' && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </div>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>سٹینڈرڈ</p>
                      <span className="text-[9px] bg-blue-500/20 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded mt-1.5 inline-block font-semibold">
                        ~50-70%
                      </span>
                    </button>

                    {/* Low Compression */}
                    <button
                      onClick={() => applyPreset('low')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        preset === 'low'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-600 dark:text-white shadow-md'
                          : isDark
                          ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold">Low</span>
                        {preset === 'low' && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>لو کمپریشن</p>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded mt-1.5 inline-block font-semibold">
                        ~20-40%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Percentage & Quality Sliders (Explicit user requirement) */}
                <div className={`border rounded-2xl p-4 space-y-4 transition-colors duration-200 ${
                  isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`font-semibold flex items-center space-x-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        <Sliders className="w-3.5 h-3.5 text-blue-500" />
                        <span>Target Quality (کوالٹی فیصد)</span>
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                        {qualityPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={qualityPercent}
                      onChange={(e) => {
                        setQualityPercent(Number(e.target.value));
                        setPreset('custom');
                      }}
                      className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500 ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                    <div className={`flex justify-between text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>10% (Extreme saving)</span>
                      <span>50% (Recommended)</span>
                      <span>100% (Lossless)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        Resolution Scale (ڈائمینشن اسکیل)
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        {scalePercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={100}
                      step={5}
                      value={scalePercent}
                      onChange={(e) => {
                        setScalePercent(Number(e.target.value));
                        setPreset('custom');
                      }}
                      className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Output Format Selector (JPEG, PNG, WEBP) */}
                <div className={`border rounded-2xl p-4 space-y-3 transition-colors duration-200 ${
                  isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Convert Format / فارمیٹ منتخب کریں
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setFormat('image/jpeg')}
                      className={`py-2.5 px-3 rounded-xl border text-center text-xs font-semibold transition ${
                        format === 'image/jpeg'
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : isDark
                          ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      JPEG (.jpg)
                    </button>
                    <button
                      onClick={() => setFormat('image/webp')}
                      className={`py-2.5 px-3 rounded-xl border text-center text-xs font-semibold transition ${
                        format === 'image/webp'
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : isDark
                          ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      WEBP (.webp)
                    </button>
                    <button
                      onClick={() => setFormat('image/png')}
                      className={`py-2.5 px-3 rounded-xl border text-center text-xs font-semibold transition ${
                        format === 'image/png'
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : isDark
                          ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      PNG (.png)
                    </button>
                  </div>
                </div>

                {/* Native Ad Card embedded in the middle as user requested */}
                <div className={`border rounded-2xl p-3.5 space-y-2.5 transition-colors duration-200 ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/80'
                    : 'bg-slate-50 border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      SPONSORED
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Google AdMob Native</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shrink-0 shadow">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Quick Cleaner &amp; Phone Booster
                      </h4>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        ⭐ 4.8 (85k reviews) • Free 50GB Cache Cleanup
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow shrink-0">
                      Install
                    </button>
                  </div>
                </div>

                {/* Download Action with Rewarded Ad */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleDownloadClick}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 transition"
                  >
                    <Download className="w-5 h-5" />
                    <span>Watch Ad &amp; Download / ڈاؤن لوڈ کریں</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    Watch a quick 5-second reward video to unlock and save your compressed photo
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* HISTORY VIEW */}
        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            isDark={isDark}
            onReDownload={handleReDownloadHistoryItem}
            onShare={handleShareHistoryItem}
            onDelete={handleDeleteHistoryItem}
            onClearAll={handleClearAllHistory}
            onOpenInCompressor={handleOpenInCompressor}
            onGoToCompressor={() => setActiveTab('compressor')}
            formatFileSize={formatFileSize}
          />
        )}

        {/* GUIDE VIEW */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            <div className={`border rounded-2xl p-4 transition-colors duration-200 ${
              isDark ? 'bg-slate-800/70 border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h2 className={`text-base font-bold flex items-center space-x-2 mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <span>Compression Guide &amp; Tips</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                بہترین نتائج حاصل کرنے کے لیے رہنما ہدایات
              </p>
            </div>

            <div className="space-y-3">
              <div className={`border rounded-xl p-4 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">
                  ⚡ High Compression (ہائی کمپریشن)
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Reduces photo size by 80% to 90%. Perfect for email attachments (under 25MB limit), official job portal uploads, government portal forms, and WhatsApp when you need to send large albums quickly.
                </p>
              </div>

              <div className={`border rounded-xl p-4 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                  ⚖️ Standard Compression (سٹینڈرڈ کمپریشن)
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Balanced 50% to 70% reduction with uncompromised human visual fidelity. Ideal for social media posts, Telegram channels, and everyday photo storage.
                </p>
              </div>

              <div className={`border rounded-xl p-4 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  💎 Low Compression (لو کمپریشن)
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Mild 20% to 40% compression. Retains full high-resolution details for printing, portfolio photos, and archival backup.
                </p>
              </div>

              <div className={`border rounded-xl p-4 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-1">
                  📁 Format Comparison
                </h3>
                <ul className={`text-xs space-y-1.5 list-disc list-inside ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <li><strong>WEBP:</strong> 25-35% smaller than JPEG with identical visual sharpness.</li>
                  <li><strong>JPEG:</strong> Universally compatible across all devices, portals, and TVs.</li>
                  <li><strong>PNG:</strong> Lossless graphics, ideal for text screenshots and transparent logos.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* PRIVACY POLICY VIEW (Google Play Store Required) */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <div className={`border rounded-2xl p-4 transition-colors duration-200 ${
              isDark ? 'bg-slate-800/70 border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h2 className={`text-base font-bold flex items-center space-x-2 mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Shield className="w-5 h-5 text-emerald-500" />
                <span>Privacy Policy / پرائیویسی پالیسی</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Compliant with Google Play Developer Policy (Target SDK 36)
              </p>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className={`border rounded-xl p-4 space-y-1.5 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 shadow-sm text-slate-600'
              }`}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>1. 100% On-Device Processing</h3>
                <p>
                  Your photos are processed completely on your device. We NEVER upload, scan, transmit, or store any of your images on cloud servers.
                </p>
              </div>

              <div className={`border rounded-xl p-4 space-y-1.5 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 shadow-sm text-slate-600'
              }`}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>2. Zero Sensitive Permissions</h3>
                <p>
                  This app uses modern zero-permission photo picking (PickVisualMedia). It does not request broad READ_EXTERNAL_STORAGE or location permissions.
                </p>
              </div>

              <div className={`border rounded-xl p-4 space-y-1.5 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 shadow-sm text-slate-600'
              }`}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>3. Advertising Disclosures (Google AdMob)</h3>
                <p>
                  We display Google AdMob advertisements (Banner, Native, Interstitial, and Rewarded ads). AdMob may use pseudonymous device identifiers in accordance with Google Play policies and user consent settings.
                </p>
              </div>

              <div className={`border rounded-xl p-4 space-y-1.5 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 shadow-sm text-slate-600'
              }`}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>4. Developer Contact</h3>
                <p>
                  For privacy queries or support, reach out to support@imagecompressor.app.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TERMS OF SERVICE VIEW */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <div className={`border rounded-2xl p-4 transition-colors duration-200 ${
              isDark ? 'bg-slate-800/70 border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h2 className={`text-base font-bold flex items-center space-x-2 mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FileText className="w-5 h-5 text-indigo-500" />
                <span>Terms of Service / شرائط و ضوابط</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                User agreement for Image Compressor &amp; Converter
              </p>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className={`border rounded-xl p-4 space-y-1.5 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 shadow-sm text-slate-600'
              }`}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>1. Permitted Use</h3>
                <p>
                  You may use this tool freely for personal and commercial image compression, resizing, and format conversion.
                </p>
              </div>

              <div className={`border rounded-xl p-4 space-y-1.5 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 shadow-sm text-slate-600'
              }`}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>2. Rewarded Ads &amp; Downloads</h3>
                <p>
                  Rewarded ads allow users to access premium compression download features at zero cost. Rewards are unlocked after the ad viewing requirement is completed.
                </p>
              </div>

              <div className={`border rounded-xl p-4 space-y-1.5 transition-colors duration-200 ${
                isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 shadow-sm text-slate-600'
              }`}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>3. Disclaimer</h3>
                <p>
                  Image compression mathematically modifies picture data to achieve reduced file size. Users are advised to retain original backups of vital master photography.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Banner Ad at the bottom as user requested */}
      <footer className={`fixed bottom-0 left-0 right-0 z-30 flex justify-center backdrop-blur border-t py-1 px-4 transition-colors duration-200 ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        <div className={`w-full max-w-md border rounded-xl p-2.5 flex items-center justify-between shadow-lg transition-colors duration-200 ${
          isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">
              Ad
            </span>
            <div className="leading-tight">
              <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>50GB Cloud Drive Free</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Google AdMob • Test Banner Unit</p>
            </div>
          </div>
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg">
            Open
          </button>
        </div>
      </footer>

      {/* REWARDED AD MODAL (Shown on Download Click) */}
      {showRewardedAd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm border rounded-3xl p-5 shadow-2xl space-y-4 transition-colors duration-200 ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                REWARDED VIDEO AD
              </span>
              {rewardEarned ? (
                <button
                  onClick={() => setShowRewardedAd(false)}
                  className={`p-1 rounded-full ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-xs font-bold text-amber-500">
                  Reward in {rewardedCountdown}s
                </span>
              )}
            </div>

            {/* Simulated Video Player */}
            <div className="relative aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-2 animate-pulse">
                <Play className="w-6 h-6 text-blue-400 ml-0.5" />
              </div>
              <h4 className="text-sm font-bold text-white">Next-Gen Fast Cloud Sync</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Watch full 5 seconds to unlock your compressed image download
              </p>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${((5 - rewardedCountdown) / 5) * 100}%` }}
                />
              </div>
            </div>

            {rewardEarned ? (
              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
                    🎉 Reward Unlocked! Your download is ready.
                  </p>
                </div>
                <button
                  onClick={executeDownload}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Now / سیو کریں</span>
                </button>
              </div>
            ) : (
              <p className={`text-[11px] text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Viewing sponsored message... ({rewardedCountdown}s remaining)
              </p>
            )}
          </div>
        </div>
      )}

      {/* INTERSTITIAL AD MODAL (Shown on repeated compression or return) */}
      {showInterstitialAd && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm border rounded-3xl p-5 shadow-2xl space-y-4 transition-colors duration-200 ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                INTERSTITIAL AD
              </span>
              {interstitialCanClose ? (
                <button
                  onClick={() => setShowInterstitialAd(false)}
                  className={`p-1 rounded-full ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Skip in {interstitialCountdown}s
                </span>
              )}
            </div>

            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 p-5 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-3">
                <Zap className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white">Ultra Turbo VPN</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-[220px]">
                Encrypt your network and browse securely with 1-click ultra fast servers.
              </p>
              <button className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg">
                Try Free 7 Days
              </button>
            </div>

            {interstitialCanClose && (
              <button
                onClick={() => setShowInterstitialAd(false)}
                className={`w-full py-2.5 text-xs font-semibold rounded-xl border transition ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                Continue to Image Compressor
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action / Success Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Legacy Download Success Toast Notification */}
      {!toastMessage && downloadSuccessToast && (
        <div className="fixed top-16 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>Image compressed &amp; downloaded successfully!</span>
        </div>
      )}

      {/* Crop Modal using Canvas Overlay */}
      {showCropModal && rawImageUrl && (
        <CropModal
          imageUrl={rawImageUrl}
          onApplyCrop={(crop) => {
            setCropArea(crop);
            setShowCropModal(false);
          }}
          onCancel={() => setShowCropModal(false)}
        />
      )}
    </div>
  );
}
