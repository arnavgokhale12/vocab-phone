import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeekDayData } from '../services/storage/mmkvStorage';
import { colors, typography, spacing, borderRadius } from '../theme';

interface WeeklyCalendarProps {
  weekData: WeekDayData[];
  targetDays: number;
  completedCount: number;
}

export function WeeklyCalendar({ weekData, targetDays, completedCount }: WeeklyCalendarProps) {
  const isTargetMet = completedCount >= targetDays;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={[styles.progress, isTargetMet && styles.progressComplete]}>
          {completedCount}/{targetDays} days
        </Text>
      </View>

      <View style={styles.daysRow}>
        {weekData.map((day) => (
          <DayCircle key={day.dateKey} day={day} />
        ))}
      </View>
    </View>
  );
}

interface DayCircleProps {
  day: WeekDayData;
}

function DayCircle({ day }: DayCircleProps) {
  const { dayName, completed, isToday, isFuture } = day;

  // Determine styling based on state
  const getCircleStyle = () => {
    if (completed) {
      return [styles.dayCircle, styles.dayCompleted];
    }
    if (isToday) {
      return [styles.dayCircle, styles.dayToday];
    }
    if (isFuture) {
      return [styles.dayCircle, styles.dayFuture];
    }
    // Past and incomplete
    return [styles.dayCircle, styles.dayPast];
  };

  const getTextStyle = () => {
    if (completed) {
      return [styles.dayText, styles.dayTextCompleted];
    }
    if (isToday) {
      return [styles.dayText, styles.dayTextToday];
    }
    if (isFuture) {
      return [styles.dayText, styles.dayTextFuture];
    }
    return [styles.dayText, styles.dayTextPast];
  };

  return (
    <View style={styles.dayContainer}>
      <View style={getCircleStyle()}>
        {completed ? (
          <Ionicons name="checkmark" size={16} color={colors.text} />
        ) : (
          <Text style={getTextStyle()}>{dayName}</Text>
        )}
      </View>
    </View>
  );
}

const CIRCLE_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
  },
  progress: {
    ...typography.label,
    color: colors.accentPurple,
    fontWeight: '600',
  },
  progressComplete: {
    color: colors.success,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayContainer: {
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
    fontSize: 13,
    fontWeight: '600',
  },
  dayTextCompleted: {
    color: colors.text,
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
