// Color palette for TipFly AI app - Dark Theme

export const Colors = {
  // Primary colors - Emerald green (money, success)
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',

  // Secondary colors - Indigo
  secondary: '#6366F1',
  secondaryDark: '#4F46E5',
  secondaryLight: '#818CF8',

  // Accent - Amber (premium, gold)
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FBBF24',

  // Status colors
  success: '#10B981',
  successLight: '#064E3B',
  error: '#EF4444',
  errorLight: '#7F1D1D',
  danger: '#EF4444',  // Alias for error
  dangerLight: '#7F1D1D',
  warning: '#F59E0B',
  warningLight: '#78350F',
  info: '#3B82F6',
  infoLight: '#1E3A8A',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Dark theme app colors
  background: '#0F172A',        // Slate 900 - main background
  backgroundSecondary: '#1E293B', // Slate 800 - cards, surfaces
  backgroundTertiary: '#334155', // Slate 700 - elevated surfaces
  card: '#1E293B',              // Card background
  cardHover: '#334155',         // Card hover state
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',

  // Text colors for dark theme
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.4)',

  // Input colors
  inputBackground: '#1E293B',
  inputBorder: 'rgba(255, 255, 255, 0.15)',
  inputText: '#FFFFFF',
  inputPlaceholder: 'rgba(255, 255, 255, 0.4)',

  // Chart colors
  chartGreen: '#10B981',
  chartBlue: '#3B82F6',
  chartPurple: '#8B5CF6',
  chartOrange: '#F59E0B',
  chartRed: '#EF4444',

  // Legacy support (mapped to dark theme)
  backgroundDark: '#0F172A',
  backgroundLight: '#1E293B',
  textLight: 'rgba(255, 255, 255, 0.5)',
};

export const GradientColors = {
  // Primary gradients
  primary: ['#10B981', '#059669'] as const,
  primaryLight: ['#34D399', '#10B981'] as const,

  // Background gradients
  background: ['#0F172A', '#1E293B', '#0F172A'] as const,
  card: ['#1E293B', '#334155'] as const,

  // Feature gradients
  premium: ['#F59E0B', '#D97706'] as const,
  success: ['#10B981', '#34D399'] as const,
  hero: ['#10B981', '#059669', '#047857'] as const,
  emerald: ['#10B981', '#059669'] as const,
  purple: ['#8B5CF6', '#7C3AED'] as const,
  blue: ['#3B82F6', '#2563EB'] as const,

  // Glass effect for overlays
  glass: ['rgba(30, 41, 59, 0.9)', 'rgba(30, 41, 59, 0.7)'] as const,
  glassDark: ['rgba(15, 23, 42, 0.95)', 'rgba(15, 23, 42, 0.8)'] as const,
};

// Dark theme specific shadows (subtle glow effects)
export const Shadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
