import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { 
  Hash, 
  Trash2, 
  Copy, 
  Check, 
  Sliders, 
  Sparkles, 
  Info, 
  TrendingUp, 
  FileText,
  AlignLeft,
  ChevronsUpDown,
  Filter,
  CheckSquare,
  Square,
  Share2
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'hashtag_cleaner',
  icon: 'Hash',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_hashtag_cleaner_title',
  descKey: 'tool_hashtag_cleaner_desc',
};

export default function HashtagCleaner({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [rawText, setRawText] = useState<string>('');
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [sortAlphabetically, setSortAlphabetically] = useState<boolean>(false);
  const [transformUnderscores, setTransformUnderscores] = useState<boolean>(true);
  const [ensurePrefix, setEnsurePrefix] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<'single' | 'multi'>('single');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Set standard initial templates on load
  useEffect(() => {
    setRawText(
      isRtl
        ? "أهلاً بك في منشورنا الجديد! #تسويق #ريادة_أعمال و#نجاح_مضمون. يسعدنا متابعتكم لنا عبر الوسوم التالية: #تسويق، #مبيعات، #ريادة_أعمال، #تحفيز و #نجاح-مضمون، لا تنسوا مراجعة #السعودية_تعلن ومتابعة هاشتاغ #عاجل_الآن!"
        : "Exciting news! Check out our new fully private tool hub. #Marketing #digital_marketing #marketing and #GlobalSuccess. Don't forget to track our popular ones: #productivity #LifeHacks, #marketing, #GlobalSuccess, and #TechNews! Follow us for more."
    );
  }, [isRtl]);

  // Comprehensive hashtag extractor regex & cleaner algorithm
  const parsingResults = useMemo(() => {
    if (!rawText.trim()) {
      return { hashtags: [], totalFoundRaw: 0, duplicatesRemoved: 0 };
    }

    // Capture standard hashtags (optionally starting with #, or words we'll convert)
    // Matches expressions starting with '#' followed by letters, numbers, underscores, or dashes
    const hashRegex = /#[\p{L}\p{N}_-]+/gu;
    const matchedRaw = rawText.match(hashRegex) || [];
    
    // Also capture plain space-separated trailing tags or comma-separated lists if the user typed them without hashes
    // Let's keep it robust and secure by sanitizing matched # tags first
    let processedTags = matchedRaw.map((tag) => {
      // Remove leading '#' for internal cleaning operations
      let clean = tag.replace(/^#+/, '');
      
      // Transform dashes to underscores if option activated
      if (transformUnderscores) {
        clean = clean.replace(/-/g, '_');
      }
      
      return clean;
    }).filter(tag => tag.length > 0);

    const totalFoundRaw = processedTags.length;

    // Deduplicate if selected
    let deduplicated = [...processedTags];
    let duplicatesRemoved = 0;
    if (removeDuplicates) {
      // Case-insensitive deduplication for multilingual consistency
      const uniqueMap = new Map<string, string>();
      processedTags.forEach((tag) => {
        const lower = tag.toLowerCase();
        if (!uniqueMap.has(lower)) {
          uniqueMap.set(lower, tag); // store original casing
        }
      });
      deduplicated = Array.from(uniqueMap.values());
      duplicatesRemoved = totalFoundRaw - deduplicated.length;
    }

    // Sort alphabetically if selected
    if (sortAlphabetically) {
      deduplicated.sort((a, b) => a.localeCompare(b, isRtl ? 'ar' : 'en'));
    }

    // Map back with '#' prefix if toggled
    const finalHashtags = deduplicated.map(tag => ensurePrefix ? `#${tag}` : tag);

    return {
      hashtags: finalHashtags,
      totalFoundRaw,
      duplicatesRemoved
    };
  }, [rawText, removeDuplicates, sortAlphabetically, transformUnderscores, ensurePrefix, isRtl]);

  // Formatted string generation based on layout choices (single line vs multi line)
  const outputText = useMemo(() => {
    if (parsingResults.hashtags.length === 0) return '';
    if (layoutMode === 'multi') {
      return parsingResults.hashtags.join('\n');
    }
    return parsingResults.hashtags.join(' ');
  }, [parsingResults.hashtags, layoutMode]);

  const handleClear = () => {
    setRawText('');
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const loadPreset = (type: 'tech' | 'growth' | 'arabic') => {
    triggerAd(() => {
      startTransition(() => {
        let preset = '';
        if (type === 'tech') {
          preset = "Exploring the absolute limits of local browser APIs! #WebDev #JavaScript #webdev #HTML #CSS #react #ReactJS #CodingLife #JavaScript #CSS #LocalFirst #OfflineSoftware";
        } else if (type === 'growth') {
          preset = "Elevate your startup launch plan today! #LaunchDay #marketing #SocialMedia #entrepreneurship #growth #marketing #LaunchDay #business #entrepreneurship #ValueDelivery";
        } else {
          preset = "تطوير مهارات العمل الحر والإنتاجية الرقمية الذكية! #صناعة_المحتوى #العمل_الحر #تطوير_الذات #العمل_الحر #مبيعات #صناعة_المحتوى #السعودية #مصر #ريادة";
        }
        setRawText(preset);
      });
    });
  };

  return (
    <div className="w-full space-y-7" id="hashtag-cleaner-root">
      
      {/* Banner Intro Section */}
      <div className="flex gap-4 p-5 bg-teal-50 dark:bg-emerald-955/15 border border-teal-100 dark:border-emerald-900/30 rounded-2xl shadow-xs">
        <Hash className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-705 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('hashtag_cleaner.title')}
          </h3>
          <p className="text-xs">
            {t('hashtag_cleaner.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-teal-600 dark:text-teal-400">
            {isRtl 
              ? '⚡ متوافق بالكامل مع الهواتف الذكية والأجهزة اللوحية، يدعم فرز وتوحيد صيغة الهاشتاجات ثنائية اللغة.'
              : '⚡ Fluid tablet & mobile response with bilingual hashtag parsing support including Arabic and Latin character layouts.'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT EDITOR AND OPTIONS (7 Columns) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
            
            {/* Header toolbar */}
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-405 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-teal-500" />
                {isRtl ? 'المحتوى النصي الأصلي أو قائمة الوسوم العشوائية' : 'Unsorted Metadata & Text Input'}
              </span>

              {rawText && (
                <button
                  onClick={handleClear}
                  className="py-1 px-3 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t('hashtag_cleaner.clear_btn')}</span>
                </button>
              )}
            </div>

            {/* Input area */}
            <textarea
              value={rawText}
              onChange={(e) => startTransition(() => setRawText(e.target.value))}
              placeholder={t('hashtag_cleaner.input_placeholder')}
              rows={8}
              className="w-full p-4 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950/60 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-sans resize-none transition focus:bg-white dark:focus:bg-slate-950"
              id="raw-hashtag-input"
            />

            {/* Quick Presets Inject Bars */}
            <div className="space-y-1.5 pt-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                💡 {isRtl ? 'تجربة سريعة لنماذج عشوائية مكررة:' : 'Pre-populate Workspace Presets:'}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadPreset('tech')}
                  className="py-1 px-2.5 rounded-lg text-[10px] font-semibold bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/10 hover:bg-indigo-500/15 transition"
                >
                  💻 {isRtl ? 'هاشتاجات برمجة وتقنية (مكررة)' : 'Tech & Dev Duplicate Tags'}
                </button>
                <button
                  onClick={() => loadPreset('growth')}
                  className="py-1 px-2.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/15 transition"
                >
                  📈 {isRtl ? 'رواد أعمال وتطوير (مفرطة)' : 'Startup & Business Overflow'}
                </button>
                <button
                  onClick={() => loadPreset('arabic')}
                  className="py-1 px-2.5 rounded-lg text-[10px] font-semibold bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/10 hover:bg-teal-500/15 transition"
                >
                  🇸🇦 {isRtl ? 'وسوم عربية مشوشة ومدمجة' : 'Bilingual Arab Tags Mashup'}
                </button>
              </div>
            </div>

          </div>

          {/* CHECK FUNCTIONAL OPTIONS (Toggle Grid) */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm">
            
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Sliders className="w-4 h-4 text-teal-500" />
              {t('hashtag_cleaner.clean_options')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              
              {/* Option 1: Remove duplicates */}
              <button
                onClick={() => setRemoveDuplicates(!removeDuplicates)}
                className={`p-3 rounded-xl border flex items-center gap-3 transition text-left cursor-pointer ${
                  removeDuplicates 
                    ? 'border-teal-200 bg-teal-50/20 text-teal-900 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/60' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-450 dark:border-slate-850 dark:bg-slate-950/20'
                }`}
                id="toggle-remove-duplicates"
              >
                {removeDuplicates ? (
                  <CheckSquare className="w-5 h-5 text-teal-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-350 shrink-0" />
                )}
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">{t('hashtag_cleaner.remove_duplicates')}</p>
                </div>
              </button>

              {/* Option 2: Alphabetical sort */}
              <button
                onClick={() => setSortAlphabetically(!sortAlphabetically)}
                className={`p-3 rounded-xl border flex items-center gap-3 transition text-left cursor-pointer ${
                  sortAlphabetically 
                    ? 'border-indigo-200 bg-indigo-50/20 text-indigo-900 dark:bg-indigo-950/10 dark:text-indigo-300 dark:border-indigo-900/60' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-450 dark:border-slate-850 dark:bg-slate-950/20'
                }`}
                id="toggle-alphabetic-sort"
              >
                {sortAlphabetically ? (
                  <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-350 shrink-0" />
                )}
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">{t('hashtag_cleaner.alphabetical')}</p>
                </div>
              </button>

              {/* Option 3: Transform spaces/dashes to underscores */}
              <button
                onClick={() => setTransformUnderscores(!transformUnderscores)}
                className={`p-3 rounded-xl border flex items-center gap-3 transition text-left cursor-pointer ${
                  transformUnderscores 
                    ? 'border-teal-200 bg-teal-50/20 text-teal-900 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/60' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-450 dark:border-slate-850 dark:bg-slate-950/20'
                }`}
                id="toggle-transform-underscores"
              >
                {transformUnderscores ? (
                  <CheckSquare className="w-5 h-5 text-teal-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-350 shrink-0" />
                )}
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">{t('hashtag_cleaner.transform_underscores')}</p>
                </div>
              </button>

              {/* Option 4: Ensure hashtag prefix */}
              <button
                onClick={() => setEnsurePrefix(!ensurePrefix)}
                className={`p-3 rounded-xl border flex items-center gap-3 transition text-left cursor-pointer ${
                  ensurePrefix 
                    ? 'border-indigo-200 bg-indigo-50/20 text-indigo-900 dark:bg-indigo-950/10 dark:text-indigo-300 dark:border-indigo-900/60' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-450 dark:border-slate-850 dark:bg-slate-950/20'
                }`}
                id="toggle-ensure-prefix"
              >
                {ensurePrefix ? (
                  <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-350 shrink-0" />
                )}
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">{t('hashtag_cleaner.prefix_hashtag_option')}</p>
                </div>
              </button>

            </div>

          </div>

        </div>

        {/* METRICS & ISOLATED PREVIEW SECTION (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Giant Stats Box with Teal Gradient styling */}
          <div className="p-6 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-3xl space-y-5 shadow-lg relative overflow-hidden">
            
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
              <Hash className="w-48 h-48" />
            </div>

            <div className="space-y-1 relative">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100 opacity-85 block">
                {isRtl ? 'الوسوم الفريدة المكتشفة والجاهزة' : 'Clean Extracted Tags Count'}
              </span>
              <p className="text-5xl font-mono font-extrabold tracking-tight drop-shadow-xs">
                #{parsingResults.hashtags.length}
              </p>
            </div>

            {/* Micro details stats list inside */}
            <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-white/10 text-xs text-white/90 relative">
              <div>
                <p className="font-bold opacity-75 text-[10px] uppercase tracking-wider">{t('hashtag_cleaner.stats_total')}</p>
                <p className="font-mono text-xl font-bold">{parsingResults.totalFoundRaw}</p>
              </div>
              <div>
                <p className="font-bold opacity-75 text-[10px] uppercase tracking-wider">{t('hashtag_cleaner.stats_removed_duplicates')}</p>
                <p className="font-mono text-xl font-bold text-teal-200">{parsingResults.duplicatesRemoved}</p>
              </div>
            </div>

          </div>

          {/* Formatted Output Layout Options & Output Screen */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm relative">
            
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <AlignLeft className="w-4 h-4 text-emerald-500" />
                {t('hashtag_cleaner.preview_header')}
              </h4>

              {/* Layout Switcher buttons */}
              <div className="flex bg-slate-55 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
                <button
                  onClick={() => setLayoutMode('single')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                    layoutMode === 'single'
                      ? 'bg-teal-500 text-white dark:bg-teal-600'
                      : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title={t('hashtag_cleaner.layout_single_line')}
                >
                  {isRtl ? 'مسطح' : 'Flow'}
                </button>
                <button
                  onClick={() => setLayoutMode('multi')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                    layoutMode === 'multi'
                      ? 'bg-teal-500 text-white dark:bg-teal-600'
                      : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title={t('hashtag_cleaner.layout_multi_line')}
                >
                  {isRtl ? 'عمودي' : 'Lines'}
                </button>
              </div>
            </div>

            {/* Simulated output rendering box */}
            <div className="relative">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-205 dark:border-slate-850 text-xs font-mono h-40 max-h-40 overflow-y-auto leading-relaxed select-text text-slate-700 dark:text-slate-300">
                {outputText ? (
                  <p className="whitespace-pre-wrap">{outputText}</p>
                ) : (
                  <p className="text-slate-400 italic font-sans">
                    {isRtl 
                      ? 'لم يتم الكشف عن الهاشتاجات تلقائياً بعد. يرجى إدخال منشور للمسح.' 
                      : 'No hashtags extracted yet. Type or load preset to execute parsing.'}
                  </p>
                )}
              </div>

              {outputText && (
                <button
                  onClick={handleCopy}
                  className="absolute bottom-2.5 right-2.5 py-1.5 px-3 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-teal-600 dark:text-teal-400 shadow-xs transition flex items-center gap-1 cursor-pointer"
                  id="copy-cleaned-hashtags"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? t('hashtag_cleaner.copied_msg') : t('hashtag_cleaner.copy_btn')}</span>
                </button>
              )}
            </div>

            {/* Quick visualization of parsed tag pills */}
            {parsingResults.hashtags.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                  {isRtl ? 'الوسوم الفردية المستخلصة كبطاقات:' : 'Extracted Tag Pills Visualizer:'}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                  {parsingResults.hashtags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="py-1 px-2.5 rounded-md bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border border-teal-100/40 dark:border-teal-900/40 text-[11px] font-medium font-mono hover:scale-105 transition"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Secure details about tags usage */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 items-start shadow-xs">
            <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
            <div className="text-[10.5px] text-slate-500 leading-normal select-text">
              <p className="font-bold text-slate-850 dark:text-white mb-0.5">
                {isRtl ? 'لماذا الهاشتاجات المنسقة مهمة؟' : 'Hashtags Outreach Importance'}
              </p>
              <p>
                {isRtl 
                  ? 'يساعد الفرز الأبجدي وإزالة التكرار مع تبديل الفواصل للشرطة السفلية على تحسين أداء خوارزميات البحث وتسهيل قراءة المنشورات ووصولها للجمهور.' 
                  : 'Formatting spacing and removing duplicate tag parameters enhances the readability index of post captions while improving indexing on search engines.'
                }
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
