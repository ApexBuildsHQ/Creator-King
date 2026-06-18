import { Suspense } from 'react';
import { Language, TranslationSet } from '../types';
import { getToolComponentById } from '../utils/toolsRegistry';

interface InteractiveToolsProps {
  currentLang: Language;
  t: (key: keyof TranslationSet) => string;
  activeToolId: string;
}

export function InteractiveTools({ currentLang, t, activeToolId }: InteractiveToolsProps) {
  const isRtl = currentLang === 'ar';
  const ToolComponent = getToolComponentById(activeToolId);

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-xl overflow-hidden p-6 md:p-8">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span>{t('loadingTool')}</span>
        </div>
      }>
        {ToolComponent ? (
          <ToolComponent t={t} isRtl={isRtl} currentLang={currentLang} />
        ) : (
          <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">
            {t('noToolsFound')}
          </div>
        )}
      </Suspense>
    </div>
  );
}
