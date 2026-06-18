import React, { useState, useRef } from 'react';
import { 
  Binary, 
  ArrowRightLeft, 
  Upload, 
  Copy, 
  Check, 
  Trash2, 
  FileImage, 
  AlertCircle, 
  Info,
  Sparkles,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'base64_tool',
  icon: 'Binary',
  category: 'utility',
  isFullyInteractive: true,
  titleKey: 'tool_base64_tool_title',
  descKey: 'tool_base64_tool_desc',
};

// Safe Unicode Base64 Helper utilities
function encodeUnicodeBase64(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (e) {
    return btoa(text); // Fallback for pure binary strings
  }
}

function decodeUnicodeBase64(base64: string): string {
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    return atob(base64); // Fallback
  }
}

export default function Base64Tool({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Image Base64 States
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDetails, setImageDetails] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEncodeText = () => {
    if (!inputText.trim()) return;
    setErrorMessage(null);
    triggerAd(() => {
      try {
        const result = encodeUnicodeBase64(inputText);
        setOutputText(result);
      } catch (err: any) {
        setErrorMessage(isRtl ? 'فشل التشفير. تأكد من إدخال نصوص صالحة.' : 'Encoding failed. Verify string contents.');
      }
    });
  };

  const handleDecodeText = () => {
    if (!inputText.trim()) return;
    setErrorMessage(null);
    triggerAd(() => {
      try {
        const result = decodeUnicodeBase64(inputText.trim());
        setOutputText(result);
      } catch (err: any) {
        setErrorMessage(
          isRtl 
            ? 'فشل فك التشفير. الكود المدخل ليس كود Base64 صالحاً أو يحتوي على رموز تالفة.' 
            : 'Decoding failed. The source is not a valid Base64 string.'
        );
      }
    });
  };

  // Process uploaded image file to Data URL
  const processImageFile = (file: File) => {
    if (!file) return;

    // Check size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(
        isRtl 
          ? 'عذراً، حجم الصورة يتجاوز الحد المسموح به (2 ميغابايت) للحفاظ على كفاءة المتصفح.' 
          : 'File size exceeds browser safety limit (2 MB).'
      );
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        isRtl 
          ? 'نوع الملف غير صالح، يرجى رفع ملفات صور فقط.' 
          : 'Invalid file type. Please upload image files only.'
      );
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setImageUri(e.target.result);
        setImageDetails({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type
        });
        // Auto copy choice
        setOutputText(e.target.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage(isRtl ? 'حدث خطأ أثناء قراءة ملف الصورة.' : 'Error reading image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleCopyOutput = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // silent
    }
  };

  const clearAllStates = () => {
    setInputText('');
    setOutputText('');
    setErrorMessage(null);
    setImageUri(null);
    setImageDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-6" id="base64-tool-root-workspace">
      
      {/* Dynamic Intro Welcome banner */}
      <div className="flex gap-4 p-5 bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-150 dark:border-emerald-900/30 rounded-2xl shadow-xs">
        <Binary className="w-6 h-6 text-emerald-650 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-705 dark:text-slate-300 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('base64_tool.title')}
          </h3>
          <p className="text-xs">
            {t('base64_tool.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-emerald-650 dark:text-emerald-400">
            {isRtl 
              ? '⚡ خصوصية بيانات فائقة: تتم معالجة النصوص وضغط الصور محلياً 100% باستخدام كائنات FileReader القياسية دون رفعها لأي خادم خارجي.'
              : '⚡ Absolute Data Privacy: Image and text parsing loops execute fully inside your device sandbox with native FileReader APIs.'
            }
          </p>
        </div>
      </div>

      {/* Workspace Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Text Input, Buttons and Drag-Drop */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 p-5 rounded-2xl shadow-3xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/60 pb-3">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-555" />
                <span>{isRtl ? 'تشفير وفك تشفير النصوص' : 'Text Processing'}</span>
              </span>

              {inputText && (
                <button 
                  onClick={clearAllStates} 
                  className="p-1 hover:text-rose-500 transition cursor-pointer"
                  title="Clear parameters"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </h4>

            <div className="space-y-1">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={
                  isRtl 
                    ? 'أدخل النص العادي لتشفيره، أو كود الـ Base64 لفك تشفيره هنا...' 
                    : 'Enter clean text to encode, or paste Base64 code to decode here...'
                }
                className="w-full h-36 p-3.5 font-sans text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-800 dark:text-slate-150 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none select-text"
              />
            </div>

            {/* Quick action buttons row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleEncodeText}
                disabled={!inputText.trim()}
                className="py-3 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>{t('base64_tool.encode_btn')}</span>
              </button>

              <button
                onClick={handleDecodeText}
                disabled={!inputText.trim()}
                className="py-3 px-5 rounded-xl text-xs font-bold text-emerald-650 dark:text-emerald-400 bg-emerald-58/40 dark:bg-emerald-955/15 border border-emerald-110 dark:border-emerald-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('base64_tool.decode_btn')}</span>
              </button>
            </div>
          </div>

          {/* IMAGE DATA-URI CONVERSION BOARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 p-5 rounded-2xl shadow-3xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/60 pb-3">
              <FileImage className="w-4 h-4 text-blue-500" />
              <span>{t('base64_tool.image_section')}</span>
            </h4>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' 
                  : 'border-slate-205 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-800 bg-slate-50/50 dark:bg-slate-950/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              
              <Upload className="w-8 h-8 text-slate-400 shrink-0" />
              
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  {isRtl 
                    ? 'اسحب وأفلت ملف الصورة هنا، أو اضغط للتصفح' 
                    : 'Drag & Drop your image here, or click to browse'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isRtl 
                    ? 'الحد الأقصى لحجم ملف الصورة: 2 ميغابايت' 
                    : 'Maximum image file size safety allocation: 2 MB'}
                </p>
              </div>
            </div>

            {/* Preview Selected Local Image parameters */}
            {imageDetails && imageUri && (
              <div className="p-3 bg-slate-50 dark:bg-slate-955/30 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    <img 
                      src={imageUri} 
                      alt="loaded Data" 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]" title={imageDetails.name}>
                      {imageDetails.name}
                    </p>
                    <p className="text-[10px] text-slate-450 font-mono">
                      {imageDetails.size} • {imageDetails.type}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageUri(null);
                    setImageDetails(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إزالة' : 'Clear'}</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right column: Formatted Output Arena */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 p-5 rounded-2xl shadow-3xs space-y-4 flex-1 flex flex-col justify-between select-text">
            
            <div className="space-y-3 flex-1 flex flex-col">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5 select-none">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? 'النتيجة والكود المستخرج' : 'Extracted Output Code'}</span>
              </h4>

              <div className="relative flex-1 flex flex-col min-h-[220px]">
                <textarea
                  readOnly
                  value={outputText}
                  placeholder={
                    isRtl 
                      ? 'الرمز المشفر أو النص المسترجع سيظهر هنا تلقائياً بعد الضغط...' 
                      : 'Encoded or decoded output string will instantly materialize here...'
                  }
                  className="w-full flex-1 p-3.5 font-mono text-[11px] border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 focus:outline-none leading-relaxed resize-none select-text"
                />
              </div>
            </div>

            {/* General Copy Trigger actions */}
            {outputText && (
              <div className="pt-4">
                <button
                  onClick={handleCopyOutput}
                  className="w-full py-3.5 px-5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-850 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{isRtl ? 'تم النسخ بنجاح!' : 'Copied Success Details!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{imageUri && outputText === imageUri ? t('base64_tool.copy_uri_btn') : (isRtl ? 'نسخ الكود الناتج للمذكرة' : 'Copy Output Code') }</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl flex gap-3 text-xs text-slate-500 mt-4 leading-normal select-text">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 dark:text-white block">
                {isRtl ? 'عن صيغة الـ Data-URI:' : 'About Data-URI Format:'}
              </strong>
              <p>
                {isRtl 
                  ? 'تمكنك صيغة كود الصورة من تضمين الصور بداخل كود HTML أو CSS كسطر واحد مباشرة للتخلص من طلبات الـ HTTP وتحسين سرعة تحميل الموقع الإلكتروني بشكل كبير.'
                  : 'Data URIs enable putting images inline under HTML or CSS strings directly, eliminating extra HTTP request overhead efficiently.'}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ERROR DEBUG LOG NOTIFICATION */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 dark:bg-rose-955/10 border border-rose-105 dark:border-rose-900/30 rounded-xl flex gap-3 text-xs text-rose-800 dark:text-rose-450 select-text font-sans"
            id="base64-calc-error-banner"
          >
            <AlertCircle className="w-5 h-5 text-rose-550 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <strong className="font-bold block">{isRtl ? 'تنبيه معالجة:' : 'Process alert details:'}</strong>
              <p>{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
