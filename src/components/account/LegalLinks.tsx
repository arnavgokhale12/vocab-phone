import React from 'react';
import { View, Linking, Alert } from 'react-native';
import PreferenceRow from '../profile/PreferenceRow';
import { colors, borderRadius } from '../../theme';
import { StyleSheet } from 'react-native';

// Placeholder URLs - replace with actual URLs
const PRIVACY_POLICY_URL = 'https://example.com/privacy';
const TERMS_URL = 'https://example.com/terms';
const SUPPORT_EMAIL = 'support@lexistack.app';

interface LegalLinksProps {
  appVersion: string;
}

export default function LegalLinks({ appVersion }: LegalLinksProps) {
  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleContactSupport = () => {
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=LexiStack Support (v${appVersion})`;
    Linking.openURL(mailtoUrl);
  };

  return (
    <View style={styles.container}>
      <PreferenceRow
        label="Privacy Policy"
        icon="document-text-outline"
        onPress={() => openURL(PRIVACY_POLICY_URL)}
        showChevron
      />
      <PreferenceRow
        label="Terms of Service"
        icon="document-text-outline"
        onPress={() => openURL(TERMS_URL)}
        showChevron
      />
      <PreferenceRow
        label="Contact Support"
        icon="mail-outline"
        onPress={handleContactSupport}
        showChevron
        isLast
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassOverlay,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
});
