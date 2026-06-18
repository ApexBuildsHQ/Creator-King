import { useState, useEffect } from 'react';
import { Scissors, Check, Copy } from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';
import { useAdManager } from '../context/AdContext';

export const toolInfo: ToolInfo = {
  id: 'cutter',
  icon: 'Scissors',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_cutter_title',
  descKey: 'tool_cutter_desc',
};

interface TextCutterProps {
  currentLang: Language;
  t: (key: keyof TranslationSet) => string;
  isRtl: boolean;
}

export default function TextCutter({ t, isRtl }: TextCutterProps) {
  const { triggerAd } = useAdManager();
  const [inputText, setInputText] = useState('');
  const [cutType, setCutType] = useState<'chars' | 'words' | 'lines'>('chars');
  const [limit, setLimit] = useState(100);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ chars: 0, words: 0, lines: 0 });

  // Calculate real stats
  useEffect(() => {
    const chars = inputText.length;
    const words = inputText.trim() === '' ? 0 : inputText.trim().split(/\s+/).length;
    const lines = inputText === '' ? 0 : inputText.split('\n').length;
    setStats({ chars, words, lines });
  }, [inputText]);

  // Perform Slice operation
  const getCutText = () => {
    if (!inputText) return '';
    if (cutType === 'chars') {
      return inputText.slice(0, limit);
    } else if (cutType === 'words') {
      const words = inputText.split(/(\s+)/);
      // Even indices represent words, odd represent spacing
      let wordCount = 0;
      let limitIndex = 0;
      for (let i = 0; i < words.length; i++) {
        if (words[i].trim() !== '') {
          wordCount++;
        }
        if (wordCount > limit) {
          break;
        }
        limitIndex = i + 1;
      }
      return words.slice(0, limitIndex).join('');
    } else {
      // Lines cutting
      const lines = inputText.split('\n');
      return lines.slice(0, limit).join('\n');
    }
  };

  const currentCutResult = getCutText();

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, trying fallback", err);
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return !!successful;
    } catch (err) {
      console.error("Clipboard copy fallback failed", err);
      return false;
    }
  };

  const handleCopy = () => {
    if (!currentCutResult) return;
    triggerAd(async () => {
      await copyToClipboard(currentCutResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 dark:text-amber-400">
          <Scissors className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('cutterTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('cutterDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INPUT AND OPTIONS (LEFT/RIGHT DEPENDING ON RTL) */}
        <div className="lg:col-span-12 xl:col-span-6 space-y-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">
            {t('originalDocumentSource')}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('textToCut')}
            className="w-full h-[220px] rounded-2xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50/20 dark:bg-slate-900/20 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-sans"
          />

          {/* Quick metric stats */}
          <div className="flex flex-wrap gap-2">
            <span className="py-1 px-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs rounded-full font-medium">
              {stats.chars} {t('charactersStats')}
            </span>
            <span className="py-1 px-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs rounded-full font-medium">
              {stats.words} {t('wordsStats')}
            </span>
            <span className="py-1 px-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs rounded-full font-medium">
              {stats.lines} {t('linesStats')}
            </span>
          </div>
        </div>

        {/* OPERATIONS AND RESULT */}
        <div className="lg:col-span-12 xl:col-span-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Cut style selection */}
            <div>
              <span className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                {t('trimmingStrategy')}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setCutType('chars'); setLimit(100); }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold select-none transition ${
                    cutType === 'chars'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50'
                  }`}
                >
                  {t('byCharacters')}
                </button>
                <button
                  onClick={() => { setCutType('words'); setLimit(25); }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold select-none transition ${
                    cutType === 'words'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50'
                  }`}
                >
                  {t('byWords')}
                </button>
                <button
                  onClick={() => { setCutType('lines'); setLimit(5); }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold select-none transition ${
                    cutType === 'lines'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50'
                  }`}
                >
                  {t('byLines')}
                </button>
              </div>
            </div>

            {/* Range selection limit */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-605 dark:text-gray-300 font-medium">{t('cutLimit')}</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{limit}</span>
              </div>
              <input
                type="range"
                min="1"
                max={cutType === 'chars' ? 1000 : cutType === 'words' ? 250 : 50}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2 flex-grow flex flex-col justify-end">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-slate-300">
              <span>{t('cutResult')}</span>
              {currentCutResult && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500">{t('copiedMsg')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t('copyBtn')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="w-full h-[150px] overflow-y-auto rounded-2xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50/50 dark:bg-slate-900/50 text-gray-800 dark:text-slate-200 text-sm font-sans break-words whitespace-pre-wrap">
              {currentCutResult ? (
                currentCutResult
              ) : (
                <span className="text-gray-400 text-xs italic">
                  {t('trimmedResultsPlaceholder')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
