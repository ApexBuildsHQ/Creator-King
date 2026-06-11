import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import { Language, TranslationSet } from './types';

export const translations: Record<Language, TranslationSet> = {
  ar,
  en,
  fr,
  es,
};

/**
 * Returns a translation function `t` for the selected language
 * so we can use t('key') across the application.
 */
export function getTranslation(lang: Language) {
  const dataset = translations[lang] || translations['ar'];
  
  const t = (key: keyof TranslationSet): string => {
    return dataset[key] || '';
  };

  return { t };
}
