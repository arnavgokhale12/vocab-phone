import React from "react";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { WordsProvider } from "./src/context/WordsContext";

export default function App() {
  return (
    <WordsProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </WordsProvider>
  );
}
