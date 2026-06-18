import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { 
  QrCode, 
  Upload, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Grid,
  Circle,
  Link,
  ShieldCheck,
  Palette,
  Eye,
  Type
} from 'lucide-react';
import QRCode from 'qrcode';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'qr_maker',
  icon: 'QrCode',
  category: 'utility',
  isFullyInteractive: true,
  titleKey: 'tool_qr_maker_title',
  descKey: 'tool_qr_maker_desc',
};

type DotStyle = 'classic' | 'round' | 'stripes';
type LogoSize = 'small' | 'medium' | 'large';

interface PresetPalette {
  nameAr: string;
  nameEn: string;
  dots: string;
  bg: string;
}

const PRESET_PALETTES: PresetPalette[] = [
  { nameEn: 'Slate Obsidian', nameAr: 'سبق أسود', dots: '#0f172a', bg: '#ffffff' },
  { nameEn: 'Satin Emerald', nameAr: 'زمرد هادئ', dots: '#064e3b', bg: '#f0fdf4' },
  { nameEn: 'Royal Indigo', nameAr: 'أزرق ملكي', dots: '#1e3a8a', bg: '#f0fdfa' },
  { nameEn: 'Velvet Purple', nameAr: 'بنفسجي فاخر', dots: '#581c87', bg: '#faf5ff' },
  { nameEn: 'Cyber Neon', nameAr: 'النيون السيبراني', dots: '#10b981', bg: '#090d16' },
  { nameEn: 'Sunset Flame', nameAr: 'لهب الغروب', dots: '#ec4899', bg: '#090d16' },
];

export default function PremiumQRGenerator({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = useAdManager();
  
  // State variables for configuration
  const [text, setText] = useState<string>('https://example.com');
  const [colorDots, setColorDots] = useState<string>('#0f172a');
  const [colorBg, setColorBg] = useState<string>('#ffffff');
  const [dotStyle, setDotStyle] = useState<DotStyle>('classic');
  const [logoSize, setLogoSize] = useState<LogoSize>('medium');
  
  // Logo variables
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoImageEl, setLogoImageEl] = useState<HTMLImageElement | null>(null);
  
  // Interface feedback states
  const [dragActive, setDragActive] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load logo source into an image element to draw synchronously inside canvas
  useEffect(() => {
    if (!logoSrc) {
      setLogoImageEl(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoSrc;
    img.onload = () => {
      setLogoImageEl(img);
    };
    img.onerror = () => {
      console.error('Failed to load local logo image source.');
    };
  }, [logoSrc]);

  // Reactive compilation on canvas when anything changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const textToEncode = text.trim() || 'https://example.com';
      // Error Correction level 'H' is strictly needed when center logo overlays are requested!
      const qrObj = QRCode.create(textToEncode, { errorCorrectionLevel: 'H' });
      const { modules } = qrObj;
      const size = modules.size;
      
      // Determine logical pixels sizes
      const baseWidth = 640;
      const cellSize = Math.floor(baseWidth / size);
      const margin = cellSize * 2.5;
      const totalSize = size * cellSize + margin * 2;
      
      canvas.width = totalSize;
      canvas.height = totalSize;

      // Draw background color
      ctx.fillStyle = colorBg;
      ctx.fillRect(0, 0, totalSize, totalSize);

      // Safe access helper for matrix points
      const isDark = (r: number, c: number) => {
        if (r < 0 || r >= size || c < 0 || c >= size) return false;
        if (typeof modules.get === 'function') {
          return modules.get(r, c) === 1;
        }
        return modules.data[r * size + c] === 1;
      };

      // Draw normal cells (skipping the corner anchor frames to style them separately)
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (isDark(r, c)) {
            // Check position finder zones
            const isTL = r < 7 && c < 7;
            const isTR = r < 7 && c >= size - 7;
            const isBL = r >= size - 7 && c < 7;
            const isEye = isTL || isTR || isBL;

            if (isEye) {
              // Corners are skipped in this pass; styled continuous below for perfect scanning
              continue;
            }

            const x = margin + c * cellSize;
            const y = margin + r * cellSize;
            ctx.fillStyle = colorDots;

            if (dotStyle === 'round') {
              ctx.beginPath();
              const cx = x + cellSize / 2;
              const cy = y + cellSize / 2;
              const radius = (cellSize / 2) * 0.85;
              ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
              ctx.fill();
            } else if (dotStyle === 'stripes') {
              // Render continuous connected capsules for a highly stylized modern finish
              const hasTop = isDark(r - 1, c);
              const hasBottom = isDark(r + 1, c);
              const cx = x + cellSize / 2;
              const cy = y + cellSize / 2;
              const rx = cellSize / 2.5;

              ctx.beginPath();
              if (hasTop && hasBottom) {
                ctx.fillRect(x + (cellSize - rx * 2) / 2, y, rx * 2, cellSize);
              } else if (hasTop) {
                ctx.arc(cx, cy, rx, 0, Math.PI);
                ctx.fillRect(cx - rx, y, rx * 2, cellSize / 2);
                ctx.fill();
              } else if (hasBottom) {
                ctx.arc(cx, cy, rx, Math.PI, 0);
                ctx.fillRect(cx - rx, cy, rx * 2, cellSize / 2);
                ctx.fill();
              } else {
                ctx.arc(cx, cy, rx, 0, 2 * Math.PI);
                ctx.fill();
              }
            } else {
              // Classic sharp square grids
              ctx.fillRect(x, y, cellSize, cellSize);
            }
          }
        }
      }

      // Render custom, clean, continuous Position Anchor Eyes
      // This is a trademark of luxury QR generators. It rounds the outer frame whilst keeping it solid
      const drawPremiumAnchorEye = (startRow: number, startCol: number) => {
        const startX = margin + startCol * cellSize;
        const startY = margin + startRow * cellSize;
        const eyeSize = cellSize * 7;

        // Clear eye canvas compartment to draw clean customized layers
        ctx.fillStyle = colorBg;
        ctx.fillRect(startX, startY, eyeSize, eyeSize);

        // Draw Outer Ring (7x7 module bounds) with elegant border roundings
        ctx.fillStyle = colorDots;
        ctx.beginPath();
        const outerRadius = cellSize * 1.8;
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(startX, startY, eyeSize, eyeSize, outerRadius);
        } else {
          ctx.rect(startX, startY, eyeSize, eyeSize);
        }
        ctx.fill();

        // Draw Middle Empty Ring Cut-out (5x5 module bounds) in BG color
        ctx.fillStyle = colorBg;
        ctx.beginPath();
        const midX = startX + cellSize;
        const midY = startY + cellSize;
        const midSize = cellSize * 5;
        const midRadius = cellSize * 1.1;
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(midX, midY, midSize, midSize, midRadius);
        } else {
          ctx.rect(midX, midY, midSize, midSize);
        }
        ctx.fill();

        // Draw Inner Center Solid Pupil (3x3 module bounds) in Dots color
        ctx.fillStyle = colorDots;
        ctx.beginPath();
        const pupilX = startX + cellSize * 2;
        const pupilY = startY + cellSize * 2;
        const pupilSize = cellSize * 3;
        const pupilRadius = cellSize * 0.7;
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(pupilX, pupilY, pupilSize, pupilSize, pupilRadius);
        } else {
          ctx.rect(pupilX, pupilY, pupilSize, pupilSize);
        }
        ctx.fill();
      };

      // Draw all three anchoring eyes on the corners
      drawPremiumAnchorEye(0, 0);               // Top-Left Frame
      drawPremiumAnchorEye(0, size - 7);        // Top-Right Frame
      drawPremiumAnchorEye(size - 7, 0);        // Bottom-Left Frame

      // Overlay the uploaded brand logo if present with absolute centering and a solid background shield
      if (logoImageEl) {
        let logoRatio = 0.15; // Medium logo occupies 15%
        if (logoSize === 'small') logoRatio = 0.10;
        else if (logoSize === 'large') logoRatio = 0.22;

        const logoPixelSize = Math.floor(totalSize * logoRatio);
        const logoX = (totalSize - logoPixelSize) / 2;
        const logoY = (totalSize - logoPixelSize) / 2;

        // Draw a solid protective shield to prevent matrix points from intersecting behind the logo
        const shieldSize = logoPixelSize + cellSize * 1.5;
        const shieldX = (totalSize - shieldSize) / 2;
        const shieldY = (totalSize - shieldSize) / 2;
        const shieldRadius = cellSize * 1.2;

        ctx.fillStyle = colorBg;
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(shieldX, shieldY, shieldSize, shieldSize, shieldRadius);
        } else {
          ctx.rect(shieldX, shieldY, shieldSize, shieldSize);
        }
        ctx.fill();

        // Sketch the logo onto the center
        try {
          ctx.drawImage(logoImageEl, logoX, logoY, logoPixelSize, logoPixelSize);
        } catch (logoErr) {
          console.error('Error drawing image asset to canvas: ', logoErr);
        }
      }

    } catch (err) {
      console.error('Failed drawing components matrix: ', err);
    }
  }, [text, colorDots, colorBg, dotStyle, logoSize, logoImageEl]);

  // Drag and drop processing triggers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setLogoFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processLogoFile(e.target.files[0]);
    }
  };

  // Actions
  const handleDownload = () => {
    if (!canvasRef.current) return;
    triggerAd(() => {
      const link = document.createElement('a');
      link.href = canvasRef.current!.toDataURL('image/png');
      link.download = `premium-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2500);
        } catch (writeErr) {
          console.error('Failed copying directly via standard Clipboard API: ', writeErr);
          // Simple local fallback (dataUrl export link, etc.) if required
        }
      });
    } catch (err) {
      console.error('Unhandled clipboard access block: ', err);
    }
  };

  const selectColorPreset = (preset: PresetPalette) => {
    setColorDots(preset.dots);
    setColorBg(preset.bg);
  };

  return (
    <div className="w-full space-y-6" id="enhanced-qr-code-maker-workspace">
      
      {/* Informative tips box */}
      <div className="flex gap-3 bg-cyan-50 dark:bg-cyan-955/20 border border-cyan-100 dark:border-cyan-900/40 p-4 rounded-2xl">
        <Sparkles className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {isRtl ? 'حفز مصفوفات الباركود الفاخرة' : 'Highly Scannable Thematic Customization'}
          </p>
          <p>
            {isRtl 
              ? 'تتيح لك هذه الأداة رسم شكل النقاط والمصفوفات، مع الحفاظ الكامل على دقة المربعات الجانبية الكبرى (Anchor eyes) دون أي تشويه لضمان مسح فائق السرعة عبر كاميرات الهواتف والتابلت.'
              : 'Our matrix engine handles dots and custom roundings elegantly while guarding the three anchor corners in pixel-perfect sharpness. Highly compatible with all smart lenses and tablets.'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Parameters, controls inputs, uploaded logo setups */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Target link Input card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Type className="w-4 h-4 text-cyan-500" />
              {t('qr_maker.input_label')}
            </h3>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Link className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('qr_maker.input_placeholder')}
                className={`w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition font-sans ${
                  isRtl ? 'text-left' : ''
                }`}
              />
            </div>
          </div>

          {/* Preset Styles and Dual Colors Selectors */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-5 shadow-xs">
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/80 pb-2.5">
              <Palette className="w-4 h-4 text-cyan-500" />
              {isRtl ? 'أنظمة الألوان واللوحات الجاهزة' : 'Theming & Matrix Colors'}
            </h3>

            {/* Micro Swatches Carousel */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">
                {isRtl ? 'مستويات الأوان الجاهزة' : 'Creative Theme Presets'}
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_PALETTES.map((preset, idx) => {
                  const isActive = colorDots === preset.dots && colorBg === preset.bg;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectColorPreset(preset)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition ${
                        isActive
                          ? 'border-cyan-500 bg-cyan-500/5 font-semibold text-slate-900 dark:text-white'
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-405'
                      }`}
                    >
                      <div className="flex shrink-0 border border-black/10 rounded-md overflow-hidden">
                        <div className="w-3.5 h-7" style={{ backgroundColor: preset.dots }} />
                        <div className="w-3.5 h-7" style={{ backgroundColor: preset.bg }} />
                      </div>
                      <span className="truncate text-[11px] font-sans">
                        {isRtl ? preset.nameAr : preset.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Individual Color Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Dots Color */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>{t('qr_maker.color_dots')}</span>
                  <span className="font-mono text-cyan-500">{colorDots}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={colorDots}
                    onChange={(e) => setColorDots(e.target.value)}
                    className="w-10 h-10 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={colorDots}
                    onChange={(e) => setColorDots(e.target.value)}
                    placeholder="#000000"
                    maxLength={7}
                    className="flex-1 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>{t('qr_maker.color_bg')}</span>
                  <span className="font-mono text-cyan-500">{colorBg}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={colorBg}
                    onChange={(e) => setColorBg(e.target.value)}
                    className="w-10 h-10 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={colorBg}
                    onChange={(e) => setColorBg(e.target.value)}
                    placeholder="#ffffff"
                    maxLength={7}
                    className="flex-1 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Dot matrix Shapes patterns */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/80 pb-2.5">
              <Grid className="w-4 h-4 text-cyan-500" />
              {t('qr_maker.dot_style')}
            </h3>

            <div className="grid grid-cols-3 gap-3">
              
              {/* Classic */}
              <button
                onClick={() => setDotStyle('classic')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition gap-2 ${
                  dotStyle === 'classic'
                    ? 'border-cyan-500 bg-cyan-500/5 text-slate-900 dark:text-white'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500'
                }`}
              >
                <Grid className="w-5 h-5 text-cyan-500" />
                <span className="text-[11px] font-bold">
                  {t('qr_maker.dot_style_classic')}
                </span>
              </button>

              {/* Round */}
              <button
                onClick={() => setDotStyle('round')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition gap-2 ${
                  dotStyle === 'round'
                    ? 'border-cyan-500 bg-cyan-500/5 text-slate-900 dark:text-white'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500'
                }`}
              >
                <Circle className="w-5 h-5 text-cyan-500" />
                <span className="text-[11px] font-bold">
                  {t('qr_maker.dot_style_round')}
                </span>
              </button>

              {/* Stripes */}
              <button
                onClick={() => setDotStyle('stripes')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition gap-2 ${
                  dotStyle === 'stripes'
                    ? 'border-cyan-500 bg-cyan-500/5 text-slate-900 dark:text-white'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500'
                }`}
              >
                <div className="flex gap-1">
                  <div className="w-1.5 h-5 bg-cyan-500 rounded-full" />
                  <div className="w-1.5 h-5 bg-cyan-500 rounded-full" />
                </div>
                <span className="text-[11px] font-bold">
                  {t('qr_maker.dot_style_stripes')}
                </span>
              </button>

            </div>

          </div>

          {/* Central Logo Upload section */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/80 pb-2.5">
              <Upload className="w-4 h-4 text-cyan-500" />
              {t('qr_maker.upload_logo')}
            </h3>

            {/* Drag & Drop Neon Glowing Area */}
            {!logoSrc ? (
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2.5 ${
                  dragActive 
                    ? 'border-cyan-500 bg-cyan-500/5 ring-4 ring-cyan-500/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705 bg-slate-50/50 dark:bg-slate-950/20'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('qr-logo-selector')?.click()}
              >
                <input
                  id="qr-logo-selector"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-955/35 text-cyan-600 dark:text-cyan-400 rounded-full">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('qr_maker.upload_logo_tip')}
                  </p>
                  <p className="text-[10px] text-slate-450">
                    PNG, JPG, SVG (1:1 Recommended Ratio)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-slate-200 dark:border-slate-800 bg-white rounded-lg p-1.5 overflow-hidden flex items-center justify-center">
                    <img src={logoSrc} alt="logo-preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="space-y-0.5 max-w-[170px] sm:max-w-xs">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate select-all">
                      {logoFileName}
                    </p>
                    <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">
                      {isRtl ? 'تم الإدراج بنجاح' : 'Brand Embed Ready'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLogoSrc(null);
                    setLogoFileName(null);
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                  title={t('qr_maker.clear_logo')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Logo sizes parameters */}
            {logoSrc && (
              <div className="space-y-2.5 pt-1.5 border-t border-slate-50 dark:border-slate-800/60">
                <label className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">
                  {t('qr_maker.logo_size')}
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* Small */}
                  <button
                    onClick={() => setLogoSize('small')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                      logoSize === 'small'
                        ? 'border-cyan-500 bg-cyan-500/5 text-slate-900 dark:text-white'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500'
                    }`}
                  >
                    {t('qr_maker.logo_size_small')} (10%)
                  </button>

                  {/* Medium */}
                  <button
                    onClick={() => setLogoSize('medium')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                      logoSize === 'medium'
                        ? 'border-cyan-500 bg-cyan-500/5 text-slate-900 dark:text-white'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
                    }`}
                  >
                    {t('qr_maker.logo_size_medium')} (15%)
                  </button>

                  {/* Large */}
                  <button
                    onClick={() => setLogoSize('large')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                      logoSize === 'large'
                        ? 'border-cyan-500 bg-cyan-500/5 text-slate-900 dark:text-white'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500'
                    }`}
                  >
                    {t('qr_maker.logo_size_large')} (22%)
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right Side: High resolution live output, Copy & download actions */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-500" />
              {isRtl ? 'معاينة الباركود فائق الجودة الـ HD' : 'Live HD QR Code Frame'}
            </h3>
            
            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 border border-cyan-500/10 rounded-full text-[10px] font-bold uppercase font-mono">
              Vector Style
            </span>
          </div>

          {/* Matrix Frame Card */}
          <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-[32px] shadow-inner">
            
            <motion.div 
              layout 
              className="relative rounded-2xl overflow-hidden shadow-2xl bg-white p-4.5 border-4 border-slate-850 dark:border-slate-800 flex items-center justify-center max-w-[280px] sm:max-w-[310px] aspect-square"
            >
              {/* Actual invisible/visible React drawing canvas */}
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain rounded-lg flex shrink-0"
              />
            </motion.div>

            {/* Quick Actions Center */}
            <div className="w-full flex flex-col gap-2.5">
              
              {/* Main premium Download execution link */}
              <button
                onClick={handleDownload}
                className="w-full py-3.5 px-6 bg-slate-950 hover:bg-slate-850 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white dark:text-slate-950 font-bold text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-2 active:scale-98 select-none"
              >
                <Download className="w-4 h-4" />
                <span>{t('qr_maker.download_btn')}</span>
              </button>

              {/* Copy QR to clipboard */}
              <button
                onClick={handleCopyToClipboard}
                className="w-full py-3 px-6 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs transition flex items-center justify-center gap-2 active:scale-98 select-none"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <span className="text-emerald-500">{t('palette_extractor.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{isRtl ? 'نسخ صورة الرمز إلى الحافظة' : 'Copy Barcode Image to Clipboard'}</span>
                  </>
                )}
              </button>

            </div>

          </div>

          {/* Privacy Seal of compliance */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-3 items-start shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[10.5px] text-slate-500 leading-normal">
              <p className="font-bold text-slate-800 dark:text-white mb-0.5">
                {isRtl ? 'تشفير وحظر الخوادم الخارجية 100٪' : 'In-Browser Private Architecture'}
              </p>
              <p>
                {t('qr_maker.on_device_processing')}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
