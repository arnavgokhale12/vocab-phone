import React from "react";
import { View, Text, Pressable } from "react-native";
import { useWords } from "../context/WordsContext";

export default function SettingsScreen() {
  const { todayGoal, setTodayGoal } = useWords();

  return (
    <View style={{ padding: 24 }}>
      <Text>Daily goal</Text>
      {[3,5,10].map(n => (
        <Pressable key={n} onPress={() => setTodayGoal(n)}>
          <Text style={{ fontWeight: n === todayGoal ? "700" : "400" }}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}
