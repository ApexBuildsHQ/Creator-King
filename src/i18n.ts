import { TranslationSet } from './types';

type LocaleModule = {
  default: TranslationSet;
};

function getLanguageCodeFromPath(filePath: string) {
  const match = /\.\/locales\/(.+)\.json$/.exec(filePath);
  return match ? match[1] : filePath;
}

function normalizeLabelKey(code: string) {
  return (
    'lang' +
    code
      .split(/[-_]/)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join('')
  );
}

const localeModules = import.meta.glob<LocaleModule>('./locales/*.json', { eager: true });

export const resources: Record<string, { translation: TranslationSet }> = Object.entries(localeModules).reduce(
  (acc, [filePath, module]) => {
    const code = getLanguageCodeFromPath(filePath);
    acc[code] = { translation: module.default };
    return acc;
  },
  {} as Record<string, { translation: TranslationSet }>
);

export const supportedLanguages = Object.keys(resources).map((code) => {
  const translation = resources[code].translation;
  const labelKey = normalizeLabelKey(code) as keyof TranslationSet;
  const label = (translation[labelKey] as unknown as string) || code;
  return { code, label };
});

const defaultLanguage = supportedLanguages[0]?.code || 'ar';

export function getTranslation(lang: string) {
  const dataset = resources[lang]?.translation || resources[defaultLanguage]?.translation;

  const t = (key: keyof TranslationSet): string => {
    return (dataset?.[key] as string) || '';
  };

  return { t };
}
