import React from "react";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { WordsProvider, useWords } from "./src/context/WordsContext";
import { ProgressProvider } from "./src/context/ProgressContext";

function AppContent() {
  const { todayGoal } = useWords();

  return (
    <ProgressProvider todayGoal={todayGoal}>
      <StatusBar style="auto" />
      <AppNavigator />
    </ProgressProvider>
  );
}

export default function App() {
  return (
    <WordsProvider>
      <AppContent />
    </WordsProvider>
  );
}
