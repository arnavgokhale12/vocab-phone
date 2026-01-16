import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import HomeScreen from "../screens/HomeScreen";
import LearnScreen from "../screens/LearnScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PronunciationScreen from "../screens/PronunciationScreen";
import { colors } from "../theme";

export type RootStackParamList = {
  Home: undefined;
  Learn: undefined;
  Settings: undefined;
  Pronunciation: { wordId: string };
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
