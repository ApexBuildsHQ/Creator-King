import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { InteractiveTools } from './components/InteractiveTools';
import { ToolsGrid } from './components/ToolsGrid';
import { getTranslation } from './i18n';
import { Language } from './types';
import { Shield, Sparkles, Zap } from 'lucide-react';
import { useAdManager } from './context/AdContext';

export default function App() {
  const { isCooldownActive, cooldownRemaining } = useAdManager();
  const [currentLang, setCurrentLang] = useState<Language>('ar');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'media' | 'video' | 'audio' | 'text' | 'utility'>('all');
  
  // Lifted theme state for synchronized night/light system linked with the header icon
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode theme class dynamic hook link
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Sync index.html title or lang code whenever language shifts
  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const { t } = getTranslation(currentLang);
  const isRtl = currentLang === 'ar';

  return (
    <div 
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 antialiased pb-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-100/20 via-transparent to-transparent dark:from-amber-950/10"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* 1. Header Navigation */}
      <Navbar 
        currentLang={currentLang} 
        onLanguageChange={setCurrentLang} 
        t={t} 
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {activeToolId === null ? (
        <>
          {/* 2. Centered Elegant Hero Section with Search and Horizontal scroll filter categories */}
          <Hero 
            currentLang={currentLang} 
            t={t} 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Majestic Responsive Ad space between horizontal category filter scrollbar and tools */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 w-full">
            <div className={`relative rounded-2xl overflow-hidden border border-dashed transition-all py-4 px-4 text-center min-h-[90px] sm:min-h-[100px] flex flex-col items-center justify-center ${
              isCooldownActive 
                ? 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400' 
                : 'border-slate-300 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30'
            }`}>
              <span className="absolute top-2 right-3 text-[9px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                {isCooldownActive ? (isRtl ? 'وضع الراحة المفعّل' : 'Ad-Free Comfort Mode') : t('adUnitLabel')}
              </span>
              <div className="space-y-1">
                {isCooldownActive ? (
                  <>
                    <p className="text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      {isRtl 
                        ? `لقد تم تفعيل التصفح السلس الخالي من الإعلانات لمدة ${Math.ceil(cooldownRemaining / 60)} دقائق!` 
                        : `Enjoy seamless ad-free processing for the next ${Math.ceil(cooldownRemaining / 60)} minutes!`}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {isRtl ? 'الراحة مدعومة تلقائياً للمستخدم الملكي' : 'Grace period automatic for royal creators'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {t('adUnitText')}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      (Auto-fit 100% Horizontal Span)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3. Complete Tools Grid (20+ specialized on-device templates) */}
          <main className="py-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ToolsGrid 
                currentLang={currentLang} 
                t={t} 
                activeToolId="" 
                onSelectTool={setActiveToolId} 
                searchQuery={searchQuery}
                activeCategory={activeCategory}
              />
            </div>
          </main>

          {/* 4. Majestic Benefits & Privacy Guarantee Info */}
          <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {t('whyTrustTitle')}
              </h2>
              <p className="text-sm text-gray-400 max-w-xl mx-auto">
                {t('whyTrustSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-6 bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-100 dark:border-slate-800/80 text-center space-y-4">
                <div className="inline-flex p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {t('benefit1Title')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('benefit1Desc')}
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-100 dark:border-slate-800/80 text-center space-y-4">
                <div className="inline-flex p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {t('benefit2Title')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('benefit2Desc')}
                </p>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Render independent tool page view! */
        <main id="tool-workspace" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back button and tool identification heading */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setActiveToolId(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-805 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition shadow-sm active:scale-95"
            >
              <span>{t('backToAllTools')}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
                {t('onDeviceSecuredSandbox')}
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Subtle majestic lighting frame */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-[2rem] blur-xl opacity-75 dark:opacity-30 -z-10 pointer-events-none" />
            
            {activeToolId && (
              <InteractiveTools 
                currentLang={currentLang} 
                t={t} 
                activeToolId={activeToolId} 
              />
            )}
          </div>
        </main>
      )}

      {/* 6. Visual Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-200/50 dark:border-slate-800/80 pt-10 text-center text-xs text-gray-400 dark:text-slate-500 font-mono space-y-3">
        <p>
          {t('footerText')}
        </p>
        <p className="text-[10px] text-gray-300 dark:text-slate-600">
          Built via Google AI Studio Developer Environment
        </p>
      </footer>
    </div>
  );
}
