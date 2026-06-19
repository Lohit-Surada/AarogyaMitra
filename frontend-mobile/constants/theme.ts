/**
 * AarogyaMitra Premium Health-Tech Theme
 */
import { Platform, StatusBar } from 'react-native';

// Ensures the header always sits below the system status bar / notch on every device.
// The extra +6 gives 1.5px additional visual breathing room as requested.
export const HEADER_PADDING_TOP = (StatusBar.currentHeight ?? 0) + 6;

const tintColorLight = '#0B5A80'; // Deep Blue
const tintColorDark = '#38Bdf8';

// Premium Medical Palette
export const Palette = {
  primary: '#0B5A80',      // Deep Blue
  primaryLight: '#E0F2FE', // Very soft blue for backgrounds
  secondary: '#10B981',    // Medical Green (Success/Action)
  secondaryLight: '#D1FAE5',
  background: '#F8FAFC',   // Soft White/Light Gray background
  surface: '#FFFFFF',      // Card backgrounds
  text: '#0F172A',         // Very dark blue/gray for high contrast text
  textMuted: '#64748B',    // Subtitles and hints
  border: '#E2E8F0',       // Subtle borders
  danger: '#EF4444',       // Errors / Deletes
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
};

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    surface: Palette.surface,
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    border: Palette.border,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    surface: '#1E293B',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    border: '#334155',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
  android: {
    sans: 'sans-serif',
    serif: 'serif',
    mono: 'monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    mono: 'monospace',
  },
});

