import React, { useState, useEffect } from "react";
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
import PlacementTestScreen from "../screens/PlacementTestScreen";
import LibraryScreen from "../screens/LibraryScreen";
import WordDetailScreen from "../screens/WordDetailScreen";
import CustomListsScreen from "../screens/CustomListsScreen";
import CustomListDetailScreen from "../screens/CustomListDetailScreen";
import SessionSummaryScreen from "../screens/SessionSummaryScreen";
import WeakWordsQuizScreen from "../screens/WeakWordsQuizScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import { SessionSummary, WeakWord } from "../types/sessionSummary";
import { hasCompletedPlacementTest, hasSeenWelcome } from "../services/storage/mmkvStorage";
import { colors } from "../theme";
import { QuizQuestionResult } from "../types/quiz";

export type RootStackParamList = {
  Welcome: undefined;
  PlacementTest: undefined;
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
  Library: undefined;
  WordDetail: { wordId: string };
  CustomLists: undefined;
  CustomListDetail: { listId?: string };
  SessionSummary: { summary?: SessionSummary };
  WeakWordsQuiz: { weakWords: WeakWord[] };
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
      Welcome: "welcome",
      PlacementTest: "placement",
      Pronunciation: "pronounce/:wordId",
      Home: "",
      Learn: "learn",
      Settings: "settings",
      Quiz: "quiz",
      QuizSummary: "quiz-summary",
      Bookmarks: "bookmarks",
      Library: "library",
      WordDetail: "word/:wordId",
      CustomLists: "custom-lists",
      CustomListDetail: "custom-list/:listId?",
      SessionSummary: "session-summary",
      WeakWordsQuiz: "weak-words-quiz",
    },
  },
};

export default function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [needsWelcome, setNeedsWelcome] = useState(false);
  const [needsPlacement, setNeedsPlacement] = useState(false);

  useEffect(() => {
    // Check onboarding state
    const seenWelcome = hasSeenWelcome();
    const completedPlacement = hasCompletedPlacementTest();

    setNeedsWelcome(!seenWelcome);
    setNeedsPlacement(!completedPlacement);
    setIsReady(true);
  }, []);

  // Determine initial route
  const getInitialRoute = (): keyof RootStackParamList => {
    if (needsWelcome) return 'Welcome';
    if (needsPlacement) return 'PlacementTest';
    return 'Home';
  };

  // Don't render until we know the initial route
  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer theme={CustomDarkTheme} linking={linking}>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
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
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PlacementTest"
          component={PlacementTestScreen}
          options={{ headerShown: false }}
        />
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
        <Stack.Screen
          name="Library"
          component={LibraryScreen}
          options={{ title: "Library" }}
        />
        <Stack.Screen
          name="WordDetail"
          component={WordDetailScreen}
          options={{ title: "Word Details" }}
        />
        <Stack.Screen
          name="CustomLists"
          component={CustomListsScreen}
          options={{ title: "My Lists" }}
        />
        <Stack.Screen
          name="CustomListDetail"
          component={CustomListDetailScreen}
          options={{ title: "" }}
        />
        <Stack.Screen
          name="SessionSummary"
          component={SessionSummaryScreen}
          options={{ title: "Session Summary", headerBackVisible: false }}
        />
        <Stack.Screen
          name="WeakWordsQuiz"
          component={WeakWordsQuizScreen}
          options={{ title: "Review" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
