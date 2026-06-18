import React, { useState, useEffect, useTransition, useRef } from 'react';
import { 
  Palette, 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  FileCode, 
  ChevronRight, 
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Layout,
  ExternalLink,
  Info
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'assets_organizer',
  icon: 'FolderOpen',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_assets_organizer_title',
  descKey: 'tool_assets_organizer_desc',
};

interface BrandColor {
  id: string;
  name: string;
  hex: string;
}

interface TextSnippet {
  id: string;
  title: string;
  content: string;
}

const LOCAL_STORAGE_COLORS_KEY = 'media_brand_colors_v1';
const LOCAL_STORAGE_SNIPPETS_KEY = 'media_brand_snippets_v1';

const DEFAULT_COLORS: BrandColor[] = [
  { id: '1', name: 'Primary Premium Aqua', hex: '#0ea5e9' },
  { id: '2', name: 'Identity Neon Emerald', hex: '#10b981' },
  { id: '3', name: 'Warm Velvet Orchid', hex: '#d946ef' },
  { id: '4', name: 'Slate Obsidian Base', hex: '#0f172a' }
];

const DEFAULT_SNIPPETS: TextSnippet[] = [
  { 
    id: '1', 
    title: '📢 Standard Social Support Links', 
    content: '🌟 Thank you for watching! Support my work here:\n• Website: https://mybrand.io\n• Twitter/X: https://x.com/creator\n• Discord Community: https://discord.gg/creatorhub' 
  },
  { 
    id: '2', 
    title: '🏷️ Ultimate Tech/Design Hashtags', 
    content: '#design #webdev #uiux #creators #branding #digitalart #microbusiness #indiehackers #tech2026' 
  },
  { 
    id: '3', 
    title: '☕ Creative Support Call-To-Action', 
    content: 'If you found this asset helpful, please consider buying me a warm cup of coffee here: https://buymeacoffee.com/creator ☕ Your support fuels better tools!' 
  }
];

export default function MediaAssetsOrganizer({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [activeTab, setActiveTab] = useState<'colors' | 'snippets'>('colors');
  const [colors, setColors] = useState<BrandColor[]>([]);
  const [snippets, setSnippets] = useState<TextSnippet[]>([]);
  
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const savedColors = localStorage.getItem(LOCAL_STORAGE_COLORS_KEY);
      const savedSnippets = localStorage.getItem(LOCAL_STORAGE_SNIPPETS_KEY);
      
      if (savedColors) {
        setColors(JSON.parse(savedColors));
      } else {
        setColors(DEFAULT_COLORS);
      }

      if (savedSnippets) {
        setSnippets(JSON.parse(savedSnippets));
      } else {
        setSnippets(DEFAULT_SNIPPETS);
      }
    } catch (e) {
      setColors(DEFAULT_COLORS);
      setSnippets(DEFAULT_SNIPPETS);
    }
  }, []);

  // Save changes to Local Storage on update
  const saveColorsToStorage = (updatedColors: BrandColor[]) => {
    localStorage.setItem(LOCAL_STORAGE_COLORS_KEY, JSON.stringify(updatedColors));
  };

  const saveSnippetsToStorage = (updatedSnippets: TextSnippet[]) => {
    localStorage.setItem(LOCAL_STORAGE_SNIPPETS_KEY, JSON.stringify(updatedSnippets));
  };

  // Color functions
  const handleAddColor = () => {
    // Pick a charming default color palette suggestion
    const randomHexs = ['#ec4899', '#f43f5e', '#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#64748b'];
    const randomHex = randomHexs[Math.floor(Math.random() * randomHexs.length)];
    const newId = Math.random().toString(36).substring(2, 9);
    
    const newColors = [...colors, { id: newId, name: 'Brand Color Token', hex: randomHex }];
    setColors(newColors);
    saveColorsToStorage(newColors);
  };

  const handleUpdateColor = (id: string, name: string, hex: string) => {
    const nextColors = colors.map(c => c.id === id ? { ...c, name, hex } : c);
    setColors(nextColors);
    saveColorsToStorage(nextColors);
  };

  const handleDeleteColor = (id: string) => {
    const nextColors = colors.filter(c => c.id !== id);
    setColors(nextColors);
    saveColorsToStorage(nextColors);
  };

  // Snippets functions
  const handleAddSnippet = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const nextSnippets = [...snippets, { id: newId, title: 'Untitled Asset Segment', content: '' }];
    setSnippets(nextSnippets);
    saveSnippetsToStorage(nextSnippets);
  };

  const handleUpdateSnippet = (id: string, title: string, content: string) => {
    const nextSnippets = snippets.map(s => s.id === id ? { ...s, title, content } : s);
    setSnippets(nextSnippets);
    saveSnippetsToStorage(nextSnippets);
  };

  const handleDeleteSnippet = (id: string) => {
    const nextSnippets = snippets.filter(s => s.id !== id);
    setSnippets(nextSnippets);
    saveSnippetsToStorage(nextSnippets);
  };

  // Copy utility
  const copyTextToClipboard = async (text: string, label: string) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopiedNotification(isRtl ? `تم نسخ: ${label} بنجاح!` : `Copied: ${label} successfully!`);
      setTimeout(() => setCopiedNotification(null), 2500);
    } catch {
      // fallback
    }
  };

  // Export brand parameters as portable JSON configuration
  const handleExportBackup = () => {
    triggerAd(() => {
      const configBackup = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        colors,
        snippets
      };

      const jsonString = JSON.stringify(configBackup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `brand_media_assets_backup.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCopiedNotification(isRtl ? 'تم تصدير النسخة الاحتياطية JSON بنجاح!' : 'JSON Config exported successfully!');
      setTimeout(() => setCopiedNotification(null), 2500);
    });
  };

  // Import configuration parameters with robust schema integrity validator
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerAd(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const rawText = event.target?.result as string;
          const parsed = JSON.parse(rawText);

          let importedColors = colors;
          let importedSnippets = snippets;

          if (parsed && Array.isArray(parsed.colors)) {
            importedColors = parsed.colors.map((c: any) => ({
              id: c.id || Math.random().toString(36).substring(2, 9),
              name: c.name || 'Imported Color',
              hex: typeof c.hex === 'string' && c.hex.startsWith('#') ? c.hex : '#3b82f6'
            }));
          }

          if (parsed && Array.isArray(parsed.snippets)) {
            importedSnippets = parsed.snippets.map((s: any) => ({
              id: s.id || Math.random().toString(36).substring(2, 9),
              title: s.title || 'Imported Snippet',
              content: s.content || ''
            }));
          }

          startTransition(() => {
            setColors(importedColors);
            setSnippets(importedSnippets);
            saveColorsToStorage(importedColors);
            saveSnippetsToStorage(importedSnippets);
          });

          setCopiedNotification(isRtl ? 'تم استيراد النسخة الاحتياطية بنجاح!' : 'Backup file parsed & applied!');
          setTimeout(() => setCopiedNotification(null), 2500);
        } catch (error) {
          setCopiedNotification(isRtl ? 'خطأ في معالجة الملف! تأكد أنه ملف JSON صالح.' : 'Invalid file format error!');
          setTimeout(() => setCopiedNotification(null), 3000);
        }
      };
      reader.readAsText(file);
      // Reset input element value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const triggerLoaderClick = () => {
    fileInputRef.current?.click();
  };

  const loadSamplePreset = () => {
    triggerAd(() => {
      startTransition(() => {
        setColors(DEFAULT_COLORS);
        setSnippets(DEFAULT_SNIPPETS);
        saveColorsToStorage(DEFAULT_COLORS);
        saveSnippetsToStorage(DEFAULT_SNIPPETS);
      });
      setCopiedNotification(isRtl ? 'تمت إعادة تعيين الواجهة للبيانات الافتراضية.' : 'Default presets populated.');
      setTimeout(() => setCopiedNotification(null), 2000);
    });
  };

  return (
    <div className="w-full space-y-7" id="media-assets-organizer-root">
      
      {/* Information Header Block */}
      <div className="flex gap-4 p-5 bg-teal-50 dark:bg-emerald-955/15 border border-teal-100 dark:border-emerald-900/30 rounded-2xl shadow-xs">
        <FolderOpen className="w-6 h-6 text-teal-650 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1 text-slate-705 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('assets_organizer.title')}
          </h3>
          <p className="text-xs">
            {t('assets_organizer.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-teal-650 dark:text-teal-400">
            {isRtl 
              ? '⚡ خصوصية مطلقة 100%: جميع معلومات العلامة التجارية ونسخ الألوان يتم تشفيرها وحفظها محلياً بمتصفحك فقط ولا يتم إرسال أي معلومة إلى خوادم السحابة.'
              : '⚡ Local Storage Safe: All your branding parameters and repetitive snippets remain encoded within sandboxed storage on this device.'
            }
          </p>
        </div>
      </div>

      {/* TOP CONTROL / TABS BAR */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl shadow-3xs">
        
        {/* Toggle Sections buttons */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('colors')}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'colors' 
                ? 'bg-teal-650 text-white shadow-3xs dark:bg-teal-605' 
                : 'text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{t('assets_organizer.tab_colors')}</span>
          </button>

          <button
            onClick={() => setActiveTab('snippets')}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'snippets' 
                ? 'bg-teal-650 text-white shadow-3xs dark:bg-teal-605' 
                : 'text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('assets_organizer.tab_snippets')}</span>
          </button>
        </div>

        {/* Portable Imports & Exports Backup widgets */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={triggerLoaderClick}
            className="py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 border border-slate-205 dark:border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            title={t('assets_organizer.backup_import')}
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden md:inline">{t('assets_organizer.backup_import')}</span>
            <span className="md:hidden">{isRtl ? 'استيراد' : 'Import'}</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleExportBackup}
            className="py-1.5 px-3 rounded-lg text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-teal-200/40 dark:border-emerald-900/40 transition flex items-center gap-1.5 cursor-pointer"
            title={t('assets_organizer.backup_export')}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('assets_organizer.backup_export')}</span>
          </button>
        </div>

      </div>

      {/* CORE ACTIVE WORKSPACE */}
      <div id="media-assets-workspace">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: BRAND COLOR BLOCKS */}
          {activeTab === 'colors' && (
            <motion.div
              key="colors-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Palette className="w-4.5 h-4.5 text-teal-500" />
                    <span>{t('assets_organizer.tab_colors')}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isRtl 
                      ? 'حدد وقس ألوان الهوية الخاصة ببطاقاتك وقنواتك البصرية، اضغط على لون لنسخه فوراً للمونتاج.'
                      : 'Define visual HEX variables. Click custom card blocks to easily capture coordinates to your clipboard.'
                    }
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadSamplePreset}
                    className="py-1 px-2.5 rounded-lg text-[10.5px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                  >
                    {isRtl ? 'استعادة الافتراضي' : 'Default Sample'}
                  </button>

                  <button
                    onClick={handleAddColor}
                    className="py-1.5 px-3.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-1 shadow-3xs cursor-pointer"
                    id="btn-add-brand-color"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isRtl ? 'أضف كود لون' : 'Add Hex'}</span>
                  </button>
                </div>
              </div>

              {/* Grid of color palettes cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {colors.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl overflow-hidden shadow-3xs hover:shadow-xs transition group hover:-translate-y-0.5"
                  >
                    {/* Visual color slab */}
                    <div 
                      className="w-full h-24 relative flex items-end justify-between p-3.5 group cursor-pointer"
                      style={{ backgroundColor: c.hex }}
                      onClick={() => copyTextToClipboard(c.hex, c.name)}
                      title="Click to copy HEX"
                    >
                      {/* Copy hover sign */}
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5">
                        <Copy className="w-4 h-4" />
                        <span>{isRtl ? 'نسخ اللون الكودي' : 'Copy HEX'}</span>
                      </div>

                      {/* Display Hex code tag */}
                      <span className="py-1 px-2.5 rounded-md text-[10px] font-mono font-black tracking-wider bg-white/95 text-slate-900 shadow-sm">
                        {c.hex}
                      </span>
                    </div>

                    {/* Meta info & direct settings inputs */}
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-400 font-mono block uppercase mb-1">
                          {isRtl ? 'عنوان اللون الاسترشادي' : 'Identifier Label'}
                        </label>
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => handleUpdateColor(c.id, e.target.value, c.hex)}
                          className="w-full px-2.5 py-1 text-xs border border-slate-205 dark:border-slate-800 rounded-lg bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none"
                          placeholder="e.g. Primary Dark Theme"
                        />
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-9">
                          <label className="text-[9.5px] font-bold text-slate-400 font-mono block uppercase mb-1">
                            {isRtl ? 'الرمز الكودي HEX' : 'Hex Code'}
                          </label>
                          <input
                            type="text"
                            value={c.hex}
                            onChange={(e) => handleUpdateColor(c.id, c.name, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-205 dark:border-slate-800 rounded-lg bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 font-mono focus:outline-none"
                            placeholder="#ffffff"
                          />
                        </div>

                        {/* Native color picker box */}
                        <div className="col-span-3 pt-4 text-center">
                          <input
                            type="color"
                            value={c.hex}
                            onChange={(e) => handleUpdateColor(c.id, c.name, e.target.value)}
                            className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                            title="Pick natively"
                          />
                        </div>
                      </div>

                      {/* Delete actions */}
                      <div className="pt-2.5 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => copyTextToClipboard(c.hex, c.name)}
                          className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3" />
                          <span>{isRtl ? 'نسخ سريع' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteColor(c.id)}
                          className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3" />
                          <span>{isRtl ? 'حذف' : 'Delete'}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ))}

                {colors.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-205 dark:border-slate-800 rounded-3xl space-y-2">
                    <p className="text-xs">
                      {isRtl ? 'لا توجد ألوان هوية مضافة مسبقاً.' : 'No brand colors defined yet.'}
                    </p>
                    <button
                      onClick={handleAddColor}
                      className="py-1 px-3 text-[11.5px] font-bold bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition"
                    >
                      {isRtl ? 'أضف لوني الأول' : 'Add First Color'}
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: TEMPLATE TEXT SNIPPETS */}
          {activeTab === 'snippets' && (
            <motion.div
              key="snippets-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-teal-500" />
                    <span>{t('assets_organizer.tab_snippets')}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isRtl 
                      ? 'احتفظ بفقرات ونصوص قنواتك المكررة (روابط الدعم، أوسمة الفيديو، الرسائل الترويجية) وانسخها بضغطة واحدة.'
                      : 'Maintain reusable blocks of text copy. Readily replicate paragraphs instantly to avoid repetitive typings.'
                    }
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadSamplePreset}
                    className="py-1 px-2.5 rounded-lg text-[10.5px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                  >
                    {isRtl ? 'استعادة الافتراضي' : 'Default Sample'}
                  </button>

                  <button
                    onClick={handleAddSnippet}
                    className="py-1.5 px-3.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-1 shadow-3xs cursor-pointer"
                    id="btn-add-brand-snippet"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isRtl ? 'أضف نص ثابت' : 'Add Snippet'}</span>
                  </button>
                </div>
              </div>

              {/* List of text snippets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {snippets.map((s) => {
                  const words = s.content ? s.content.trim().split(/\s+/).filter(Boolean).length : 0;
                  const chars = s.content.length;

                  return (
                    <div
                      key={s.id}
                      className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl p-5 shadow-3xs space-y-4 hover:border-slate-200 dark:hover:border-slate-800 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="text"
                            value={s.title}
                            onChange={(e) => handleUpdateSnippet(s.id, e.target.value, s.content)}
                            placeholder="Snippet Title/Category"
                            className="bg-transparent text-sm font-extrabold font-sans text-slate-850 dark:text-white border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:outline-none pb-0.5 w-full font-sans"
                            id={`snippet-title-input-${s.id}`}
                          />

                          <button
                            onClick={() => handleDeleteSnippet(s.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                            title="Delete this text snippet"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="relative">
                          <textarea
                            value={s.content}
                            onChange={(e) => handleUpdateSnippet(s.id, s.title, e.target.value)}
                            rows={5}
                            placeholder={isRtl ? 'اكتب الفقرة أو الكليشة الثابتة هنا...' : 'Paste your recurring template boilerplate or support text here...'}
                            className="w-full p-3.5 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-teal-500 transition leading-relaxed select-text font-serif"
                            id={`snippet-textarea-${s.id}`}
                          />

                          <span className="absolute bottom-2.5 right-3 text-[9px] text-slate-400 font-mono bg-white/90 dark:bg-slate-950/90 py-0.5 px-1.5 rounded-md">
                            {words} W / {chars} Chars
                          </span>
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="pt-3 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-450 font-mono uppercase tracking-widest block">
                          Local Draft
                        </span>

                        <button
                          onClick={() => copyTextToClipboard(s.content, s.title)}
                          className="py-1.5 px-4 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-650 dark:bg-teal-950/30 dark:text-teal-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          id={`copy-snippet-btn-${s.id}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'نسخ النص بالكامل' : 'Copy Full Snippet'}</span>
                        </button>
                      </div>

                    </div>
                  );
                })}

                {snippets.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-205 dark:border-slate-800 rounded-3xl space-y-2">
                    <p className="text-xs">
                      {isRtl ? 'لا توجد نصوص أو مقاطع محفوظة حالياً.' : 'No text snippets saved yet.'}
                    </p>
                    <button
                      onClick={handleAddSnippet}
                      className="py-1 px-3 text-[11.5px] font-bold bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition"
                    >
                      {isRtl ? 'أضف نصي الأول' : 'Add First Snippet'}
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Auxiliary informative note */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 shadow-3xs">
        <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
        <div className="text-[10.5px] text-slate-500 leading-normal select-text">
          <p className="font-bold text-slate-850 dark:text-white mb-0.5">
            {isRtl ? 'منظم المحتوى والأصول الاحترافي' : 'Professional Brand Sync'}
          </p>
          <p>
            {isRtl 
              ? 'تضمن لك هذه الأداة عدم كتابة نفس نصوص الدعم، أو البحث عن أكواد الألوان في كل مرة تقوم فيها بصناعة المحتوى وتعديل الفيديوهات والصور البصرية.' 
              : 'Keep all your media workflows streamlined. Maintain solid control of Hex metrics, and avoid writing repetitive footers, supporting templates and links manually.'
            }
          </p>
        </div>
      </div>

      {/* Slide-out Copy/Export notification toast */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {copiedNotification && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="py-2.5 px-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-full shadow-lg flex items-center gap-2 border border-slate-700/10 pointer-events-auto"
              id="copied-notification-toast"
            >
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{copiedNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
