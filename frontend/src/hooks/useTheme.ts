import { useState, useEffect } from 'react';
import { getTheme, setTheme, toggleTheme as toggleThemeFn } from '@/stores/themeStore';

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(getTheme);

  useEffect(() => {
    // Sync with actual DOM state
    const updateTheme = () => {
      setThemeState(getTheme());
    };

    // Check theme on mount and when storage changes
    updateTheme();
    window.addEventListener('storage', updateTheme);

    // Watch for class changes on document
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      window.removeEventListener('storage', updateTheme);
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    toggleThemeFn();
    setThemeState(getTheme());
  };

  const changeTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  return { theme, toggleTheme, setTheme: changeTheme };
}
