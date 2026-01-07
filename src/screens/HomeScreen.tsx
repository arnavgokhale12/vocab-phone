import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useWords } from "../context/WordsContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { todayGoal } = useWords();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.subtitle}>Goal: {todayGoal} new words</Text>

      <Pressable style={styles.button} onPress={() => navigation.navigate("Learn")}>
        <Text style={styles.buttonText}>Start learning</Text>
      </Pressable>

      <Pressable style={styles.link} onPress={() => navigation.navigate("Settings")}>
        <Text style={styles.linkText}>Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, opacity: 0.7, marginBottom: 24 },
  button: { padding: 14, borderRadius: 12, backgroundColor: "#111" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  link: { marginTop: 16, alignSelf: "center" },
  linkText: { opacity: 0.7 },
});
