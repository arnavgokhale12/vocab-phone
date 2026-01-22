import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LevelProgress } from '../services/LevelService';
import { colors, typography, spacing, borderRadius } from '../theme';

interface LevelBadgeProps {
  levelProgress: LevelProgress;
  showProgress?: boolean;
}

export function LevelBadge({ levelProgress, showProgress = true }: LevelBadgeProps) {
  const { currentLevel, nextLevel, masteredCount, progressToNext, wordsToNextLevel } = levelProgress;

  return (
    <View style={styles.container}>
      {/* Level Badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.iconContainer, { backgroundColor: currentLevel.color + '30' }]}>
          <Text style={styles.icon}>{currentLevel.icon}</Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={styles.levelName}>{currentLevel.name} Level</Text>
          <Text style={styles.masteredCount}>
            {masteredCount} words mastered
          </Text>
        </View>
      </View>

      {/* Progress to Next Level */}
      {showProgress && nextLevel && (
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              Progress to {nextLevel.name}
            </Text>
            <Text style={styles.progressCount}>
              {wordsToNextLevel} to go
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[currentLevel.color, nextLevel.color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressToNext * 100}%` }]}
            />
          </View>
        </View>
      )}

      {/* At Max Level */}
      {showProgress && !nextLevel && (
        <View style={styles.maxLevelBadge}>
          <Text style={styles.maxLevelText}>Maximum Level Achieved!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 2,
  },
  masteredCount: {
    ...typography.label,
    color: colors.textMuted,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  progressCount: {
    ...typography.label,
    color: colors.accentPurple,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  maxLevelBadge: {
    marginTop: spacing.md,
    backgroundColor: colors.accentPurple + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  maxLevelText: {
    ...typography.label,
    color: colors.accentPurple,
    fontWeight: '600',
  },
});
