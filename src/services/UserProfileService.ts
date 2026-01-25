import * as AppleAuthentication from 'expo-apple-authentication';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import {
  getUserProfile,
  setUserProfile,
  clearUserProfile,
  exportAllData,
  storage,
} from './storage/mmkvStorage';
import { UserProfile, createDefaultUserProfile } from '../types/userProfile';

/**
 * Sign in with Apple and store the user profile
 */
export async function signInWithApple(): Promise<UserProfile> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const profile: UserProfile = {
      appleUserId: credential.user,
      email: credential.email,
      displayName: credential.fullName
        ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim() ||
          null
        : null,
      givenName: credential.fullName?.givenName ?? null,
      familyName: credential.fullName?.familyName ?? null,
      signedInAt: new Date().toISOString(),
    };

    // Apple only returns name/email on first sign-in
    // On subsequent sign-ins, merge with existing profile
    const existing = getUserProfile();
    if (existing && existing.appleUserId === credential.user) {
      // Keep existing name/email if new ones are null
      profile.displayName = profile.displayName ?? existing.displayName;
      profile.email = profile.email ?? existing.email;
      profile.givenName = profile.givenName ?? existing.givenName;
      profile.familyName = profile.familyName ?? existing.familyName;
    }

    setUserProfile(profile);
    return profile;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'ERR_REQUEST_CANCELED'
    ) {
      throw new Error('Sign in was cancelled');
    }
    throw error;
  }
}

/**
 * Sign out and clear the user profile
 */
export async function signOut(): Promise<void> {
  clearUserProfile();
}

/**
 * Check if Apple Sign-In is available on this device
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  return await AppleAuthentication.isAvailableAsync();
}

/**
 * Get initials from user profile for avatar display
 */
export function getInitials(profile: UserProfile | null): string {
  if (!profile) return '?';

  // Try to get initials from given/family name
  if (profile.givenName || profile.familyName) {
    const first = profile.givenName?.charAt(0).toUpperCase() ?? '';
    const last = profile.familyName?.charAt(0).toUpperCase() ?? '';
    return (first + last) || '?';
  }

  // Fall back to display name
  if (profile.displayName) {
    const parts = profile.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return profile.displayName.charAt(0).toUpperCase();
  }

  // Fall back to email
  if (profile.email) {
    return profile.email.charAt(0).toUpperCase();
  }

  return '?';
}

/**
 * Get display name with fallback
 */
export function getDisplayName(profile: UserProfile | null): string {
  if (!profile) return 'Guest';

  if (profile.displayName) return profile.displayName;

  if (profile.givenName || profile.familyName) {
    return `${profile.givenName ?? ''} ${profile.familyName ?? ''}`.trim();
  }

  if (profile.email) {
    // Use email prefix as display name
    return profile.email.split('@')[0];
  }

  return 'Guest';
}

/**
 * Export all user data to a JSON file and share it
 */
export async function exportDataToFile(): Promise<void> {
  const data = exportAllData();
  const jsonString = JSON.stringify(data, null, 2);

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `lexistack-export-${date}.json`;
  const file = new File(Paths.cache, filename);

  // Write to file
  await file.write(jsonString);

  // Check if sharing is available
  const sharingAvailable = await isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  // Share the file
  await shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export LexiStack Data',
    UTI: 'public.json',
  });
}

/**
 * Clear cached data (non-essential storage)
 * This clears temporary data but keeps important user data
 */
export function clearCache(): void {
  // Clear session-related data that can be regenerated
  storage.set('quiz_session', '');
  storage.set('learn_session', '');
  storage.set('last_session_summary', '');
  storage.set('yesterday_quiz_status', '');
}

/**
 * Get approximate cache size in bytes
 */
export function getCacheSize(): number {
  let size = 0;
  const cacheKeys = ['quiz_session', 'learn_session', 'last_session_summary', 'yesterday_quiz_status'];

  for (const key of cacheKeys) {
    const value = storage.getString(key);
    if (value) {
      size += value.length * 2; // UTF-16 encoding
    }
  }

  return size;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
