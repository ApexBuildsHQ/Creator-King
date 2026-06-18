import { Search } from 'lucide-react';
import { Language, TranslationSet } from '../types';

interface HeroProps {
  currentLang: Language;
  t: (key: keyof TranslationSet) => string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: 'all' | 'media' | 'video' | 'audio' | 'text' | 'utility';
  onCategoryChange: (category: 'all' | 'media' | 'video' | 'audio' | 'text' | 'utility') => void;
}

export function Hero({ currentLang, t, searchQuery, onSearchChange, activeCategory, onCategoryChange }: HeroProps) {
  return (
    <div className="relative py-12 md:py-20 overflow-hidden text-center max-w-5xl mx-auto px-4 sm:px-6">
      
      {/* Absolute Decorative ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-amber-500/10 dark:bg-amber-400/5 blur-3xl rounded-full -z-10 pointer-events-none" />
      
      {/* Main Heading H1 */}
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-medium text-slate-900 dark:text-white leading-[1.1] tracking-tight">
        {t('heroTitlePre')}
        <span className="text-amber-500 dark:text-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent inline-block font-semibold pb-1">
          {t('heroTitleKings')}
        </span>
      </h1>

      {/* Main Subtitle P */}
      <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-650 dark:text-gray-405 font-medium max-w-2xl mx-auto leading-relaxed">
        {t('heroSubtitle')}
      </p>

      {/* Bigger and ultra-responsive search input */}
      <div className="mt-10 w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto relative px-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full text-sm sm:text-base md:text-lg lg:text-xl py-3.5 sm:py-4 md:py-5 px-6 sm:px-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[2rem] shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500"
            style={{ 
              direction: currentLang === 'ar' ? 'rtl' : 'ltr',
              paddingRight: currentLang === 'ar' ? '1.5rem' : '4rem',
              paddingLeft: currentLang === 'ar' ? '4rem' : '1.5rem'
            }}
          />
          <Search className={`absolute w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-slate-400 top-1/2 -translate-y-1/2 leading-none transition-colors duration-200 ${
            currentLang === 'ar' ? 'left-5 sm:left-6 md:left-7' : 'right-5 sm:right-6 md:right-7'
          }`} />
        </div>
      </div>

      {/* Clean horizontal scrollable category filter bar spanning full width on all devices */}
      <div className="mt-6 w-full max-w-full mx-auto px-4 overflow-hidden">
        <div className="w-full flex items-center justify-start md:justify-center flex-nowrap overflow-x-auto gap-2 py-3 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { id: 'all', label: t('filterAll') },
            { id: 'video', label: t('filterVideo') },
            { id: 'audio', label: t('filterAudio') },
            { id: 'media', label: t('filterMedia') },
            { id: 'text', label: t('filterText') },
            { id: 'utility', label: t('filterUtility') },
          ].map((cat) => (
            <button
               key={cat.id}
               onClick={() => onCategoryChange(cat.id as any)}
               className={`py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition select-none shrink-0 cursor-pointer active:scale-95 ${
                 activeCategory === cat.id
                   ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md shadow-slate-950/15'
                   : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
               }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
