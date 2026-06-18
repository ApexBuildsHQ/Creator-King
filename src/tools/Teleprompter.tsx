import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Sliders, 
  Type, 
  ShieldCheck, 
  Tv, 
  Maximize2, 
  X, 
  Eye, 
  Compass, 
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'teleprompter',
  icon: 'Tv',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_teleprompter_title',
  descKey: 'tool_teleprompter_desc',
};

type BackdropTheme = 'dark' | 'light' | 'cyber';
type TextAlignment = 'left' | 'center' | 'right';

export default function Teleprompter({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = useAdManager();

  // Settings states
  const [script, setScript] = useState<string>('');
  const [speed, setSpeed] = useState<number>(30); // 0 to 100
  const [fontSize, setFontSize] = useState<number>(42); // 16px to 100px
  const [isMirror, setIsMirror] = useState<boolean>(false);
  const [alignment, setAlignment] = useState<TextAlignment>('center');
  const [theme, setTheme] = useState<BackdropTheme>('cyber');
  const [showGuideline, setShowGuideline] = useState<boolean>(true);

  // Runtime states
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize script with default translation once
  useEffect(() => {
    setScript(t('teleprompter.default_script'));
  }, [t]);

  // Smooth requestAnimationFrame scrolling loop
  useEffect(() => {
    if (!isPrompting || !isPlaying) return;

    let animFrameId: number;
    let lastTime = performance.now();

    const scrollStep = (time: number) => {
      const elapsed = time - lastTime;
      
      // Cap delta time to prevent micro-stutter on frame drops
      const delta = Math.min(elapsed, 30);
      lastTime = time;

      if (scrollContainerRef.current) {
        // High speed coefficient mapping to give range from slow reading to super fast scanning
        const speedCoefficient = 0.005 * speed;
        scrollContainerRef.current.scrollTop += delta * speedCoefficient;
        
        // Auto pause if reached the end of script
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 2) {
          setIsPlaying(false);
        }
      }
      animFrameId = requestAnimationFrame(scrollStep);
    };

    animFrameId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPrompting, isPlaying, speed]);

  // Keyboard accessibility triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPrompting) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setSpeed(prev => Math.min(prev + 5, 100));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setSpeed(prev => Math.max(prev - 5, 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setFontSize(prev => Math.max(prev - 3, 16));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setFontSize(prev => Math.min(prev + 3, 100));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsPrompting(false);
        setIsPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrompting]);

  // Actions
  const handleStartSession = () => {
    triggerAd(() => {
      setIsPrompting(true);
      setIsPlaying(false);
    });
  };

  const handleResetScroll = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // Theme color variables selectors
  const getThemeColors = () => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-black',
          text: 'text-whiteStyle',
          hexBg: '#000000',
          hexText: '#ffffff',
          accent: 'border-slate-800'
        };
      case 'light':
        return {
          bg: 'bg-white',
          text: 'text-blackStyle',
          hexBg: '#ffffff',
          hexText: '#000000',
          accent: 'border-slate-200'
        };
      case 'cyber':
      default:
        // Studio Amber High Contrast
        return {
          bg: 'bg-[#040811]',
          text: 'text-amber-400',
          hexBg: '#040811',
          hexText: '#f59e0b',
          accent: 'border-blue-950Style'
        };
    }
  };

  const configColors = getThemeColors();

  return (
    <div className="w-full space-y-6" id="teleprompter-studio-panel">

      {/* Dynamic guidance container */}
      <div className="flex gap-3 bg-blue-50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/40 p-4 rounded-2xl">
        <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {t('teleprompter.title')}
          </p>
          <p>
            {t('teleprompter.desc')}
          </p>
          <p className="text-[10px] text-blue-500 font-bold font-mono">
            {isRtl 
              ? '💡 اختصارات لوحة المفاتيح: مسافة (تشغيل/إيقاف مؤقت) • سهم لأعلى/أسفل (السرعة) • سهم يمين/يسار (حجم الخط) • Escape (إغلاق)'
              : '💡 Hotkeys: Space (Play/Pause) • ArrowUp/Down (Speed) • ArrowLeft/Right (Font Size) • Escape (Close)'
            }
          </p>
        </div>
      </div>

      {!isPrompting ? (
        /* SETUP MODE LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls inputs dashboard */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
            
            {/* Visual configuration card */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-5 shadow-xs">
              
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5 animate-pulse">
                <Sliders className="w-4 h-4 text-blue-500" />
                {isRtl ? 'إعدادات لوحة الملقن' : 'Studio Prompter Configurations'}
              </h3>

              {/* Auto Scrolling Speed Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {t('teleprompter.speed')}
                  </label>
                  <span className="font-mono text-xs font-bold text-blue-500">{speed}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSpeed(prev => Math.max(prev - 5, 1))} 
                    className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-500 transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="flex-1 accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"
                  />
                  <button 
                    onClick={() => setSpeed(prev => Math.min(prev + 5, 100))} 
                    className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-500 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Display Text Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {t('teleprompter.font_size')}
                  </label>
                  <span className="font-mono text-xs font-bold text-blue-500">{fontSize}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setFontSize(prev => Math.max(prev - 3, 16))} 
                    className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-500 transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="range"
                    min="16"
                    max="100"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1 accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"
                  />
                  <button 
                    onClick={() => setFontSize(prev => Math.min(prev + 3, 100))} 
                    className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-500 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Text Horizontal Mirror Switch */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                  {t('teleprompter.mirror_mode')}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMirror(!isMirror)}
                    className={`flex-1 py-3 px-4 rounded-xl border text-center transition text-xs font-bold flex items-center justify-center gap-2 ${
                      isMirror 
                        ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400' 
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center p-0.5 transition ${isMirror ? 'bg-blue-500 border-none' : ''}`}>
                      {isMirror && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span>{isRtl ? 'تفعيل المرآة الأفقية' : 'Mirror Text Mode'}</span>
                  </button>
                </div>
              </div>

              {/* Backdrop Theme Mode Select */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                  {t('teleprompter.backdrop_theme')}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'cyber', label: t('teleprompter.backdrop_cyber'), color: 'bg-amber-400' },
                    { id: 'dark', label: t('teleprompter.backdrop_dark'), color: 'bg-white' },
                    { id: 'light', label: t('teleprompter.backdrop_light'), color: 'bg-black' }
                  ].map((preset) => {
                    const isSel = theme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setTheme(preset.id as BackdropTheme)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs text-left transition ${
                          isSel 
                            ? 'border-blue-500 bg-blue-500/5 font-semibold text-slate-900 dark:text-white' 
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center border border-black/10 shrink-0" style={{ backgroundColor: preset.id === 'cyber' ? '#040811' : preset.id === 'dark' ? '#000000' : '#ffffff' }}>
                          <span className={`w-2.5 h-2.5 rounded-full ${preset.color}`} />
                        </div>
                        <span className="truncate flex-1 font-sans text-[11px]">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Script Align controls */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                  {isRtl ? 'محاذاة النص والخط' : 'Script Text Alignment'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'left', icon: AlignLeft, label: t('teleprompter.align_left') },
                    { id: 'center', icon: AlignCenter, label: t('teleprompter.align_center') },
                    { id: 'right', icon: AlignRight, label: t('teleprompter.align_right') }
                  ].map((align) => {
                    const isSel = alignment === align.id;
                    const IconEl = align.icon;
                    return (
                      <button
                        key={align.id}
                        onClick={() => setAlignment(align.id as TextAlignment)}
                        className={`py-2 px-3 rounded-lg border text-center transition flex flex-col items-center gap-1 text-[10px] ${
                          isSel 
                            ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold' 
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500'
                        }`}
                        title={align.label}
                      >
                        <IconEl className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>{align.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guideline indicator switch */}
              <div className="pt-2 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                  {isRtl ? 'مؤشر خط تركيز العين' : 'Eye-Level Focus Guideline'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowGuideline(!showGuideline)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showGuideline ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      showGuideline ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>

          </div>

          {/* Script Editor area */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col flex-1 gap-4 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/80 pb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-blue-500" />
                  {isRtl ? 'محتوى نص السكربت' : 'Script Content Script'}
                </h3>
                
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/10 rounded-full text-[10px] font-bold">
                  {script.length} {isRtl ? 'حرف' : 'Characters'}
                </span>
              </div>

              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder={t('teleprompter.script_placeholder')}
                rows={11}
                className="w-full flex-1 p-4 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed resize-none transition"
              />

              {/* Start prompting dashboard launcher */}
              <button
                onClick={handleStartSession}
                disabled={!script.trim()}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-98 select-none"
              >
                <Tv className="w-4 h-4" />
                <span>{t('teleprompter.start_tele')}</span>
              </button>

            </div>

            {/* Offline compliance security notice */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-3 items-start shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-550 shrink-0 mt-0.5" />
              <div className="text-[10.5px] text-slate-500 leading-normal">
                <p className="font-bold text-slate-800 dark:text-white mb-0.5">
                  {isRtl ? 'خصوصية كاملة وحظر التسريب للشبكات' : 'Studio Sandbox Safe Workspace'}
                </p>
                <p>
                  {t('teleprompter.on_device_processing')}
                </p>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* IMMERSIVE STUDIO PROMPTING MODE OVERLAY */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden ${configColors.bg}`}
          style={{ width: '100vw', height: '100vh', maxWidth: 'none' }}
        >
          {/* TOP CONTROLS NAVBAR */}
          <div className="p-4 border-b border-white/10 dark:border-slate-800/50 bg-black/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 z-20">
            
            {/* Title / Close button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsPrompting(false);
                  setIsPlaying(false);
                }}
                className="p-2 text-white hover:bg-white/10 rounded-xl transition"
                title={t('teleprompter.close_session')}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="hidden sm:block text-xs font-bold text-white tracking-wide uppercase">
                {t('teleprompter.title')}
              </div>
            </div>

            {/* Core Play/Pause controls with extra large comfortable targets */}
            <div className="flex items-center gap-2">
              
              {/* Back to normal beginning */}
              <button
                onClick={handleResetScroll}
                className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
                title={t('teleprompter.reset_tele')}
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>

              {/* Pause/Play trigger button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`py-2 px-5 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-2 ${
                  isPlaying 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white animate-bounce'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>{t('teleprompter.pause_tele')}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t('teleprompter.play_tele')}</span>
                  </>
                )}
              </button>

            </div>

            {/* Sizing & speed quick tuning sliders inside prompting screen */}
            <div className="flex items-center gap-6">
              
              {/* Internal slider for quick changes to Speed */}
              <div className="hidden md:flex items-center gap-2.5">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{isRtl ? 'السرعة' : 'Speed'}</span>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-24 accent-blue-500 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                />
                <span className="font-mono text-[10px] text-white/80 font-bold">{speed}%</span>
              </div>

              {/* Internal slider for quick changes to Font size */}
              <div className="hidden md:flex items-center gap-2.5">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{isRtl ? 'حجم الخط' : 'Font'}</span>
                <input
                  type="range"
                  min="16"
                  max="100"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-24 accent-blue-500 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                />
                <span className="font-mono text-[10px] text-white/80 font-bold">{fontSize}px</span>
              </div>

              {/* Toggle mirror mirroring instantly */}
              <button
                onClick={() => setIsMirror(!isMirror)}
                className={`p-2.5 rounded-full transition ${isMirror ? 'text-blue-400 bg-blue-500/10' : 'text-white/60 hover:text-white'}`}
                title={t('teleprompter.mirror_mode')}
              >
                <Maximize2 className="w-4 h-4 transform rotate-45" />
              </button>

            </div>

          </div>

          {/* EYE FOCUS GUIDELINE OVERLAY MARK */}
          {showGuideline && (
            <div className="absolute inset-y-1/2 left-0 right-0 h-28 -translate-y-1/2 bg-blue-500/10 border-y-2 border-blue-500/25 pointer-events-none z-10 flex items-center justify-between px-6">
              {/* Visual guidance triangles */}
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[14px] border-l-blue-500" />
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[14px] border-r-blue-500" />
            </div>
          )}

          {/* ACTIVE READING FLOW CONTAINER */}
          <div 
            ref={scrollContainerRef}
            className={`flex-1 overflow-y-auto px-6 py-24 md:px-12 md:py-36 pb-[80vh] scroll-smooth ${configColors.bg} ${
              isMirror ? 'transform scale-x-[-1]' : ''
            }`}
          >
            <div 
              className={`max-w-4xl mx-auto ${configColors.text}`}
              style={{ 
                fontSize: `${fontSize}px`, 
                lineHeight: '1.65',
                textAlign: alignment as any,
                fontWeight: '600'
              }}
            >
              <div className="space-y-8 select-none">
                {/* Break script into paragraphs for elegant visualization spacing */}
                {script.split('\n').map((para, idx) => {
                  if (!para.trim()) return <div key={idx} className="h-6" />;
                  return (
                    <p key={idx} className="break-words font-sans">
                      {para}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SCREEN MOBILE BANNER STATUS BAR */}
          <div className="p-3 bg-black/80 text-center text-[10px] text-white/50 tracking-widest font-mono flex items-center justify-center gap-4 border-t border-white/5">
            <span>{isRtl ? 'المطور السلس للفحوصات' : 'SUPER FLUID SCROLLER FRAME'}</span>
            <span>•</span>
            <span>{alignment.toUpperCase()} VIEW</span>
            <span>•</span>
            <button 
              onClick={() => setShowGuideline(!showGuideline)}
              className="hover:text-white transition font-bold"
            >
              FOCUS LINE: {showGuideline ? 'ON' : 'OFF'}
            </button>
          </div>

        </motion.div>
      )}

    </div>
  );
}
