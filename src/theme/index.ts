// Centralized theme system for Vocab Phone

export const colors = {
  // Backgrounds
  background: "#FFFFFF",
  card: "#F8F9FA",
  cardBorder: "#E9ECEF",

  // Text
  text: "#1A1A1A",
  textSecondary: "#6C757D",
  textMuted: "#ADB5BD",

  // Primary actions
  primary: "#1A1A1A",
  primaryText: "#FFFFFF",

  // Accent
  accent: "#007AFF",
  accentLight: "#E7F1FF",

  // States
  success: "#28A745",
  error: "#DC3545",

  // Borders
  border: "#DEE2E6",
  borderLight: "#F1F3F5",
};

export const typography = {
  // Large display text
  displayLarge: {
    fontSize: 48,
    fontWeight: "700" as const,
    lineHeight: 56,
    letterSpacing: -1,
  },
  displayMedium: {
    fontSize: 40,
    fontWeight: "700" as const,
    lineHeight: 48,
    letterSpacing: -0.5,
  },

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: "600" as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 32,
  },

  // Body text
  bodyLarge: {
    fontSize: 20,
    fontWeight: "400" as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 17,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },

  // Labels and captions
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
  },

  // Button text
  button: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 16,
    fontWeight: "600" as const,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Common style patterns
export const commonStyles = {
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center" as const,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...shadows.md,
  },
  primaryButtonText: {
    color: colors.primaryText,
    ...typography.button,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  secondaryButtonText: {
    color: colors.accent,
    ...typography.buttonSmall,
  },
};
