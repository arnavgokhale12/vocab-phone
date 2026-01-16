// Centralized theme system for Vocab Phone
// Dark glassmorphism design matching iOS widget aesthetic

export const colors = {
  // Background gradient colors
  gradientStart: '#262633',
  gradientEnd: '#14141F',
  background: '#14141F',

  // Accent colors (from widget)
  accentPurple: '#9966FF',
  accentBlue: '#6699FF',
  accentPurpleLight: 'rgba(153, 102, 255, 0.2)',
  accentBlueLight: 'rgba(102, 153, 255, 0.2)',

  // Text hierarchy (white with opacity)
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textSubtle: 'rgba(255, 255, 255, 0.3)',

  // Glassmorphism
  glassOverlay: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassHighlight: 'rgba(255, 255, 255, 0.12)',

  // Action colors
  success: '#4CD964',
  successLight: 'rgba(76, 217, 100, 0.2)',
  warning: '#FF9500',
  warningLight: 'rgba(255, 149, 0, 0.2)',
  error: '#FF3B30',
  errorLight: 'rgba(255, 59, 48, 0.2)',

  // Legacy compatibility
  card: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.15)',
  primary: '#9966FF',
  primaryText: '#FFFFFF',
  accent: '#9966FF',
  border: 'rgba(255, 255, 255, 0.15)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
};

export const glassmorphism = {
  // Standard glass card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  // Elevated glass card (more prominent)
  cardElevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Subtle glass overlay
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
};

export const gradients = {
  // Main background gradient
  background: {
    colors: ['#262633', '#14141F'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Primary button gradient
  primaryButton: {
    colors: ['#9966FF', '#6699FF'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Success button gradient
  successButton: {
    colors: ['#4CD964', '#34C759'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
};

export const glowEffects = {
  // Purple radial glow (for background decoration)
  purple: {
    color: 'rgba(153, 102, 255, 0.25)',
    size: 300,
  },
  // Accent glow for interactive elements
  accent: {
    shadowColor: '#9966FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
};

export const typography = {
  // Large display text
  displayLarge: {
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 56,
    letterSpacing: -1,
  },
  displayMedium: {
    fontSize: 40,
    fontWeight: '700' as const,
    lineHeight: 48,
    letterSpacing: -0.5,
  },

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },

  // Body text
  bodyLarge: {
    fontSize: 20,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },

  // Labels and captions
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  // Button text
  button: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  // Accent glow shadow
  glow: {
    shadowColor: '#9966FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
};

// Common style patterns
export const commonStyles = {
  screenContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  centeredContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center' as const,
  },
  card: {
    ...glassmorphism.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  cardElevated: {
    ...glassmorphism.cardElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  primaryButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  primaryButtonText: {
    color: colors.primaryText,
    ...typography.button,
  },
  glassButton: {
    ...glassmorphism.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  glassButtonText: {
    color: colors.textSecondary,
    ...typography.button,
  },
};
