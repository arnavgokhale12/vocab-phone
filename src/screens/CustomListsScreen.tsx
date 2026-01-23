import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  getCustomLists,
  deleteCustomList,
  setCustomListIncludeInDaily,
} from '../services/storage/mmkvStorage';
import { CustomList } from '../types/customList';
import { GradientBackground, GlassCard } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomLists'>;

export default function CustomListsScreen({ navigation }: Props) {
  const [lists, setLists] = useState<CustomList[]>([]);

  useFocusEffect(
    useCallback(() => {
      const all = getCustomLists();
      const sorted = Array.from(all.values()).sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
      setLists(sorted);
    }, [])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerBlurEffect: undefined,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('CustomListDetail', {})}
          style={styles.addButton}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color={colors.accentPurple} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleToggleInDaily = (listId: string, currentValue: boolean) => {
    setCustomListIncludeInDaily(listId, !currentValue);
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, includeInDaily: !currentValue } : l
      )
    );
  };

  const handleDeleteList = (listId: string, name: string) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCustomList(listId);
            setLists((prev) => prev.filter((l) => l.id !== listId));
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CustomList }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('CustomListDetail', { listId: item.id })}
    >
      <GlassCard style={styles.listCard}>
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.listName}>{item.name}</Text>
            <Text style={styles.wordCount}>
              {item.words.length}/20 words
            </Text>
          </View>
          <View style={styles.cardRight}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Daily</Text>
              <Switch
                value={item.includeInDaily}
                onValueChange={() => handleToggleInDaily(item.id, item.includeInDaily)}
                trackColor={{ false: colors.card, true: colors.accentPurple }}
                thumbColor={colors.text}
              />
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteList(item.id, item.name)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  if (lists.length === 0) {
    return (
      <GradientBackground>
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Custom Lists</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to create your first vocabulary list.
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glassOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
  },
  listCard: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  wordCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toggleLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
