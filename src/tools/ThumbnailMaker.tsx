import { useState, useRef, useEffect, ChangeEvent, DragEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Type, Upload, Download, Sparkles, Move, Trash2, Plus, LayoutGrid, Check, Settings, Sliders, Layers } from 'lucide-react';
import { Language, ToolInfo } from '../types';
import { useAdManager } from '../context/AdContext';

export const toolInfo: ToolInfo = {
  id: 'thumbnail_maker',
  icon: 'LayoutGrid',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_thumbnail_maker_title',
  descKey: 'tool_thumbnail_maker_desc',
};

interface ThumbnailMakerProps {
  currentLang: Language;
  t: (key: string) => string;
  isRtl: boolean;
}

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowColor: string;
}

type PresetId = 'youtube' | 'facebook' | 'instagram' | 'custom';

export default function ThumbnailMaker({ t, isRtl, currentLang }: ThumbnailMakerProps) {
  const { triggerAd } = useAdManager();

  // Canvas Dimensions
  const [preset, setPreset] = useState<PresetId>('youtube');
  const [canvasWidth, setCanvasWidth] = useState<number>(1280);
  const [canvasHeight, setCanvasHeight] = useState<number>(720);

  // Background style
  const [bgColor, setBgColor] = useState<string>('#131722');
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Text Layers list
  const [layers, setLayers] = useState<TextLayer[]>([
    {
      id: 'layer-1',
      text: currentLang === 'ar' ? 'صانع الصور المصغرة الملكي' : 'CREATOR KING SANDBOX',
      x: 640,
      y: 260,
      fontSize: 64,
      fontFamily: 'Impact',
      color: '#facc15', // beautiful yellow-400
      strokeColor: '#000000',
      strokeWidth: 6,
      shadowEnabled: true,
      shadowBlur: 15,
      shadowColor: '#000000',
    },
    {
      id: 'layer-2',
      text: currentLang === 'ar' ? 'صمم باحترافية محلياً 100%' : '100% Serverless Workstation',
      x: 640,
      y: 420,
      fontSize: 42,
      fontFamily: 'Inter',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowEnabled: true,
      shadowBlur: 10,
      shadowColor: '#000000',
    }
  ]);

  const [activeLayerId, setActiveLayerId] = useState<string | null>('layer-1');
  const [newTextString, setNewTextString] = useState<string>('');
  const [fontSizeInput, setFontSizeInput] = useState<string>('64');

  const activeLayer = layers.find(l => l.id === activeLayerId);

  useEffect(() => {
    if (activeLayer) {
      setFontSizeInput(activeLayer.fontSize.toString());
    } else {
      setFontSizeInput('');
    }
  }, [activeLayerId]);

  const handleFontSizeInputChange = (valStr: string) => {
    setFontSizeInput(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      updateActiveLayer({ fontSize: Math.min(250, Math.max(1, parsed)) });
    }
  };

  const handleFontSizeInputBlur = () => {
    if (activeLayer) {
      setFontSizeInput(activeLayer.fontSize.toString());
    }
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update canvas size on preset change
  const handlePresetChange = (selected: PresetId) => {
    setPreset(selected);
    if (selected === 'youtube') {
      setCanvasWidth(1280);
      setCanvasHeight(720);
      centerAllLayers(1280, 720);
    } else if (selected === 'facebook') {
      setCanvasWidth(1200);
      setCanvasHeight(630);
      centerAllLayers(1200, 630);
    } else if (selected === 'instagram') {
      setCanvasWidth(1080);
      setCanvasHeight(1080);
      centerAllLayers(1080, 1080);
    }
  };

  const centerAllLayers = (w: number, h: number) => {
    setLayers(prev => prev.map((lyr, index) => ({
      ...lyr,
      x: w / 2,
      y: h / 2 + (index === 0 ? -60 : 60)
    })));
  };

  const handleCustomWidthChange = (val: number) => {
    setPreset('custom');
    setCanvasWidth(val);
  };

  const handleCustomHeightChange = (val: number) => {
    setPreset('custom');
    setCanvasHeight(val);
  };

  // Add layer helper
  const handleAddTextLayer = () => {
    const textToAdd = newTextString.trim() || (currentLang === 'ar' ? 'نص جديد بارز' : 'New Aesthetic Layer');
    const newLayer: TextLayer = {
      id: `layer-${Date.now()}`,
      text: textToAdd,
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      fontSize: 50,
      fontFamily: 'Impact',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 5,
      shadowEnabled: true,
      shadowBlur: 8,
      shadowColor: '#000000',
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    setNewTextString('');
  };

  // Delete layer helper
  const handleDeleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(null);
    }
  };

  // Update active layer properties
  const updateActiveLayer = (updates: Partial<TextLayer>) => {
    if (!activeLayerId) return;
    setLayers(prev => prev.map(lyr => lyr.id === activeLayerId ? { ...lyr, ...updates } : lyr));
  };

  // Render state loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background color
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Render background image if present
    if (bgImage) {
      // Scale cover
      const canvasRatio = canvasWidth / canvasHeight;
      const imgRatio = bgImage.width / bgImage.height;
      let drawW, drawH, drawX, drawY;

      if (imgRatio > canvasRatio) {
        drawH = canvasHeight;
        drawW = canvasHeight * imgRatio;
        drawX = (canvasWidth - drawW) / 2;
        drawY = 0;
      } else {
        drawW = canvasWidth;
        drawH = canvasWidth / imgRatio;
        drawX = 0;
        drawY = (canvasHeight - drawH) / 2;
      }
      ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
    }

    // Render each text layer
    layers.forEach(lyr => {
      ctx.save();
      
      // Configuration
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.font = `${lyr.fontSize}px ${lyr.fontFamily}`;

      // Drop shadow (Can be performance sluggish but native)
      if (lyr.shadowEnabled) {
        ctx.shadowColor = lyr.shadowColor;
        ctx.shadowBlur = lyr.shadowBlur;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // Draw stroke first
      if (lyr.strokeWidth > 0) {
        ctx.strokeStyle = lyr.strokeColor;
        ctx.lineWidth = lyr.strokeWidth;
        ctx.lineJoin = 'miter';
        ctx.strokeText(lyr.text, lyr.x, lyr.y);
      }

      // Fill text
      ctx.fillStyle = lyr.color;
      ctx.fillText(lyr.text, lyr.x, lyr.y);

      // Selected highlight ring helper
      if (lyr.id === activeLayerId) {
        // Draw dotted selector boundary
        const metrics = ctx.measureText(lyr.text);
        const textWidth = metrics.width;
        const textHeight = lyr.fontSize;
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#f59e0b'; // amber-500
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          lyr.x - textWidth / 2 - 15,
          lyr.y - textHeight / 2 - 10,
          textWidth + 30,
          textHeight + 20
        );

        // draw tiny drag controller dots
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(lyr.x - textWidth / 2 - 20, lyr.y - 5, 10, 10);
        ctx.fillRect(lyr.x + textWidth / 2 + 10, lyr.y - 5, 10, 10);
      }

      ctx.restore();
    });

  }, [canvasWidth, canvasHeight, bgColor, bgImage, layers, activeLayerId]);

  // Handle local background image loading
  const handleBgImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setBgImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setBgImage(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleBgImageUpload(file);
    }
  };

  const removeBgImage = () => {
    setBgImage(null);
    setBgImageFile(null);
  };

  // Convert client cursor coordinate to canvas grid coordinate
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Text layer hittest
  const hitTestText = (canvasX: number, canvasY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Iterate backwards so uppermost layers are clicked first
    for (let i = layers.length - 1; i >= 0; i--) {
      const lyr = layers[i];
      ctx.save();
      ctx.font = `${lyr.fontSize}px ${lyr.fontFamily}`;
      const metrics = ctx.measureText(lyr.text);
      const textWidth = metrics.width;
      const textHeight = lyr.fontSize;
      ctx.restore();

      const xMin = lyr.x - textWidth / 2 - 15;
      const xMax = lyr.x + textWidth / 2 + 15;
      const yMin = lyr.y - textHeight / 2 - 10;
      const yMax = lyr.y + textHeight / 2 + 10;

      if (canvasX >= xMin && canvasX <= xMax && canvasY >= yMin && canvasY <= yMax) {
        return lyr.id;
      }
    }
    return null;
  };

  // Drag listeners
  const startDrag = (canvasX: number, canvasY: number) => {
    const hitId = hitTestText(canvasX, canvasY);
    if (hitId) {
      setActiveLayerId(hitId);
      isDraggingRef.current = true;
      const activeLayer = layers.find(l => l.id === hitId);
      if (activeLayer) {
        dragStartOffset.current = {
          x: canvasX - activeLayer.x,
          y: canvasY - activeLayer.y
        };
      }
    } else {
      setActiveLayerId(null);
    }
  };

  const performDrag = (canvasX: number, canvasY: number) => {
    if (!isDraggingRef.current || !activeLayerId) return;
    const targetX = Math.round(canvasX - dragStartOffset.current.x);
    const targetY = Math.round(canvasY - dragStartOffset.current.y);
    
    // Bounds check within canvas or relative margin
    updateActiveLayer({ x: targetX, y: targetY });
  };

  const stopDrag = () => {
    isDraggingRef.current = false;
  };

  // Mouse drag implementation
  const handleMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (coords) {
      startDrag(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (coords) {
      performDrag(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    stopDrag();
  };

  // Mobile/Tablet responsive Touchdrag implementation
  const handleTouchStart = (e: ReactTouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      if (coords) {
        startDrag(coords.x, coords.y);
      }
    }
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      // Prevent browser bounce scrolling on drag
      e.preventDefault();
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      if (coords) {
        performDrag(coords.x, coords.y);
      }
    }
  };

  const handleTouchEnd = () => {
    stopDrag();
  };

  // Premium Download Handler protected by our Creator King Ad system
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Deselect active layer boundary outline so it downloads cleanly
    setActiveLayerId(null);

    // Wait slightly for reactivation state cleanups
    setTimeout(() => {
      triggerAd(() => {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const anchor = document.createElement('a');
          const originalName = bgImageFile?.name || 'custom_thumbnail';
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          anchor.download = `${nameWithoutExt}_designer.png`;
          anchor.href = dataUrl;
          anchor.classList.add('ad-bypassed'); // Tell ad proxy to ignore and download immediately
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
        } catch (err) {
          console.error("Canvas export failed due to security/tainting", err);
          alert("Could not export high-res thumbnail because of cross-origin background images. Please upload local files only.");
        }
      });
    }, 50);
  };

  return (
    <div className="w-full space-y-6" id="thumbnail-maker-overall-workspace">
      
      {/* Sub header with custom instruction */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {t('thumbnail_maker.tip_title')}
          </p>
          <p>
            {t('thumbnail_maker.tip_desc')}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Control panel */}
        <div className="flex-1 space-y-6 max-w-full lg:max-w-md">
          
          {/* Preset size selectors */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2">
              <LayoutGrid className="w-4 h-4 text-amber-500" />
              {t('thumbnail_maker.target_canvas')}
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetChange('youtube')}
                className={`py-2 px-3 text-center rounded-xl border text-xs font-bold flex flex-col gap-0.5 transition ${
                  preset === 'youtube'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>YouTube</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">1280x720</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetChange('facebook')}
                className={`py-2 px-3 text-center rounded-xl border text-xs font-bold flex flex-col gap-0.5 transition ${
                  preset === 'facebook'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Facebook</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">1200x630</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetChange('instagram')}
                className={`py-2 px-3 text-center rounded-xl border text-xs font-bold flex flex-col gap-0.5 transition ${
                  preset === 'instagram'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Instagram</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">1080x1080</span>
              </button>
            </div>

            {/* Custom dimensions parameters inputs */}
            <div className="grid grid-cols-2 gap-3 pt-2 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('width')} (Pixel)</span>
                <input
                  type="number"
                  value={canvasWidth}
                  onChange={(e) => handleCustomWidthChange(parseInt(e.target.value, 10) || 100)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('height')} (Pixel)</span>
                <input
                  type="number"
                  value={canvasHeight}
                  onChange={(e) => handleCustomHeightChange(parseInt(e.target.value, 10) || 100)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Background settings upload and color */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2">
              <Upload className="w-4 h-4 text-emerald-500" />
              {t('thumbnail_maker.bg_settings')}
            </h3>

            {/* Drop Drag Image Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[100px] ${
                dragActive
                  ? 'border-amber-500 bg-amber-500/5'
                  : bgImage
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBgImageUpload(file);
                }}
                className="hidden"
              />

              {bgImage ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 line-clamp-1">
                    ✓ {bgImageFile?.name || 'Image Loaded'}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBgImage();
                    }}
                    className="px-2 py-1 bg-rose-50 dark:bg-rose-950/20 text-[10px] font-bold text-rose-500 hover:text-rose-600 rounded-md transition"
                  >
                    {t('thumbnail_maker.bg_clear_pic')}
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {t('thumbnail_maker.bg_image_drag')}
                  </p>
                </div>
              )}
            </div>

            {/* Solid Color selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 block">
                {t('thumbnail_maker.bg_choose_solid')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono flex-1 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Add Text layers workbench panel */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2">
              <Plus className="w-4 h-4 text-amber-500" />
              {t('thumbnail_maker.add_text')}
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('thumbnail_maker.add_text_placeholder')}
                value={newTextString}
                onChange={(e) => setNewTextString(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTextLayer();
                }}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300"
              />
              <button
                type="button"
                onClick={handleAddTextLayer}
                className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center"
              >
                {t('thumbnail_maker.add_text')}
              </button>
            </div>

            {/* List layers to permit manual deletion and selection */}
            {layers.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('thumbnail_maker.layers_queue')}</span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {layers.map((lyr) => (
                    <div
                      key={lyr.id}
                      onClick={() => setActiveLayerId(lyr.id)}
                      className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer border transition ${
                        activeLayerId === lyr.id
                          ? 'border-amber-500 bg-amber-500/5 font-extrabold text-amber-600 dark:text-amber-400'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Type className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{lyr.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLayer(lyr.id);
                        }}
                        className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Layer Customization workbench panel (Visible only if a layer is selected) */}
          {activeLayer ? (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5 animate-fadeIn">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  {t('thumbnail_maker.selected_layer_settings')}
                </span>
                <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 py-0.5 px-2 rounded">
                  {layers.indexOf(activeLayer) + 1} / {layers.length}
                </span>
              </h3>

              {/* Text Input edit */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('thumbnail_maker.edit_text_content')}</span>
                <input
                  type="text"
                  value={activeLayer.text}
                  onChange={(e) => updateActiveLayer({ text: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300"
                />
              </div>

              {/* Font settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('thumbnail_maker.font_style')}</span>
                  <select
                    value={activeLayer.fontFamily}
                    onChange={(e) => updateActiveLayer({ fontFamily: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="Impact">Impact (Bold Memes)</option>
                    <option value="Inter">Inter (Clean UI)</option>
                    <option value="Space Grotesk">Space Grotesk</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Georgia">Georgia (Serif)</option>
                    <option value="Arial Black">Arial Black</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('thumbnail_maker.font_size')}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      pattern="[0-9]*"
                      value={fontSizeInput}
                      onChange={(e) => handleFontSizeInputChange(e.target.value)}
                      onBlur={handleFontSizeInputBlur}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Text Fill and stroke color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('thumbnail_maker.text_color')}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={activeLayer.color}
                      onChange={(e) => updateActiveLayer({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={activeLayer.color}
                      onChange={(e) => updateActiveLayer({ color: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('thumbnail_maker.stroke_color')}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={activeLayer.strokeColor}
                      onChange={(e) => updateActiveLayer({ strokeColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={activeLayer.strokeColor}
                      onChange={(e) => updateActiveLayer({ strokeColor: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Stroke Border outline size range */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                  <span>{t('thumbnail_maker.text_stroke')}</span>
                  <span className="font-mono text-amber-500 font-bold">{activeLayer.strokeWidth}px</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={activeLayer.strokeWidth}
                  onChange={(e) => updateActiveLayer({ strokeWidth: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 py-1.5 bg-transparent"
                />
              </div>

              {/* Drop Shadow slider controls */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeLayer.shadowEnabled}
                    onChange={(e) => updateActiveLayer({ shadowEnabled: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-800 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    {t('thumbnail_maker.text_shadow')}
                  </span>
                </label>

                {activeLayer.shadowEnabled && (
                  <div className="space-y-2 animate-fadeIn pl-2">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 flex justify-between">
                        <span>{t('thumbnail_maker.shadow_spread_blur')}</span>
                        <span className="font-mono text-indigo-500">{activeLayer.shadowBlur}px</span>
                      </span>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={activeLayer.shadowBlur}
                        onChange={(e) => updateActiveLayer({ shadowBlur: parseInt(e.target.value, 10) })}
                        className="w-full accent-indigo-500 p-0.5 bg-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">{t('thumbnail_maker.shadow_color')}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeLayer.shadowColor}
                          onChange={(e) => updateActiveLayer({ shadowColor: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={activeLayer.shadowColor}
                          onChange={(e) => updateActiveLayer({ shadowColor: e.target.value })}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-[10px] text-slate-700 dark:text-slate-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs italic">
              {t('thumbnail_maker.no_text_selected')}
            </div>
          )}

        </div>

        {/* Right Side: Preview Workbench & HTML5 Canvas Stage */}
        <div className="flex-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 rounded-2xl p-5 space-y-4 flex flex-col items-center justify-center">
            
            <div className="w-full flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
              <div className="space-y-0.5 text-right">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                  {t('thumbnail_maker.canvas_viewport')}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Target: {canvasWidth}x{canvasHeight} • {layers.length} layers
                </p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded-full text-[10px] font-bold uppercase">
                {t('thumbnail_maker.active_sandbox')}
              </span>
            </div>

            {/* Canvas Stage Viewport wrapper that keeps the coordinate aspect ratio fluidlyresizing */}
            <div className="relative w-full max-w-full overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-950 rounded-2xl shadow-inner flex items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="max-w-full h-auto cursor-crosshair rounded border border-slate-200/50 dark:border-slate-800 shadow-md transition-all duration-150"
                style={{
                  aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                  touchAction: 'none' // Disable scroll gestures on the canvas for tablet touch capability
                }}
              />
            </div>

            {/* Instruction badge */}
            <div className="w-full flex text-[10px] text-slate-400 dark:text-slate-500 font-mono justify-between items-center px-1">
              <span>{t('thumbnail_maker.export_format')}</span>
              <span>{t('thumbnail_maker.drag_active_label')}</span>
            </div>

            {/* Action triggering download of the designed thumbnail with ad integration block */}
            <div className="w-full pt-4 border-t border-slate-50 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-4 px-4 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-sm rounded-2xl transition shadow-lg shadow-amber-500/5 flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>{t('thumbnail_maker.download_png')}</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
