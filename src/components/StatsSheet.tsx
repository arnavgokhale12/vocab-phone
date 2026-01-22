import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LevelProgress } from '../services/LevelService';
import { WeekDayData } from '../services/storage/mmkvStorage';
import { LevelBadge } from './LevelBadge';
import { WeeklyCalendar } from './WeeklyCalendar';
import { colors, typography, spacing, borderRadius } from '../theme';

interface StatsSheetProps {
  visible: boolean;
  onClose: () => void;
  levelProgress: LevelProgress;
  weekData: WeekDayData[];
  weeklyTarget: number;
  weeklyCompleted: number;
  totalWordsReviewed: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function StatsSheet({
  visible,
  onClose,
  levelProgress,
  weekData,
  weeklyTarget,
  weeklyCompleted,
  totalWordsReviewed,
}: StatsSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                { paddingBottom: insets.bottom + spacing.lg },
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Your Progress</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Level Section */}
              <View style={styles.section}>
                <LevelBadge levelProgress={levelProgress} showProgress={true} />
              </View>

              {/* Stats Row */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{levelProgress.masteredCount}</Text>
                  <Text style={styles.statLabel}>Mastered</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalWordsReviewed}</Text>
                  <Text style={styles.statLabel}>Total Reviews</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {levelProgress.totalWords > 0
                      ? Math.round(levelProgress.overallMasteryPercent)
                      : 0}%
                  </Text>
                  <Text style={styles.statLabel}>Mastery</Text>
                </View>
              </View>

              {/* Weekly Section */}
              <View style={styles.section}>
                <WeeklyCalendar
                  weekData={weekData}
                  targetDays={weeklyTarget}
                  completedCount={weeklyCompleted}
                />
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.gradientStart,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glassOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
