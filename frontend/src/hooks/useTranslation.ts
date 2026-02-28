import { useLocale } from '@/stores/localeStore';
import { TRANSLATIONS } from '@/i18n/translations';
import type { Locale, Translations } from '@/i18n/translations';

interface UseTranslationResult {
  t: Translations;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export function useTranslation(): UseTranslationResult {
  const [locale, setLocale] = useLocale();
  return { t: TRANSLATIONS[locale], locale, setLocale };
}
