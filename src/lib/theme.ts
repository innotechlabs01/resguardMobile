import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

/**
 * ResGuard mobile theme.
 *
 * The semantic palette below MIRRORS the web design tokens in
 * `residential-management-system/styles/design-tokens.css`. The two repos have
 * independent .git roots, so tokens are shared by specification (hand-synced,
 * versioned) rather than by a package dependency.
 *
 * - `palette.light` / `palette.dark` expose raw semantic colors (including
 *   brand/status tones that MD3 does not model directly).
 * - `lightTheme` / `darkTheme` map them onto Material Design 3 color roles for
 *   React Native Paper.
 * - `useAppTheme()` (see below) is the recommended way for screens to read the
 *   active palette + MD3 roles.
 */

export const palette = {
  light: {
    background: '#F5F7F8',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    surfaceHover: '#E7EDF1',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    primary: '#0F172A',
    onPrimary: '#FFFFFF',
    hero: '#0F172A',
    onHero: '#FFFFFF',
    brand: '#159A8C',
    onBrand: '#FFFFFF',
    brandSoft: '#D6F2EE',
    accent: '#D97706',
    success: '#059669',
    successContainer: '#D1FAE5',
    onSuccessContainer: '#065F46',
    warning: '#D97706',
    warningContainer: '#FEF3C7',
    onWarningContainer: '#92400E',
    error: '#DC2626',
    errorContainer: '#FEE2E2',
    onErrorContainer: '#991B1B',
    info: '#0284C7',
    infoContainer: '#E0F2FE',
    onInfoContainer: '#075985',
  },
  dark: {
    background: '#020617',
    surface: '#0F172A',
    surfaceElevated: '#16203A',
    surfaceVariant: '#1E293B',
    surfaceHover: '#24324A',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: '#1E293B',
    borderStrong: '#334155',
    primary: '#F1F5F9',
    onPrimary: '#0F172A',
    hero: '#16203A',
    onHero: '#F8FAFC',
    brand: '#2DD4BF',
    onBrand: '#03251F',
    brandSoft: '#0F3D38',
    accent: '#FBBF24',
    success: '#34D399',
    successContainer: '#064E3B',
    onSuccessContainer: '#D1FAE5',
    warning: '#FBBF24',
    warningContainer: '#78350F',
    onWarningContainer: '#FEF3C7',
    error: '#F87171',
    errorContainer: '#7F1D1D',
    onErrorContainer: '#FEE2E2',
    info: '#38BDF8',
    infoContainer: '#0C4A6E',
    onInfoContainer: '#E0F2FE',
  },
} as const;

export type AppPalette = Record<keyof typeof palette.light, string>;

export const lightTheme: typeof MD3LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0F172A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E2E8F0',
    onPrimaryContainer: '#0F172A',
    secondary: '#159A8C',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D6F2EE',
    onSecondaryContainer: '#08554C',
    tertiary: '#D97706',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FEF3C7',
    onTertiaryContainer: '#92400E',
    surface: '#FFFFFF',
    onSurface: '#0F172A',
    surfaceVariant: '#F1F5F9',
    onSurfaceVariant: '#475569',
    surfaceDisabled: 'rgba(15, 23, 42, 0.12)',
    onSurfaceDisabled: 'rgba(15, 23, 42, 0.38)',
    background: '#F5F7F8',
    onBackground: '#0F172A',
    error: '#DC2626',
    onError: '#FFFFFF',
    errorContainer: '#FEE2E2',
    onErrorContainer: '#991B1B',
    outline: '#CBD5E1',
    outlineVariant: '#E2E8F0',
    inverseSurface: '#0F172A',
    inverseOnSurface: '#F8FAFC',
    inversePrimary: '#2DD4BF',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(15, 23, 42, 0.5)',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FAFBFC',
      level3: '#F5F7F8',
      level4: '#F1F5F9',
      level5: '#E7EDF1',
    },
  },
};

export const darkTheme: typeof MD3DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#F1F5F9',
    onPrimary: '#0F172A',
    primaryContainer: '#334155',
    onPrimaryContainer: '#F8FAFC',
    secondary: '#2DD4BF',
    onSecondary: '#03251F',
    secondaryContainer: '#0F3D38',
    onSecondaryContainer: '#A7F3E6',
    tertiary: '#FBBF24',
    onTertiary: '#3A2A05',
    tertiaryContainer: '#78350F',
    onTertiaryContainer: '#FEF3C7',
    surface: '#0F172A',
    onSurface: '#F8FAFC',
    surfaceVariant: '#1E293B',
    onSurfaceVariant: '#94A3B8',
    surfaceDisabled: 'rgba(248, 250, 252, 0.12)',
    onSurfaceDisabled: 'rgba(248, 250, 252, 0.38)',
    background: '#020617',
    onBackground: '#F8FAFC',
    error: '#F87171',
    onError: '#3A0A0A',
    errorContainer: '#7F1D1D',
    onErrorContainer: '#FEE2E2',
    outline: '#334155',
    outlineVariant: '#1E293B',
    inverseSurface: '#F8FAFC',
    inverseOnSurface: '#0F172A',
    inversePrimary: '#159A8C',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    elevation: {
      level0: 'transparent',
      level1: '#0F172A',
      level2: '#16203A',
      level3: '#1E293B',
      level4: '#24324A',
      level5: '#24324A',
    },
  },
};

/**
 * Backward-compatible flat color map still imported by legacy screens.
 * Top-level values preserve the previous light palette so untouched screens do
 * not regress. New/updated screens should read `useTheme()` from Paper or the
 * `palette` object above. `Colors.light` / `Colors.dark` describe both themes.
 */
export const Colors = {
  primary: '#0F172A',
  primaryLight: '#334155',
  secondary: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
  background: '#F5F7F8',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  muted: '#F1F5F9',
  errorContainer: '#FEE2E2',
  successContainer: '#D1FAE5',
  warningContainer: '#FEF3C7',
  infoContainer: '#DBEAFE',
  light: palette.light,
  dark: palette.dark,
};

/** @deprecated use `lightTheme` / `darkTheme` with PaperProvider. */
export const theme = lightTheme;
