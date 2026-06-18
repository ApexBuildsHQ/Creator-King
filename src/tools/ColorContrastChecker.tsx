import { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  Palette, 
  Check, 
  Copy, 
  HelpCircle, 
  ArrowLeftRight,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Compass,
  Contrast,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'contrast_checker',
  icon: 'Contrast',
  category: 'utility',
  isFullyInteractive: true,
  titleKey: 'tool_contrast_checker_title',
  descKey: 'tool_contrast_checker_desc',
};

interface ClassicContrastPreset {
  nameAr: string;
  nameEn: string;
  text: string;
  bg: string;
  type: 'accessible' | 'inaccessible';
}

const SHOWN_PRESETS: ClassicContrastPreset[] = [
  { nameEn: 'Contrast Obsidian', nameAr: 'الأسود البركاني', text: '#000000', bg: '#ffffff', type: 'accessible' },
  { nameEn: 'Nordic Snow', nameAr: 'جليد الشمال', text: '#2e3440', bg: '#eceff4', type: 'accessible' },
  { nameEn: 'Satin Teal', nameAr: 'التيال المخملي', text: '#0f766e', bg: '#f0fdfa', type: 'accessible' },
  { nameEn: 'Deep Ocean Blue', nameAr: 'أعماق المحيط', text: '#ffffff', bg: '#0369a1', type: 'accessible' },
  { nameEn: 'Muted Lavender', nameAr: 'اللافندر الضبابي', text: '#7c3aed', bg: '#e0e7ff', type: 'accessible' },
  { nameEn: 'Poor Sunshine', nameAr: 'أصفر باهت (ضعيف)', text: '#ffffff', bg: '#fef08a', type: 'inaccessible' },
  { nameEn: 'Blurry Grey', nameAr: 'رمادي عائم (ضعيف)', text: '#94a3b8', bg: '#f1f5f9', type: 'inaccessible' },
  { nameEn: 'Neon Glow error', nameAr: 'أخضر النيون (ضعيف)', text: '#4ade80', bg: '#ffffff', type: 'inaccessible' },
];

export default function ColorContrastChecker({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = useAdManager();
  
  // Default values: high-contrast dark text on clean white bg
  const [textColor, setTextColor] = useState<string>('#0f172a');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedBg, setCopiedBg] = useState<boolean>(false);

  // WCAG scoring outputs
  const [contrastRatio, setContrastRatio] = useState<number>(21);
  const [passesAANormal, setPassesAANormal] = useState<boolean>(true);
  const [passesAALarge, setPassesAALarge] = useState<boolean>(true);
  const [passesAAANormal, setPassesAAANormal] = useState<boolean>(true);
  const [passesAAALarge, setPassesAAALarge] = useState<boolean>(true);

  // Relative luminance formulas of WCAG definition guidelines
  const calculateRelativeLuminance = (hex: string): number => {
    // Sanitize hex address
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;

    const rChan = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gChan = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bChan = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rChan + 0.7152 * gChan + 0.0722 * bChan;
  };

  // Recalculates contrast score live
  useEffect(() => {
    try {
      const validHex = (h: string) => {
        const s = h.replace('#', '');
        return s.length === 3 || s.length === 6;
      };

      if (!validHex(textColor) || !validHex(bgColor)) return;

      const lum1 = calculateRelativeLuminance(textColor);
      const lum2 = calculateRelativeLuminance(bgColor);

      const brighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);

      // (L1 + 0.05) / (L2 + 0.05) ratio formula
      const ratio = (brighter + 0.05) / (darker + 0.05);
      const roundedRatio = Math.round(ratio * 100) / 100;

      setContrastRatio(roundedRatio);

      // Standard WCAG Thresholds check
      // AA Normal: 4.5
      setPassesAANormal(roundedRatio >= 4.5);
      // AA Large: 3.0
      setPassesAALarge(roundedRatio >= 3.0);
      // AAA Normal: 7.0
      setPassesAAANormal(roundedRatio >= 7.0);
      // AAA Large: 4.5
      setPassesAAALarge(roundedRatio >= 4.5);

    } catch (err) {
      console.error('Luminance ratio evaluation failure: ', err);
    }
  }, [textColor, bgColor]);

  // Swap colors instantly
  const handleSwapColors = () => {
    setTextColor(bgColor);
    setBgColor(textColor);
  };

  const handleCopyHex = (colorVal: string, isTextColorField: boolean) => {
    navigator.clipboard.writeText(colorVal);
    if (isTextColorField) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } else {
      setCopiedBg(true);
      setTimeout(() => setCopiedBg(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-6" id="wcag-color-contrast-analyzer-panel">
      
      {/* Dynamic guidance panel */}
      <div className="flex gap-3 bg-purple-50 dark:bg-purple-955/20 border border-purple-100 dark:border-purple-900/40 p-4 rounded-2xl">
        <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {t('contrast_checker.tip_title')}
          </p>
          <p>
            {t('contrast_checker.tip_desc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: interactive inputs, picker, and text fields */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-start">
          
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-5 shadow-xs">
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Sliders className="w-4 h-4 text-purple-500" />
              {isRtl ? 'تحديد وتوليف قيم الألوان' : 'Color Customization Inputs'}
            </h3>

            {/* Custom inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Text color field */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>{t('contrast_checker.text_color')}</span>
                  <span className="font-mono text-purple-500 text-[10px]">{textColor}</span>
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-11 h-11 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer bg-transparent p-0 flex shrink-0"
                  />
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      placeholder="#0f172a"
                      maxLength={7}
                      className="w-full pr-8 pl-3 py-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyHex(textColor, true)}
                      className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-purple-500 transition"
                      title="Copy HEX"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Background layout color field */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>{t('contrast_checker.bg_color')}</span>
                  <span className="font-mono text-purple-500 text-[10px]">{bgColor}</span>
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-11 h-11 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer bg-transparent p-0 flex shrink-0"
                  />
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      placeholder="#ffffff"
                      maxLength={7}
                      className="w-full pr-8 pl-3 py-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyHex(bgColor, false)}
                      className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-purple-500 transition"
                      title="Copy HEX"
                    >
                      {copiedBg ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Micro Swap Tool button */}
            <button
              onClick={handleSwapColors}
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span>{t('contrast_checker.swap_btn')}</span>
            </button>

          </div>

          {/* Rapid preset configurations (accessible vs inaccessible examples) */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/80 pb-2.5">
              <Palette className="w-4 h-4 text-purple-500" />
              {isRtl ? 'عينات سريعة واختبارات قياسية' : 'Standard Palette Benchmarks'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SHOWN_PRESETS.map((preset, index) => {
                const isActive = textColor.toLowerCase() === preset.text.toLowerCase() && bgColor.toLowerCase() === preset.bg.toLowerCase();
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setTextColor(preset.text);
                      setBgColor(preset.bg);
                    }}
                    className={`p-2 border text-left rounded-xl transition flex flex-col items-center gap-1.5 ${
                      isActive 
                        ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500/25' 
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950'
                    }`}
                  >
                    <div className="w-full h-8 rounded-lg border border-black/5 flex items-center justify-center font-bold text-[10px]" style={{ color: preset.text, backgroundColor: preset.bg }}>
                      AA
                    </div>
                    <span className="text-[10px] font-sans truncate text-slate-600 dark:text-slate-400 font-bold max-w-full">
                      {isRtl ? preset.nameAr : preset.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

        </div>

        {/* Right Side: WCAG score ratings, pass fail check indicators, live preview boxes */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Live Preview Display Box containing interactive styles customized by the user */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-500" />
              {isRtl ? 'معاينة القراءة والوضوح التفاعلية' : 'Interactive WCAG Preview Canvas'}
            </h3>

            <div 
              className="w-full min-h-[140px] rounded-2xl border border-slate-150 p-6 flex flex-col justify-center gap-2 transition-all duration-300 shadow-inner"
              style={{ backgroundColor: bgColor }}
            >
              <h4 
                className="text-lg sm:text-xl font-extrabold tracking-tight"
                style={{ color: textColor }}
              >
                {isRtl ? 'خط عريض كبير (حجم 20pt)' : 'Large Bold Heading (20pt Headline)'}
              </h4>
              <p 
                className="text-xs sm:text-sm leading-relaxed opacity-95"
                style={{ color: textColor }}
              >
                {t('contrast_checker.preview_placeholder')}
              </p>
            </div>
          </div>

          {/* WCAG Mathematical contrast score ratings & pass fail status lists */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-5 shadow-xs">
            
            {/* Header score */}
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/80 pb-3">
              <span className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">
                {t('contrast_checker.score_label')}
              </span>
              
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{contrastRatio}</span>
                <span className="text-xs text-slate-450 font-bold font-mono">: 1</span>
              </div>
            </div>

            {/* Checklists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Level AA normal text checklist */}
              <div className={`p-4.5 rounded-xl border flex flex-col gap-1.5 transition ${
                passesAANormal 
                  ? 'bg-emerald-500/5 border-emerald-500/10 dark:border-emerald-500/5' 
                  : 'bg-rose-500/5 border-rose-500/10 dark:border-rose-500/5'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-850 dark:text-white">
                    {t('contrast_checker.aa_normal')}
                  </span>
                  {passesAANormal ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-450">Threshold: min 4.5:1</span>
                  <span className={`font-bold ${passesAANormal ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {passesAANormal ? t('contrast_checker.status_pass') : t('contrast_checker.status_fail')}
                  </span>
                </div>
              </div>

              {/* Level AA large text checklist */}
              <div className={`p-4.5 rounded-xl border flex flex-col gap-1.5 transition ${
                passesAALarge 
                  ? 'bg-emerald-500/5 border-emerald-500/10 dark:border-emerald-500/5' 
                  : 'bg-rose-500/5 border-rose-500/10 dark:border-rose-500/5'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-850 dark:text-white">
                    {t('contrast_checker.aa_large')}
                  </span>
                  {passesAALarge ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-450">Threshold: min 3.0:1</span>
                  <span className={`font-bold ${passesAALarge ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {passesAALarge ? t('contrast_checker.status_pass') : t('contrast_checker.status_fail')}
                  </span>
                </div>
              </div>

              {/* Level AAA normal text checklist */}
              <div className={`p-4.5 rounded-xl border flex flex-col gap-1.5 transition ${
                passesAAANormal 
                  ? 'bg-emerald-500/5 border-emerald-500/10 dark:border-emerald-500/5' 
                  : 'bg-rose-500/5 border-rose-500/10 dark:border-rose-500/5'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-850 dark:text-white">
                    {t('contrast_checker.aaa_normal')}
                  </span>
                  {passesAAANormal ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-450">Threshold: min 7.0:1</span>
                  <span className={`font-bold ${passesAAANormal ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {passesAAANormal ? t('contrast_checker.status_pass') : t('contrast_checker.status_fail')}
                  </span>
                </div>
              </div>

              {/* Level AAA large text checklist */}
              <div className={`p-4.5 rounded-xl border flex flex-col gap-1.5 transition ${
                passesAAALarge 
                  ? 'bg-emerald-500/5 border-emerald-500/10 dark:border-emerald-500/5' 
                  : 'bg-rose-500/5 border-rose-500/10 dark:border-rose-500/5'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-850 dark:text-white">
                    {t('contrast_checker.aaa_large')}
                  </span>
                  {passesAAALarge ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-450">Threshold: min 4.5:1</span>
                  <span className={`font-bold ${passesAAALarge ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {passesAAALarge ? t('contrast_checker.status_pass') : t('contrast_checker.status_fail')}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Secure offline checker footer badge */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 items-start">
            <div className="p-1 px-1.5 bg-purple-500/10 text-purple-600 rounded-md font-bold text-[8px] font-sans">
              100% OFF
            </div>
            <div className="text-[10px] text-slate-500 leading-normal">
              <p className="font-bold text-slate-800 dark:text-white mb-0.5">
                {isRtl ? 'أمان وسرعة ومطابقة كاملة للخصوصية' : 'Fully Local WCAG Compliance Space'}
              </p>
              <p>
                {t('contrast_checker.on_device_processing')}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
