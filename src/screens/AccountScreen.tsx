import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getUserProfile } from '../services/storage/mmkvStorage';
import {
  exportDataToFile,
  clearCache,
  getCacheSize,
  formatBytes,
} from '../services/UserProfileService';
import { UserProfile } from '../types/userProfile';
import { GradientBackground } from '../components';
import PreferenceSection from '../components/profile/PreferenceSection';
import PreferenceRow from '../components/profile/PreferenceRow';
import SignInCard from '../components/account/SignInCard';
import SubscriptionCard from '../components/account/SubscriptionCard';
import LegalLinks from '../components/account/LegalLinks';
import ConfirmModal from '../components/common/ConfirmModal';
import { colors, typography, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

const APP_VERSION = '2.2.0';

export default function AccountScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setProfile(getUserProfile());
      setCacheSize(getCacheSize());
    }, [])
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportDataToFile();
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'An error occurred while exporting data.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
    setCacheSize(0);
    setShowClearCacheModal(false);
    Alert.alert('Cache Cleared', 'Temporary data has been cleared.');
  };

  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Sign In Section */}
        <PreferenceSection title="ACCOUNT">
          <SignInCard profile={profile} onProfileChange={setProfile} />
        </PreferenceSection>

        {/* Subscription Section */}
        <PreferenceSection title="SUBSCRIPTION">
          <SubscriptionCard />
        </PreferenceSection>

        {/* Data Section */}
        <PreferenceSection title="DATA">
          <PreferenceRow
            label="Export All Data"
            subtitle={isExporting ? 'Exporting...' : 'Download your data as JSON'}
            icon="download-outline"
            onPress={handleExport}
            showChevron
          />
          <PreferenceRow
            label="Clear Cache"
            subtitle={`${formatBytes(cacheSize)} used`}
            icon="trash-outline"
            onPress={() => setShowClearCacheModal(true)}
            showChevron
            isLast
          />
        </PreferenceSection>

        {/* Legal Section */}
        <PreferenceSection title="LEGAL">
          <LegalLinks appVersion={APP_VERSION} />
        </PreferenceSection>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>LexiStack v{APP_VERSION}</Text>
        </View>

        <View style={styles.bottomSpacer} />

        {/* Clear Cache Confirmation Modal */}
        <ConfirmModal
          visible={showClearCacheModal}
          title="Clear Cache"
          message="This will clear temporary session data. Your progress and settings will not be affected."
          confirmText="Clear"
          onConfirm={handleClearCache}
          onCancel={() => setShowClearCacheModal(false)}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
