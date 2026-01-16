import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { glassmorphism, borderRadius, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function GlassCard({ children, style, elevated = false }: Props) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glassmorphism.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  elevated: {
    ...glassmorphism.cardElevated,
    padding: spacing.xl,
  },
});
