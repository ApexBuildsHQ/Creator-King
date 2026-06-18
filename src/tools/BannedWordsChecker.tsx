import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Trash2,
  Sliders,
  Type,
  ToggleLeft,
  ToggleRight,
  Eye,
  Info,
  BadgeAlert,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'banned_checker',
  icon: 'ShieldAlert',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_banned_checker_title',
  descKey: 'tool_banned_checker_desc',
};

// Locally managed dictionary of censored and banned keywords
interface BannedWord {
  phrase: string;
  replacement: string;
  policies: Array<'tiktok' | 'youtube'>;
  severity: 'medium' | 'high';
}

const BANNED_DATABASE: BannedWord[] = [
  // Arabic - High Severity & Shadowban terms
  { phrase: 'قتل', replacement: 'ق*تل', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'انتحار', replacement: 'انـ*ـحار', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'موت', replacement: 'مـ*ـوت', policies: ['tiktok'], severity: 'medium' },
  { phrase: 'مخدرات', replacement: 'مخـ*ـدرات', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'سلاح', replacement: 'سـ*ـلاح', policies: ['tiktok'], severity: 'high' },
  { phrase: 'أسلحة', replacement: 'أسـ*ـحة', policies: ['tiktok'], severity: 'high' },
  { phrase: 'حشيش', replacement: 'حـ*ـيش', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'جنس', replacement: 'جـ*ـنس', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'سكس', replacement: 'سـ*ـكس', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'تفجير', replacement: 'تـ*ـجير', policies: ['youtube'], severity: 'high' },
  { phrase: 'قنبلة', replacement: 'قنـ*ـلة', policies: ['youtube'], severity: 'high' },
  { phrase: 'ارهاب', replacement: 'ار*هاب', policies: ['youtube'], severity: 'high' },
  { phrase: 'إرهاب', replacement: 'إر*هاب', policies: ['youtube'], severity: 'high' },
  { phrase: 'كورونا', replacement: 'كو*ونا', policies: ['youtube'], severity: 'medium' },
  { phrase: 'كوفيد', replacement: 'كو*يد', policies: ['youtube'], severity: 'medium' },
  { phrase: 'ربح سريع', replacement: 'ربح سـ*ـيع', policies: ['youtube'], severity: 'medium' },
  { phrase: 'ثراء سريع', replacement: 'ثراء سـ*ـ يع', policies: ['youtube'], severity: 'medium' },
  { phrase: 'تهكير', replacement: 'تهـ*ـكير', policies: ['tiktok'], severity: 'high' },
  { phrase: 'اختراق', replacement: 'اختـ*ـراق', policies: ['tiktok'], severity: 'high' },
  { phrase: 'شدو', replacement: 'شـ*ـدو', policies: ['tiktok'], severity: 'medium' },
  { phrase: 'مؤامرة', replacement: 'مؤا*رة', policies: ['tiktok'], severity: 'medium' },
  
  // English words
  { phrase: 'kill', replacement: 'k*ll', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'suicide', replacement: 'su*cide', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'murder', replacement: 'm*rder', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'blood', replacement: 'bl*od', policies: ['tiktok'], severity: 'medium' },
  { phrase: 'drug', replacement: 'dr*g', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'drugs', replacement: 'dr*gs', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'weed', replacement: 'w*ed', policies: ['tiktok'], severity: 'medium' },
  { phrase: 'cocaine', replacement: 'coc*ine', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'covid', replacement: 'cov*d', policies: ['youtube'], severity: 'medium' },
  { phrase: 'corona', replacement: 'cor*na', policies: ['youtube'], severity: 'medium' },
  { phrase: 'bomb', replacement: 'b*mb', policies: ['youtube'], severity: 'high' },
  { phrase: 'explosion', replacement: 'expl*sion', policies: ['youtube'], severity: 'high' },
  { phrase: 'hack', replacement: 'h*ck', policies: ['tiktok'], severity: 'high' },
  { phrase: 'hacker', replacement: 'h*cker', policies: ['tiktok'], severity: 'high' },
  { phrase: 'sex', replacement: 's*x', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'porn', replacement: 'p*rn', policies: ['tiktok', 'youtube'], severity: 'high' },
  { phrase: 'terrorist', replacement: 'terr*rist', policies: ['youtube'], severity: 'high' },
  { phrase: 'terrorism', replacement: 'terr*rism', policies: ['youtube'], severity: 'high' },
  { phrase: 'easy money', replacement: 'easy m*ney', policies: ['youtube'], severity: 'medium' },
  { phrase: 'onlyfans', replacement: 'onlyf*ns', policies: ['tiktok'], severity: 'high' }
];

export default function BannedWordsChecker({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [scriptText, setScriptText] = useState<string>('');
  const [tiktokPolicy, setTiktokPolicy] = useState<boolean>(true);
  const [adsensePolicy, setAdsensePolicy] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Active database list filtered by user preferences
  const activeBannedList = useMemo(() => {
    return BANNED_DATABASE.filter((item) => {
      if (item.policies.includes('tiktok') && tiktokPolicy) return true;
      if (item.policies.includes('youtube') && adsensePolicy) return true;
      return false;
    });
  }, [tiktokPolicy, adsensePolicy]);

  // Set standard initial templates on load
  useEffect(() => {
    setScriptText(
      isRtl
        ? "مرحباً بكم يا أصدقاء! اليوم سنتحدث عن طريقة تهكير الحسابات من خلال ثغرة خطيرة جداً لتجنب سحب حسابك.\nهذا السكربت تمت كتابته كصيغة إعلانية للتحذير من أي تفجير أو خطر قتل الحسابات، لا تستخدم كورونا كحجة لتبرير الفشل، أو بيع حشيش وسيجارة أو الدخول بقضايا جنس مخلة بالآداب العامة."
        : "Hey guys! Today I will show you how to hack social media accounts easily to make easy money.\nDon't let the covid pandemic lock you down. Avoid bad habits like selling drug packages or looking up porn links to maintain clean focus."
    );
  }, [isRtl]);

  // Scan input script for matched words
  const scanResults = useMemo(() => {
    if (!scriptText.trim()) return { matches: [], risk: 'low' };

    const matches: Array<{ word: string; entry: BannedWord; index: number }> = [];
    const textLower = scriptText.toLowerCase();

    activeBannedList.forEach((entry) => {
      const phraseLower = entry.phrase.toLowerCase();
      
      // Let's use simple string index searching to find all occurrences cleanly (supporting multilingual text)
      let pos = textLower.indexOf(phraseLower);
      while (pos !== -1) {
        // Double check bounds to make sure it's not a segment of another larger word (for English only)
        const charBefore = pos > 0 ? textLower[pos - 1] : ' ';
        const charAfter = pos + phraseLower.length < textLower.length ? textLower[pos + phraseLower.length] : ' ';

        const isEnglishLetter = (char: string) => /[a-z]/i.test(char);
        const wordMatch = !(isEnglishLetter(charBefore) && isEnglishLetter(textLower[pos])) && 
                          !(isEnglishLetter(textLower[pos + phraseLower.length - 1]) && isEnglishLetter(charAfter));

        if (wordMatch) {
          // Exact text match
          const actualTextMatch = scriptText.substring(pos, pos + entry.phrase.length);
          matches.push({
            word: actualTextMatch,
            entry,
            index: pos
          });
        }
        pos = textLower.indexOf(phraseLower, pos + 1);
      }
    });

    // Sort matches by index to keep things orderly
    matches.sort((a, b) => a.index - b.index);

    // Remove overlapping duplicates (for example if 'drugs' and 'drug' both matched the same word)
    const uniqueMatches: typeof matches = [];
    matches.forEach((m) => {
      const isOverlapping = uniqueMatches.some(
        (u) => m.index >= u.index && m.index < u.index + u.entry.phrase.length
      );
      if (!isOverlapping) {
        uniqueMatches.push(m);
      }
    });

    // Evaluate risk levels
    let risk: 'low' | 'medium' | 'high' = 'low';
    if (uniqueMatches.length > 0) {
      const hasHighSeverity = uniqueMatches.some((u) => u.entry.severity === 'high');
      if (hasHighSeverity || uniqueMatches.length > 3) {
        risk = 'high';
      } else {
        risk = 'medium';
      }
    }

    return { matches: uniqueMatches, risk };
  }, [scriptText, activeBannedList]);

  // Auto replacement processor
  const obfuscatedScript = useMemo(() => {
    if (!scriptText) return '';
    let result = scriptText;

    // To prevent offset shifting issues we replace matches back-to-front
    const sortedMatches = [...scanResults.matches].sort((a, b) => b.index - a.index);
    
    sortedMatches.forEach((m) => {
      const before = result.substring(0, m.index);
      const after = result.substring(m.index + m.word.length);
      result = before + m.entry.replacement + after;
    });

    return result;
  }, [scriptText, scanResults.matches]);

  const handleClear = () => {
    setScriptText('');
  };

  const handleObfuscateAll = () => {
    triggerAd(() => {
      startTransition(() => {
        setScriptText(obfuscatedScript);
      });
    });
  };

  const copyObfuscated = async () => {
    try {
      await navigator.clipboard.writeText(obfuscatedScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // safe fallback
    }
  };

  // Helper function to render text with highlighted yellow spans for matches
  const renderHighlightedText = () => {
    if (!scriptText) return null;
    if (scanResults.matches.length === 0) {
      return <p className="whitespace-pre-wrap leading-relaxed select-text">{scriptText}</p>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort matches from start to finish
    const sortedMatches = [...scanResults.matches].sort((a, b) => a.index - b.index);

    sortedMatches.forEach((m, idx) => {
      // Part before match
      if (m.index > lastIndex) {
        segments.push(scriptText.substring(lastIndex, m.index));
      }
      // Highlighted matched part
      segments.push(
        <span 
          key={`match-${idx}`} 
          className="relative inline-block px-1 rounded-sm bg-amber-200 text-amber-950 font-bold dark:bg-amber-400 dark:text-slate-950 shadow-xs group"
          title={`${m.entry.severity === 'high' ? '🚨' : '⚠️'} Policy: ${m.entry.policies.join(', ')}`}
        >
          {scriptText.substring(m.index, m.index + m.word.length)}
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[9px] py-0.5 px-1.5 rounded shadow-md transition-all whitespace-nowrap z-30 font-mono">
            {m.entry.severity.toUpperCase()} risk
          </span>
        </span>
      );
      lastIndex = m.index + m.word.length;
    });

    if (lastIndex < scriptText.length) {
      segments.push(scriptText.substring(lastIndex));
    }

    return <div className="whitespace-pre-wrap leading-relaxed select-text">{segments}</div>;
  };

  return (
    <div className="w-full space-y-7" id="banned-checker-root">
      
      {/* Dynamic Header Badge and Intro */}
      <div className="flex gap-4 p-5 bg-rose-50 dark:bg-rose-955/15 border border-rose-100 dark:border-rose-900/30 rounded-2xl shadow-xs">
        <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-705 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('banned_checker.title')}
          </h3>
          <p className="text-xs">
            {t('banned_checker.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400">
            {isRtl 
              ? '⚡ فحص محلي فوري وآمن بنسبة 100% دون إرسال أي نصوص لخوادم خارجية لحفظ المسرودات الخصوصية.'
              : '⚡ Full offline local detection. Your sensitive spoken drafts remain protected inside browser sandbox memory.'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT & CONTROL SECTION (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Workspace Frame */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
            
            {/* Command row config */}
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-405 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-rose-450" />
                {isRtl ? 'نص السكربت المرغوب فحصه ومراجعته' : 'Video Script Input Workspace'}
              </span>

              {scriptText && (
                <button
                  onClick={handleClear}
                  className="py-1 px-3 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t('banned_checker.clear_btn')}</span>
                </button>
              )}
            </div>

            {/* Input box */}
            <textarea
              value={scriptText}
              onChange={(e) => startTransition(() => setScriptText(e.target.value))}
              placeholder={t('banned_checker.input_placeholder')}
              rows={9}
              className="w-full p-4 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950/60 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed font-sans resize-none transition focus:bg-white dark:focus:bg-slate-950"
              id="script-input-checker"
            />

            {/* Selection Toggles */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5 font-mono">
                {isRtl ? 'المنصات ومجالات الحظر المستهدفة:' : 'Target Platform Policy Filters:'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* TikTok Policy Frame */}
                <button
                  onClick={() => setTiktokPolicy(!tiktokPolicy)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition text-left ${
                    tiktokPolicy 
                      ? 'border-indigo-400 bg-indigo-50/30 text-slate-800 dark:border-indigo-800 dark:bg-indigo-950/10 dark:text-slate-200' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 dark:border-slate-850 dark:bg-slate-950/20'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">{t('banned_checker.policy_tiktok')}</p>
                    <p className="text-[10px] opacity-75">{isRtl ? 'فلاتر كلمات الظل والتفاعل' : 'Shadowban & engagement restrictions'}</p>
                  </div>
                  {tiktokPolicy ? (
                    <ToggleRight className="w-6 h-6 text-indigo-500 shrink-0" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-350 shrink-0" />
                  )}
                </button>

                {/* Adsense Policy Frame */}
                <button
                  onClick={() => setAdsensePolicy(!adsensePolicy)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition text-left ${
                    adsensePolicy 
                      ? 'border-rose-400 bg-rose-50/30 text-slate-800 dark:border-rose-800 dark:bg-rose-955/10 dark:text-slate-200' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 dark:border-slate-850 dark:bg-slate-955/10'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">{t('banned_checker.policy_adsense')}</p>
                    <p className="text-[10px] opacity-75">{isRtl ? 'فلاتر سحب الأرباح وتقييد الإعلانات' : 'Demonetization & limited ad policies'}</p>
                  </div>
                  {adsensePolicy ? (
                    <ToggleRight className="w-6 h-6 text-rose-500 shrink-0" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-350 shrink-0" />
                  )}
                </button>

              </div>
            </div>

          </div>

          {/* SENSITIVE WORDS FOUND LIST (Only if any) */}
          {scanResults.matches.length > 0 && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <BadgeAlert className="w-4 h-4 text-amber-500" />
                {t('banned_checker.found_words')}
              </h4>

              <div className="flex flex-wrap gap-2">
                {scanResults.matches.map((m, idx) => (
                  <div 
                    key={`badge-${idx}`}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition hover:scale-[1.02] ${
                      m.entry.severity === 'high'
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border-rose-100 dark:border-rose-900/30'
                        : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-100 dark:border-amber-900/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span className="font-bold">{m.word}</span>
                    <span className="text-[9px] opacity-75 bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">
                      {m.entry.severity === 'high' ? 'High Risk' : 'Mod Risk'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Panel (Original vs Censored) */}
          {scriptText.trim().length > 0 && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Sliders className="w-4 h-4 text-emerald-500" />
                {t('banned_checker.original_vs_censored')}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Original highlighted view */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">
                    ⚠️ {t('banned_checker.original_text')}
                  </span>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 text-xs rounded-xl border border-slate-100 dark:border-slate-850 max-h-[180px] overflow-y-auto leading-relaxed h-[180px]">
                    {renderHighlightedText()}
                  </div>
                </div>

                {/* Safe output view */}
                <div className="space-y-1.5 relative">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono">
                    ✅ {t('banned_checker.censored_text')}
                  </span>
                  <div className="p-3.5 bg-emerald-50/20 dark:bg-slate-950/40 text-xs rounded-xl border border-emerald-100 dark:border-slate-800/60 max-h-[180px] overflow-y-auto leading-relaxed h-[180px] select-text">
                    {obfuscatedScript ? (
                      <p className="font-sans text-slate-700 dark:text-slate-300">{obfuscatedScript}</p>
                    ) : (
                      <p className="text-slate-400 italic font-mono">{isRtl ? 'لا توجد مسودات حالية لتوليد النص الآمن.' : 'No draft to display safe view.'}</p>
                    )}
                  </div>

                  {obfuscatedScript && (
                    <button
                      onClick={copyObfuscated}
                      className="absolute bottom-2.5 right-2.5 p-2 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-lg shadow-xs border border-slate-200 dark:border-slate-805 transition flex items-center gap-1"
                      title={t('banned_checker.copy')}
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

              </div>

              {/* Mega Action Button to replace inline */}
              {scanResults.matches.length > 0 && (
                <button
                  onClick={handleObfuscateAll}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>{t('banned_checker.obfuscate_btn')}</span>
                </button>
              )}

            </div>
          )}

        </div>

        {/* METRICS & RISK ASSESSMENT (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Risk Level Dial box */}
          <div className={`p-6 rounded-3xl text-white space-y-4 shadow-lg relative overflow-hidden transition-all duration-300 ${
            scanResults.risk === 'high'
              ? 'bg-gradient-to-br from-rose-500 to-red-600'
              : scanResults.risk === 'medium'
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
          }`}>
            
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
              <ShieldAlert className="w-48 h-48" />
            </div>

            <div className="space-y-1.5 relative">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block font-mono">
                {t('banned_checker.risk_level')}
              </span>
              <p className="text-3xl font-black tracking-tight leading-none drop-shadow-xs">
                {scanResults.risk === 'high'
                  ? (isRtl ? 'مرتفع الخطورة 🚨' : 'High Risk Level 🚨')
                  : scanResults.risk === 'medium'
                    ? (isRtl ? 'متوسط الخطورة ⚠️' : 'Moderate Risk ⚠️')
                    : (isRtl ? 'آمن للنشر ✅' : 'Fully Safe ✅')
                }
              </p>
              <p className="text-xs text-white/90 leading-normal pt-1.5 font-medium">
                {scanResults.risk === 'high'
                  ? t('banned_checker.risk_high')
                  : scanResults.risk === 'medium'
                    ? t('banned_checker.risk_medium')
                    : t('banned_checker.risk_low')
                }
              </p>
            </div>

            {/* Microstats inside block */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15 text-xs text-white/90 relative font-mono">
              <div>
                <p className="font-bold opacity-75 text-[10px] uppercase tracking-wider">{t('banned_checker.banned_words_detected_count')}</p>
                <p className="text-xl font-extrabold">{scanResults.matches.length}</p>
              </div>
              <div>
                <p className="font-bold opacity-75 text-[10px] uppercase tracking-wider">{isRtl ? 'محتوى السياسات النشط' : 'Active Filters'}</p>
                <p className="text-sm font-extrabold">
                  {tiktokPolicy ? 'TikTok ' : ''}
                  {adsensePolicy ? 'AdSense' : ''}
                </p>
              </div>
            </div>

          </div>

          {/* Explanation helper info on censorship terms */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Info className="w-4 h-4 text-rose-500" />
              {isRtl ? 'كيف يتم تظليل وحساب حظر الظل؟' : 'Algorithm Detection & Censor Details'}
            </h4>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 select-text">
              <p>
                {isRtl 
                  ? 'يقوم الفاحص تلقائياً بجرد وفرز الكلمات المدخلة بمقارنتها مع قائمة الألفاظ الممنوعة والكلمات التي تقلل من وصول المحتوى وحجم التداول على TikTok و YouTube.'
                  : 'Platform upload mechanisms scan transcripts dynamically in real-time. Words indicating cyber security, violence, sensitive topics, or explicit context limits visibility or disables advertisement campaigns.'
                }
              </p>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2 border border-slate-100 dark:border-slate-855 font-mono text-[10px]">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-350 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span>{isRtl ? 'تصنيف ومؤشرات الحجب آلياً:' : 'Censorship Sample Mapping:'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500 font-bold">قتل</span>
                  <span>➜</span>
                  <span className="text-emerald-500 font-bold">ق*تل</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500 font-bold">تهكير</span>
                  <span>➜</span>
                  <span className="text-emerald-500 font-bold">تهـ*ـكير</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500 font-bold">easy money</span>
                  <span>➜</span>
                  <span className="text-emerald-500 font-bold">easy m*ney</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                {isRtl 
                  ? 'نصيحة: ينصح باستخدام زر التشفير التلقائي لتفادي أي فلترة دون التأثير على قدرة المستمع لقراءة السكربت.'
                  : 'Protip: Obfuscating sensitive elements ensures algorithms skip the vocabulary triggers while humans easily comprehend the sentence flow.'
                }
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
