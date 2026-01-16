import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients, glowEffects } from '../theme';

interface Props {
  children: React.ReactNode;
  showGlow?: boolean;
}

export function GradientBackground({ children, showGlow = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      {showGlow && <View style={styles.purpleGlow} />}
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  purpleGlow: {
    position: 'absolute',
    width: glowEffects.purple.size,
    height: glowEffects.purple.size,
    borderRadius: glowEffects.purple.size / 2,
    backgroundColor: glowEffects.purple.color,
    top: -100,
    left: -100,
  },
});
