import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  RotateCw, 
  Copy, 
  Check, 
  Sparkles, 
  Plus, 
  Minus, 
  Languages, 
  Sliders, 
  BookOpen, 
  Laptop,
  AlignLeft,
  RefreshCw,
  Info
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'lorem_ipsum',
  icon: 'FileText',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_lorem_ipsum_title',
  descKey: 'tool_lorem_ipsum_desc',
};

// Linguistic Database
const WORD_POOLS: Record<string, Record<'classic' | 'modern', string[]>> = {
  LATIN: {
    classic: [
      "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", 
      "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", 
      "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud", 
      "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", 
      "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit", 
      "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla", 
      "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", 
      "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"
    ],
    modern: [
      "responsive", "viewport", "grid", "tailwind", "framework", "flexbox", "endpoint", 
      "payload", "metadata", "component", "render", "hooks", "state", "context", "async", 
      "callback", "deployment", "microservices", "database", "analytics", "bandwidth", 
      "compression", "caching", "scalability", "redundancy", "pipeline", "automation", 
      "container", "serverless", "middleware", "latency", "token", "encryption", "auth"
    ]
  },
  EN: {
    classic: [
      "whispering", "breeze", "ancient", "forest", "shadows", "glowing", "embrace", 
      "golden", "horizon", "timeless", "journey", "forgotten", "tales", "enchanted", 
      "castle", "mystic", "river", "silent", "mountains", "starlit", "night", "velvet", 
      "canopy", "ethereal", "melody", "serene", "solitude", "wanderer", "destiny", 
      "unfolding", "secrets", "echoes", "eternal", "beauty", "gentle", "ripples", 
      "crimson", "sunset", "majestic", "peaks", "emerald", "valleys", "luminous", 
      "pathway", "infinite", "possibilities", "fading", "twilight", "vintage", "prose"
    ],
    modern: [
      "innovative", "synergistic", "disruptive", "scalable", "engagement", "conversion", 
      "optimization", "infrastructure", "analytics", "dashboard", "monetization", "workflow", 
      "automation", "strategy", "ecosystem", "integration", "enterprise", "leverage", 
      "retention", "metrics", "viewport", "collaboration", "paradigm", "solutions", 
      "digital", "identity", "assets", "agile", "streamline", "interactive", "testing"
    ]
  },
  AR: {
    classic: [
      "النسيم", "العليل", "القمر", "المنير", "الصحراء", "الواسعة", "النجوم", "اللامعة", 
      "القافلة", "القديمة", "الرحيل", "الأمل", "الواعد", "الشرق", "العظيم", "الأصالة", 
      "التراث", "الخالد", "الواحة", "الخضراء", "الياسمين", "العبق", "الفواح", "التاريخ", 
      "العريق", "القصائد", "المغناة", "الألحان", "الشجية", "الشوق", "القديم", "العزم", 
      "الفروسية", "الشهامة", "الكرم", "الحكمة", "المعالي", "الهمم", "العالية", "السفر", 
      "المنارة", "الأدب", "البلاغة", "السحر", "الغموض", "الفجر", "الضحى", "الأصيل"
    ],
    modern: [
      "الرئيسية", "قاعدة", "البيانات", "التحديث", "التلقائي", "منصة", "إلكترونية", 
      "لوحة", "التحكم", "الذكاء", "الاصطناعي", "البرمجة", "السحابية", "التصميم", 
      "المتجاوب", "الواجهة", "التفاعلية", "السرعة", "تطوير", "المواقع", "الأمان", 
      "التشفير", "الهوية", "البصرية", "المقاييس", "الإحصائية", "التحليلات", "المتقدمة", 
      "التحول", "الرقمي", "تجربة", "المستخدم", "تطبيق", "الهواتف", "المشاهدات", 
      "العائدات", "الشبكة", "التدفق", "الخادم", "الاستضافة", "السرعة", "النطاق"
    ]
  },
  ES: {
    classic: [
      "viento", "susurra", "historias", "antiguas", "glorioso", "valle", "sombras", 
      "doradas", "camino", "eterna", "felicidad", "estrellas", "brillan", "misteriosa", 
      "canta", "canción", "olvido", "cielo", "infinito", "serena", "primavera", 
      "florida", "vida", "mar", "silencioso", "montañas", "bosque", "romántico", 
      "corazón", "nobleza", "leyenda", "pueblo", "antiguo", "sabor", "tradición", 
      "horizonte", "crepúsculo", "amanecer", "sueño", "iluminado", "cálido", "abrigo"
    ],
    modern: [
      "interfaz", "desarrollo", "dispositivo", "sistema", "dinámico", "optimización", 
      "pantalla", "usuario", "conversión", "estrategia", "analítica", "métricas", 
      "rendimiento", "plataforma", "digital", "diseño", "adaptativo", "arquitectura", 
      "integración", "automatización", "innovación", "tecnología", "servicios", 
      "seguridad", "nube", "aplicación", "datos", "conexión", "flujo", "interacción"
    ]
  }
};

// Sentences starter helpers to add realistic structure variation
const SENTENCE_CONNECTORS: Record<string, string[]> = {
  LATIN: ["Et", "Sed", "Quis", "Nam", "At", "Ut", "Aenean", "Morbi", "Nullam", "Phasellus"],
  EN: ["Therefore,", "Moreover,", "Indeed,", "With", "However,", "Although", "In", "Meanwhile,", "Furthermore,"],
  AR: ["علاوة على ذلك،", "ومن هذا المنطِق،", "وفي ذات الوقت،", "وفي هذا النحو،", "بناءً على ذلك،", "وعلى صعيدٍ آخر،", "ومن الجدير بالذكر أن", "وحيثما تكون"],
  ES: ["Por lo tanto,", "Además,", "Ciertamente,", "Sin embargo,", "Mientras tanto,", "Por consiguiente,"]
};

// Build random text based on a lightweight seed
function generateDeterministicLispum(
  lang: 'AR' | 'EN' | 'LATIN' | 'ES',
  style: 'classic' | 'modern',
  unit: 'word' | 'sentence' | 'paragraph',
  count: number
): string {
  const words = WORD_POOLS[lang]?.[style] || WORD_POOLS.LATIN.classic;
  const connectors = SENTENCE_CONNECTORS[lang] || SENTENCE_CONNECTORS.LATIN;

  // Simple pseudo random index helper
  let seed = 42;
  const nextRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const getWord = () => {
    const idx = Math.floor(nextRandom() * words.length);
    return words[idx];
  };

  const getSentence = (isFirstInParagraph = false) => {
    const len = 6 + Math.floor(nextRandom() * 8); // 6 to 13 words
    const sentenceWords: string[] = [];
    
    // Add connector occasionally
    if (!isFirstInParagraph && nextRandom() < 0.4) {
      const connIdx = Math.floor(nextRandom() * connectors.length);
      sentenceWords.push(connectors[connIdx]);
    }

    for (let i = 0; i < len; i++) {
      sentenceWords.push(getWord());
    }

    let sentenceStr = sentenceWords.join(' ');
    
    // Formatting punctuation and casing correctly
    if (lang !== 'AR') {
      sentenceStr = sentenceStr.charAt(0).toUpperCase() + sentenceStr.slice(1);
      return sentenceStr + '.';
    } else {
      // Arabic doesn't use capital letters, just a perfect trailing dot or comma
      return sentenceStr + '،';
    }
  };

  const getParagraph = () => {
    const sentencesCount = 3 + Math.floor(nextRandom() * 3); // 3 to 5 sentences
    const sentencesList: string[] = [];
    for (let s = 0; s < sentencesCount; s++) {
      sentencesList.push(getSentence(s === 0));
    }
    let pStr = sentencesList.join(' ');
    if (pStr.endsWith('،')) {
      pStr = pStr.slice(0, -1) + ' .';
    }
    return pStr;
  };

  // Switch structure logic
  if (unit === 'word') {
    const results: string[] = [];
    for (let w = 0; w < count; w++) {
      results.push(getWord());
    }
    let rawStr = results.join(' ');
    if (lang !== 'AR') {
      rawStr = rawStr.charAt(0).toUpperCase() + rawStr.slice(1);
    }
    return rawStr;
  }

  if (unit === 'sentence') {
    const sentences: string[] = [];
    for (let s = 0; s < count; s++) {
      let sent = getSentence(true);
      if (lang === 'AR' && sent.endsWith('،')) {
        sent = sent.slice(0, -1) + ' .';
      }
      sentences.push(sent);
    }
    return sentences.join(' ');
  }

  // Paragraphs
  const paragraphs: string[] = [];
  for (let p = 0; p < count; p++) {
    paragraphs.push(getParagraph());
  }
  return paragraphs.join('\n\n');
}

export default function LoremIpsumGenerator({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [targetLang, setTargetLang] = useState<'AR' | 'EN' | 'LATIN' | 'ES'>('LATIN');
  const [unitType, setUnitType] = useState<'word' | 'sentence' | 'paragraph'>('paragraph');
  const [styleMode, setStyleMode] = useState<'classic' | 'modern'>('classic');
  const [quantity, setQuantity] = useState<number>(3);
  const [resultText, setResultText] = useState<string>('');
  
  const [copied, setCopied] = useState<boolean>(false);

  // Auto setup Dynamic Alignment/Text Direction based on generated language selection
  const isGeneratedRtl = targetLang === 'AR';

  useEffect(() => {
    handleGenerateText();
  }, [targetLang, unitType, styleMode]);

  const handleGenerateText = () => {
    // Validate bounds
    const count = Math.max(1, Math.min(100, quantity));
    const generated = generateDeterministicLispum(targetLang, styleMode, unitType, count);
    setResultText(generated);
  };

  const incrementValue = () => {
    setQuantity(prev => {
      const nextVal = Math.min(100, prev + 1);
      setTimeout(() => {
        const gen = generateDeterministicLispum(targetLang, styleMode, unitType, nextVal);
        setResultText(gen);
      }, 0);
      return nextVal;
    });
  };

  const decrementValue = () => {
    setQuantity(prev => {
      const nextVal = Math.max(1, prev - 1);
      setTimeout(() => {
        const gen = generateDeterministicLispum(targetLang, styleMode, unitType, nextVal);
        setResultText(gen);
      }, 0);
      return nextVal;
    });
  };

  const handleTriggerGenerateBtn = () => {
    triggerAd(() => {
      handleGenerateText();
    });
  };

  const handleCopyClipboard = async () => {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent protection
    }
  };

  return (
    <div className="w-full space-y-6" id="global-lorem-generator-root">
      
      {/* Intro Welcome Frame */}
      <div className="flex gap-4 p-5 bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-150 dark:border-emerald-900/30 rounded-2xl shadow-xs">
        <FileText className="w-6 h-6 text-emerald-650 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-705 dark:text-slate-300 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('lorem_ipsum.title')}
          </h3>
          <p className="text-xs">
            {t('lorem_ipsum.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-emerald-650 dark:text-emerald-400">
            {isRtl 
              ? '⚡ معالجة محلية بالكامل: يتم توليد وصياغة النصوص العشوائية محلياً بداخل خوارزميات المتصفح لتلبية احتياجات التصميم والتدوين فوراً.'
              : '⚡ Local Instant Engine: Structured prose templates are synthesized on-device inside your browser without backend network roundtrips.'
            }
          </p>
        </div>
      </div>

      {/* Control Station Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Settings Box */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 p-5 rounded-2xl shadow-3xs space-y-4">
            
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 pb-3 border-b border-slate-50 dark:border-slate-800/60 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>{isRtl ? 'خيارات التوليد والتحكم' : 'Generation Controls'}</span>
            </h4>

            {/* Target Language dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-450 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" />
                <span>{t('lorem_ipsum.lang_select')}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-105 dark:border-slate-850">
                {(['AR', 'EN', 'LATIN', 'ES'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setTargetLang(l)}
                    className={`py-2 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      targetLang === l
                        ? 'bg-emerald-600 text-white shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Logical Styles select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-450 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('lorem_ipsum.style_mode')}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-105 dark:border-slate-850">
                <button
                  onClick={() => setStyleMode('classic')}
                  className={`py-2 px-1.5 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    styleMode === 'classic'
                      ? 'bg-emerald-600 text-white shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <BookOpen className="w-3 h-3 shrink-0" />
                  <span className="truncate">{t('lorem_ipsum.style_classic')}</span>
                </button>
                <button
                  onClick={() => setStyleMode('modern')}
                  className={`py-2 px-1.5 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    styleMode === 'modern'
                      ? 'bg-emerald-600 text-white shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <Laptop className="w-3 h-3 shrink-0" />
                  <span className="truncate">{t('lorem_ipsum.style_modern')}</span>
                </button>
              </div>
            </div>

            {/* Target model unit: words, sentences, paragraphs */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-450 flex items-center gap-1">
                <AlignLeft className="w-3.5 h-3.5" />
                <span>{t('lorem_ipsum.unit_type')}</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-105 dark:border-slate-850">
                <button
                  onClick={() => setUnitType('word')}
                  className={`py-2 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                    unitType === 'word'
                      ? 'bg-emerald-600 text-white shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  {t('lorem_ipsum.unit_word')}
                </button>
                <button
                  onClick={() => setUnitType('sentence')}
                  className={`py-2 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                    unitType === 'sentence'
                      ? 'bg-emerald-600 text-white shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  {t('lorem_ipsum.unit_sentence')}
                </button>
                <button
                  onClick={() => setUnitType('paragraph')}
                  className={`py-2 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                    unitType === 'paragraph'
                      ? 'bg-emerald-600 text-white shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  {t('lorem_ipsum.unit_paragraph')}
                </button>
              </div>
            </div>

            {/* DESIRED QUANTITY CONTROLS */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-450 block">
                {t('lorem_ipsum.count_label')}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={decrementValue}
                  disabled={quantity <= 1}
                  className="w-12 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-3xs"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 text-center bg-slate-50 dark:bg-slate-950/70 border border-slate-105 dark:border-slate-850 py-3.5 rounded-xl font-mono font-black text-lg text-slate-800 dark:text-white select-text">
                  {quantity}
                </div>

                <button
                  onClick={incrementValue}
                  disabled={quantity >= 100}
                  className="w-12 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-3xs"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Big Action Call Button */}
            <div className="pt-2">
              <button
                onClick={handleTriggerGenerateBtn}
                className="w-full py-3.5 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('lorem_ipsum.gen_btn')}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Output Area */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 p-5 rounded-2xl shadow-3xs flex-1 flex flex-col justify-between select-text min-h-[380px]">
            
            <div className="space-y-3 flex-1 flex flex-col">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 pb-2 border-b border-slate-50 dark:border-slate-800/40 select-none">
                {isRtl ? 'معاينة النص العشوائي المولد' : 'Stylized Placeholder Output'}
              </h4>

              {/* Textarea container that adopts Language Direction */}
              <div className="relative flex-1 flex flex-col">
                <textarea
                  readOnly
                  value={resultText}
                  dir={isGeneratedRtl ? 'rtl' : 'ltr'}
                  className={`w-full flex-1 p-4 font-sans text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-960 text-slate-800 dark:text-slate-200 focus:outline-none leading-relaxed select-text min-h-[220px] ${
                    isGeneratedRtl ? 'text-right' : 'text-left'
                  }`}
                />
              </div>
            </div>

            {/* Copy Command Controls */}
            {resultText && (
              <div className="pt-4">
                <button
                  onClick={handleCopyClipboard}
                  className="w-full py-3.5 px-5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-850 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{t('lorem_ipsum.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t('lorem_ipsum.copy_btn')}</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* Quick Informational Tip Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl flex gap-3 text-xs text-slate-500 mt-4 leading-normal select-text">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 dark:text-white block">
                {isRtl ? 'لماذا نستخدم لوريم إيبسوم؟' : 'Why use Dummy Text?'}
              </strong>
              <p>
                {isRtl 
                  ? 'يُستخدم حشو النصوص لتجربة مظهر الخطوط وحجم الفقرات والتنسيقات البصرية قبل توفير المحتوى الفعلي؛ مما يمنع تشتيت العميل بقرائتها ويوجه الانتباه للجمال المعماري للتصميم.'
                  : 'Placeholder layouts prevent semantic distraction by letting designers preview real typographical sizing, structural rhythm, and container ratios before content arrives.'}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
