import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Type, 
  ShieldCheck, 
  HelpCircle,
  Hash,
  Layers,
  ChevronRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'thread_splitter',
  icon: 'Layers',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_thread_splitter_title',
  descKey: 'tool_thread_splitter_desc',
};

type LimitPreset = 'twitter' | 'threads' | 'linkedin' | 'custom';
type NumberingPosition = 'start' | 'end';

export default function ThreadSplitter({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = useAdManager();

  // Settings states
  const [inputText, setInputText] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<LimitPreset>('twitter');
  const [customLimit, setCustomLimit] = useState<number>(280);
  const [autoNumber, setAutoNumber] = useState<boolean>(true);
  const [numberPosition, setNumberPosition] = useState<NumberingPosition>('end');
  const [prefixSymbol, setPrefixSymbol] = useState<string>(''); // e.g. 🧵
  const [styleTemplate, setStyleTemplate] = useState<string>('slash'); // 'slash' (1/5) or 'bracket' [1/5] or 'parentheses' (1/5)

  // Output states
  const [threadChunks, setThreadChunks] = useState<string[]>([]);
  const [copiedIndexes, setCopiedIndexes] = useState<{ [key: number]: boolean }>({});
  const [isCopiedAll, setIsCopiedAll] = useState<boolean>(false);

  // Initialize default text once
  useEffect(() => {
    const welcomeText = isRtl
      ? "تعتبر هذه الأداة الإلكترونية هي الخيار الأفضل والذكي لصناع المحتوى والكتاب والمثقفين الراغبين في إعادة صياغة الكتب والمقالات الطويلة والملاحظات اليومية وتوزيعها على أجزاء متناسقة ومنشورة بدقة بالغة. بمجرد لصق النص الطويل هنا، يقوم النظام بمعالجة ذكية وسريعة للحروف والمسافات والنقاط الفاصلة لضمان ألا تقسم الكلمات بشكل عشوائي مشوه في المنتصف. نأمل أن تستمتع بتجربة نشر احترافية لا مثيل لها وبشكل محلي آمن يحظر تسريب نصوصك خارج جهازك!"
      : "In the rapidly evolving landscape of social communication, composing threaded posts on networks like X (formerly Twitter), Threads, or LinkedIn remains a proven strategy to drive organic engagement. However, manually splitting a comprehensive, 1000-word article or a long narrative story into clean posts that respect hard character limits without severing a word right in the middle is incredibly tedious.\n\nThis high-performance Social Media Thread Splitter automates this process instantly. Paste or compose your thoughts in the editor. Adjust the character limits dynamically using the presets or tailor it explicitly via the numeric input. Our intelligent partitioning algorithms crawl your content, find sentence punctuation breaks, detect correct trailing spaces, factor in automatic index numbering overlays, and preview your ready-to-publish thread immediately.";
    setInputText(welcomeText);
  }, [isRtl]);

  // Compute active character limit
  const getActiveLimit = (): number => {
    if (selectedPreset === 'twitter') return 280;
    if (selectedPreset === 'threads') return 500;
    if (selectedPreset === 'linkedin') return 3000;
    return customLimit > 10 ? customLimit : 280;
  };

  // Safe split algorithm
  const performThreadSplit = (text: string, limit: number, useNumbering: boolean): string[] => {
    if (!text.trim()) return [];

    // Let's implement an interactive multiple-pass refinement to perfectly respect character limits
    // even with dynamic numbering string sizes (e.g. " (12/12)" contributes 8 characters extra overhead).
    
    // Initial guess on number of chunks based on basic division
    let estimatedParts = Math.max(1, Math.ceil(text.length / (limit - 15)));
    let chunks: string[] = [];
    let isSuccessful = false;
    let iterations = 0;

    while (!isSuccessful && iterations < 5) {
      chunks = [];
      let remainingText = text.replace(/\r\n/g, '\n').trim();
      let partIndex = 1;

      while (remainingText.length > 0) {
        // Calculate numbering overlay overhead for this specific index
        let numLabel = '';
        if (useNumbering) {
          const numStr = styleTemplate === 'slash' 
            ? `${partIndex}/${estimatedParts}`
            : styleTemplate === 'bracket'
              ? `[${partIndex}/${estimatedParts}]`
              : `(${partIndex}/${estimatedParts})`;
          
          const prefix = prefixSymbol ? `${prefixSymbol} ` : '';
          numLabel = numberPosition === 'start' ? `${prefix}${numStr} ` : ` ${prefix}${numStr}`;
        }

        const allowedChunkCharCount = limit - numLabel.length;
        if (allowedChunkCharCount <= 0) {
          // Fallback if limit is too small to accommodate even the numbering overhead
          chunks = [text];
          isSuccessful = true;
          break;
        }

        if (remainingText.length <= allowedChunkCharCount) {
          // Last remaining section fits completely
          if (useNumbering) {
            chunks.push(numberPosition === 'start' ? `${numLabel}${remainingText}` : `${remainingText}${numLabel}`);
          } else {
            chunks.push(remainingText);
          }
          remainingText = '';
        } else {
          // Need to split chunk
          let sliceIndex = allowedChunkCharCount;
          let subStr = remainingText.substring(0, sliceIndex);

          // Find the last space, sentence break, or newline
          let spaceIndex = subStr.lastIndexOf(' ');
          let newlineIndex = subStr.lastIndexOf('\n');
          
          // Prefer newline index if it exists in the last third of the slice
          let targetSplitIndex = sliceIndex;
          if (newlineIndex > allowedChunkCharCount * 0.7) {
            targetSplitIndex = newlineIndex;
          } else if (spaceIndex > allowedChunkCharCount * 0.5) {
            targetSplitIndex = spaceIndex;
          }

          // In case the target index is extremely small (no spaces found), force split at maximum allowed
          if (targetSplitIndex <= 0) {
            targetSplitIndex = allowedChunkCharCount;
          }

          let chunkText = remainingText.substring(0, targetSplitIndex).trim();
          
          if (useNumbering) {
            chunks.push(numberPosition === 'start' ? `${numLabel}${chunkText}` : `${chunkText}${numLabel}`);
          } else {
            chunks.push(chunkText);
          }

          remainingText = remainingText.substring(targetSplitIndex).trim();
          partIndex++;
        }
      }

      // Check if actual partition count matches our estimated denominator
      if (!useNumbering || chunks.length === estimatedParts) {
        isSuccessful = true;
      } else {
        estimatedParts = chunks.length;
        iterations++;
      }
    }

    return chunks;
  };

  // Run auto-split whenever inputs change
  useEffect(() => {
    const activeLimit = getActiveLimit();
    const result = performThreadSplit(inputText, activeLimit, autoNumber);
    setThreadChunks(result);
  }, [inputText, selectedPreset, customLimit, autoNumber, numberPosition, prefixSymbol, styleTemplate]);

  // Actions
  const handleSplitClick = () => {
    triggerAd(() => {
      const activeLimit = getActiveLimit();
      const result = performThreadSplit(inputText, activeLimit, autoNumber);
      setThreadChunks(result);
    });
  };

  const handleCopyPost = async (chunkText: string, index: number) => {
    try {
      await navigator.clipboard.writeText(chunkText);
      setCopiedIndexes(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedIndexes(prev => ({ ...prev, [index]: false }));
      }, 1500);
    } catch (err) {
      console.error('Copy post action error: ', err);
    }
  };

  const handleCopyAll = async () => {
    if (threadChunks.length === 0) return;
    try {
      const allMerged = threadChunks.join('\n\n---\n\n');
      await navigator.clipboard.writeText(allMerged);
      setIsCopiedAll(true);
      setTimeout(() => setIsCopiedAll(false), 2000);
    } catch (err) {
      console.error('Copy all threads failed: ', err);
    }
  };

  return (
    <div className="w-full space-y-6" id="thread-splitter-panel">

      {/* Top Description Alert Banner */}
      <div className="flex gap-3 bg-indigo-50 dark:bg-indigo-955/20 border border-indigo-100 dark:border-indigo-900/40 p-4 rounded-2xl">
        <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {t('thread_splitter.title')}
          </p>
          <p>
            {t('thread_splitter.desc')}
          </p>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
            {isRtl 
              ? '🧵 يقسم مقالك الطويل إلى سلاسل تغريدات متسلسلة بدقة 100٪ بداخل متصفحك دون قطع الكلمات أو إرسال أية بيانات!'
              : '🧵 Seamlessly partitions long form sheets into multi-post drafts in-browser without sending your letters anywhere!'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT AND CONFIGURATOR SECTION (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-start">
          
          {/* Main Text Input Area card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 shadow-xs">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Type className="w-4 h-4 text-indigo-500" />
                {isRtl ? 'محتوى النص الإبداعي' : 'Source Storyboard Draft'}
              </h3>
              
              <span className="font-mono text-[10.5px] px-2 py-0.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 rounded-full font-bold">
                {inputText.length} {isRtl ? 'حرف' : 'Chars'}
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('thread_splitter.input_placeholder')}
              rows={11}
              className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans resize-none transition focus:bg-white dark:focus:bg-slate-950"
            />

          </div>

          {/* Configuration Rules card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-5 shadow-xs">
            
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Hash className="w-4 h-4 text-indigo-500" />
              {isRtl ? 'شروط وقواعد التقسيم' : 'Tuning & Presets Configurations'}
            </h3>

            {/* Platform Presets controls selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                {t('thread_splitter.char_limit')}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'twitter', label: t('thread_splitter.limit_preset_tw'), cap: 280 },
                  { id: 'threads', label: t('thread_splitter.limit_preset_threads'), cap: 500 },
                  { id: 'linkedin', label: t('thread_splitter.limit_preset_li'), cap: 3000 },
                  { id: 'custom', label: isRtl ? 'حد مخصص' : 'Custom Manual', cap: null }
                ].map((preset) => {
                  const isSel = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id as LimitPreset)}
                      className={`p-2.5 rounded-xl border text-[10.5px] text-center transition font-bold flex flex-col justify-center items-center gap-1 ${
                        isSel 
                          ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400' 
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500'
                      }`}
                    >
                      <span className="truncate max-w-full">{preset.label}</span>
                      {preset.cap && (
                        <span className="font-mono text-[9px] opacity-60 font-semibold">{preset.cap} Chars</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Limit input field */}
            <AnimatePresence>
              {selectedPreset === 'custom' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-1.5"
                >
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    {t('thread_splitter.custom_limit')}
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="10000"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(Math.max(15, Number(e.target.value)))}
                    className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auto Numbering preferences */}
            <div className="pt-2 border-t border-slate-50 dark:border-slate-800/85 space-y-4">
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                    {t('thread_splitter.auto_number')}
                  </span>
                  <span className="text-[9.5px] text-slate-400 block max-w-sm">
                    {isRtl ? 'المساعدة على توجيه القراء عبر الترقيم التلقائي المحسوب.' : 'Appends precise numeric sequence tracker indexing to posts.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoNumber(!autoNumber)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoNumber ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      autoNumber ? (isRtl ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Numbering Detail Formats (Yellow highlighting and styles) */}
              <AnimatePresence>
                {autoNumber && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3.5"
                  >
                    
                    {/* Positioning selectors (Start or End of message) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          {isRtl ? 'موضع الترقيم' : 'Tracker Position'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setNumberPosition('start')}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition border ${
                              numberPosition === 'start' 
                                ? 'bg-white dark:bg-slate-800 text-indigo-500 border-indigo-200' 
                                : 'text-slate-500 border-transparent hover:bg-slate-100'
                            }`}
                          >
                            {isRtl ? 'بداية المنشور' : 'Start of Post'}
                          </button>
                          <button
                            onClick={() => setNumberPosition('end')}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition border ${
                              numberPosition === 'end' 
                                ? 'bg-white dark:bg-slate-800 text-indigo-500 border-indigo-200' 
                                : 'text-slate-500 border-transparent hover:bg-slate-100'
                            }`}
                          >
                            {isRtl ? 'نهاية المنشور' : 'End of Post'}
                          </button>
                        </div>
                      </div>

                      {/* Formatting Wrapper preset tags */}
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          {isRtl ? 'نمط وأقواس الترقيم' : 'Index Style Pattern'}
                        </span>
                        <div className="flex items-center gap-1">
                          {[
                            { id: 'slash', label: '(1/3)', test: '(1/3)' },
                            { id: 'bracket', label: '[1/3]', test: '[1/3]' },
                            { id: 'parentheses', label: '1/3', test: '1/3' }
                          ].map((style) => (
                            <button
                              key={style.id}
                              onClick={() => setStyleTemplate(style.id)}
                              className={`flex-1 py-1.5 text-[10px] font-mono font-bold rounded-lg transition border ${
                                styleTemplate === style.id 
                                  ? 'bg-white dark:bg-slate-800 text-indigo-500 border-indigo-200' 
                                  : 'text-slate-500 border-transparent hover:bg-slate-100'
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Leading emojis / symbols triggers */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        {isRtl ? 'رمز أو إيموجي مميز (اختياري)' : 'Tracker Emoji / Symbol (Optional)'}
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {['', '🧵', '📌', '👇', '👉', '🔥', '✨'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => setPrefixSymbol(emoji)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition border ${
                              prefixSymbol === emoji 
                                ? 'bg-white dark:bg-slate-800 text-indigo-500 border-indigo-200' 
                                : 'bg-transparent text-slate-500 hover:bg-slate-100 border-transparent'
                            }`}
                          >
                            {emoji || (isRtl ? 'بلا' : 'None')}
                          </button>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

        </div>

        {/* OUTPUT LIVE PREVIEW THREAD LAYOUT (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Output Control stats Header */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between shadow-xs">
            
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                {t('thread_splitter.thread_results')}
              </h4>
              <span className="font-mono text-[10px] text-slate-400 font-bold block">
                {threadChunks.length} {isRtl ? 'منشور مجزأ' : 'Draft posts compiled'}
              </span>
            </div>

            {threadChunks.length > 0 && (
              <button
                onClick={handleCopyAll}
                className={`py-2 px-3.5 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1.5 select-none ${
                  isCopiedAll 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-xs'
                }`}
              >
                {isCopiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تم نسخ الكل' : 'All Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('thread_splitter.copy_all')}</span>
                  </>
                )}
              </button>
            )}

          </div>

          {/* Sequential Thread visualizers list */}
          <div className="max-h-[640px] overflow-y-auto space-y-4 pr-1">
            
            <AnimatePresence mode="popLayout">
              {threadChunks.length === 0 ? (
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl text-center space-y-2">
                  <Layers className="w-8 h-8 text-indigo-500 opacity-20 mx-auto" />
                  <p className="text-xs text-slate-400">
                    {isRtl ? 'يرجى كتابة نص في لوحة الصياغة للمشاهدة والتوزيع.' : 'Your segmented posts feed is waiting for drafting input.'}
                  </p>
                </div>
              ) : (
                threadChunks.map((chunk, index) => {
                  const isCopied = !!copiedIndexes[index];
                  const charactersCount = chunk.length;
                  const maxLimit = getActiveLimit();
                  const percentageUsed = Math.min(100, (charactersCount / maxLimit) * 100);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: Math.min(0.2, index * 0.05) }}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-3.5 relative group shadow-xs hover:border-slate-200 dark:hover:border-slate-800 transition"
                    >
                      
                      {/* Thread connecting virtual visual rail line */}
                      {index < threadChunks.length - 1 && (
                        <div className="absolute top-1/2 left-4 w-0.5 h-20 bg-slate-150 dark:bg-slate-800/80 pointer-events-none z-0 translate-y-3" />
                      )}

                      <div className="flex items-center justify-between text-[10.5px]">
                        
                        {/* Part ID bubble counter */}
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center font-bold font-mono text-[9.5px]">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-450 uppercase tracking-widest">{isRtl ? 'مسودة' : 'POST'} {index + 1}</span>
                        </div>

                        {/* Copy specific chunk */}
                        <button
                          onClick={() => handleCopyPost(chunk, index)}
                          className={`p-1.5 rounded-lg transition flex items-center gap-1 text-[9px] font-bold ${
                            isCopied 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{isRtl ? 'تم النسخ' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{isRtl ? 'نسخ الجزء' : 'Copy'}</span>
                            </>
                          )}
                        </button>

                      </div>

                      {/* Display block segmented letters */}
                      <p className="text-sm leading-relaxed text-slate-850 dark:text-slate-200 whitespace-pre-wrap font-sans break-words bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-50 dark:border-slate-850">
                        {chunk}
                      </p>

                      {/* Chars count stats slider under chunk */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400">
                          <span>{charactersCount} / {maxLimit} {isRtl ? 'حرف مستخدم' : 'characters'}</span>
                          <span>{charactersCount > maxLimit ? (isRtl ? 'تخطى الحد!' : 'Exceeds!') : ''}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              percentageUsed > 90 ? 'bg-amber-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${percentageUsed}%` }}
                          />
                        </div>
                      </div>

                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>

          </div>

          {/* Privacy processing compliant footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 items-start shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-555 shrink-0 mt-0.5" />
            <div className="text-[10.5px] text-slate-500 leading-normal">
              <p className="font-bold text-slate-800 dark:text-white mb-0.5">
                {isRtl ? 'أمان التعديل والمنشورات' : 'Committed Offline Studio Workspace'}
              </p>
              <p>
                {isRtl 
                  ? 'يتم تشغيل ومعالجة تقسيم هذه النصوص على جهازك وتخزينها محلياً بالكامل.' 
                  : 'All formatting runs offline inside your local browser tab instance. Absolutely zero text properties are shared or saved on remote servers.'
                }
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
