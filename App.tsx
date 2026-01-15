import React from "react";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { WordsProvider } from "./src/context/WordsContext";
import { ProgressProvider } from "./src/context/ProgressContext";

export default function App() {
  return (
    <WordsProvider>
      <ProgressProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </ProgressProvider>
    </WordsProvider>
  );
}
