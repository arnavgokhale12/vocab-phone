import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useWords } from "../context/WordsContext";
import { GradientBackground, GradientButton } from "../components";
import { colors, typography, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { todayGoal } = useWords();

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>{todayGoal} words to learn</Text>
        </View>

        <View style={styles.actions}>
          <GradientButton
            title="Start Learning"
            onPress={() => navigation.navigate("Learn")}
            variant="primary"
          />
          <GradientButton
            title="Settings"
            onPress={() => navigation.navigate("Settings")}
            variant="glass"
          />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
