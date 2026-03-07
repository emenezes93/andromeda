import { IconSun, IconMoon } from '@/components/icons';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-button text-content-muted transition-calm hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      title={theme === 'dark' ? 'Modo escuro ativo' : 'Modo claro ativo'}
    >
      {theme === 'dark' ? (
        <IconMoon className="size-5 shrink-0" />
      ) : (
        <IconSun className="size-5 shrink-0" />
      )}
    </button>
  );
}
