import { useState, useEffect, useRef } from 'react';
import { Globe, Sun, Moon } from 'lucide-react';
import { TranslationSet } from '../types';
import { supportedLanguages } from '../i18n';

interface NavbarProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  t: (key: keyof TranslationSet) => string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function Navbar({ currentLang, onLanguageChange, t, isDarkMode, onToggleTheme }: NavbarProps) {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const languages = supportedLanguages;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/85 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-800 dark:text-white">
              Creator <span className="text-amber-500">King</span>
            </span>
            <span className="text-xl sm:text-2xl select-none" style={{ background: 'none' }}>👑</span>
          </div>

          {/* Center Links removed as requested */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500 dark:text-gray-300">
          </div>

          {/* Right Controls (Theme toggle & Language dropdown) */}
          <div className="flex items-center gap-2">
            
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle"
              onClick={onToggleTheme}
              aria-label={t('themeToggle')}
              className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-all focus:outline-none"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 animate-spin-slow" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Language Selector Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                aria-label={t('languageSelect')}
                className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-all focus:outline-none"
              >
                <Globe className="w-5 h-5" />
              </button>

              {/* Languages Dropdown Menu */}
              {isLangDropdownOpen && (
                <div 
                  className={`absolute mt-2.5 w-40 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1 z-50 transition-all duration-200 transform origin-top-right ${
                    currentLang === 'ar' ? 'left-0' : 'right-0'
                  }`}
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-right px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition ${
                        currentLang === lang.code
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                      style={{ direction: lang.code === 'ar' ? 'rtl' : 'ltr' }}
                    >
                      <span>{lang.label}</span>
                      {currentLang === lang.code && (
                        <span className="text-[10px] sm:text-xs">✦</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </nav>
  );
}
