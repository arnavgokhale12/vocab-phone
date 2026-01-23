import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  markWelcomeSeen,
  hasCompletedPlacementTest,
} from '../services/storage/mmkvStorage';
import {
  GradientBackground,
  GradientButton,
} from '../components';
import {
  colors,
  typography,
  spacing,
} from '../theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const handleGetStarted = () => {
    markWelcomeSeen();

    // Navigate to placement test if not completed, otherwise home
    if (!hasCompletedPlacementTest()) {
      navigation.replace('PlacementTest');
    } else {
      navigation.replace('Home');
    }
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.appName}>LexiStack</Text>
          <Text style={styles.tagline}>
            Build your vocabulary{'\n'}one word at a time
          </Text>
        </View>

        <View style={styles.actions}>
          <GradientButton
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
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
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    ...typography.displayLarge,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  tagline: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  actions: {
    paddingBottom: spacing.xxl,
  },
});
