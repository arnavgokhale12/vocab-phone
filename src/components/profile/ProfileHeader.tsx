import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { UserProfile } from '../../types/userProfile';
import { getInitials, getDisplayName } from '../../services/UserProfileService';

interface ProfileHeaderProps {
  profile: UserProfile | null;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initials = getInitials(profile);
  const displayName = getDisplayName(profile);
  const email = profile?.email ?? null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.accentPurple, colors.accentBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatar}
      >
        <Text style={styles.initials}>{initials}</Text>
      </LinearGradient>
      <Text style={styles.displayName}>{displayName}</Text>
      {email && <Text style={styles.email}>{email}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  initials: {
    ...typography.h1,
    color: colors.text,
    fontWeight: '700',
  },
  displayName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
