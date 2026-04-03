/**
 * Tema do app — cores, espaçamentos e tipografia para consistência e acessibilidade.
 * Boas práticas mobile: touch targets ≥44pt, hierarquia visual clara, contraste adequado.
 */

export type ThemeMode = 'dark' | 'light';

export type SemanticColors = {
  bg: {
    canvas: string;
    surface: string;
    surfaceElevated: string;
    subtle: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    subtle: string;
    onPrimary: string;
    onDanger: string;
  };
  border: {
    default: string;
    subtle: string;
    strong: string;
  };
  brand: {
    primary: string;
    primarySoft: string;
    accent: string;
    accentSoft: string;
  };
  feedback: {
    success: string;
    successSoft: string;
    error: string;
    warning: string;
  };
  interactive: {
    primary: string;
    primarySoft: string;
    danger: string;
    ghost: string;
  };
};

export type ColorPalette = {
  semantic: SemanticColors;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  success: string;
  successLight: string;
  error: string;
  warning: string;
};

function withLegacyAliases(semantic: SemanticColors): ColorPalette {
  return {
    semantic,
    background: semantic.bg.canvas,
    surface: semantic.bg.surface,
    surfaceElevated: semantic.bg.surfaceElevated,
    border: semantic.border.default,
    borderLight: semantic.border.strong,
    text: semantic.text.primary,
    textSecondary: semantic.text.secondary,
    textMuted: semantic.text.muted,
    textSubtle: semantic.text.subtle,
    primary: semantic.brand.primary,
    primaryLight: semantic.brand.primarySoft,
    accent: semantic.brand.accent,
    accentLight: semantic.brand.accentSoft,
    success: semantic.feedback.success,
    successLight: semantic.feedback.successSoft,
    error: semantic.feedback.error,
    warning: semantic.feedback.warning,
  };
}

/** Paleta escura — Fit Insight / landing (PROMPT_APP_MOBILE). */
export const darkColors: ColorPalette = withLegacyAliases({
  bg: {
    canvas: '#070A0F',
    surface: '#111620',
    surfaceElevated: '#1A2130',
    subtle: '#0E1420',
  },
  text: {
    primary: '#F8FBFF',
    secondary: '#DDE6F2',
    muted: '#97A8BD',
    subtle: '#6E8098',
    onPrimary: '#ffffff',
    onDanger: '#ffffff',
  },
  border: {
    default: '#2B3648',
    subtle: '#212A39',
    strong: '#344157',
  },
  brand: {
    primary: '#9BFF18',
    primarySoft: 'rgba(155, 255, 24, 0.16)',
    accent: '#31D0FF',
    accentSoft: 'rgba(49, 208, 255, 0.16)',
  },
  feedback: {
    success: '#4CE5A3',
    successSoft: 'rgba(76, 229, 163, 0.14)',
    error: '#FF6F6F',
    warning: '#FFB545',
  },
  interactive: {
    primary: '#9BFF18',
    primarySoft: 'rgba(155, 255, 24, 0.16)',
    danger: '#FF6F6F',
    ghost: 'rgba(151, 168, 189, 0.12)',
  },
});

/** Paleta clara — mesmo primary/accent para manter identidade. */
export const lightColors: ColorPalette = withLegacyAliases({
  bg: {
    canvas: '#F4F8FC',
    surface: '#ffffff',
    surfaceElevated: '#EEF3F8',
    subtle: '#F3F7FC',
  },
  text: {
    primary: '#0E141C',
    secondary: '#324358',
    muted: '#5D7087',
    subtle: '#8493A5',
    onPrimary: '#ffffff',
    onDanger: '#ffffff',
  },
  border: {
    default: '#D8E1EB',
    subtle: '#E5ECF4',
    strong: '#C4D0DE',
  },
  brand: {
    primary: '#65B800',
    primarySoft: 'rgba(101, 184, 0, 0.14)',
    accent: '#008EC4',
    accentSoft: 'rgba(0, 142, 196, 0.14)',
  },
  feedback: {
    success: '#169F66',
    successSoft: 'rgba(22, 159, 102, 0.12)',
    error: '#D33838',
    warning: '#CB830F',
  },
  interactive: {
    primary: '#65B800',
    primarySoft: 'rgba(101, 184, 0, 0.14)',
    danger: '#D33838',
    ghost: 'rgba(93, 112, 135, 0.1)',
  },
});

export function getColorsForTheme(theme: ThemeMode): ColorPalette {
  return theme === 'dark' ? darkColors : lightColors;
}

/** Compatibilidade: tema escuro por padrão quando não se usa ThemeContext. */
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  /** Espaço extra no fim de listas/scroll para safe area e respiro */
  listBottom: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  full: 9999,
} as const;

/** Mínimo 44pt (Apple HIG / Material) para áreas clicáveis */
export const touchTargetMin = 44;

/** Altura consistente para inputs e botões primários */
export const inputHeight = 48;
export const buttonHeight = 52;

/** Tipografia com line-height adequado para leitura (1.2–1.5) */
export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, lineHeight: 40 },
  title: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32 },
  titleSmall: { fontSize: 21, fontWeight: '700' as const, lineHeight: 27 },
  sectionTitle: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
} as const;
