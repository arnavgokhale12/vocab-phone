import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

// Common Ionicons names used in the app
type IconName = 'chevron-forward' | 'volume-high' | 'volume-high-outline' |
  'notifications' | 'notifications-outline' | 'speedometer' | 'speedometer-outline' |
  'options' | 'options-outline' | 'download' | 'download-outline' |
  'trash' | 'trash-outline' | 'shield' | 'shield-outline' |
  'document-text' | 'document-text-outline' | 'mail' | 'mail-outline' |
  'log-out' | 'log-out-outline' | 'settings' | 'settings-outline' |
  'person' | 'person-outline' | 'star' | 'star-outline' | string;

interface PreferenceRowProps {
  label: string;
  subtitle?: string;
  icon?: IconName;
  onPress?: () => void;
  rightElement?: ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
}

export default function PreferenceRow({
  label,
  subtitle,
  icon,
  onPress,
  rightElement,
  showChevron = false,
  isLast = false,
}: PreferenceRowProps) {
  const content = (
    <View style={[styles.container, !isLast && styles.borderBottom]}>
      {icon && (
        <Ionicons
          name={icon as any}
          size={22}
          color={colors.accentPurple}
          style={styles.icon}
        />
      )}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textMuted}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// Toggle row variant
interface ToggleRowProps {
  label: string;
  subtitle?: string;
  icon?: IconName;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

export function ToggleRow({
  label,
  subtitle,
  icon,
  value,
  onValueChange,
  isLast = false,
}: ToggleRowProps) {
  return (
    <PreferenceRow
      label={label}
      subtitle={subtitle}
      icon={icon}
      isLast={isLast}
      rightElement={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.glassOverlay, true: colors.accentPurple }}
          thumbColor={colors.text}
          ios_backgroundColor={colors.glassOverlay}
        />
      }
    />
  );
}

// Selector row variant (shows current value)
interface SelectorRowProps {
  label: string;
  subtitle?: string;
  icon?: IconName;
  value: string;
  onPress: () => void;
  isLast?: boolean;
}

export function SelectorRow({
  label,
  subtitle,
  icon,
  value,
  onPress,
  isLast = false,
}: SelectorRowProps) {
  return (
    <PreferenceRow
      label={label}
      subtitle={subtitle}
      icon={icon}
      onPress={onPress}
      isLast={isLast}
      showChevron
      rightElement={
        <Text style={styles.selectorValue}>{value}</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: 56,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  icon: {
    marginRight: spacing.md,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  selectorValue: {
    ...typography.body,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
});
