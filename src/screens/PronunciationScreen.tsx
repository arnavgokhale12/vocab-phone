import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as Speech from "expo-speech";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { GradientBackground, GlassCard, GradientButton } from "../components";
import { colors, typography, spacing } from "../theme";
import { useWords } from "../context/WordsContext";

type Props = NativeStackScreenProps<RootStackParamList, "Pronunciation">;

export default function PronunciationScreen({ route }: Props) {
  const { wordId } = route.params;
  const { todayWords } = useWords();

  const word = todayWords.find((w) => w.id === wordId) || todayWords[0];

  useEffect(() => {
    if (word) {
      // Auto-play pronunciation when screen opens
      Speech.speak(word.term, {
        language: "en-US",
        rate: 0.8,
        pitch: 1.0,
      });
    }
  }, [word]);

  const playPronunciation = () => {
    if (word) {
      Speech.speak(word.term, {
        language: "en-US",
        rate: 0.8,
        pitch: 1.0,
      });
    }
  };

  if (!word) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <Text style={styles.errorText}>Word not found</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <GlassCard elevated style={styles.card}>
          <Text style={styles.partOfSpeech}>
            {word.partOfSpeech.toUpperCase()}
          </Text>
          <Text style={styles.term}>{word.term}</Text>
          <Text style={styles.pronunciation}>{word.pronunciation}</Text>

          <Pressable style={styles.speakerButton} onPress={playPronunciation}>
            <Text style={styles.speakerIcon}>🔊</Text>
            <Text style={styles.speakerText}>Play Pronunciation</Text>
          </Pressable>

          <View style={styles.divider} />

          <Text style={styles.definition}>{word.definition}</Text>

          <View style={styles.exampleContainer}>
            <Text style={styles.example}>"{word.example}"</Text>
          </View>
        </GlassCard>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
  },
  partOfSpeech: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.accentPurple,
    marginBottom: spacing.sm,
  },
  term: {
    ...typography.displayMedium,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  pronunciation: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: "italic",
    marginBottom: spacing.lg,
  },
  speakerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentPurpleLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 9999,
    gap: spacing.sm,
  },
  speakerIcon: {
    fontSize: 24,
  },
  speakerText: {
    ...typography.button,
    color: colors.accentPurple,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.lg,
  },
  definition: {
    ...typography.bodyLarge,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  exampleContainer: {
    backgroundColor: colors.glassOverlay,
    borderRadius: 12,
    padding: spacing.md,
    width: "100%",
  },
  example: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
