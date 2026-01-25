import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function SubscriptionCard() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.planBadge}>
          <Text style={styles.planText}>FREE</Text>
        </View>
        <Text style={styles.planLabel}>Current Plan</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.proSection}>
        <LinearGradient
          colors={[colors.accentPurple + '20', colors.accentBlue + '20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.proPreview}
        >
          <Ionicons name="star" size={20} color={colors.accentPurple} />
          <View style={styles.proTextContainer}>
            <Text style={styles.proTitle}>Upgrade to Pro</Text>
            <Text style={styles.proSubtitle}>Coming Soon</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresLabel}>Pro features will include:</Text>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark" size={16} color={colors.success} />
          <Text style={styles.featureText}>Unlimited custom word lists</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark" size={16} color={colors.success} />
          <Text style={styles.featureText}>Advanced statistics</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark" size={16} color={colors.success} />
          <Text style={styles.featureText}>Cloud sync across devices</Text>
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planBadge: {
    backgroundColor: colors.accentPurple,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  planText: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 1,
  },
  planLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginBottom: spacing.md,
  },
  proSection: {
    marginBottom: spacing.md,
  },
  proPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accentPurple + '30',
  },
  proTextContainer: {
    marginLeft: spacing.sm,
  },
  proTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  proSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  features: {
    gap: spacing.xs,
  },
  featuresLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
