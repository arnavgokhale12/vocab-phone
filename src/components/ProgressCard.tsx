import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WeekDayData } from '../services/storage/mmkvStorage';
import { colors, typography, spacing, borderRadius } from '../theme';

interface ProgressCardProps {
  learned: number;
  goal: number;
  streak: number;
  weekData: WeekDayData[];
  weeklyTarget: number;
  weeklyCompleted: number;
}

export function ProgressCard({
  learned,
  goal,
  streak,
  weekData,
  weeklyTarget,
  weeklyCompleted,
}: ProgressCardProps) {
  const progress = goal > 0 ? Math.min(learned / goal, 1) : 0;
  const isComplete = learned >= goal;

  return (
    <View style={styles.container}>
      {/* Row 1: Today's Progress */}
      <View style={styles.todayRow}>
        <Text style={styles.todayLabel}>Today</Text>
        <Text style={[styles.todayCount, isComplete && styles.todayCountComplete]}>
          {learned} / {goal}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={[colors.accentPurple, colors.accentBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progress * 100}%` }]}
        />
      </View>

      {/* Row 2: Streak + Weekly Count */}
      <View style={styles.statsRow}>
        {streak > 0 ? (
          <View style={styles.streakChip}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>
              {streak} day{streak !== 1 ? 's' : ''}
            </Text>
          </View>
        ) : (
          <View style={styles.streakChip}>
            <Text style={styles.noStreakText}>Start your streak!</Text>
          </View>
        )}
        <Text style={styles.weeklyCount}>
          {weeklyCompleted}/{weeklyTarget} days this week
        </Text>
      </View>

      {/* Row 3: Week Calendar */}
      <View style={styles.weekRow}>
        {weekData.map((day) => (
          <View key={day.dateKey} style={styles.dayItem}>
            <View style={getDayCircleStyle(day)}>
              {day.completed ? (
                <Ionicons name="checkmark" size={12} color={colors.text} />
              ) : (
                <Text style={getDayTextStyle(day)}>{day.dayName}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function getDayCircleStyle(day: WeekDayData): object[] {
  const base = styles.dayCircle;
  if (day.completed) {
    return [base, styles.dayCompleted];
  }
  if (day.isToday) {
    return [base, styles.dayToday];
  }
  if (day.isFuture) {
    return [base, styles.dayFuture];
  }
  return [base, styles.dayPast];
}

function getDayTextStyle(day: WeekDayData): object[] {
  const base = styles.dayText;
  if (day.isToday) {
    return [base, styles.dayTextToday];
  }
  if (day.isFuture) {
    return [base, styles.dayTextFuture];
  }
  return [base, styles.dayTextPast];
}

const CIRCLE_SIZE = 28;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  todayLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  todayCount: {
    ...typography.h3,
    color: colors.text,
  },
  todayCountComplete: {
    color: colors.accentPurple,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentPurple + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  streakIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  streakText: {
    ...typography.caption,
    color: colors.accentPurple,
    fontWeight: '600',
  },
  noStreakText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  weeklyCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayItem: {
    alignItems: 'center',
  },
  dayCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCompleted: {
    backgroundColor: colors.accentPurple,
  },
  dayToday: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accentPurple,
  },
  dayFuture: {
    backgroundColor: colors.glassOverlay,
  },
  dayPast: {
    backgroundColor: colors.glassOverlay,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayTextToday: {
    color: colors.accentPurple,
  },
  dayTextFuture: {
    color: colors.textSubtle,
  },
  dayTextPast: {
    color: colors.textMuted,
  },
});
