import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useWords } from "../context/WordsContext";
import { useProgress } from "../context/ProgressContext";
import { GradientBackground, GradientButton, GlassCard, ProgressBar } from "../components";
import { colors, typography, spacing, borderRadius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { todayGoal } = useWords();
  const { stats, todayProgress } = useProgress();

  const progress = todayProgress.goal > 0 ? todayProgress.learned / todayProgress.goal : 0;

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>{todayGoal} words to learn</Text>

          {/* Streak Badge */}
          {stats.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>
                {stats.currentStreak} day{stats.currentStreak !== 1 ? "s" : ""} streak
              </Text>
            </View>
          )}
        </View>

        {/* Progress Card */}
        <GlassCard style={styles.progressCard}>
          <ProgressBar
            progress={progress}
            learned={todayProgress.learned}
            goal={todayProgress.goal}
          />
        </GlassCard>

        <View style={styles.actions}>
          <GradientButton
            title={todayProgress.learned > 0 ? "Continue Learning" : "Start Learning"}
            onPress={() => navigation.navigate("Learn")}
            variant="primary"
          />
          <GradientButton
            title="Settings"
            onPress={() => navigation.navigate("Settings")}
            variant="glass"
          />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  content: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.displayLarge,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    backgroundColor: colors.accentPurple + "20",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    alignSelf: "flex-start",
  },
  streakIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  streakText: {
    ...typography.label,
    color: colors.accentPurple,
    fontWeight: "600",
  },
  progressCard: {
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
});
