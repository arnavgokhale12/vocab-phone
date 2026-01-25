import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface PreferenceSectionProps {
  title: string;
  children: ReactNode;
}

export default function PreferenceSection({ title, children }: PreferenceSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.label,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  content: {
    backgroundColor: colors.glassOverlay,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
});
