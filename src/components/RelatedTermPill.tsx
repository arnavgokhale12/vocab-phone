import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface RelatedTermPillProps {
  term: string;
  variant: 'synonym' | 'antonym' | 'family';
  partOfSpeech?: string;
}

const variantColors: Record<string, string> = {
  synonym: colors.accent,
  antonym: colors.error ?? '#FF6B6B',
  family: colors.accentSecondary ?? colors.accent,
};

export function RelatedTermPill({ term, variant, partOfSpeech }: RelatedTermPillProps) {
  const accentColor = variantColors[variant] ?? colors.accent;

  return (
    <View style={[styles.pill, { borderColor: accentColor + '40', backgroundColor: accentColor + '15' }]}>
      <Text style={[styles.term, { color: accentColor }]}>{term}</Text>
      {partOfSpeech ? (
        <Text style={styles.pos}> · {partOfSpeech}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  term: {
    ...typography.label,
    fontWeight: '600',
  },
  pos: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
