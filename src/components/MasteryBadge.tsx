import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface MasteryBadgeProps {
  level: number; // 0-3
  size?: 'small' | 'medium';
}

const LEVEL_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: 'New', color: colors.textMuted },
  1: { label: 'Learning', color: colors.warning },
  2: { label: 'Familiar', color: colors.accentBlue },
  3: { label: 'Mastered', color: colors.success },
};

export function MasteryBadge({ level, size = 'small' }: MasteryBadgeProps) {
  const config = LEVEL_CONFIG[Math.max(0, Math.min(3, level))] ?? LEVEL_CONFIG[0];

  const badgeStyle = [
    styles.badge,
    size === 'medium' && styles.badgeMedium,
    { backgroundColor: config.color + '25', borderColor: config.color },
  ];

  const textStyle = [
    styles.text,
    size === 'medium' && styles.textMedium,
    { color: config.color },
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeMedium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textMedium: {
    ...typography.label,
  },
});
