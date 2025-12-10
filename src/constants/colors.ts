// Color palette for TipFly AI app - DropFly Brand Theme
// Electric Blue + Gold + Dark Navy

export const Colors = {
  // Primary colors - Electric Blue (DropFly brand)
  primary: '#00A8E8',
  primaryDark: '#0077B6',
  primaryLight: '#48CAE4',

  // Secondary colors - Sky Blue
  secondary: '#48CAE4',
  secondaryDark: '#00A8E8',
  secondaryLight: '#90E0EF',

  // Accent - Gold (money moments, premium, celebrations)
  accent: '#FFD700',
  accentDark: '#D4AF00',
  accentLight: '#FFE55C',
  gold: '#FFD700',
  goldDark: '#D4AF00',
  goldLight: '#FFE55C',

  // Status colors
  success: '#14B8A6',
  successLight: '#0D9488',
  error: '#EF4444',
  errorLight: '#7F1D1D',
  danger: '#EF4444',
  dangerLight: '#7F1D1D',
  warning: '#F59E0B',
  warningLight: '#78350F',
  info: '#00A8E8',
  infoLight: '#0077B6',

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

  // Dark theme app colors - DropFly dark navy
  background: '#0A0F1A',           // Rich black - main background
  backgroundSecondary: '#1A2332', // Dark navy - cards, surfaces
  backgroundTertiary: '#2A3442',  // Slate - elevated surfaces
  card: '#1A2332',                // Card background
  cardHover: '#2A3442',           // Card hover state
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderBlue: 'rgba(0, 168, 232, 0.2)',

  // Text colors for dark theme
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.4)',

  // Input colors
  inputBackground: '#1A2332',
  inputBorder: 'rgba(255, 255, 255, 0.15)',
  inputBorderFocus: 'rgba(0, 168, 232, 0.5)',
  inputText: '#FFFFFF',
  inputPlaceholder: 'rgba(255, 255, 255, 0.4)',

  // Chart colors - Updated for DropFly theme
  chartPrimary: '#00A8E8',
  chartSecondary: '#48CAE4',
  chartAccent: '#FFD700',
  chartBlue: '#00A8E8',
  chartGold: '#FFD700',
  chartTeal: '#14B8A6',
  chartPurple: '#8B5CF6',
  chartRed: '#EF4444',
  // Legacy chart colors (mapped to new)
  chartGreen: '#14B8A6',
  chartOrange: '#FFD700',

  // Glass effect colors
  glass: 'rgba(26, 35, 50, 0.7)',
  glassLight: 'rgba(26, 35, 50, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHover: 'rgba(26, 35, 50, 0.8)',

  // Legacy support (mapped to new theme)
  backgroundDark: '#0A0F1A',
  backgroundLight: '#1A2332',
  textLight: 'rgba(255, 255, 255, 0.5)',
};

export const GradientColors = {
  // Primary gradients - Electric Blue
  primary: ['#00A8E8', '#0077B6'] as const,
  primaryLight: ['#48CAE4', '#00A8E8'] as const,

  // Background gradients
  background: ['#0A0F1A', '#1A2332', '#0A0F1A'] as const,
  card: ['#1A2332', '#2A3442'] as const,

  // Feature gradients
  premium: ['#FFD700', '#D4AF00'] as const,
  gold: ['#FFD700', '#D4AF00'] as const,
  success: ['#FFD700', '#D4AF00'] as const,  // Gold for success/money moments
  successTeal: ['#14B8A6', '#0D9488'] as const,
  hero: ['#00A8E8', '#0077B6', '#005F8A'] as const,
  blue: ['#00A8E8', '#0077B6'] as const,
  skyBlue: ['#48CAE4', '#00A8E8'] as const,

  // Legacy (mapped to new)
  emerald: ['#00A8E8', '#0077B6'] as const,  // Now blue
  purple: ['#8B5CF6', '#7C3AED'] as const,

  // Glass effect for overlays
  glass: ['rgba(26, 35, 50, 0.9)', 'rgba(26, 35, 50, 0.7)'] as const,
  glassDark: ['rgba(10, 15, 26, 0.95)', 'rgba(10, 15, 26, 0.8)'] as const,
  glassCard: ['rgba(26, 35, 50, 0.8)', 'rgba(42, 52, 66, 0.6)'] as const,
};

// Dark theme specific shadows and glow effects
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
  // Blue glow for interactive elements
  glow: {
    shadowColor: '#00A8E8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glowBlue: {
    shadowColor: '#00A8E8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glowBlueSubtle: {
    shadowColor: '#00A8E8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  // Gold glow for money moments
  glowGold: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  glowGoldSubtle: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  // Button shadows
  buttonBlue: {
    shadowColor: '#00A8E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGold: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Glass effect styles for React Native
export const GlassStyles = {
  card: {
    backgroundColor: 'rgba(26, 35, 50, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  cardHover: {
    backgroundColor: 'rgba(26, 35, 50, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.2)',
    borderRadius: 20,
  },
  input: {
    backgroundColor: 'rgba(26, 35, 50, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
  },
  inputFocus: {
    backgroundColor: 'rgba(26, 35, 50, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.5)',
    borderRadius: 14,
  },
  button: {
    backgroundColor: 'rgba(26, 35, 50, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  modal: {
    backgroundColor: 'rgba(26, 35, 50, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 232, 0.2)',
    borderRadius: 24,
  },
  numpadKey: {
    backgroundColor: 'rgba(26, 35, 50, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
};
