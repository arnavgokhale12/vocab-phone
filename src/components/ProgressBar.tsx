import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, borderRadius } from "../theme";

interface ProgressBarProps {
  progress: number; // 0 to 1
  learned: number;
  goal: number;
}

export function ProgressBar({ progress, learned, goal }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const isComplete = learned >= goal;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Today's Progress</Text>
        <Text style={[styles.count, isComplete && styles.countComplete]}>
          {learned} / {goal}
        </Text>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={[colors.accentPurple, colors.accentBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${clampedProgress * 100}%` }]}
        />
      </View>
      {isComplete && (
        <Text style={styles.completeText}>Goal reached!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  count: {
    ...typography.h3,
    color: colors.text,
  },
  countComplete: {
    color: colors.accentPurple,
  },
  track: {
    height: 8,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: borderRadius.sm,
  },
  completeText: {
    ...typography.label,
    color: colors.accentPurple,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
