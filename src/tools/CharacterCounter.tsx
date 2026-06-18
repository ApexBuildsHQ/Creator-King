import { useState, useTransition } from 'react';
import { 
  BarChart3, 
  Copy, 
  Check, 
  Trash2, 
  BookOpen, 
  Mic, 
  Type, 
  Info, 
  Hash, 
  AlertTriangle,
  Flame,
  PieChart,
  CheckCircle,
  Clock,
  Layers,
  Facebook,
  Twitter,
  Linkedin,
  Youtube
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'char_counter',
  icon: 'Hash',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_char_counter_title',
  descKey: 'tool_char_counter_desc',
};

// Platforms metadata
interface PlatformInfo {
  key: string;
  labelKey: string;
  limit: number;
  icon: any;
  color: string;
}

export default function CharacterCounter({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    // Optional Ad Context fallback
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Metrics calculators
  const charCountWithSpaces = text.length;
  const charCountWithoutSpaces = text.replace(/\s/g, '').length;
  
  // Calculate word count properly without empty fragments
  const wordsArray = text.trim() ? text.trim().split(/\s+/) : [];
  const wordCount = wordsArray.length;

  const linesCount = text ? text.split(/\r\n|\r|\n/).length : 0;
  
  // Sentences count based on traditional separators
  const sentencesCount = text.trim() 
    ? (text.match(/[.!?⁇؟।!…]+/g) || []).length || 1 
    : 0;

  // Paragraphs
  const paragraphsCount = text.trim()
    ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
    : 0;

  // Times calculating (Avg adult reading speed ~200 WPM, speaking is ~130 WPM)
  const readingTimeSec = Math.ceil((wordCount / 200) * 60);
  const speakingTimeSec = Math.ceil((wordCount / 130) * 60);

  const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 6) return isRtl ? 'ثانية واحدة' : '1 sec';
    if (totalSeconds < 60) {
      return isRtl ? `${totalSeconds} ثانية` : `${totalSeconds} sec`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (isRtl) {
      return `${minutes} دقيقة و ${seconds} ثانية`;
    }
    return `${minutes} min ${seconds} sec`;
  };

  // Keyword density
  const getKeywordDensity = () => {
    if (!text.trim()) return [];
    
    // clean words, lowercase and filter small prepositions/determinants
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 
      'for', 'with', 'in', 'on', 'at', 'by', 'of', 'from', 'this', 'that', 'it', 
      'this', 'these', 'those', 'i', 'you', 'he', 'she', 'they', 'we', 'me', 
      'في', 'من', 'على', 'إلى', 'عن', 'مع', 'أو', 'و', 'ثم', 'هذا', 'هذه', 'أن', 'إن'
    ]);

    const dict: Record<string, number> = {};
    const sanitised = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, " ")
      .replace(/\s+/g, " ");

    const words = sanitised.trim().split(/\s+/);
    let validWordsCount = 0;

    words.forEach(w => {
      if (w.length > 1 && !stopWords.has(w)) {
        dict[w] = (dict[w] || 0) + 1;
        validWordsCount++;
      }
    });

    if (validWordsCount === 0) return [];

    return Object.entries(dict)
      .map(([word, count]) => ({
        word,
        count,
        pct: ((count / words.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const densities = getKeywordDensity();

  // Social platforms configurations
  const platforms: PlatformInfo[] = [
    { key: 'twitter', labelKey: 'char_counter.limit_twitter', limit: 280, icon: Twitter, color: '#1DA1F2' },
    { key: 'sms', labelKey: 'char_counter.limit_sms', limit: 160, icon: Hash, color: '#00B4D8' },
    { key: 'linkedin', labelKey: 'char_counter.limit_linked_in', limit: 3000, icon: Linkedin, color: '#0A66C2' },
    { key: 'meta', labelKey: 'char_counter.limit_meta', limit: 2200, icon: Facebook, color: '#1877F2' },
    { key: 'tiktok', labelKey: 'char_counter.limit_tiktok', limit: 80, icon: Flame, color: '#FE2C55' },
    { key: 'youtube', labelKey: 'char_counter.limit_youtube', limit: 5000, icon: Youtube, color: '#FF0000' }
  ];

  const handleClear = () => {
    setText('');
  };

  const handleCopyReport = async () => {
    const report = `
=== TEXT ANALYTICS REPORT ===
- Total Characters: ${charCountWithSpaces}
- Characters (No spaces): ${charCountWithoutSpaces}
- Words: ${wordCount}
- Paragraphs: ${paragraphsCount}
- Sentences: ${sentencesCount}
- Lines: ${linesCount}
- Reading Time: ${formatTime(readingTimeSec)}
- Speaking Time: ${formatTime(speakingTimeSec)}
=============================
`;
    try {
      await navigator.clipboard.writeText(report.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error('Error copying analytical text report', e);
    }
  };

  // Helper progress state
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-rose-500';
    if (percent >= 90) return 'bg-amber-500 animate-pulse';
    if (percent >= 70) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };

  const getProgressBg = (percent: number) => {
    if (percent >= 100) return 'bg-rose-100 dark:bg-rose-950/20';
    if (percent >= 90) return 'bg-amber-100 dark:bg-amber-950/20';
    return 'bg-slate-100 dark:bg-slate-800';
  };

  return (
    <div className="w-full space-y-7" id="char-counter-root">
      
      {/* Header Info Banner */}
      <div className="flex gap-4 p-5 bg-indigo-50 dark:bg-indigo-955/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl shadow-sm">
        <BarChart3 className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-700 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('char_counter.title')}
          </h3>
          <p className="text-xs">
            {t('char_counter.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
            {isRtl 
              ? '⚡ تتم معالجة كافة النصوص داخلياً 100% دون مغادرة متصفحك أو تجميع أي من مذكراتك للمقاصد الإعلانية.'
              : '⚡ Private client-side execution. Your drafts are never processed or sent to external analytical clouds.'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT COLUMN (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs relative">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Type className="w-4 h-4 text-slate-400" />
                {isRtl ? 'المسودة والمدونة الحالية' : 'Live Text Workspace'}
              </span>

              <div className="flex gap-2">
                {text && (
                  <>
                    <button
                      onClick={handleCopyReport}
                      className="py-1 px-3 rounded-lg text-[11px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-indigo-650 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 transition flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? t('char_counter.copied_report') : t('char_counter.copy_report')}</span>
                    </button>

                    <button
                      onClick={handleClear}
                      className="py-1 px-3 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-955/15 hover:bg-rose-150-custom border border-rose-100 dark:border-rose-900/30 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('char_counter.clear_btn')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => startTransition(() => setText(e.target.value))}
              placeholder={t('char_counter.input_placeholder')}
              rows={11}
              className="w-full p-4.5 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans resize-none transition focus:bg-white dark:focus:bg-slate-950"
              id="draft-text-counter"
            />

            {/* Quick playground injection sentences */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isRtl ? 'حقن نصوص تجريبية فورية:' : 'Inject Sample Scenarios:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { text: "Check out this beautiful interactive character and social word limit budget counter platform! 🚀 Created purely on your devices secure container memory context.", label: isRtl ? "تغريدة نموذجية" : "X Post Draft" },
                  { text: isRtl ? "السلام عليكم ورحمة الله وبركاته، محتوى عربي متميز وخفيف لحساب الحروف والكلمات الإحصائية." : "Arabic text test script.", label: "عربي / Arabic" },
                  { text: "Professional bio: 🎬 Creative Content Producer | Specialized in serverless application delivery pipelines. Follow my journey and updates. ☕ Contact info: info@creative.io", label: "Professional Bio" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setText(item.text)}
                    className="py-1 px-2.5 rounded-lg text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-150 dark:border-slate-800 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Reading & Spoken metrics details card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Clock className="w-4 h-4 text-indigo-500" />
              {isRtl ? 'تقديرات زمن القراءة والإلقاء' : 'Estimated Vocalized Metrics'}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-slate-400">{t('char_counter.reading_time')}</p>
                  <p className="font-mono text-sm font-bold text-slate-850 dark:text-slate-100">{formatTime(readingTimeSec)}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center gap-3">
                <Mic className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-slate-400">{t('char_counter.speaking_time')}</p>
                  <p className="font-mono text-sm font-bold text-slate-850 dark:text-slate-100">{formatTime(speakingTimeSec)}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Word counts density table */}
          {densities.length > 0 && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-3 shadow-xs">
              
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <PieChart className="w-4 h-4 text-emerald-500" />
                {t('char_counter.density_title')}
              </h4>

              <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left" dir={isRtl ? 'rtl' : 'ltr'}>
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold">
                    <tr>
                      <th className="p-3 text-right">{t('char_counter.density_word')}</th>
                      <th className="p-3 text-center">{t('char_counter.density_count')}</th>
                      <th className="p-3 text-center">{t('char_counter.density_pct')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {densities.map((row) => (
                      <tr key={row.word} className="hover:bg-slate-50/55 dark:hover:bg-slate-900/30">
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 text-right">{row.word}</td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-505">{row.count}</td>
                        <td className="p-3 text-center font-mono">{row.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* LIVE METRICS AND LIMITS SIDEBAR (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main counts dashboard */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <BarChart3 className="w-4 h-4 text-indigo-505" />
              {isRtl ? 'المؤشرات الرقمية والعمق النصي' : 'Real-time Metrics Dashboard'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('char_counter.stat_chars')}</span>
                <p className="text-2xl font-mono font-extrabold text-slate-950 dark:text-white">{charCountWithSpaces}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('char_counter.stat_chars_no_spaces')}</span>
                <p className="text-2xl font-mono font-extrabold text-slate-700 dark:text-slate-350">{charCountWithoutSpaces}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('char_counter.stat_words')}</span>
                <p className="text-2xl font-mono font-extrabold text-slate-950 dark:text-white">{wordCount}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('char_counter.stat_lines')}</span>
                <p className="text-2xl font-mono font-extrabold text-slate-700 dark:text-slate-350">{linesCount}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('char_counter.stat_paragraphs')}</span>
                <p className="text-xl font-mono font-extrabold text-slate-800 dark:text-white">{paragraphsCount}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('char_counter.stat_sentences')}</span>
                <p className="text-xl font-mono font-extrabold text-slate-800 dark:text-white">{sentencesCount}</p>
              </div>

            </div>
          </div>

          {/* Character Budgets Tracking */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
            
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Layers className="w-4 h-4 text-indigo-500" />
                {t('char_counter.platform_limits')}
              </h4>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {platforms.length} Platforms
              </span>
            </div>

            <div className="space-y-4" id="platforms-progress-list">
              {platforms.map((platform) => {
                const P_Icon = platform.icon;
                const percent = Math.min((charCountWithSpaces / platform.limit) * 100, 100);
                const isOver = charCountWithSpaces > platform.limit;
                const remaining = platform.limit - charCountWithSpaces;

                return (
                  <div key={platform.key} className="space-y-1.5 p-3.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850 relative">
                    
                    {/* Progress details */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-white"
                          style={{ backgroundColor: platform.color }}
                        >
                          <P_Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-slate-800 dark:text-white text-[11px] font-bold">
                          {t(platform.labelKey)}
                        </span>
                      </div>

                      <div className="text-right font-mono text-[10.5px]">
                        {isOver ? (
                          <span className="text-rose-600 font-extrabold flex items-center gap-0.5 justify-end">
                            <AlertTriangle className="w-3 h-3" />
                            {isRtl ? `تجاوز الحد بـ ${Math.abs(remaining)}` : `${Math.abs(remaining)} Chars Over`}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {isRtl 
                              ? `${charCountWithSpaces} / ${platform.limit} (باقي ${remaining})`
                              : `${charCountWithSpaces} / ${platform.limit} (${remaining} left)`
                            }
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Progress Bar Container */}
                    <div className={`w-full h-2.5 rounded-full overflow-hidden ${getProgressBg(percent)}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getProgressColor(percent)}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Danger helper */}
                    {percent >= 90 && (
                      <span className="text-[9.5px] font-mono text-amber-600 dark:text-amber-400 font-extrabold block text-right mt-1">
                        {isOver 
                          ? (isRtl ? '⛔ تجاوزت ميزانيتك هذا السقف!' : '⛔ Exceeded budgeted layout limit!') 
                          : (isRtl ? '⚠️ ميزانيتك تقترب من النفاد السريع!' : '⚠️ budget closely filled!')
                        }
                      </span>
                    )}

                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
