import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WordEtymology } from '../types/wordContent';
import { colors, typography, spacing, borderRadius, glassmorphism } from '../theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EtymologyCardProps {
  etymology: WordEtymology;
  /** Compact mode for LearnScreen — shows only summary + roots when expanded */
  compact?: boolean;
}

export function EtymologyCard({ etymology, compact = false }: EtymologyCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>Etymology</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      <Text style={styles.summary}>{etymology.plainEnglishSummary}</Text>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Language chain */}
          <View style={styles.row}>
            <Text style={styles.label}>Origin:</Text>
            <Text style={styles.originValue}>{etymology.languageOfOrigin}</Text>
          </View>

          {/* Roots */}
          {etymology.roots.length > 0 && (
            <View style={styles.rootsSection}>
              <Text style={styles.label}>Roots:</Text>
              {etymology.roots.map((r, i) => (
                <View key={i} style={styles.rootRow}>
                  <Text style={styles.rootTerm}>{r.root}</Text>
                  <Text style={styles.rootLang}>({r.language})</Text>
                  <Text style={styles.rootMeaning}>{r.literalMeaning}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Evolution and period — full mode only */}
          {!compact && (
            <>
              {etymology.evolution ? (
                <View style={styles.evolutionSection}>
                  <Text style={styles.evolutionText}>{etymology.evolution}</Text>
                </View>
              ) : null}

              <View style={styles.row}>
                <Text style={styles.label}>Entered English:</Text>
                <Text style={styles.periodValue}>{etymology.enteredEnglish}</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  summary: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  expandedContent: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  originValue: {
    ...typography.label,
    color: colors.accentBlue,
  },
  rootsSection: {
    gap: spacing.xs,
  },
  rootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
  },
  rootTerm: {
    ...typography.label,
    color: colors.accentPurple,
    fontWeight: '600',
  },
  rootLang: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rootMeaning: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  evolutionSection: {
    ...glassmorphism.overlay,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  evolutionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  periodValue: {
    ...typography.label,
    color: colors.text,
  },
});
