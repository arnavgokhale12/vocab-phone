import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useWords } from "../context/WordsContext";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
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
      <View style={styles.container}>
        <View style={styles.doneCard}>
          <Text style={styles.doneTitle}>All Done!</Text>
          <Text style={styles.doneSubtitle}>
            You've completed today's vocabulary.
          </Text>
          <Text style={styles.doneCount}>
            {todayWords.length} words learned
          </Text>
        </View>
      </View>
    );
  }

  const progress = `${idx + 1} of ${todayWords.length}`;

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.progress}>{progress}</Text>

      <View style={styles.wordCard}>
        <Text style={styles.partOfSpeech}>{w.partOfSpeech}</Text>
        <Text style={styles.term}>{w.term}</Text>

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
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.revealButton,
            revealed && styles.revealButtonActive,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => setRevealed((r) => !r)}
        >
          <Text
            style={[
              styles.revealButtonText,
              revealed && styles.revealButtonTextActive,
            ]}
          >
            {revealed ? "Hide" : "Reveal"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => {
            setRevealed(false);
            setIdx((i) => i + 1);
          }}
        >
          <Text style={styles.nextButtonText}>Next Word</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  progress: {
    ...typography.label,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },
  wordCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.lg,
    marginBottom: spacing.lg,
  },
  partOfSpeech: {
    ...typography.label,
    color: colors.accent,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  term: {
    ...typography.displayMedium,
    color: colors.text,
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
    backgroundColor: colors.accentLight,
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
  revealButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  revealButtonActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  revealButtonText: {
    ...typography.button,
    color: colors.text,
  },
  revealButtonTextActive: {
    color: colors.accent,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  nextButtonText: {
    color: colors.primaryText,
    ...typography.button,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  // Done state styles
  doneCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    ...shadows.lg,
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
    color: colors.accent,
  },
});
