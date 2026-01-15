import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useWords } from "../context/WordsContext";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { todayGoal } = useWords();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>
          {todayGoal} words to learn
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate("Learn")}
        >
          <Text style={styles.buttonText}>Start Learning</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.settingsButton,
            pressed && styles.settingsButtonPressed,
          ]}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.settingsButtonText}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  content: {
    marginBottom: spacing.xxl,
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
  actions: {
    gap: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: colors.primaryText,
    ...typography.button,
  },
  settingsButton: {
    backgroundColor: "transparent",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButtonPressed: {
    opacity: 0.6,
  },
  settingsButtonText: {
    color: colors.textSecondary,
    ...typography.buttonSmall,
  },
});
