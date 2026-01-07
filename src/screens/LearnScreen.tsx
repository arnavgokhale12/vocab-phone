import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useWords } from "../context/WordsContext";

export default function LearnScreen() {
  const { todayWords, refreshTodayIfNeeded } = useWords();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    refreshTodayIfNeeded();
  }, []);

  const w = todayWords[idx];

  if (!w) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Done</Text>
        <Text style={styles.subtitle}>You finished today’s set.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.term}>{w.term}</Text>

      {revealed ? (
        <>
          <Text style={styles.definition}>{w.definition}</Text>
          <Text style={styles.example}>“{w.example}”</Text>
        </>
      ) : (
        <Text style={styles.hint}>Tap reveal to see the meaning.</Text>
      )}

      <Pressable onPress={() => setRevealed(r => !r)}>
        <Text style={styles.link}>{revealed ? "Hide" : "Reveal"}</Text>
      </Pressable>

      <Pressable onPress={() => { setRevealed(false); setIdx(i => i + 1); }}>
        <Text style={styles.link}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  term: { fontSize: 28, fontWeight: "800" },
  hint: { marginTop: 12, opacity: 0.7 },
  definition: { marginTop: 12, fontSize: 16 },
  example: { marginTop: 8, fontStyle: "italic", opacity: 0.8 },
  link: { marginTop: 16, color: "#007aff" },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { marginTop: 8, opacity: 0.7 },
});
