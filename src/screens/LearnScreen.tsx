import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useWords } from "../context/WordsContext";
import {
  GradientBackground,
  GlassCard,
  GradientButton,
  CapsuleBadge,
} from "../components";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  glassmorphism,
} from "../theme";

export default function LearnScreen() {
  const { todayWords, refreshTodayIfNeeded } = useWords();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    refreshTodayIfNeeded();
  }, []);

  const w = todayWords[idx];

  if (!w) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <GlassCard elevated style={styles.doneCard}>
            <Text style={styles.doneTitle}>All Done!</Text>
            <Text style={styles.doneSubtitle}>
              You've completed today's vocabulary.
            </Text>
            <Text style={styles.doneCount}>
              {todayWords.length} words learned
            </Text>
          </GlassCard>
        </View>
      </GradientBackground>
    );
  }

  const progress = `${idx + 1} of ${todayWords.length}`;

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.progress}>{progress}</Text>

        <GlassCard elevated style={styles.wordCard}>
          <CapsuleBadge label={w.partOfSpeech} />
          <Text style={styles.term}>{w.term}</Text>
          <Text style={styles.pronunciation}>{w.pronunciation}</Text>

          {revealed ? (
            <View style={styles.meaningContainer}>
              <Text style={styles.definition}>{w.definition}</Text>
              <View style={styles.exampleContainer}>
                <Text style={styles.example}>"{w.example}"</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.hint}>Tap below to reveal the meaning</Text>
          )}
        </GlassCard>

        <View style={styles.actions}>
          <GradientButton
            title={revealed ? "Hide" : "Reveal"}
            onPress={() => setRevealed((r) => !r)}
            variant="glass"
          />
          <GradientButton
            title="Next Word"
            onPress={() => {
              setRevealed(false);
              setIdx((i) => i + 1);
            }}
            variant="primary"
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  progress: {
    ...typography.label,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  wordCard: {
    marginBottom: spacing.lg,
  },
  term: {
    ...typography.displayMedium,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  pronunciation: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: "italic",
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  meaningContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  definition: {
    ...typography.bodyLarge,
    color: colors.text,
    marginBottom: spacing.md,
  },
  exampleContainer: {
    ...glassmorphism.overlay,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  example: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  actions: {
    gap: spacing.md,
  },
  doneCard: {
    alignItems: "center",
  },
  doneTitle: {
    ...typography.displayMedium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  doneSubtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  doneCount: {
    ...typography.h3,
    color: colors.accentPurple,
  },
});
