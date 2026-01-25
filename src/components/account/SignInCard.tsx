import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { UserProfile } from '../../types/userProfile';
import {
  signInWithApple,
  signOut,
  isAppleSignInAvailable,
  getDisplayName,
} from '../../services/UserProfileService';

interface SignInCardProps {
  profile: UserProfile | null;
  onProfileChange: (profile: UserProfile | null) => void;
}

export default function SignInCard({ profile, onProfileChange }: SignInCardProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    isAppleSignInAvailable().then(setIsAvailable);
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const newProfile = await signInWithApple();
      onProfileChange(newProfile);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Sign in was cancelled') {
        Alert.alert('Sign In Failed', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            onProfileChange(null);
          },
        },
      ]
    );
  };

  const isSignedIn = profile?.appleUserId != null;

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>
          Apple Sign-In is not available on this device
        </Text>
      </View>
    );
  }

  if (isSignedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.signedInRow}>
          <View style={styles.userInfo}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <View style={styles.userTextContainer}>
              <Text style={styles.signedInLabel}>Signed in as</Text>
              <Text style={styles.userName}>{getDisplayName(profile)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={borderRadius.md}
        style={styles.appleButton}
        onPress={handleSignIn}
      />
      <Text style={styles.helperText}>
        Sign in to sync your profile across devices
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassOverlay,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  helperText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  unavailableText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  signedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  signedInLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  userName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  signOutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.errorLight,
  },
  signOutText: {
    ...typography.label,
    color: colors.error,
    fontWeight: '600',
  },
});
