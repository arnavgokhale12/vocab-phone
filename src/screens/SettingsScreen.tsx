import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useWords } from "../context/WordsContext";
import { GradientBackground } from "../components";
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

export default function SettingsScreen() {
  const { todayGoal, setTodayGoal } = useWords();

  return (
    <GradientBackground>
      <View style={styles.container}>
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
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
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
});
