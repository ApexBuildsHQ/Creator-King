import { useState, useEffect, useTransition } from 'react';
import { 
  Clock, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw,
  Sliders,
  FileText,
  Copy,
  Check,
  Trash2,
  Gauge,
  HelpCircle,
  Lightbulb,
  Info,
  Type,
  Mic,
  Volume2
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'script_timer',
  icon: 'Timer',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_script_timer_title',
  descKey: 'tool_script_timer_desc',
};

// Pacing presets requested: slow (110 WPM), normal (140 WPM), fast (180 WPM)
const PACING_SPEEDS = [
  { id: 'slow', wpm: 110, labelKey: 'script_timer.pacing_slow', color: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' },
  { id: 'normal', wpm: 140, labelKey: 'script_timer.pacing_normal', color: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-955/20 dark:text-indigo-400' },
  { id: 'fast', wpm: 180, labelKey: 'script_timer.pacing_fast', color: 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400' }
];

export default function ScriptReadingTimer({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [scriptText, setScriptText] = useState<string>('');
  const [pacingMode, setPacingMode] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Teleprompter / Simulating State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulatedProgress, setSimulatedProgress] = useState<number>(0);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);

  // Initialize with attractive script
  useEffect(() => {
    setScriptText(
      isRtl
        ? "أهلاً بكم في هذا الفيديو القصير! [مشهد ١: البداية]\nاليوم سأشارك معكم ثلاث نصائح سرية ومهمة جداً لزيادة عدد المتابعين وتحسين جودة منصات التواصل الاجتماعي الخاصة بكم مجاناً.\n\nأولاً: ركّز على جودة الصوت والميكروفون فالمشاهد يسامح جودة الصورة المنخفضة ولا يسامح الصوت الرديء ابداً.\n\nثانياً: حافظ على تقديم الفائدة المركزة في أول ٥ ثوان لشد الانتباه وحظر الارتداد والهروب للمقاطع الأخرى السريعة.\n\nثالثاً: تفاعل مع التعليقات الأولى واطرح مع نهاية السكربت أسئلة تفاعلية ذكية تزيد من النقاش في صندوق التعليقات."
        : "[Scene 1: Introduction]\nWelcome back, creators! In this quick video, I am going to share with you three key tips to instantly elevate your production value and double your retention metrics organically.\n\n[Scene 2: Core Tip]\nFirst off, always prioritize clean audio. Audiences will easily tolerate standard quality footage, but bad audio is an immediate swipe-away. Invest in a proper microphone.\n\n[Scene 3: Call to Action]\nSecond, craft a killer hook in the first five seconds of your script to secure viewer interest. Now let me know down in the comments: which tip are you using first?"
    );
  }, [isRtl]);

  // Statistics
  const charCount = scriptText.length;
  const wordsArray = scriptText.trim() ? scriptText.trim().split(/\s+/) : [];
  const wordCount = wordsArray.length;

  // Selected WPM budget
  const selectedPacing = PACING_SPEEDS.find(p => p.id === pacingMode) || PACING_SPEEDS[1];
  const wpm = selectedPacing.wpm;

  // Calculate duration in seconds
  const estimatedSeconds = Math.ceil((wordCount / wpm) * 60);

  // Format second-based outputs elegantly
  const formatTimeOutput = (totalSecs: number) => {
    if (totalSecs === 0) return "00:00";
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    let result = '';
    if (hrs > 0) {
      result += `${hrs}h `;
    }
    if (mins > 0 || hrs > 0) {
      result += isRtl ? `${mins} دقيقة ` : `${mins}m `;
    }
    result += isRtl ? `${secs} ثانية` : `${secs}s`;
    return result;
  };

  const formattedHoursMinsSecs = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const padMin = mins.toString().padStart(2, '0');
    const padSec = secs.toString().padStart(2, '0');
    return `${padMin}:${padSec}`;
  };

  // Splitting sections (paragraphs) to calculate segment schedules
  const rawSections = scriptText.split(/\n\s*\n/).filter(s => s.trim().length > 0);
  const sectionsCalculations = rawSections.map((sectionText, idx) => {
    const secWords = sectionText.trim() ? sectionText.trim().split(/\s+/).length : 0;
    const secSecs = Math.ceil((secWords / wpm) * 60);
    
    // detect simple scenes markers like [Scene 1] or [مشهد ١]
    const sceneMatch = sectionText.match(/\[(.*?)\]/);
    const sceneLabel = sceneMatch ? sceneMatch[1] : null;
    const cleanContent = sectionText.replace(/\[.*?\]/g, '').trim();

    return {
      id: idx,
      originalText: sectionText,
      cleanContent,
      sceneLabel,
      words: secWords,
      estimatedSecs: secSecs
    };
  });

  // Simulator interval loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => {
          const nextVal = prev + 1;
          if (nextVal >= estimatedSeconds) {
            setIsPlaying(false);
            return estimatedSeconds;
          }
          return nextVal;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, estimatedSeconds]);

  // Handle simulated slider/scroller percentage
  const simulatedPercent = estimatedSeconds > 0 
    ? Math.min((secondsElapsed / estimatedSeconds) * 100, 100) 
    : 0;

  const handleToggleTimer = () => {
    if (estimatedSeconds === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleResetTimer = () => {
    setIsPlaying(false);
    setSecondsElapsed(0);
  };

  const handleClear = () => {
    setIsPlaying(false);
    setSecondsElapsed(0);
    setScriptText('');
  };

  // Preset professional text structures
  const loadPresetScript = (type: 'commercial' | 'docu' | 'tips') => {
    triggerAd(() => {
      let sample = '';
      if (type === 'commercial') {
        sample = isRtl 
          ? "هل تبحث عن أفضل طريقة لمضاعفة إنتاجيتك اليومية؟ [مشهد ١: حماس]\nنقدم لكم الأداة الذكية لجدولة المحادثات والمنشورات فورياً وبكبسة زر واحدة دون أي خبرة مسبقة!\n\n[مشهد ٢: العرض]\nاحصل الآن على نسختك التجريبية المجانية بالكامل من الرابط المثبت في البايو بالأسفل وضاعف كفاءتك بنسبة ٢٠٠٪. العرض محدود للغاية!"
          : "[Scene 1: Enthusiastic Hook]\nAre you still struggling with legacy content optimization suites? That ends today.\n\n[Scene 2: Core Solution]\nIntroducing our fully offline, 100% private text utility hub. Convert fonts, analyze metrics, and time your scripts locally with total data preservation. Click the secure link below to unlock premium access today!";
      } else if (type === 'docu') {
        sample = isRtl
          ? "[مشهد ١: تاريخي]\nتحت رمال الصحراء القاحلة، كانت هناك حضارات عظيمة صاغت التاريخ الإنساني بذكاء هندسي مذهل ما زال يحير الأذهان ويجذب الزوار من كافة أنحاء العالم.\n\n[مشهد ٢: التفصيل]\nلم تكن تلك المباني مجرد أحجار متراصة، بل كانت مراكزاً ومجمعات فلكية وعلمية بالغة التعقيد تشهد على عظمة العقل البشري وقدرته الفائقة على التكيف مع التحديات البيئية والمناخية."
          : "[Scene 1: Narrative Intro]\nBeneath the layers of ancient histories lie forgotten mechanical marvels that continue to stun modern physics.\n\n[Scene 2: Deep Dive]\nThese archaeological structures were not merely ornamental ruins. Instead, modern scans reveal highly sophisticated seismic dampers and celestial alignments designed to endure extreme geographical shifts over thousands of centuries.";
      } else {
        sample = isRtl
          ? "[مشهد ١: الحث والنصائح]\nهذه ثلاث عادات صباحية ستغير روتينك اليومي وصحتك النفسية بالكامل:\n١. تجنب تصفح الهاتف والمنصات في أول ٣٠ دقيقة بعد الاستيقاظ.\n٢. اشرب كوباً دافئاً من الماء مع رذاذ الليمون الطازج.\n٣. خطط لثلاث مهام محورية أساسية ترغب في إنجازها اليوم بقوة وتصميم."
          : "[Scene 1: Productivity Hook]\nHere are three morning rituals to guarantee premium focus and daily high-output energy:\n\n1. Stop greeting your smartphone notifications within your first 30 minutes of waking up.\n\n2. Drink 16 ounces of pure ambient water as an immediate metabolic wake-up.\n\n3. Outline exactly three hard tasks to claim complete victory over your target goals today.";
      }
      setScriptText(sample);
      setIsPlaying(false);
      setSecondsElapsed(0);
    });
  };

  const copyDetailedReport = async () => {
    const report = `
=== SCRIPT READING DURATION SUMMARY ===
- Total Words: ${wordCount}
- Total Characters: ${charCount}
- Pacing Applied: ${wpm} WPM (${pacingMode})
- Estimated Runtime: ${formatTimeOutput(estimatedSeconds)} (${estimatedSeconds} seconds)
- Scene Dividers Count: ${sectionsCalculations.filter(s => s.sceneLabel).length}
========================================
`;
    try {
      await navigator.clipboard.writeText(report.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed copying script timer analytical details', e);
    }
  };

  return (
    <div className="w-full space-y-7" id="script-timer-root">
      
      {/* Header Info Banner */}
      <div className="flex gap-4 p-5 bg-indigo-50 dark:bg-indigo-955/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl shadow-sm">
        <Clock className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-700 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('script_timer.title')}
          </h3>
          <p className="text-xs">
            {t('script_timer.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
            {isRtl 
              ? '⚡ متوافق تماماً مع التابلت واللمس محلياً، احسب الأوقات والسرعة بدقة فائقة وبشكل فوري.'
              : '⚡ Perfect for video creators, presenters, and public speakers to plan content delivery with offline speed filters.'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SCRIPT EDITOR & PRESETS (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs relative">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-slate-400" />
                {isRtl ? 'محرر السكربت واللقطات' : 'Script Content Editor'}
              </span>

              <div className="flex gap-2">
                {scriptText && (
                  <>
                    <button
                      onClick={copyDetailedReport}
                      className="py-1 px-3 rounded-lg text-[11px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-indigo-650 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 transition flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? t('script_timer.copied') : t('script_timer.copy')}</span>
                    </button>

                    <button
                      onClick={handleClear}
                      className="py-1 px-3 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-955/15 hover:bg-rose-100 border border-rose-100 dark:border-rose-900/30 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('script_timer.clear_btn')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Main Textarea */}
            <textarea
              value={scriptText}
              onChange={(e) => startTransition(() => {
                setScriptText(e.target.value);
                setIsPlaying(false);
                setSecondsElapsed(0);
              })}
              placeholder={t('script_timer.input_placeholder')}
              rows={10}
              className="w-full p-4 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950/60 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans resize-none transition focus:bg-white dark:focus:bg-slate-950"
              id="script-text-input"
            />

            {/* Quick Presets injector buttons */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isRtl ? 'تحميل قوالب سكربتات جاهزة للتدريب:' : 'Load Professional Sample Presets:'}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadPresetScript('commercial')}
                  className="py-1 px-3 rounded-lg text-[10px] font-semibold bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/10 hover:bg-indigo-500/15 transition"
                >
                  📢 {isRtl ? 'سيناريو إعلاني ترويجي' : 'Promotional Ad Script'}
                </button>
                <button
                  onClick={() => loadPresetScript('docu')}
                  className="py-1 px-3 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/15 transition"
                >
                  🌿 {isRtl ? 'وثائقي / تاريخي متأني' : 'Documentary Narrative'}
                </button>
                <button
                  onClick={() => loadPresetScript('tips')}
                  className="py-1 px-3 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-650 dark:text-amber-400 border border-amber-500/10 hover:bg-amber-500/15 transition"
                >
                  ⚡ {isRtl ? 'مقطع نصائح سريع (تيك توك)' : 'Quick Value Tips (Reels)'}
                </button>
              </div>
            </div>

          </div>

          {/* Section Breakdown lists details */}
          {sectionsCalculations.length > 0 && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Sliders className="w-4 h-4 text-emerald-500" />
                {t('script_timer.sections_header')}
              </h4>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {sectionsCalculations.map((sec, idx) => {
                  // Determine individual timing estimation
                  return (
                    <div 
                      key={sec.id} 
                      className={`p-3 rounded-xl border transition ${
                        isPlaying && secondsElapsed >= sectionsCalculations.slice(0, idx).reduce((acc, curr) => acc + curr.estimatedSecs, 0) &&
                        secondsElapsed < sectionsCalculations.slice(0, idx + 1).reduce((acc, curr) => acc + curr.estimatedSecs, 0)
                          ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                          : 'border-slate-100 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1.5 border-b border-slate-50/35">
                        <span className="bg-indigo-500/10 text-indigo-500 rounded px-1.5 py-0.5 font-mono">
                          {isRtl ? `الفقرة ${idx + 1}` : `Part ${idx + 1}`}
                        </span>
                        {sec.sceneLabel && (
                          <span className="text-amber-600 bg-amber-100/40 dark:bg-amber-950/30 px-2 py-0.5 rounded">
                            🎬 {sec.sceneLabel}
                          </span>
                        )}
                        <span className="font-mono text-slate-650 dark:text-slate-405">
                          {sec.words} {sec.words === 1 ? 'word' : 'words'} ~ <strong className="text-indigo-500">{sec.estimatedSecs}s</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 leading-relaxed font-sans line-clamp-2">
                        {sec.cleanContent}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* TIME ANALYSIS & SIMULATOR (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Giant Timer Box */}
          <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl space-y-5 shadow-lg relative overflow-hidden">
            
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
              <Clock className="w-48 h-48" />
            </div>

            <div className="space-y-1.5 relative">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-150-custom opacity-85 block">
                {t('script_timer.result_time')}
              </span>
              <p className="text-5xl font-mono font-extrabold tracking-tight drop-shadow-xs">
                {formattedHoursMinsSecs(estimatedSeconds)}
              </p>
              <span className="inline-block text-xs bg-white/15 px-2.5 py-0.5 rounded-full font-bold">
                {formatTimeOutput(estimatedSeconds)}
              </span>
            </div>

            {/* Secondary metrics row */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs text-white/80 relative">
              <div>
                <p className="font-bold opacity-75 text-[10px] uppercase tracking-wider">{t('script_timer.words_label')}</p>
                <p className="font-mono text-xl font-black text-white">{wordCount}</p>
              </div>
              <div>
                <p className="font-bold opacity-75 text-[10px] uppercase tracking-wider">{t('script_timer.chars_label')}</p>
                <p className="font-mono text-xl font-black text-white">{charCount}</p>
              </div>
            </div>

          </div>

          {/* Pacing Speed Toggles (Slow, Normal, Fast) */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
            
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Gauge className="w-4 h-4 text-indigo-500" />
              {t('script_timer.pacing_mode')}
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {PACING_SPEEDS.map((p) => {
                const isActive = pacingMode === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPacingMode(p.id as any);
                      setIsPlaying(false);
                      setSecondsElapsed(0);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                      isActive 
                        ? p.color + ' border-current' 
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">{t(p.labelKey)}</p>
                      <p className="text-[10px] opacity-75">{wpm} {t('script_timer.pacing_wpm')}</p>
                    </div>
                    {isActive && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Simulator teleprompter helper */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
            
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Volume2 className="w-4 h-4 text-indigo-505" />
              {isRtl ? 'محاكاة وبث تدريبي مباشر' : 'Live Reading Presentation Simulator'}
            </h4>

            {/* Current speaker pacing state */}
            <div className="space-y-3.5">
              
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-450">
                  {isPlaying ? (isRtl ? '🔴 ميكروفون التدريب مفتوح...' : '🔴 Simulating verbal narration...') : (isRtl ? '⏸️ متوقف مؤقتاً' : '⏸️ Standby')}
                </span>
                <span className="font-mono font-bold text-indigo-500">
                  {formattedHoursMinsSecs(secondsElapsed)} / {formattedHoursMinsSecs(estimatedSeconds)}
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-805 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300" 
                  style={{ width: `${simulatedPercent}%` }}
                />
              </div>

              {/* Simulator buttons */}
              <div className="flex gap-2 justify-center">
                
                <button
                  onClick={handleToggleTimer}
                  disabled={estimatedSeconds === 0}
                  className={`py-2 px-5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 select-none ${
                    estimatedSeconds === 0 
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white text-white" />
                      <span>{isRtl ? 'إيقاف مؤقت' : 'Pause Sim'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span>{isRtl ? 'بدأ التدريب الفعلي' : 'Start Read'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleResetTimer}
                  className="p-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

              </div>

            </div>

          </div>

          {/* Secure privacy verification footer badge */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 items-start shadow-xs">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-[10.5px] text-slate-500 leading-normal">
              <p className="font-bold text-slate-800 dark:text-white mb-0.5">
                {isRtl ? 'حسابات وتوقعات حية دقيقة' : 'Narrative Cadence Calculation'}
              </p>
              <p>
                {isRtl 
                  ? 'تم حساب الخوارزمية بدقة وفقاً لمتوسط الكلمات العربية والإنجليزية المقروءة في الدقيقة من قبل المحترفين والمذيعين.' 
                  : 'Algorithms compute the averages based on standardized verbal speeds commonly utilized in voiceovers and broadcasting fields.'
                }
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
