import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useWords } from "../context/WordsContext";
import { GradientBackground } from "../components";
import {
  getWeeklyTargetDays,
  setWeeklyTargetDays,
  getNotificationSettings,
  setNotificationsEnabled,
  setReminderTime,
  NotificationSettings,
  getCustomListMixCount,
  setCustomListMixCount,
} from "../services/storage/mmkvStorage";
import { MAX_MIX_COUNT } from "../types/customList";
import {
  requestPermission,
  hasPermission,
  scheduleDailyReminder,
  cancelAllNotifications,
} from "../services/NotificationService";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  glassmorphism,
} from "../theme";

const GOAL_OPTIONS = [
  { value: 3, label: "3 words", description: "Light practice" },
  { value: 5, label: "5 words", description: "Balanced learning" },
  { value: 10, label: "10 words", description: "Intensive study" },
];

const WEEKLY_OPTIONS = [
  { value: 3, description: "Relaxed" },
  { value: 4, description: "Light" },
  { value: 5, description: "Balanced" },
  { value: 6, description: "Committed" },
  { value: 7, description: "Daily" },
];

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m} ${period}`;
}

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { todayGoal, setTodayGoal, refreshTodayIfNeeded } = useWords();
  const [weeklyTarget, setWeeklyTarget] = useState(getWeeklyTargetDays());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mixCount, setMixCount] = useState(getCustomListMixCount());

  const handleWeeklyTargetChange = (days: number) => {
    setWeeklyTarget(days);
    setWeeklyTargetDays(days);
  };

  async function handleToggleNotifications(enabled: boolean) {
    if (enabled) {
      const permitted = await hasPermission();
      if (!permitted) {
        const granted = await requestPermission();
        if (!granted) {
          return; // User denied permission
        }
      }
    }

    setNotificationsEnabled(enabled);
    setNotifSettings({ ...notifSettings, enabled });

    if (enabled) {
      await scheduleDailyReminder();
    } else {
      await cancelAllNotifications();
    }
  }

  async function handleTimeChange(event: DateTimePickerEvent, date?: Date) {
    setShowTimePicker(Platform.OS === "ios"); // Keep open on iOS
    if (event.type === "dismissed") {
      setShowTimePicker(false);
      return;
    }
    if (date) {
      const hour = date.getHours();
      const minute = date.getMinutes();
      setReminderTime(hour, minute);
      setNotifSettings({ ...notifSettings, reminderHour: hour, reminderMinute: minute });
      await scheduleDailyReminder();
      if (Platform.OS === "android") {
        setShowTimePicker(false);
      }
    }
  }

  function handleTimePickerDone() {
    setShowTimePicker(false);
  }

  return (
    <GradientBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goal</Text>
          <Text style={styles.sectionDescription}>
            How many new words do you want to learn each day?
          </Text>

          <View style={styles.optionsContainer}>
            {GOAL_OPTIONS.map((option) => {
              const isSelected = option.value === todayGoal;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                    pressed && styles.optionButtonPressed,
                  ]}
                  onPress={() => setTodayGoal(option.value)}
                >
                  <Text
                    style={[
                      styles.optionValue,
                      isSelected && styles.optionValueSelected,
                    ]}
                  >
                    {option.value}
                  </Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      isSelected && styles.optionDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Target</Text>
          <Text style={styles.sectionDescription}>
            How many days per week do you want to reach your daily goal?
          </Text>

          <View style={styles.weeklyOptionsRow}>
            {WEEKLY_OPTIONS.map((option) => {
              const isSelected = option.value === weeklyTarget;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.weeklyOption,
                    isSelected && styles.weeklyOptionSelected,
                    pressed && styles.optionButtonPressed,
                  ]}
                  onPress={() => handleWeeklyTargetChange(option.value)}
                >
                  <Text
                    style={[
                      styles.weeklyOptionValue,
                      isSelected && styles.weeklyOptionValueSelected,
                    ]}
                  >
                    {option.value}
                  </Text>
                  <Text
                    style={[
                      styles.weeklyOptionLabel,
                      isSelected && styles.weeklyOptionLabelSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.sectionDescription}>
            Daily reminder to keep your streak alive
          </Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Daily Reminder</Text>
            <Switch
              value={notifSettings.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.glassOverlay, true: colors.accentPurple }}
              thumbColor={colors.text}
            />
          </View>

          {notifSettings.enabled && (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.timePickerButton,
                  pressed && styles.optionButtonPressed,
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timePickerLabel}>Reminder Time</Text>
                <Text style={styles.timePickerValue}>
                  {formatTime(notifSettings.reminderHour, notifSettings.reminderMinute)}
                </Text>
              </Pressable>

              {showTimePicker && (
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={new Date(2000, 0, 1, notifSettings.reminderHour, notifSettings.reminderMinute)}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleTimeChange}
                    textColor={colors.text}
                  />
                  {Platform.OS === "ios" && (
                    <Pressable style={styles.timePickerDoneButton} onPress={handleTimePickerDone}>
                      <Text style={styles.timePickerDoneText}>Done</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Lists</Text>
          <Text style={styles.sectionDescription}>
            Create your own vocabulary lists to study
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.navRow,
              pressed && styles.optionButtonPressed,
            ]}
            onPress={() => navigation.navigate("CustomLists")}
          >
            <View style={styles.navRowLeft}>
              <Ionicons name="list" size={24} color={colors.accentPurple} />
              <Text style={styles.navRowLabel}>Manage Lists</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>

          <View style={styles.mixCountRow}>
            <View style={styles.mixCountLeft}>
              <Text style={styles.mixCountLabel}>Words per Day</Text>
              <Text style={styles.mixCountDescription}>
                Mix custom words into daily learning
              </Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                style={[styles.stepperButton, mixCount === 0 && styles.stepperButtonDisabled]}
                onPress={() => {
                  if (mixCount > 0) {
                    const newCount = mixCount - 1;
                    setMixCount(newCount);
                    setCustomListMixCount(newCount);
                    refreshTodayIfNeeded(true);
                  }
                }}
                disabled={mixCount === 0}
              >
                <Ionicons name="remove" size={18} color={mixCount === 0 ? colors.textMuted : colors.text} />
              </Pressable>
              <Text style={styles.stepperValue}>{mixCount}</Text>
              <Pressable
                style={[styles.stepperButton, mixCount === MAX_MIX_COUNT && styles.stepperButtonDisabled]}
                onPress={() => {
                  if (mixCount < MAX_MIX_COUNT) {
                    const newCount = mixCount + 1;
                    setMixCount(newCount);
                    setCustomListMixCount(newCount);
                    refreshTodayIfNeeded(true);
                  }
                }}
                disabled={mixCount === MAX_MIX_COUNT}
              >
                <Ionicons name="add" size={18} color={mixCount === MAX_MIX_COUNT ? colors.textMuted : colors.text} />
              </Pressable>
            </View>
          </View>
        </View>
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
    paddingBottom: spacing.xxl,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    ...glassmorphism.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: colors.accentPurpleLight,
    borderColor: colors.accentPurple,
  },
  optionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  optionValue: {
    ...typography.h1,
    color: colors.text,
    width: 60,
  },
  optionValueSelected: {
    color: colors.accentPurple,
  },
  optionLabel: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  optionLabelSelected: {
    color: colors.text,
  },
  optionDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  optionDescriptionSelected: {
    color: colors.textSecondary,
  },
  weeklyOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  weeklyOption: {
    ...glassmorphism.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flex: 1,
    alignItems: "center",
  },
  weeklyOptionSelected: {
    backgroundColor: colors.accentPurpleLight,
    borderColor: colors.accentPurple,
  },
  weeklyOptionValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  weeklyOptionValueSelected: {
    color: colors.accentPurple,
  },
  weeklyOptionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
  weeklyOptionLabelSelected: {
    color: colors.textSecondary,
  },
  toggleRow: {
    ...glassmorphism.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    ...typography.h3,
    color: colors.text,
  },
  timePickerButton: {
    ...glassmorphism.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  timePickerLabel: {
    ...typography.body,
    color: colors.text,
  },
  timePickerValue: {
    ...typography.h3,
    color: colors.accentPurple,
  },
  timePickerContainer: {
    ...glassmorphism.card,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  timePickerDoneButton: {
    padding: spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  timePickerDoneText: {
    ...typography.button,
    color: colors.accentPurple,
  },
  navRow: {
    ...glassmorphism.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  navRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  navRowLabel: {
    ...typography.h3,
    color: colors.text,
  },
  mixCountRow: {
    ...glassmorphism.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mixCountLeft: {
    flex: 1,
  },
  mixCountLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  mixCountDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentPurple,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperButtonDisabled: {
    backgroundColor: colors.card,
  },
  stepperValue: {
    ...typography.h3,
    color: colors.text,
    minWidth: 24,
    textAlign: "center",
  },
});
