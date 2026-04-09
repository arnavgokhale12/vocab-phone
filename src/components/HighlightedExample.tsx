import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface HighlightedExampleProps {
  sentence: string;
  targetWord: string;
}

export function HighlightedExample({ sentence, targetWord }: HighlightedExampleProps) {
  // Split sentence on the target word (case-insensitive) and highlight it
  const parts = sentence.split(new RegExp(`(${targetWord})`, 'gi'));

  return (
    <View style={styles.container}>
      <Text style={styles.sentence}>
        {parts.map((part, i) =>
          part.toLowerCase() === targetWord.toLowerCase() ? (
            <Text key={i} style={styles.highlight}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          ),
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  sentence: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  highlight: {
    color: colors.accent,
    fontWeight: '600',
  },
});
