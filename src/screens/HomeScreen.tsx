import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useWords } from "../context/WordsContext";
import { useProgress } from "../context/ProgressContext";
import { getDailyQuizStatus, getCurrentWeekCompletions, getWeeklyTargetDays, WeekDayData } from "../services/storage/mmkvStorage";
import { getLevelProgress, LevelProgress } from "../services/LevelService";
import { GradientBackground, GradientButton, GlassCard, ProgressBar, LevelBadge, WeeklyCalendar } from "../components";
import { colors, typography, spacing, borderRadius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { todayGoal } = useWords();
  const { stats, todayProgress } = useProgress();
  const [quizStatus, setQuizStatus] = useState<{
    canTake: boolean;
    isTaken: boolean;
    score: number | null;
    wordCount: number;
  }>({ canTake: false, isTaken: false, score: null, wordCount: 0 });

  const [levelProgress, setLevelProgress] = useState<LevelProgress>(getLevelProgress());
  const [weeklyData, setWeeklyData] = useState<{
    weekData: WeekDayData[];
    targetDays: number;
    completedCount: number;
  }>(() => {
    const weekData = getCurrentWeekCompletions();
    return {
      weekData,
      targetDays: getWeeklyTargetDays(),
      completedCount: weekData.filter(d => d.completed).length,
    };
  });

  // Refresh quiz status and level progress when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refresh quiz status
      const status = getDailyQuizStatus();
      if (status) {
        setQuizStatus({
          canTake: status.seenWordIds.length > 0 && !status.quizTaken,
          isTaken: status.quizTaken,
          score: status.quizScore,
          wordCount: status.seenWordIds.length,
        });
      } else {
        setQuizStatus({ canTake: false, isTaken: false, score: null, wordCount: 0 });
      }

      // Refresh level progress (updates after quizzes/sessions)
      setLevelProgress(getLevelProgress());

      // Refresh weekly data
      const weekData = getCurrentWeekCompletions();
      setWeeklyData({
        weekData,
        targetDays: getWeeklyTargetDays(),
        completedCount: weekData.filter(d => d.completed).length,
      });
    }, [])
  );

  const progress = todayProgress.goal > 0 ? todayProgress.learned / todayProgress.goal : 0;

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* Header with icons */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate("Library")}
              activeOpacity={0.7}
            >
              <Ionicons name="library" size={24} color={colors.accentBlue} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate("Bookmarks")}
              activeOpacity={0.7}
            >
              <Ionicons name="heart" size={24} color={colors.accentPurple} />
            </TouchableOpacity>
          </View>
        </View>

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

        {/* Level Badge */}
        <GlassCard style={styles.levelCard}>
          <LevelBadge levelProgress={levelProgress} />
        </GlassCard>

        {/* Weekly Calendar */}
        <GlassCard style={styles.weeklyCard}>
          <WeeklyCalendar
            weekData={weeklyData.weekData}
            targetDays={weeklyData.targetDays}
            completedCount={weeklyData.completedCount}
          />
        </GlassCard>

        <View style={styles.actions}>
          <GradientButton
            title={todayProgress.learned > 0 ? "Continue Learning" : "Start Learning"}
            onPress={() => navigation.navigate("Learn")}
            variant="primary"
          />
          {quizStatus.canTake && (
            <GradientButton
              title="Take Today's Quiz"
              onPress={() => navigation.navigate("Quiz")}
              variant="glass"
            />
          )}
          {quizStatus.isTaken && quizStatus.score !== null && (
            <View style={styles.quizCompleteCard}>
              <Text style={styles.quizCompleteText}>
                Quiz Complete: {quizStatus.score}/{quizStatus.wordCount}
              </Text>
            </View>
          )}
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
  header: {
    position: "absolute",
    top: spacing.xxl + spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerSpacer: {
    width: 40,
  },
  headerIcons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassOverlay,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: spacing.md,
  },
  levelCard: {
    marginBottom: spacing.md,
  },
  weeklyCard: {
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  quizCompleteCard: {
    backgroundColor: colors.accentPurple + "20",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  quizCompleteText: {
    ...typography.label,
    color: colors.accentPurple,
    fontWeight: "600",
  },
});
