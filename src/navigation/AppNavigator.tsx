import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import HomeScreen from "../screens/HomeScreen";
import LearnScreen from "../screens/LearnScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PronunciationScreen from "../screens/PronunciationScreen";
import QuizScreen from "../screens/QuizScreen";
import QuizSummaryScreen from "../screens/QuizSummaryScreen";
import BookmarksScreen from "../screens/BookmarksScreen";
import { colors } from "../theme";
import { QuizQuestionResult } from "../types/quiz";

export type RootStackParamList = {
  Home: undefined;
  Learn: undefined;
  Settings: undefined;
  Pronunciation: { wordId: string };
  Quiz: undefined;
  QuizSummary: {
    score: number;
    total: number;
    results: QuizQuestionResult[];
  };
  Bookmarks: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accentPurple,
    background: colors.background,
    card: colors.gradientStart,
    text: colors.text,
    border: colors.glassBorder,
    notification: colors.accentPurple,
  },
};

const linking = {
  prefixes: [Linking.createURL("/"), "vocabphone://"],
  config: {
    screens: {
      Pronunciation: "pronounce/:wordId",
      Home: "",
      Learn: "learn",
      Settings: "settings",
      Quiz: "quiz",
      QuizSummary: "quiz-summary",
      Bookmarks: "bookmarks",
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={CustomDarkTheme} linking={linking}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerTransparent: true,
          headerBlurEffect: "dark",
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Learn"
          component={LearnScreen}
          options={{ title: "Learn" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Settings" }}
        />
        <Stack.Screen
          name="Pronunciation"
          component={PronunciationScreen}
          options={{ title: "Pronunciation" }}
        />
        <Stack.Screen
          name="Quiz"
          component={QuizScreen}
          options={{ title: "Quiz" }}
        />
        <Stack.Screen
          name="QuizSummary"
          component={QuizSummaryScreen}
          options={{ title: "Results", headerBackVisible: false }}
        />
        <Stack.Screen
          name="Bookmarks"
          component={BookmarksScreen}
          options={{ title: "Bookmarks" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
