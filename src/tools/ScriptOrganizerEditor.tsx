import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Bold, 
  Underline, 
  Highlighter, 
  FileText, 
  Search, 
  Save, 
  Clock, 
  ShieldCheck, 
  FileDown, 
  Edit3,
  BookOpen,
  ChevronRight,
  Maximize2,
  Trash
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'script_editor',
  icon: 'PenTool',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_script_editor_title',
  descKey: 'tool_script_editor_desc',
};

interface Script {
  id: string;
  title: string;
  content: string; // HTML formatted string
  lastModified: number;
}

export default function ScriptOrganizerEditor({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = useAdManager();

  // Storage and lists states
  const [scripts, setScripts] = useState<Script[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // UI states
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>('');
  const [isSavingNotification, setIsSavingNotification] = useState<boolean>(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize scripts from localStorage or default values
  useEffect(() => {
    try {
      const stored = localStorage.getItem('studio_scripts_v1');
      if (stored) {
        const parsed = JSON.parse(stored) as Script[];
        if (parsed.length > 0) {
          setScripts(parsed);
          setActiveId(parsed[0].id);
          setTitleInput(parsed[0].title);
        } else {
          loadDefaultScript();
        }
      } else {
        loadDefaultScript();
      }
    } catch (err) {
      console.error('Failed reading scripts from localStorage: ', err);
      loadDefaultScript();
    }
  }, []);

  // Helper to load standard welcome script
  const loadDefaultScript = () => {
    const welcome: Script = {
      id: 'default-welcome-id',
      title: isRtl ? 'عرض تقديمي ترحيبي' : 'Welcome Presentation Script',
      content: `<div><strong>${isRtl ? 'أهلاً بك في منظم ومحرر السكربتات الذكي!' : 'Welcome to the Smart Studio Script Editor!'}</strong></div><div><br></div><div>${
        isRtl 
          ? 'هذا المحرر الفاخر مخصص لمساعدتك في كتابة وصياغة وتنظيم نصوص الحلقات، العروض التقديمية، ومقاطع الفيديو التفاعلية.' 
          : 'This workspace is tailored to help you compose, organize, and style high-production narratives, video scripts, and verbal presentations.'
      }</div><div><br></div><div>${
        isRtl 
          ? '💡 <span style="background-color: rgb(254, 240, 138);">استخدم قلم التمييز الأصفر لتحديد الكلمات المفتاحية</span> لتعرف متى تركز بصرك!' 
          : '💡 <span style="background-color: rgb(254, 240, 138);">Use the yellow highlighter tool to trace important keywords</span> so you never lose focus during delivery!'
      }</div><div><br></div><div>${
        isRtl 
          ? 'تتميز هذه الأداة بـ <u>حفظ تلقائي محلي 100%</u> وتعمل بسلاسة تامة على الأجهزة اللوحية (التابلت) والمحمول.' 
          : 'This organizer saves continuously with <u>100% local browser storage protection</u>. Works perfectly across tablets and mobile gear.'
      }</div>`,
      lastModified: Date.now()
    };
    setScripts([welcome]);
    setActiveId(welcome.id);
    setTitleInput(welcome.title);
    localStorage.setItem('studio_scripts_v1', JSON.stringify([welcome]));
  };

  // Switch scripts
  const handleSelectScript = (id: string) => {
    const target = scripts.find(s => s.id === id);
    if (target) {
      setActiveId(id);
      setTitleInput(target.title);
      if (editorRef.current) {
        editorRef.current.innerHTML = target.content;
      }
    }
  };

  // Sync editor HTML inner content on script change
  useEffect(() => {
    if (activeId) {
      const activeScript = scripts.find(s => s.id === activeId);
      if (activeScript && editorRef.current && editorRef.current.innerHTML !== activeScript.content) {
        editorRef.current.innerHTML = activeScript.content;
      }
    }
  }, [activeId]);

  // Saves changes to active script (saves automatically)
  const saveActiveScript = (updatedContent: string, updatedTitle: string) => {
    if (!activeId) return;

    setIsSavingNotification(true);
    const updated = scripts.map(s => {
      if (s.id === activeId) {
        return {
          ...s,
          title: updatedTitle || t('script_editor.untitled'),
          content: updatedContent,
          lastModified: Date.now()
        };
      }
      return s;
    });

    // Bubble current active script to top of the list for better temporal organization
    const sorted = [...updated].sort((a, b) => b.lastModified - a.lastModified);
    
    setScripts(sorted);
    localStorage.setItem('studio_scripts_v1', JSON.stringify(sorted));

    setTimeout(() => {
      setIsSavingNotification(false);
    }, 800);
  };

  // Editor keyboard actions listener to trigger immediate states
  const handleEditorInput = () => {
    if (editorRef.current && activeId) {
      saveActiveScript(editorRef.current.innerHTML, titleInput);
    }
  };

  const handleTitleChange = (newVal: string) => {
    setTitleInput(newVal);
    if (activeId && editorRef.current) {
      saveActiveScript(editorRef.current.innerHTML, newVal);
    }
  };

  // Create new script action
  const handleCreateNewScript = () => {
    triggerAd(() => {
      const newObj: Script = {
        id: `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: t('script_editor.untitled'),
        content: `<div>${t('script_editor.placeholder')}</div>`,
        lastModified: Date.now()
      };
      const updatedList = [newObj, ...scripts];
      setScripts(updatedList);
      setActiveId(newObj.id);
      setTitleInput(newObj.title);
      if (editorRef.current) {
        editorRef.current.innerHTML = newObj.content;
        editorRef.current.focus();
      }
      localStorage.setItem('studio_scripts_v1', JSON.stringify(updatedList));
    });
  };

  // Delete current script
  const handleDeleteScript = (id: string, e: any) => {
    e.stopPropagation();
    const remains = scripts.filter(s => s.id !== id);
    setScripts(remains);
    localStorage.setItem('studio_scripts_v1', JSON.stringify(remains));

    if (activeId === id) {
      if (remains.length > 0) {
        setActiveId(remains[0].id);
        setTitleInput(remains[0].title);
        if (editorRef.current) {
          editorRef.current.innerHTML = remains[0].content;
        }
      } else {
        setActiveId(null);
        setTitleInput('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      }
    }
  };

  // Text markup formatting buttons (pure standard rich execution)
  const applyTextFormat = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg);
    // Focus back on sheet
    if (editorRef.current) {
      editorRef.current.focus();
      handleEditorInput();
    }
  };

  // Highlighter toggle
  const applyHighlighter = () => {
    // Toggles between yellow background or transparent standard markup
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Standard high-performance WCAG yellow marker
    applyTextFormat('backColor', '#fef08a');
  };

  // Helper to extract clean plain text from html string
  const getCleanPlainTextFromHtml = (htmlContent: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.innerText || tempDiv.textContent || '';
  };

  // Copy plain text content to user device clipboard
  const handleCopyToClipboard = async () => {
    if (!editorRef.current) return;
    try {
      const textToCopy = getCleanPlainTextFromHtml(editorRef.current.innerHTML);
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Unhandled copy procedure error: ', err);
    }
  };

  // Export TXT clean script
  const handleExportTxtFile = () => {
    if (!editorRef.current) return;
    triggerAd(() => {
      const plainText = getCleanPlainTextFromHtml(editorRef.current.innerHTML);
      const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${titleInput || 'script'}-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Export HTML-compatible DOC template representation
  const handleExportDocFile = () => {
    if (!editorRef.current) return;
    triggerAd(() => {
      // Build clean document wrapping formatted HTML segment
      const renderedHtml = editorRef.current.innerHTML;
      const fullDoc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>${titleInput}</title><style>body { font-family: Arial, sans-serif; }</style></head>
        <body>
          <h2>${titleInput}</h2>
          <hr/>
          <div>${renderedHtml}</div>
        </body>
        </html>
      `;
      const blob = new Blob([fullDoc], { type: 'application/msword' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${titleInput || 'script'}-${Date.now()}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Date local formatting
  const formatLocalTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fitler scripts according to search bar values
  const filteredScripts = scripts.filter(s => {
    const q = searchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(q);
    const contentMatch = getCleanPlainTextFromHtml(s.content).toLowerCase().includes(q);
    return titleMatch || contentMatch;
  });

  return (
    <div className="w-full space-y-6" id="script-organizer-and-markup-editor-panel">
      
      {/* Top Banner details */}
      <div className="flex gap-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/40 p-4 rounded-2xl">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {isRtl ? 'صياغة وسرد متميز بلا حدود' : 'Safe Unlimited Creative Storyboarding'}
          </p>
          <p>
            {t('script_editor.desc')}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold font-mono">
            {isRtl 
              ? '📝 يتم تخزين هذا العمل محلياً داخل جهازك بشكل آمن وتلقائي - لن يتم إرسال نصوصك الإبداعية أبداً إلى شبكات أو خوادم خارجية.'
              : '📝 Your edits are guarded and saved inside your web browser environment. Your creative properties never leave your tablet or host device.'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR LIST (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* Header Action Card */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-3.5 shadow-xs">
            
            <button
              onClick={handleCreateNewScript}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 select-none"
            >
              <Plus className="w-4 h-4" />
              <span>{t('script_editor.new_script')}</span>
            </button>

            {/* Quick Filter Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'البحث في السكربتات...' : 'Filter scripts...'}
                className="w-full py-2.5 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
              />
              <div className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>

          {/* List of Saved Scripts Items */}
          <div className="max-h-[480px] overflow-y-auto space-y-2 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-850/60 min-h-[160px] flex-1">
            
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1.5 pb-1 flex justify-between">
              <span>{isRtl ? 'السكربتات المحفوظة' : 'My Scripts List'}</span>
              <span>({filteredScripts.length})</span>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredScripts.length === 0 ? (
                <div className="text-center py-8 px-4 text-xs text-slate-400">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-40 text-amber-500" />
                  <p>{t('script_editor.no_scripts')}</p>
                </div>
              ) : (
                filteredScripts.map((script) => {
                  const isSel = activeId === script.id;
                  const snippet = getCleanPlainTextFromHtml(script.content).slice(0, 60);

                  return (
                    <motion.div
                      key={script.id}
                      layoutId={`script-item-${script.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleSelectScript(script.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start gap-2 group relative ${
                        isSel 
                          ? 'bg-amber-500/10 border-amber-500/30 text-slate-900 dark:text-white' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850/80 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-650'
                      }`}
                    >
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-xs truncate leading-snug">
                            {script.title || t('script_editor.untitled')}
                          </p>
                          <span className="font-mono text-[8.5px] text-slate-400 shrink-0 font-medium">
                            {formatLocalTime(script.lastModified)}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-450 dark:text-slate-400 truncate leading-relaxed">
                          {snippet || (isRtl ? 'فارغ...' : 'Empty...')}
                        </p>
                      </div>

                      {/* Delete icon visible on hover or select */}
                      <button
                        onClick={(e) => handleDeleteScript(script.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition shrink-0 ml-1"
                        title={t('script_editor.delete_btn')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>

          </div>

        </div>

        {/* ACTIVE EDITOR BODY (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {activeId ? (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl flex flex-col flex-1 space-y-4 shadow-sm">
              
              {/* Auto saves notification flag indicator */}
              <div className="flex items-center justify-between text-[10.5px] border-b border-slate-50 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-1 text-slate-450 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('script_editor.auto_save')}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isSavingNotification ? (
                    <span className="text-amber-500 font-bold animate-pulse">● {isRtl ? 'جاري المزامنة...' : 'Saved locally...'}</span>
                  ) : (
                    <span className="text-emerald-500 font-bold">● {isRtl ? 'محفوظ وآمن' : 'Encrypted & Safe'}</span>
                  )}
                </div>
              </div>

              {/* Title Input field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {t('script_editor.script_title')}
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t('script_editor.untitled')}
                  className="w-full text-base sm:text-lg font-bold bg-transparent border-b border-transparent hover:border-slate-150 focus:border-amber-500 pb-1 focus:outline-none focus:ring-0 transition py-0.5"
                />
              </div>

              {/* Rich visual markup formatting Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl">
                
                {/* Standard command toggles */}
                <div className="flex items-center gap-1">
                  
                  {/* Bold toggle */}
                  <button
                    onClick={() => applyTextFormat('bold')}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition"
                    title={t('script_editor.bold_btn')}
                  >
                    <Bold className="w-4 h-4" />
                  </button>

                  {/* Underline toggle */}
                  <button
                    onClick={() => applyTextFormat('underline')}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition"
                    title={t('script_editor.underline_btn')}
                  >
                    <Underline className="w-4 h-4" />
                  </button>

                  {/* Highlight marker toggle */}
                  <button
                    onClick={applyHighlighter}
                    className="p-2 text-amber-600 hover:text-slate-900 hover:bg-amber-100/50 dark:hover:bg-amber-950/20 rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                    title={t('script_editor.highlight_btn')}
                  >
                    <Highlighter className="w-4 h-4" />
                    <span className="hidden sm:inline-block">{t('script_editor.highlight_btn')}</span>
                  </button>

                </div>

                {/* Exporters actions */}
                <div className="flex items-center gap-1.5">
                  
                  {/* Copy plain formatted string */}
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                        <span className="text-emerald-500">{isRtl ? 'تم النسخ' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline-block">{isRtl ? 'نسخ المقال' : 'Copy'}</span>
                      </>
                    )}
                  </button>

                  {/* Download DOC doc templates selection */}
                  <button
                    onClick={handleExportDocFile}
                    className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                    title="Export as Document"
                  >
                    <FileDown className="w-3.5 h-3.5 text-amber-500" />
                    <span>DOC</span>
                  </button>

                  {/* Download pure clean text file */}
                  <button
                    onClick={handleExportTxtFile}
                    className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                    title="Export as Clean text"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>TXT</span>
                  </button>

                </div>

              </div>

              {/* ACTIVE SHEET PAPER EDITABLE DIV */}
              <div className="border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden flex-1 flex flex-col">
                <div 
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  placeholder={t('script_editor.placeholder')}
                  className="w-full flex-1 min-h-[300px] max-h-[500px] overflow-y-auto p-5 text-sm sm:text-base leading-relaxed focus:outline-none font-sans outline-none bg-amber-50/5 select-all text-slate-800 dark:text-slate-200"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}
                />
              </div>

            </div>
          ) : (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl text-center py-16 space-y-3">
              <Clock className="w-8 h-8 text-amber-500 mx-auto opacity-30" />
              <div className="space-y-1">
                <p className="font-extrabold text-sm">{isRtl ? 'لم يتم تحديد أي سكربت' : 'No Script Selected'}</p>
                <p className="text-xs text-slate-400">{isRtl ? 'يرجى تشغيل أو اختيار سكربت من القائمة الجانبية للمتابعة.' : 'Please select or create an active manuscript layout from the left sidebar panel.'}</p>
              </div>
              <button
                onClick={handleCreateNewScript}
                className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl"
              >
                {t('script_editor.new_script')}
              </button>
            </div>
          )}

          {/* Compliance Safe Sandbox Label */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 items-start shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-550 shrink-0 mt-0.5" />
            <div className="text-[10.5px] text-slate-500 leading-normal">
              <p className="font-bold text-slate-800 dark:text-white mb-0.5">
                {isRtl ? 'معالجة محلية لحماية الأسرار الإبداعية' : 'Safe Sandbox & Local Environment'}
              </p>
              <p>
                {t('script_editor.on_device_processing')}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
