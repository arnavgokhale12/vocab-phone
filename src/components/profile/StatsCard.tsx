import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { UserStats } from '../../types/wordProgress';
import { AccuracyStats } from '../../types/userProfile';

interface StatItemProps {
  icon: string;
  value: string | number;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface StatsCardProps {
  stats: UserStats;
  accuracy: AccuracyStats;
  todayLearned: number;
}

export default function StatsCard({ stats, accuracy, todayLearned }: StatsCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>STATS</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatItem
            icon="🔥"
            value={stats.currentStreak}
            label="Streak"
          />
          <StatItem
            icon="📚"
            value={todayLearned}
            label="Today"
          />
          <StatItem
            icon="✓"
            value={`${accuracy.last7Days.percentage}%`}
            label="7-Day"
          />
        </View>
        <View style={styles.statsRow}>
          <StatItem
            icon="🏆"
            value={stats.longestStreak}
            label="Best"
          />
          <StatItem
            icon="📖"
            value={stats.totalWordsReviewed}
            label="Total"
          />
          <StatItem
            icon="✓"
            value={`${accuracy.lifetime.percentage}%`}
            label="Lifetime"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassOverlay,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  statsGrid: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.glassOverlay,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginHorizontal: spacing.xs / 2,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
