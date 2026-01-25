import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useWords } from '../context/WordsContext';
import { useProgress } from '../context/ProgressContext';
import {
  getUserProfile,
  getAppPreferences,
  setAppPreferences,
  calculateAccuracyStats,
  getStats,
} from '../services/storage/mmkvStorage';
import { exportDataToFile } from '../services/UserProfileService';
import { UserProfile, AppPreferences, AccuracyStats } from '../types/userProfile';
import { UserStats } from '../types/wordProgress';
import { GradientBackground, GradientButton } from '../components';
import ProfileHeader from '../components/profile/ProfileHeader';
import StatsCard from '../components/profile/StatsCard';
import PreferenceSection from '../components/profile/PreferenceSection';
import PreferenceRow, { ToggleRow, SelectorRow } from '../components/profile/PreferenceRow';
import { colors, typography, spacing, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ACCENT_OPTIONS = [
  { label: 'American', value: 'american' as const },
  { label: 'British', value: 'british' as const },
];

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export default function ProfileScreen({ navigation }: Props) {
  const { todayGoal, setTodayGoal } = useWords();
  const { todayProgress } = useProgress();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<AppPreferences>(getAppPreferences());
  const [stats, setStats] = useState<UserStats>(getStats());
  const [accuracy, setAccuracy] = useState<AccuracyStats>(calculateAccuracyStats());
  const [isExporting, setIsExporting] = useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setProfile(getUserProfile());
      setPreferences(getAppPreferences());
      setStats(getStats());
      setAccuracy(calculateAccuracyStats());
    }, [])
  );

  const handleAccentChange = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...ACCENT_OPTIONS.map((o) => o.label)],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            const selected = ACCENT_OPTIONS[buttonIndex - 1];
            setAppPreferences({ pronunciationAccent: selected.value });
            setPreferences((prev) => ({ ...prev, pronunciationAccent: selected.value }));
          }
        }
      );
    } else {
      // For Android, cycle through options
      const currentIndex = ACCENT_OPTIONS.findIndex(
        (o) => o.value === preferences.pronunciationAccent
      );
      const nextIndex = (currentIndex + 1) % ACCENT_OPTIONS.length;
      const selected = ACCENT_OPTIONS[nextIndex];
      setAppPreferences({ pronunciationAccent: selected.value });
      setPreferences((prev) => ({ ...prev, pronunciationAccent: selected.value }));
    }
  };

  const handleDifficultyChange = () => {
    if (Platform.OS === 'ios') {
      const options = ['Cancel', ...Object.values(DIFFICULTY_LABELS)];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            const difficulty = buttonIndex as 1 | 2 | 3 | 4 | 5;
            setAppPreferences({ difficultyPreference: difficulty });
            setPreferences((prev) => ({ ...prev, difficultyPreference: difficulty }));
          }
        }
      );
    } else {
      // For Android, cycle through options
      const nextDifficulty = (preferences.difficultyPreference % 5) + 1;
      setAppPreferences({ difficultyPreference: nextDifficulty as 1 | 2 | 3 | 4 | 5 });
      setPreferences((prev) => ({
        ...prev,
        difficultyPreference: nextDifficulty as 1 | 2 | 3 | 4 | 5,
      }));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportDataToFile();
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'An error occurred while exporting data.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const currentAccentLabel =
    ACCENT_OPTIONS.find((o) => o.value === preferences.pronunciationAccent)?.label ?? 'American';

  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ProfileHeader profile={profile} />

        {/* Stats */}
        <StatsCard
          stats={stats}
          accuracy={accuracy}
          todayLearned={todayProgress.learned}
        />

        <View style={styles.spacer} />

        {/* Learning Preferences */}
        <PreferenceSection title="LEARNING">
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Daily Goal</Text>
            <View style={styles.goalButtons}>
              {[3, 5, 10].map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalButton,
                    todayGoal === goal && styles.goalButtonActive,
                  ]}
                  onPress={() => setTodayGoal(goal)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.goalButtonText,
                      todayGoal === goal && styles.goalButtonTextActive,
                    ]}
                  >
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <SelectorRow
            label="Difficulty"
            value={DIFFICULTY_LABELS[preferences.difficultyPreference]}
            onPress={handleDifficultyChange}
            isLast
          />
        </PreferenceSection>

        {/* Pronunciation */}
        <PreferenceSection title="PRONUNCIATION">
          <SelectorRow
            label="Accent"
            icon="volume-high-outline"
            value={currentAccentLabel}
            onPress={handleAccentChange}
          />
          <ToggleRow
            label="Autoplay"
            subtitle="Play pronunciation automatically"
            value={preferences.autoplayPronunciation}
            onValueChange={(value) => {
              setAppPreferences({ autoplayPronunciation: value });
              setPreferences((prev) => ({ ...prev, autoplayPronunciation: value }));
            }}
            isLast
          />
        </PreferenceSection>

        {/* App Preferences */}
        <PreferenceSection title="APP">
          <ToggleRow
            label="Haptics"
            subtitle="Vibration feedback"
            icon="options-outline"
            value={preferences.hapticsEnabled}
            onValueChange={(value) => {
              setAppPreferences({ hapticsEnabled: value });
              setPreferences((prev) => ({ ...prev, hapticsEnabled: value }));
            }}
            isLast
          />
        </PreferenceSection>

        {/* Account Link */}
        <PreferenceSection title="ACCOUNT">
          <PreferenceRow
            label="Account Settings"
            icon="person-outline"
            onPress={() => navigation.navigate('Account')}
            showChevron
            isLast
          />
        </PreferenceSection>

        {/* Export Button */}
        <View style={styles.exportContainer}>
          <GradientButton
            title={isExporting ? 'Exporting...' : 'Export My Data'}
            onPress={handleExport}
            variant="glass"
            disabled={isExporting}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
  },
  spacer: {
    height: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  goalLabel: {
    ...typography.body,
    color: colors.text,
  },
  goalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  goalButton: {
    width: 44,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glassOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  goalButtonActive: {
    backgroundColor: colors.accentPurple,
    borderColor: colors.accentPurple,
  },
  goalButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  goalButtonTextActive: {
    color: colors.text,
  },
  exportContainer: {
    marginTop: spacing.md,
  },
});
