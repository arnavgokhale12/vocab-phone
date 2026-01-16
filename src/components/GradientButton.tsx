import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, borderRadius, spacing, colors, gradients, glassmorphism } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'success' | 'glass';
  style?: ViewStyle;
  disabled?: boolean;
}

export function GradientButton({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
}: Props) {
  if (variant === 'glass') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.glassButton,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={styles.glassButtonText}>{title}</Text>
      </Pressable>
    );
  }

  const gradientColors =
    variant === 'success'
      ? gradients.successButton.colors
      : gradients.primaryButton.colors;

  return (
    <Pressable
      style={({ pressed }) => [
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientButton}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradientButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassButton: {
    ...glassmorphism.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.button,
    color: colors.text,
  },
  glassButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
