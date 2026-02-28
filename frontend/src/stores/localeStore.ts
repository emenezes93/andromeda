import { useState, useEffect } from 'react';
import type { Locale } from '@/i18n/translations';

const STORAGE_KEY = 'anamnese_locale';
const DEFAULT_LOCALE: Locale = 'pt-BR';

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'pt-BR' || stored === 'en-US') return stored;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

// Shared mutable state — simple pub/sub without external library
let _locale: Locale = getInitialLocale();
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

export function getLocale(): Locale {
  return _locale;
}

export function setLocale(locale: Locale) {
  _locale = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
  notify();
}

/** React hook that re-renders when locale changes. */
export function useLocale(): [Locale, (locale: Locale) => void] {
  const [locale, setLocalState] = useState<Locale>(_locale);

  useEffect(() => {
    const listener = () => setLocalState(_locale);
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  return [locale, setLocale];
}
