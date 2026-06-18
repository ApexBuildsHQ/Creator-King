import { useState, useEffect } from 'react';
import { 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Check, 
  Copy, 
  HelpCircle, 
  Trash2, 
  Heart, 
  Zap, 
  FileText, 
  Activity, 
  ShieldCheck, 
  Youtube, 
  Video, 
  Globe, 
  AlertCircle 
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'headline_analyzer',
  icon: 'Activity',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_headline_analyzer_title',
  descKey: 'tool_headline_analyzer_desc',
};

type PlatformType = 'youtube' | 'tiktok' | 'web';

// English emotional/power word databases
const ENGLISH_POWER_WORDS = [
  'instant', 'instantly', 'immediately', 'secret', 'secrets', 'reveal', 'reveals', 'revealed', 
  'checklist', 'hack', 'hacks', 'cheat', 'ultimate', 'guide', 'master', 'guaranteed', 'premium', 
  'absolute', 'genius', 'dangerous', 'warning', 'magic', 'skyrocket', 'boost', 'multiply', 'hidden', 
  'shocking', 'private', 'explosive', 'viral', 'breakthrough', 'unlocked', 'proven', 'forbidden'
];

const ENGLISH_EMOTIONAL_WORDS = [
  'love', 'hate', 'fail', 'failure', 'incredible', 'regret', 'mistake', 'mistakes', 'heartbreaking', 
  'awesome', 'devastating', 'painful', 'joy', 'tragic', 'terrifying', 'gorgeous', 'worst', 'best', 
  'amazing', 'mind-blowing', 'silent', 'lonely', 'furious', 'obsessed', 'surprising', 'ridiculous', 
  'insane', 'scared', 'shocked', 'thrilled'
];

// Arabic emotional/power word databases
const ARABIC_POWER_WORDS = [
  'سري', 'أسرار', 'كشف', 'الآن', 'فوراً', 'مجانا', 'مجاناً', 'مضمون', 'الدليل', 'النهائي', 'خارق', 
  'سحري', 'تحذير', 'خطير', 'رهيب', 'ضاعف', 'فجر', 'نمو', 'مذهل', 'مخفي', 'كنز', 'فرصة', 'حقيقة', 
  'مفاجأة', 'احذر', 'عاجل', 'حصري', 'حصرية', 'الحل', 'الأصح', 'طريقة'
];

const ARABIC_EMOTIONAL_WORDS = [
  'حب', 'عشق', 'كراهية', 'فشل', 'ندم', 'صدمة', 'صادم', 'خطأ', 'كارثة', 'رائع', 'مدمر', 'مؤلم', 
  'فرح', 'مأساوي', 'مخيف', 'الأفضل', 'الأسوأ', 'مذهل', 'وحيد', 'غريب', 'جنون', 'مجنون', 'خسارة', 
  'حزن', 'ألم', 'سعادة', 'بكاء', 'ضحك', 'يبكي', 'صادم'
];

export default function HeadlineAnalyzer({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = useAdManager();

  // Component configuration states
  const [headline, setHeadline] = useState<string>('');
  const [platform, setPlatform] = useState<PlatformType>('youtube');
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize placeholder text dynamically based on language
  useEffect(() => {
    const defaultHeadline = isRtl
      ? "كشفت أخيراً: السر السحري الذي ضاعف أرباحي وجلب لي آلاف المشاهدات في يوم واحد!"
      : "Revealed: The Secret Magic Hack that Skyrocketed My Revenue and Traffic Instantly!";
    setHeadline(defaultHeadline);
  }, [isRtl]);

  // Clean and prepare search terms
  const tokenize = (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?؟]/g, '')
      .split(/\s+/)
      .filter(item => item.length > 0);
  };

  // Find detected words
  const analyzeWords = () => {
    const tokens = tokenize(headline);
    const lowercaseTokens = tokens.map(t => t.toLowerCase());

    const detectedPower: string[] = [];
    const detectedEmotional: string[] = [];

    lowercaseTokens.forEach(token => {
      // English lookup
      if (ENGLISH_POWER_WORDS.includes(token)) {
        detectedPower.push(token);
      }
      if (ENGLISH_EMOTIONAL_WORDS.includes(token)) {
        detectedEmotional.push(token);
      }

      // Arabic lookup (exact or subset)
      // Check if some Arabic dictionary terms are matched
      ARABIC_POWER_WORDS.forEach(pWord => {
        if (token === pWord || token.includes(pWord)) {
          if (!detectedPower.includes(pWord)) {
            detectedPower.push(pWord);
          }
        }
      });

      ARABIC_EMOTIONAL_WORDS.forEach(eWord => {
        if (token === eWord || token.includes(eWord)) {
          if (!detectedEmotional.includes(eWord)) {
            detectedEmotional.push(eWord);
          }
        }
      });
    });

    return {
      power: Array.from(new Set(detectedPower)),
      emotional: Array.from(new Set(detectedEmotional)),
      totalWordsCount: tokens.length
    };
  };

  const wordMetrics = analyzeWords();

  // Metrics thresholds based on platform targets
  const getLengthAnalysis = () => {
    const charCount = headline.length;
    let minOptimal = 50;
    let maxOptimal = 70;
    let tooLong = 85;

    if (platform === 'tiktok') {
      minOptimal = 15;
      maxOptimal = 45;
      tooLong = 60;
    } else if (platform === 'web') {
      minOptimal = 55;
      maxOptimal = 80;
      tooLong = 95;
    }

    let status: 'short' | 'optimal' | 'long' = 'optimal';
    let label = isRtl ? 'مثالي ومناسب جداً' : 'Optimal Length';

    if (charCount < minOptimal) {
      status = 'short';
      label = isRtl ? 'قصير للغاية' : 'Too Short';
    } else if (charCount > maxOptimal) {
      status = 'long';
      label = charCount > tooLong 
        ? (isRtl ? 'طويل جداً (سيتم اقتطاعه)' : 'Severely Truncated') 
        : (isRtl ? 'مستفيض قليلاً' : 'Slightly Extended');
    }

    return {
      charCount,
      minOptimal,
      maxOptimal,
      status,
      label,
      percentage: Math.min(100, Math.max(10, (charCount / tooLong) * 100))
    };
  };

  const lenMetrics = getLengthAnalysis();

  // Overall Score Calculation Out of 100
  const getOverallHeadlineScore = (): number => {
    if (!headline.trim()) return 0;

    let baseScore = 40;

    // 1. Length scoring component (up to 30 points)
    const charCount = headline.length;
    if (platform === 'youtube') {
      if (charCount >= 50 && charCount <= 70) baseScore += 30;
      else if (charCount >= 40 && charCount < 50) baseScore += 20;
      else if (charCount > 70 && charCount <= 80) baseScore += 18;
      else baseScore += 10;
    } else if (platform === 'tiktok') {
      if (charCount >= 15 && charCount <= 45) baseScore += 30;
      else if (charCount >= 10 && charCount < 15) baseScore += 22;
      else if (charCount > 45 && charCount <= 55) baseScore += 18;
      else baseScore += 8;
    } else { // Web Blog
      if (charCount >= 55 && charCount <= 80) baseScore += 30;
      else if (charCount >= 45 && charCount < 55) baseScore += 22;
      else if (charCount > 80 && charCount <= 90) baseScore += 16;
      else baseScore += 8;
    }

    // 2. Power and emotional words count scoring component (up to 30 points)
    const powCount = wordMetrics.power.length;
    const emoCount = wordMetrics.emotional.length;

    baseScore += Math.min(15, powCount * 8);
    baseScore += Math.min(15, emoCount * 8);

    // 3. Numbers presence index (usually helps Conversion CTR by up to 10 points)
    const hasNumber = /\d+/.test(headline);
    if (hasNumber) baseScore += 10;

    // Ensure we do not breach limit of 100
    return Math.min(100, baseScore);
  };

  const overallScore = getOverallHeadlineScore();

  // Status Range determination
  const getScoreRangeStatus = (score: number) => {
    if (score >= 80) return { color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-955/20 border-emerald-200', text: t('headline_analyzer.strength_excellent') };
    if (score >= 60) return { color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-955/20 border-indigo-200', text: t('headline_analyzer.strength_good') };
    if (score >= 40) return { color: 'text-amber-500 bg-amber-50 dark:bg-amber-955/20 border-amber-200', text: t('headline_analyzer.strength_fair') };
    return { color: 'text-rose-500 bg-rose-50 dark:bg-rose-955/20 border-rose-200', text: t('headline_analyzer.strength_poor') };
  };

  const scoreStatus = getScoreRangeStatus(overallScore);

  // Generate adaptive tip arrays
  const getOptimizationTips = (): string[] => {
    const list: string[] = [];
    const charCount = headline.length;

    // Platform specific advice
    if (platform === 'youtube') {
      if (charCount < 40) {
        list.push(
          isRtl 
            ? 'العنوان قصير جداً لنتائج البحث! أضف تفاصيل حيوية في كلمات إضافية لتعطي انطباعاً واضحاً للجهود المبذولة.' 
            : 'Title is too short for search algorithms. Expand on what the audience will learn by adding explicit benefits.'
        );
      }
      if (charCount > 70) {
        list.push(
          isRtl 
            ? 'احذر! سيتخطى العنوان الطول الأقصى المسموح وسيتم قطعه بنقاط (...) لمستخدمي الهواتف الذكية.' 
            : 'Caution: The tail end of your title will be truncated with ellipsis (...) on YouTube mobile screens.'
        );
      }
    } else if (platform === 'tiktok') {
      if (charCount > 45) {
        list.push(
          isRtl 
            ? 'تغريدات ومقاطع تيك توك تتطلب خطافات سريعة جداً. حاول خفض الطول ليكون موجزاً كالبرق!' 
            : 'TikTok relies heavily on micro headlines. Condense your text into a punchier visual statement.'
        );
      }
    } else { // Web
      if (charCount < 50) {
        list.push(
          isRtl 
            ? 'لتحسين أرشفة محركات البحث (SEO)، حاول استهلاك كلمات رنانة تمثل موضوع وعصب محتوى المقالة.' 
            : 'For Google Search SEO snippet optimizers, consider adding context words targeting main search phrases.'
        );
      }
    }

    // Power word recommendations
    if (wordMetrics.power.length === 0) {
      list.push(
        isRtl 
          ? 'اضف كلمة رنانة واحدة على الأقل مثل "سري"، "الكشف" أو "دليلك" لزيادة فضول القراء للضغط.' 
          : 'Incorporate at least one high-power attention word (e.g., "secret", "reveal", "ultimate") to prompt curiosity.'
      );
    }

    // Emotional trigger words recommended
    if (wordMetrics.emotional.length === 0) {
      list.push(
        isRtl 
          ? 'العاطفة تقود النقرات! استخدم كلمة تعكس الدهشة، الفوز، أو الإثارة مثل "رهيب"، "رائع" أو "صادم".' 
          : 'Emotional resonance is the main driver of click conversions. Enrich your line with a feeling term (e.g. "surprising", "fail", "best").'
      );
    }

    // Numbers recommendations
    if (!/\d+/.test(headline)) {
      list.push(
        isRtl 
          ? 'استعمال الأعداد والنسب المئوية (مثل: "5 أخطاء" أو "90٪") يضاعف من نسبة النقر والثقة بالنتائج.' 
          : 'Adding specific numbers or lists (e.g., "5 mistakes" or "90%") signals highly organized and valuable structured content.'
      );
    }

    // General fallback
    if (list.length === 0) {
      list.push(
        isRtl 
          ? 'عمل ممتاز! عنوانك متزن وممتاز وجاهز تماماً لجذب المشاهدات وزيادة النقرات بنسب مرتفعة للغاية.' 
          : 'Fabulous blueprint! Your headline is elegantly balanced and configured for immediate reader attention.'
      );
    }

    return list;
  };

  const activeTips = getOptimizationTips();

  // Action Actions
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(headline);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy headline', err);
    }
  };

  const handleClear = () => {
    setHeadline('');
  };

  return (
    <div className="w-full space-y-6 animate-fade-in" id="headline-analyzer-section">
      
      {/* Visual Header Banner */}
      <div className="flex gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950 border border-indigo-100 dark:border-indigo-900/40 p-4 rounded-2xl">
        <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {t('headline_analyzer.title')}
          </p>
          <p>
            {t('headline_analyzer.desc')}
          </p>
          <p className="text-[10px] text-indigo-650 dark:text-indigo-400 font-semibold font-mono">
            {isRtl 
              ? '✨ محلل ذكي وآمن يحافظ على أفكارك محلياً بالكامل 100٪ لحماية الملكية الفكرية لعناوينك الإبداعية!'
              : '✨ Advanced local NLP matching protects your raw article draft safely inside memory with zero leaks!'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT PANEL AND CONFIG (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Title editor input */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            
            <div className="flex items-center justify-between border-b border-slate-55 dark:border-slate-800 pb-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                {isRtl ? 'صياغة وتدقيق العنوان' : 'Headline Diction Editor'}
              </span>

              <div className="flex items-center gap-2">
                {headline && (
                  <button
                    onClick={handleClear}
                    className="p-1 px-2.5 rounded-md hover:bg-rose-50 text-rose-500 text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isRtl ? 'تفريغ' : 'Clear'}</span>
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className={`p-1 px-2.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                    copied 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{isRtl ? 'تم النسخ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isRtl ? 'نسخ العنوان' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={t('headline_analyzer.input_placeholder')}
              rows={4}
              maxLength={200}
              className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans resize-none transition focus:bg-white dark:focus:bg-slate-950"
            />

            {/* Custom counter helper indicator */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>{headline.length} / 200 {isRtl ? 'حرف مستخدم' : 'maximum chars'}</span>
              <span>{wordMetrics.totalWordsCount} {isRtl ? 'كلمات' : 'words'}</span>
            </div>

          </div>

          {/* Platform filter tabs selector */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            
            <label className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
              {t('headline_analyzer.platform_target')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'youtube', label: t('headline_analyzer.youtube'), icon: Youtube, color: 'text-red-500' },
                { id: 'tiktok', label: t('headline_analyzer.tiktok'), icon: Video, color: 'text-rose-500' },
                { id: 'web', label: t('headline_analyzer.web'), icon: Globe, color: 'text-emerald-500' }
              ].map((plat) => {
                const isSel = platform === plat.id;
                const Icon = plat.icon;
                return (
                  <button
                    key={plat.id}
                    onClick={() => {
                      triggerAd(() => setPlatform(plat.id as PlatformType));
                    }}
                    className={`py-3 px-4 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-2 select-none ${
                      isSel 
                        ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-2xs' 
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${plat.color}`} />
                    <span>{plat.label}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* ANALYSIS TIPS AND ACTIONS CONTAINER */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-3 shadow-xs">
            
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              {t('headline_analyzer.analysis_tip')}
            </h4>

            <ul className="space-y-2.5">
              {activeTips.map((tip, idx) => (
                <li 
                  key={idx} 
                  className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850 flex gap-2.5 items-start text-xs text-slate-600 dark:text-slate-400 transition hover:bg-slate-100/50 dark:hover:bg-slate-950/45"
                >
                  <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>

          </div>

        </div>

        {/* METRICS VISUAL CARDS BOARD (3 CARDS INSIDE 5 COLS) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* CARD 1: OVERALL SCORE VISUAL DIAL METRIC */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs text-center flex flex-col justify-center items-center">
            
            <div className="w-full text-left border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
                {t('headline_analyzer.score_card')}
              </h4>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
            </div>

            {/* Circular arc or solid progress score representation with motion */}
            <div className="relative w-28 h-28 flex items-center justify-center my-2">
              
              <svg className="w-full h-full transform -rotate-95" viewBox="0 0 100 100">
                {/* Background Ring channel */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800"
                />
                {/* Active value indicator stroke */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallScore / 100)}`}
                  className={`${
                    overallScore >= 80 
                      ? 'text-emerald-500' 
                      : overallScore >= 60 
                        ? 'text-indigo-500' 
                        : 'text-amber-500'
                  } transition-all duration-700 ease-out`}
                />
              </svg>

              {/* Central text content with precise metric score */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold font-mono text-slate-800 dark:text-white leading-none">
                  {overallScore}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">/ 100</span>
              </div>

            </div>

            {/* Status explanation pill */}
            <div className={`py-1.5 px-4 rounded-full border text-[10.5px] font-bold text-center ${scoreStatus.color}`}>
              {scoreStatus.text}
            </div>

          </div>

          {/* CARD 2: LENGTH OPTIMIZATION ANALYSIS CARD */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            
            <div className="border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
                {t('headline_analyzer.length_card')}
              </h4>
            </div>

            {/* Slider meter indicating lengths */}
            <div className="space-y-4">
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">
                  {isRtl ? 'عدد الحروف الحالية' : 'Current Code Characters'}
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">
                  {lenMetrics.charCount} Chars
                </span>
              </div>

              {/* Styled track showing optimal segments visually */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      lenMetrics.status === 'optimal' 
                        ? 'bg-emerald-500' 
                        : lenMetrics.status === 'short' 
                          ? 'bg-amber-400' 
                          : 'bg-rose-500'
                    }`}
                    style={{ width: `${lenMetrics.percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono font-semibold">
                  <span>{lenMetrics.minOptimal} chars {isRtl ? '(الحد الأدنى)' : '(optimal min)'}</span>
                  <span>{lenMetrics.maxOptimal} chars {isRtl ? '(الأقصى)' : '(optimal max)'}</span>
                </div>
              </div>

              {/* Explicit recommendation and metrics message */}
              <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                lenMetrics.status === 'optimal'
                  ? 'bg-emerald-50/50 dark:bg-emerald-955/10 border-emerald-100 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50/50 dark:bg-amber-955/10 border-amber-100 text-amber-600 dark:text-amber-400'
              }`}>
                <Check className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-bold">
                  {lenMetrics.label}
                </span>
              </div>

            </div>

          </div>

          {/* CARD 3: EMOTIONAL AND ACTIVE WORD DENSITY CARD */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            
            <div className="border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
                {t('headline_analyzer.sentiment_card')}
              </h4>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Power words dictionary findings container */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {t('headline_analyzer.power_words')}
                  </span>
                  <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-mono">
                    {wordMetrics.power.length}
                  </span>
                </div>

                {wordMetrics.power.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {wordMetrics.power.map((powWord, idx) => (
                      <span 
                        key={idx} 
                        className="p-1 px-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10 rounded-full font-bold text-[10.5px]"
                      >
                        {powWord}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 leading-normal italic py-1">
                    {isRtl ? 'لم يتم اكتشاف أية كلمات قوة لتحفيز الفضول والنقر.' : 'No active power action words found in the statement.'}
                  </p>
                )}
              </div>

              {/* Emotional triggers findings container */}
              <div className="space-y-2 pt-2 border-t border-slate-55 dark:border-slate-800/80">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {t('headline_analyzer.emotional_words')}
                  </span>
                  <span className="bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-mono">
                    {wordMetrics.emotional.length}
                  </span>
                </div>

                {wordMetrics.emotional.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {wordMetrics.emotional.map((emoWord, idx) => (
                      <span 
                        key={idx} 
                        className="p-1 px-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10 rounded-full font-bold text-[10.5px]"
                      >
                        {emoWord}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 leading-normal italic py-1">
                    {isRtl ? 'لم يكتشف كلمات عاطفية رنانة تخاطب مشاعر واكتراث الجمهور.' : 'No strong feeling / emotion vocabulary keywords identified.'}
                  </p>
                )}
              </div>

              {/* Neutral context diction score slider */}
              <div className="pt-2 border-t border-slate-55 dark:border-slate-800/80">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">
                  <span>{t('headline_analyzer.neutral_words')}</span>
                  <span className="font-mono text-slate-500">
                    {wordMetrics.totalWordsCount - wordMetrics.power.length - wordMetrics.emotional.length}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* OFFLINE SECURITY PROCESSOR STATEMENT */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 items-start shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-555 shrink-0 mt-0.5" />
            <div className="text-[10.5px] text-slate-500 leading-normal">
              <p className="font-bold text-slate-800 dark:text-white mb-0.5">
                {isRtl ? 'أمن التعديل وتدقيق القنوات' : 'No Cloud Storage Required'}
              </p>
              <p>
                {isRtl 
                  ? 'يتم تقييم وحساب مستويات جودة وجاذبية العنوان محلياً 100٪ بداخل متصفحك بشكل آمن تماماً.' 
                  : 'Calculations run right inside memory using static lexical checks to achieve ultimate privacy preservation.'
                }
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
