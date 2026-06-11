import { lazy, Suspense } from 'react';
import { Language, TranslationSet } from '../types';

// Lazy load the independent tool components from the tools folder
const ImageCompressor = lazy(() => import('../tools/ImageCompressor'));
const TextCutter = lazy(() => import('../tools/TextCutter'));
const ImageExtractor = lazy(() => import('../tools/ImageExtractor'));

interface InteractiveToolsProps {
  currentLang: Language;
  t: (key: keyof TranslationSet) => string;
  activeToolId: string;
}

export function InteractiveTools({ currentLang, t, activeToolId }: InteractiveToolsProps) {
  const isRtl = currentLang === 'ar';

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-xl overflow-hidden p-6 md:p-8">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span>{t('loadingTool')}</span>
        </div>
      }>
        {activeToolId === 'compressor' && (
          <ImageCompressor t={t} isRtl={isRtl} currentLang={currentLang} />
        )}
        {activeToolId === 'cutter' && (
          <TextCutter t={t} isRtl={isRtl} currentLang={currentLang} />
        )}
        {activeToolId === 'extractor' && (
          <ImageExtractor t={t} isRtl={isRtl} currentLang={currentLang} />
        )}
      </Suspense>
    </div>
  );
}
