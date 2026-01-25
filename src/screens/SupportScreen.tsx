import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GradientBackground } from '../components';
import PreferenceSection from '../components/profile/PreferenceSection';
import PreferenceRow from '../components/profile/PreferenceRow';
import FAQItem from '../components/support/FAQItem';
import { colors, typography, spacing, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Support'>;

// ============================================================================
// CONFIGURATION - All static content lives here
// ============================================================================

const APP_VERSION = '2.2.0';
const SUPPORT_EMAIL = 'arnavgokhale216@gmail.com';

const FAQ_ITEMS = [
  {
    question: 'How does the daily word system work?',
    answer:
      'Each day, LexiStack generates a set of words based on your daily goal (3, 5, or 10 words). The same words appear for everyone on the same day, using a date-based selection system. Complete your daily words to maintain your streak!',
  },
  {
    question: 'Why did my streak reset?',
    answer:
      'Your streak resets if you miss a full day without completing your daily goal. Streaks are counted at midnight local time. If you believe your streak reset incorrectly, try force-closing and reopening the app.',
  },
  {
    question: 'How do I hear pronunciation?',
    answer:
      'Tap the speaker icon next to any word to hear its pronunciation. You can also enable "Autoplay" in your Profile settings to automatically play pronunciation when viewing a new word.',
  },
  {
    question: 'How is my data stored?',
    answer:
      'All your data is stored locally on your device. We do not collect or transmit your learning progress, custom word lists, or personal information to any server. Your data stays private on your phone.',
  },
  {
    question: 'How do I export or reset my data?',
    answer:
      'Go to Account → Export All Data to download a JSON file of your complete data. To clear temporary cache, use Account → Clear Cache. Note: There is no full progress reset option to protect against accidental data loss.',
  },
];

const LEGAL_LINKS = {
  privacy: {
    label: 'Privacy Policy',
    url: null, // Placeholder - set to actual URL when ready
  },
  terms: {
    label: 'Terms of Service',
    url: null, // Placeholder - set to actual URL when ready
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function getDeviceInfo(): string {
  const osVersion = Platform.Version;
  const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';
  return `\n\n---\nApp Version: ${APP_VERSION}\nPlatform: ${platform}\nOS Version: ${osVersion}`;
}

function openMailto(subject: string): void {
  const deviceInfo = getDeviceInfo();
  const body = encodeURIComponent(`\n\n[Please describe your issue or suggestion above]${deviceInfo}`);
  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;

  Linking.openURL(mailtoUrl).catch(() => {
    Alert.alert(
      'Unable to Open Email',
      `Please email us directly at ${SUPPORT_EMAIL}`,
      [{ text: 'OK' }]
    );
  });
}

function openExternalLink(url: string | null, label: string): void {
  if (!url) {
    Alert.alert(label, 'Coming soon. This link is not yet available.');
    return;
  }

  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open this link');
    }
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SupportScreen({ navigation }: Props) {
  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <PreferenceSection title="FREQUENTLY ASKED QUESTIONS">
          <View style={styles.faqContainer}>
            {FAQ_ITEMS.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                isLast={index === FAQ_ITEMS.length - 1}
              />
            ))}
          </View>
        </PreferenceSection>

        {/* Feedback Section */}
        <PreferenceSection title="FEEDBACK & SUPPORT">
          <PreferenceRow
            label="Report a Problem"
            subtitle="Let us know about bugs or issues"
            icon="bug-outline"
            onPress={() => openMailto('[LexiStack Bug]')}
            showChevron
          />
          <PreferenceRow
            label="Suggest a Feature"
            subtitle="Share your ideas with us"
            icon="bulb-outline"
            onPress={() => openMailto('[LexiStack Feature Request]')}
            showChevron
            isLast
          />
        </PreferenceSection>

        {/* Legal Section */}
        <PreferenceSection title="LEGAL">
          <PreferenceRow
            label={LEGAL_LINKS.privacy.label}
            subtitle={LEGAL_LINKS.privacy.url ? undefined : 'Coming soon'}
            icon="document-text-outline"
            onPress={() => openExternalLink(LEGAL_LINKS.privacy.url, LEGAL_LINKS.privacy.label)}
            showChevron
          />
          <PreferenceRow
            label={LEGAL_LINKS.terms.label}
            subtitle={LEGAL_LINKS.terms.url ? undefined : 'Coming soon'}
            icon="document-text-outline"
            onPress={() => openExternalLink(LEGAL_LINKS.terms.url, LEGAL_LINKS.terms.label)}
            showChevron
            isLast
          />
        </PreferenceSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>LexiStack v{APP_VERSION}</Text>
          <Text style={styles.appInfoText}>
            {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
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
  faqContainer: {
    backgroundColor: colors.glassOverlay,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  appInfoText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
