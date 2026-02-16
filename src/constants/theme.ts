export const COLORS = {
  primary: '#1A1A1A',
  secondary: '#333333',
  accent: '#0066CC',
  bgLight: '#FFFFFF',
  bgMedium: '#F5F5F5',
  bgGray: '#FAFAFA',
  border: '#E5E5E5',
  borderDark: '#CCCCCC',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  success: '#22C55E',
  error: '#DC2626',
  white: '#FFFFFF',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const FONT_SIZE = {
  h1: 32,
  h2: 24,
  h3: 20,
  body: 16,
  caption: 14,
  small: 12,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const BORDER_RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
} as const;
