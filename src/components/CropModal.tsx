import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Check, X, RotateCcw, Crop as CropIcon } from 'lucide-react';

export interface CropArea {
  x: number; // in natural image pixels
  y: number;
  width: number;
  height: number;
}

interface CropModalProps {
  imageUrl: string;
  onApplyCrop: (crop: CropArea) => void;
  onCancel: () => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  imageUrl,
  onApplyCrop,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Normalized coordinates (0 to 1) relative to displayed image bounds
  const [cropNorm, setCropNorm] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  });

  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{
    clientX: number;
    clientY: number;
    startCrop: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Image layout inside container
  const [layout, setLayout] = useState<{
    displayX: number;
    displayY: number;
    displayWidth: number;
    displayHeight: number;
  }>({ displayX: 0, displayY: 0, displayWidth: 0, displayHeight: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setImageObj(img);
    };
  }, [imageUrl]);

  // Measure container and compute image display layout
  const updateLayout = useCallback(() => {
    if (!containerRef.current || !imageObj) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;

    const imgAspect = imageObj.naturalWidth / imageObj.naturalHeight;
    const containerAspect = containerW / containerH;

    let displayW = 0;
    let displayH = 0;
    let displayX = 0;
    let displayY = 0;

    if (imgAspect > containerAspect) {
      displayW = containerW;
      displayH = containerW / imgAspect;
      displayX = 0;
      displayY = (containerH - displayH) / 2;
    } else {
      displayH = containerH;
      displayW = containerH * imgAspect;
      displayX = (containerW - displayW) / 2;
      displayY = 0;
    }

    setLayout({
      displayX,
      displayY,
      displayWidth: displayW,
      displayHeight: displayH,
    });
  }, [imageObj]);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  // Redraw canvas overlay whenever layout or crop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj || layout.displayWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    canvas.width = containerRect.width * dpr;
    canvas.height = containerRect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, containerRect.width, containerRect.height);

    // 1. Draw base image
    ctx.drawImage(
      imageObj,
      layout.displayX,
      layout.displayY,
      layout.displayWidth,
      layout.displayHeight
    );

    // 2. Crop area screen coordinates
    const cropScreenX = layout.displayX + cropNorm.x * layout.displayWidth;
    const cropScreenY = layout.displayY + cropNorm.y * layout.displayHeight;
    const cropScreenW = cropNorm.width * layout.displayWidth;
    const cropScreenH = cropNorm.height * layout.displayHeight;

    // 3. Dark backdrop dimming outside crop box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    // Top
    ctx.fillRect(0, 0, containerRect.width, cropScreenY);
    // Bottom
    ctx.fillRect(
      0,
      cropScreenY + cropScreenH,
      containerRect.width,
      containerRect.height - (cropScreenY + cropScreenH)
    );
    // Left
    ctx.fillRect(0, cropScreenY, cropScreenX, cropScreenH);
    // Right
    ctx.fillRect(
      cropScreenX + cropScreenW,
      cropScreenY,
      containerRect.width - (cropScreenX + cropScreenW),
      cropScreenH
    );

    // 4. Crop boundary border
    ctx.strokeStyle = '#3b82f6'; // Brand blue
    ctx.lineWidth = 2;
    ctx.strokeRect(cropScreenX, cropScreenY, cropScreenW, cropScreenH);

    // 5. Rule-of-thirds grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical grid lines
    ctx.moveTo(cropScreenX + cropScreenW / 3, cropScreenY);
    ctx.lineTo(cropScreenX + cropScreenW / 3, cropScreenY + cropScreenH);
    ctx.moveTo(cropScreenX + (2 * cropScreenW) / 3, cropScreenY);
    ctx.lineTo(cropScreenX + (2 * cropScreenW) / 3, cropScreenY + cropScreenH);
    // Horizontal grid lines
    ctx.moveTo(cropScreenX, cropScreenY + cropScreenH / 3);
    ctx.lineTo(cropScreenX + cropScreenW, cropScreenY + cropScreenH / 3);
    ctx.moveTo(cropScreenX, cropScreenY + (2 * cropScreenH) / 3);
    ctx.lineTo(cropScreenX + cropScreenW, cropScreenY + (2 * cropScreenH) / 3);
    ctx.stroke();

    // 6. Corner accents
    const cornerSize = 16;
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(cropScreenX, cropScreenY + cornerSize);
    ctx.lineTo(cropScreenX, cropScreenY);
    ctx.lineTo(cropScreenX + cornerSize, cropScreenY);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(cropScreenX + cropScreenW - cornerSize, cropScreenY);
    ctx.lineTo(cropScreenX + cropScreenW, cropScreenY);
    ctx.lineTo(cropScreenX + cropScreenW, cropScreenY + cornerSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(cropScreenX, cropScreenY + cropScreenH - cornerSize);
    ctx.lineTo(cropScreenX, cropScreenY + cropScreenH);
    ctx.lineTo(cropScreenX + cornerSize, cropScreenY + cropScreenH);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(cropScreenX + cropScreenW - cornerSize, cropScreenY + cropScreenH);
    ctx.lineTo(cropScreenX + cropScreenW, cropScreenY + cropScreenH);
    ctx.lineTo(cropScreenX + cropScreenW, cropScreenY + cropScreenH - cornerSize);
    ctx.stroke();
  }, [imageObj, layout, cropNorm]);

  // Pointer / Touch Handlers
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    handle: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveHandle(handle);
    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      startCrop: { ...cropNorm },
    });
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeHandle || !dragStart || layout.displayWidth === 0) return;

      const dx = (e.clientX - dragStart.clientX) / layout.displayWidth;
      const dy = (e.clientY - dragStart.clientY) / layout.displayHeight;

      const start = dragStart.startCrop;
      const minSize = 0.08; // Min 8% of width/height

      let newX = start.x;
      let newY = start.y;
      let newW = start.width;
      let newH = start.height;

      if (activeHandle === 'move') {
        newX = Math.max(0, Math.min(1 - newW, start.x + dx));
        newY = Math.max(0, Math.min(1 - newH, start.y + dy));
      } else if (activeHandle === 'nw') {
        const targetX = Math.max(0, Math.min(start.x + start.width - minSize, start.x + dx));
        const targetY = Math.max(0, Math.min(start.y + start.height - minSize, start.y + dy));
        newW = start.width + (start.x - targetX);
        newH = start.height + (start.y - targetY);
        newX = targetX;
        newY = targetY;
      } else if (activeHandle === 'ne') {
        const targetY = Math.max(0, Math.min(start.y + start.height - minSize, start.y + dy));
        newW = Math.max(minSize, Math.min(1 - start.x, start.width + dx));
        newH = start.height + (start.y - targetY);
        newY = targetY;
      } else if (activeHandle === 'sw') {
        const targetX = Math.max(0, Math.min(start.x + start.width - minSize, start.x + dx));
        newW = start.width + (start.x - targetX);
        newH = Math.max(minSize, Math.min(1 - start.y, start.height + dy));
        newX = targetX;
      } else if (activeHandle === 'se') {
        newW = Math.max(minSize, Math.min(1 - start.x, start.width + dx));
        newH = Math.max(minSize, Math.min(1 - start.y, start.height + dy));
      }

      setCropNorm({
        x: Math.max(0, Math.min(1, newX)),
        y: Math.max(0, Math.min(1, newY)),
        width: Math.max(minSize, Math.min(1 - newX, newW)),
        height: Math.max(minSize, Math.min(1 - newY, newH)),
      });
    },
    [activeHandle, dragStart, layout]
  );

  const handlePointerUp = useCallback(() => {
    setActiveHandle(null);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [activeHandle, handlePointerMove, handlePointerUp]);

  // Compute final crop in original natural pixel coordinates
  const getSelectedPixelDimensions = () => {
    if (!imageObj) return { width: 0, height: 0, x: 0, y: 0 };
    const naturalW = imageObj.naturalWidth;
    const naturalH = imageObj.naturalHeight;

    const x = Math.round(cropNorm.x * naturalW);
    const y = Math.round(cropNorm.y * naturalH);
    const width = Math.max(1, Math.round(cropNorm.width * naturalW));
    const height = Math.max(1, Math.round(cropNorm.height * naturalH));

    return { x, y, width, height };
  };

  const handleApply = () => {
    const crop = getSelectedPixelDimensions();
    onApplyCrop(crop);
  };

  const handleResetCrop = () => {
    setCropNorm({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  };

  const selectedDims = getSelectedPixelDimensions();

  // Screen positions for DOM drag handles
  const cropScreenX = layout.displayX + cropNorm.x * layout.displayWidth;
  const cropScreenY = layout.displayY + cropNorm.y * layout.displayHeight;
  const cropScreenW = cropNorm.width * layout.displayWidth;
  const cropScreenH = cropNorm.height * layout.displayHeight;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none touch-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <CropIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">Crop Image</h2>
            <p className="text-[11px] text-slate-400">
              Select area to compress • منتخب جگہ کاٹیں
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-1 rounded-lg">
            {selectedDims.width} × {selectedDims.height} px
          </span>
        </div>
      </div>

      {/* Main Canvas & Interactive Overlay Area */}
      <div
        ref={containerRef}
        className="relative flex-1 my-3 bg-slate-950/80 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {layout.displayWidth > 0 && (
          <div
            className="absolute cursor-move"
            style={{
              left: `${cropScreenX}px`,
              top: `${cropScreenY}px`,
              width: `${cropScreenW}px`,
              height: `${cropScreenH}px`,
            }}
            onPointerDown={(e) => handlePointerDown(e, 'move')}
          >
            {/* Corner Handles (Touch targets min 40x40 with centered visual indicator) */}
            <div
              className="absolute -top-4 -left-4 w-10 h-10 flex items-center justify-center cursor-nwse-resize z-20"
              onPointerDown={(e) => handlePointerDown(e, 'nw')}
            >
              <div className="w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full shadow-md" />
            </div>

            <div
              className="absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center cursor-nesw-resize z-20"
              onPointerDown={(e) => handlePointerDown(e, 'ne')}
            >
              <div className="w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full shadow-md" />
            </div>

            <div
              className="absolute -bottom-4 -left-4 w-10 h-10 flex items-center justify-center cursor-nesw-resize z-20"
              onPointerDown={(e) => handlePointerDown(e, 'sw')}
            >
              <div className="w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full shadow-md" />
            </div>

            <div
              className="absolute -bottom-4 -right-4 w-10 h-10 flex items-center justify-center cursor-nwse-resize z-20"
              onPointerDown={(e) => handlePointerDown(e, 'se')}
            >
              <div className="w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full shadow-md" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between space-x-2 shadow-lg">
        <button
          onClick={handleResetCrop}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700/60"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Full</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700/60"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>

          <button
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-blue-600/30 transition"
          >
            <Check className="w-4 h-4" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
