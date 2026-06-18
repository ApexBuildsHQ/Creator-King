import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { Palette, Upload, Copy, Sparkles, Check, Layers, Eye, RefreshCw } from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';
import { useAdManager } from '../context/AdContext';

export const toolInfo: ToolInfo = {
  id: 'palette_extractor',
  icon: 'Palette',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_palette_extractor_title',
  descKey: 'tool_palette_extractor_desc',
};

interface ColorPaletteExtractorProps {
  currentLang: Language;
  t: (key: any) => string;
  isRtl: boolean;
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export default function ColorPaletteExtractor({ t, isRtl }: ColorPaletteExtractorProps) {
  const { triggerAd } = useAdManager();
  const [dragActive, setDragActive] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    type: string;
    dimensions: string;
  } | null>(null);

  // States for options
  const [colorCount, setColorCount] = useState<5 | 8 | 12>(8);
  const [format, setFormat] = useState<'HEX' | 'RGB' | 'HSL'>('HEX');
  const [palette, setPalette] = useState<RGBColor[]>([]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const loadedSrc = event.target.result as string;
        setImageSrc(loadedSrc);

        const img = new Image();
        img.src = loadedSrc;
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;

          setFileDetails({
            name: file.name,
            size: formatSize(file.size),
            type: file.type,
            dimensions: `${w} × ${h} px`
          });

          extractPaletteFromImage(img);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const extractPaletteFromImage = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    // Scale down image to 120x120 pixels to keep it fast
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, 120, 120);
    const imgData = ctx.getImageData(0, 0, 120, 120).data;
    
    // Gather all valid pixels (excluding high transparency)
    const colors: {r: number, g: number, b: number}[] = [];
    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      if (a >= 125) {
        colors.push({ r, g, b });
      }
    }

    if (colors.length === 0) {
      // Fallback
      setPalette(getDefaultPalette(colorCount));
      return;
    }

    // Advanced Local Color Extraction with Euclidean spacing to ensure diversity
    const sampledPalette = extractDistinctColors(colors, 16); // Extract more than needed first
    
    // Convert to target format schema
    const finalColors: RGBColor[] = sampledPalette.map(c => ({
      r: c.r,
      g: c.g,
      b: c.b,
      hex: rgbToHex(c.r, c.g, c.b)
    }));

    setPalette(finalColors);
  };

  // Extract a highly diverse palette using color quantization/spacing
  const extractDistinctColors = (colors: {r: number, g: number, b: number}[], targetCount: number) => {
    // 1. Group very similar colors using rough round quantizations (30px size buckets)
    const buckets: Record<string, { r: number, g: number, b: number, count: number }> = {};
    for (const color of colors) {
      const qr = Math.round(color.r / 20) * 20;
      const qg = Math.round(color.g / 20) * 20;
      const qb = Math.round(color.b / 20) * 20;
      const key = `${qr},${qg},${qb}`;

      if (!buckets[key]) {
        buckets[key] = { r: color.r, g: color.g, b: color.b, count: 0 };
      }
      buckets[key].count++;
    }

    // 2. Sort by popularity
    const sortedCandidates = Object.values(buckets)
      .sort((a, b) => b.count - a.count);

    // 3. Select with a decreasing minimum distance criterion to fill the requested colors
    const selected: { r: number, g: number, b: number }[] = [];
    let distanceThreshold = 65; // High initial distance to make sure colors are genuinely distinct

    while (selected.length < targetCount && distanceThreshold >= 10) {
      for (const candidate of sortedCandidates) {
        if (selected.length >= targetCount) break;

        // Check distance to all already selected colors
        const tooClose = selected.some(sel => {
          const dr = sel.r - candidate.r;
          const dg = sel.g - candidate.g;
          const db = sel.b - candidate.b;
          // Euclidean distance in 3D color space
          return Math.sqrt(dr*dr + dg*dg + db*db) < distanceThreshold;
        });

        if (!tooClose) {
          selected.push({ r: candidate.r, g: candidate.g, b: candidate.b });
        }
      }
      // Gradually decrease the distance threshold to find enough colors
      distanceThreshold -= 10;
    }

    // Fallback if we still don't have enough colors, add any popular candidate
    for (const candidate of sortedCandidates) {
      if (selected.length >= targetCount) break;
      if (!selected.some(sel => sel.r === candidate.r && sel.g === candidate.g && sel.b === candidate.b)) {
        selected.push({ r: candidate.r, g: candidate.g, b: candidate.b });
      }
    }

    return selected;
  };

  // Re-run color extraction if colorCount changes and we have an image
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        extractPaletteFromImage(img);
      };
    }
  }, [colorCount]);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (c: number) => {
      const hex = Math.max(0, Math.min(255, c)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const getFormattedColor = (color: RGBColor) => {
    if (format === 'RGB') {
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    if (format === 'HSL') {
      const hsl = rgbToHsl(color.r, color.g, color.b);
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }
    return color.hex;
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, trying fallback", err);
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return !!successful;
    } catch (err) {
      console.error("Clipboard copy fallback failed", err);
      return false;
    }
  };

  const handleColorCopy = (colorCode: string) => {
    triggerAd(async () => {
      const success = await copyToClipboard(colorCode);
      if (success) {
        setCopiedColor(colorCode);
        setTimeout(() => setCopiedColor(null), 1500);
      }
    });
  };

  const handleCopyAll = () => {
    if (palette.length === 0) return;
    const formattedList = palette.slice(0, colorCount).map(c => getFormattedColor(c)).join(', ');
    
    triggerAd(async () => {
      const success = await copyToClipboard(formattedList);
      if (success) {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }
    });
  };

  const getDefaultPalette = (count: number): RGBColor[] => {
    // Beautiful default modern warm slate/copper/emerald palette
    const defaults = [
      { r: 30, g: 41, b: 59, hex: '#1E293B' },
      { r: 124, g: 58, b: 237, hex: '#7C3AED' },
      { r: 245, g: 158, b: 11, hex: '#F59E0B' },
      { r: 16, g: 185, b: 129, hex: '#10B981' },
      { r: 239, g: 68, b: 68, hex: '#EF4444' },
      { r: 59, g: 130, b: 246, hex: '#3B82F6' },
      { r: 236, g: 72, b: 153, hex: '#EC4899' },
      { r: 100, g: 116, b: 139, hex: '#64748B' },
      { r: 20, g: 184, b: 166, hex: '#14B8A6' },
      { r: 99, g: 102, b: 241, hex: '#6366F1' },
      { r: 168, g: 85, b: 247, hex: '#A855F7' },
      { r: 225, g: 29, b: 72, hex: '#E11D48' }
    ];
    return defaults.slice(0, count);
  };

  // Check if a color has high luminance (light) to adapt text contrast
  const getContrastColor = (color: RGBColor) => {
    // Standard relative luminance formula
    const yiq = ((color.r * 299) + (color.g * 587) + (color.b * 114)) / 1000;
    return (yiq >= 128) ? 'text-slate-900 border-black/10' : 'text-white border-white/10';
  };

  const activePalette = palette.slice(0, colorCount);

  return (
    <div className="w-full space-y-6" id="color-palette-extractor-workspace">
      
      {/* Informative banner area */}
      <div className="flex gap-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/40 p-4 rounded-2xl">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {t('palette_extractor.title')}
          </p>
          <p>
            {t('palette_extractor.drag_tip')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Drag/Drop Upload and Source Image details */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              {isRtl ? 'مصدر الصورة' : 'Source Image Viewport'}
            </h3>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 rounded-full text-[10px] font-bold uppercase">
              100% OFF-LINE
            </span>
          </div>

          {!imageSrc ? (
            /* Upload Sandbox Box */
            <div
              className={`border-3 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer min-h-[340px] flex flex-col justify-center items-center gap-4 ${
                dragActive 
                  ? 'border-amber-500 bg-amber-500/5' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705 bg-slate-50 dark:bg-slate-900/20'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('palette-file-selector')?.click()}
            >
              <input
                id="palette-file-selector"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-amber-100 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 rounded-full">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t('palette_extractor.select_image')}
                </p>
                <p className="text-xs text-slate-450 max-w-sm mx-auto">
                  {t('palette_extractor.on_device_processing')}
                </p>
              </div>
              <button 
                type="button"
                className="px-5 py-2 bg-slate-950 hover:bg-slate-850 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition shadow active:scale-95 mt-2"
              >
                {t('palette_extractor.upload_image')}
              </button>
            </div>
          ) : (
            /* Uploaded Image view and details */
            <div className="space-y-4">
              <div className="relative w-full max-h-[300px] overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-2">
                <img
                  src={imageSrc}
                  alt="Source Palette"
                  className="max-h-[280px] object-contain rounded-lg shadow-sm"
                />
              </div>

              {/* Technical file variables */}
              {fileDetails && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-450 font-medium">{isRtl ? 'اسم الملف' : 'Filename'}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold max-w-[200px] truncate">{fileDetails.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-450 font-medium">{isRtl ? 'الأبعاد والوضوح' : 'Dimensions'}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">{fileDetails.dimensions}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-450 font-medium">{isRtl ? 'الحجم' : 'File Size'}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">{fileDetails.size}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setImageSrc(null);
                  setFileDetails(null);
                  setPalette([]);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-bold text-slate-650 dark:text-slate-300 rounded-xl transition flex items-center justify-center gap-1.5 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تغيير أو رفع صورة جديدة' : 'Change Image'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Colors display, Controls, and Copy tools */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Controls Sandbox */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-amber-500" />
              {isRtl ? 'خيارات استخراج الألوان' : 'Palette Extraction Settings'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option 1: Number of colors */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">
                  {t('palette_extractor.colors_count')}
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {([5, 8, 12] as const).map((count) => (
                    <button
                      key={count}
                      onClick={() => setColorCount(count)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                        colorCount === count
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 border-transparent'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Format choice */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">
                  {t('palette_extractor.color_format')}
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['HEX', 'RGB', 'HSL'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                        format === fmt
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/40'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 border-transparent'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Color list display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                {t('palette_extractor.dominant_colors')}
              </h3>

              {imageSrc && activePalette.length > 0 && (
                <button
                  onClick={handleCopyAll}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl shadow-sm border transition flex items-center gap-1.5 ${
                    copiedAll
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-950 hover:bg-slate-850 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 border-transparent active:scale-95'
                  }`}
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? t('palette_extractor.copied') : t('palette_extractor.copy_all')}</span>
                </button>
              )}
            </div>

            {/* Color Swatch cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(imageSrc && activePalette.length > 0) ? (
                activePalette.map((color, idx) => {
                  const formattedCode = getFormattedColor(color);
                  const isTileCopied = copiedColor === formattedCode;
                  const contrastTextColor = getContrastColor(color);

                  return (
                    <div
                      key={idx}
                      id={`color-swatch-tile-${idx}`}
                      onClick={() => handleColorCopy(formattedCode)}
                      style={{ backgroundColor: color.hex }}
                      className="h-28 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md cursor-pointer transition duration-300 relative group overflow-hidden active:scale-95 flex flex-col justify-end p-3"
                    >
                      {/* Interactive hover overlays */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition duration-200" />

                      {/* Top Action Copy icon */}
                      <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/10 backdrop-blur-sm shadow opacity-0 group-hover:opacity-100 transition duration-200">
                        <Copy className={`w-3.5 h-3.5 ${contrastTextColor}`} />
                      </div>

                      {/* Status label if individual card got clicked to copy */}
                      {isTileCopied ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white p-2 text-center animate-fadeIn">
                          <Check className="w-5 h-5 text-emerald-400 mb-1" />
                          <span className="text-[10px] font-bold font-mono">{t('palette_extractor.copied')}</span>
                        </div>
                      ) : null}

                      {/* Display color code values */}
                      <div className="space-y-0.5 z-10">
                        <span className={`text-[10px] font-bold font-mono py-0.5 px-1.5 rounded-md bg-black/15 backdrop-blur-xs inline-block max-w-[95%] truncate select-all ${contrastTextColor}`}>
                          {formattedCode}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Empty placeholder layout */
                Array.from({ length: colorCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-28 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col justify-end p-3 relative text-slate-300 dark:text-slate-800"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Palette className="w-5 h-5 stroke-[1.5] animate-pulse" />
                    </div>
                    <div className="space-y-1 w-2/3">
                      <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-full" />
                      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-1/2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Secure local note */}
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-mono">
              {t('palette_extractor.on_device_processing')}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
