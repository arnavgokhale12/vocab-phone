import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useWords } from "../context/WordsContext";
import { useProgress } from "../context/ProgressContext";
import {
  getDailyQuizStatus,
  getCurrentWeekCompletions,
  getWeeklyTargetDays,
  WeekDayData,
  wasYesterdayQuizMissed,
  getYesterdayQuizStatus,
} from "../services/storage/mmkvStorage";
import { getLevelProgress, LevelProgress } from "../services/LevelService";
import {
  GradientBackground,
  GradientButton,
  GlassCard,
  ProgressCard,
  StatsSheet,
} from "../components";
import { colors, typography, spacing, borderRadius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { todayGoal } = useWords();
  const { stats, todayProgress } = useProgress();
  const [statsSheetVisible, setStatsSheetVisible] = useState(false);

  const [quizStatus, setQuizStatus] = useState<{
    canTake: boolean;
    isTaken: boolean;
    score: number | null;
    wordCount: number;
  }>({ canTake: false, isTaken: false, score: null, wordCount: 0 });

  const [yesterdayQuiz, setYesterdayQuiz] = useState<{
    missed: boolean;
    wordIds: string[];
    wordCount: number;
  }>({ missed: false, wordIds: [], wordCount: 0 });

  const [levelProgress, setLevelProgress] = useState<LevelProgress>(
    getLevelProgress()
  );
  const [weeklyData, setWeeklyData] = useState<{
    weekData: WeekDayData[];
    targetDays: number;
    completedCount: number;
  }>(() => {
    const weekData = getCurrentWeekCompletions();
    return {
      weekData,
      targetDays: getWeeklyTargetDays(),
      completedCount: weekData.filter((d) => d.completed).length,
    };
  });

  // Refresh data when screen comes into focus
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
        setQuizStatus({
          canTake: false,
          isTaken: false,
          score: null,
          wordCount: 0,
        });
      }

      // Refresh level progress
      setLevelProgress(getLevelProgress());

      // Check for missed yesterday's quiz
      if (wasYesterdayQuizMissed()) {
        const yesterdayStatus = getYesterdayQuizStatus();
        if (yesterdayStatus) {
          setYesterdayQuiz({
            missed: true,
            wordIds: yesterdayStatus.seenWordIds,
            wordCount: yesterdayStatus.seenWordIds.length,
          });
        }
      } else {
        setYesterdayQuiz({ missed: false, wordIds: [], wordCount: 0 });
      }

      // Refresh weekly data
      const weekData = getCurrentWeekCompletions();
      setWeeklyData({
        weekData,
        targetDays: getWeeklyTargetDays(),
        completedCount: weekData.filter((d) => d.completed).length,
      });
    }, [])
  );

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* Header with Level Badge and Icons */}
        <View style={styles.header}>
          {/* Compact Level Badge */}
          <TouchableOpacity
            style={styles.levelChip}
            onPress={() => setStatsSheetVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.levelIcon}>{levelProgress.currentLevel.icon}</Text>
            <Text style={styles.levelName}>{levelProgress.currentLevel.name}</Text>
          </TouchableOpacity>

          {/* Header Icons */}
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate("Library")}
              activeOpacity={0.7}
            >
              <Ionicons name="library" size={20} color={colors.accentBlue} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate("Profile")}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={22} color={colors.accentPurple} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>{todayGoal} words to learn</Text>
        </View>

        {/* Primary CTA */}
        <GradientButton
          title={todayProgress.learned > 0 ? "Continue Learning" : "Start Today's Session"}
          onPress={() => navigation.navigate("Learn")}
          variant="primary"
        />

        {/* Combined Progress Card */}
        <GlassCard style={styles.progressCard}>
          <ProgressCard
            learned={todayProgress.learned}
            goal={todayProgress.goal}
            streak={stats.currentStreak}
            weekData={weeklyData.weekData}
            weeklyTarget={weeklyData.targetDays}
            weeklyCompleted={weeklyData.completedCount}
          />
        </GlassCard>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          {yesterdayQuiz.missed && (
            <TouchableOpacity
              style={[styles.secondaryButton, styles.yesterdayQuizButton]}
              onPress={() => navigation.navigate("Quiz", {
                wordIds: yesterdayQuiz.wordIds,
                isYesterdayQuiz: true,
              })}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={18} color={colors.warning} />
              <Text style={[styles.secondaryButtonText, styles.yesterdayQuizText]}>
                Yesterday's Quiz ({yesterdayQuiz.wordCount})
              </Text>
            </TouchableOpacity>
          )}
          {quizStatus.canTake && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("Quiz")}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={18} color={colors.accentPurple} />
              <Text style={styles.secondaryButtonText}>Take Quiz</Text>
            </TouchableOpacity>
          )}
          {quizStatus.isTaken && quizStatus.score !== null && (
            <View style={styles.quizCompleteBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.quizCompleteText}>
                Quiz: {quizStatus.score}/{quizStatus.wordCount}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Bottom Sheet */}
        <StatsSheet
          visible={statsSheetVisible}
          onClose={() => setStatsSheetVisible(false)}
          levelProgress={levelProgress}
          weekData={weeklyData.weekData}
          weeklyTarget={weeklyData.targetDays}
          weeklyCompleted={weeklyData.completedCount}
          totalWordsReviewed={stats.totalWordsReviewed}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  levelChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glassOverlay,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  levelIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  levelName: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
  },
  headerIcons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glassOverlay,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.displayLarge,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  progressCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  secondaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glassOverlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  secondaryButtonText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  quizCompleteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success + "15",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  quizCompleteText: {
    ...typography.label,
    color: colors.success,
    fontWeight: "600",
  },
  yesterdayQuizButton: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning + "40",
  },
  yesterdayQuizText: {
    color: colors.warning,
  },
});
