import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  getCustomList,
  createNewCustomList,
  saveCustomList,
  addWordToCustomList,
  removeWordFromCustomList,
} from '../services/storage/mmkvStorage';
import { CustomList, CustomWord, MAX_WORDS_PER_LIST } from '../types/customList';
import { GradientBackground, GlassCard, GradientButton } from '../components';
import { colors, typography, spacing, borderRadius, glassmorphism } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomListDetail'>;

export default function CustomListDetailScreen({ route, navigation }: Props) {
  const { listId } = route.params ?? {};
  const isEditMode = !!listId;

  const [list, setList] = useState<CustomList | null>(null);
  const [name, setName] = useState('');
  const [includeInDaily, setIncludeInDaily] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');

  useEffect(() => {
    if (isEditMode && listId) {
      const existingList = getCustomList(listId);
      if (existingList) {
        setList(existingList);
        setName(existingList.name);
        setIncludeInDaily(existingList.includeInDaily);
      }
    }
  }, [isEditMode, listId]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit List' : 'New List',
    });
  }, [isEditMode, navigation]);

  const refreshList = useCallback(() => {
    if (listId) {
      const updated = getCustomList(listId);
      if (updated) {
        setList(updated);
      }
    }
  }, [listId]);

  const handleSaveList = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a name for this list.');
      return;
    }

    if (isEditMode && list) {
      const updatedList: CustomList = {
        ...list,
        name: name.trim(),
        includeInDaily,
      };
      saveCustomList(updatedList);
      navigation.goBack();
    } else {
      const newList = createNewCustomList(name.trim());
      newList.includeInDaily = includeInDaily;
      saveCustomList(newList);
      navigation.replace('CustomListDetail', { listId: newList.id });
    }
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (isEditMode && list) {
      const updatedList: CustomList = {
        ...list,
        name: newName.trim() || list.name,
      };
      saveCustomList(updatedList);
    }
  };

  const handleToggleInDaily = (value: boolean) => {
    setIncludeInDaily(value);
    if (isEditMode && list) {
      const updatedList: CustomList = {
        ...list,
        includeInDaily: value,
      };
      saveCustomList(updatedList);
    }
  };

  const handleAddWord = () => {
    if (!newTerm.trim()) {
      Alert.alert('Term Required', 'Please enter a word.');
      return;
    }
    if (!newDefinition.trim()) {
      Alert.alert('Definition Required', 'Please enter a definition.');
      return;
    }

    if (!isEditMode) {
      Alert.alert('Save List First', 'Please save the list before adding words.');
      return;
    }

    if (list && list.words.length >= MAX_WORDS_PER_LIST) {
      Alert.alert('List Full', `Maximum ${MAX_WORDS_PER_LIST} words per list.`);
      return;
    }

    if (listId) {
      const success = addWordToCustomList(listId, newTerm.trim(), newDefinition.trim());
      if (success) {
        setNewTerm('');
        setNewDefinition('');
        refreshList();
      }
    }
  };

  const handleRemoveWord = (wordId: string) => {
    if (listId) {
      removeWordFromCustomList(listId, wordId);
      refreshList();
    }
  };

  const renderWordItem = ({ item }: { item: CustomWord }) => (
    <View style={styles.wordItem}>
      <View style={styles.wordContent}>
        <Text style={styles.wordTerm}>{item.term}</Text>
        <Text style={styles.wordDefinition} numberOfLines={2}>
          {item.definition}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveWord(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.headerSection}>
      {/* Name Input */}
      <GlassCard style={styles.inputCard}>
        <Text style={styles.label}>List Name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Enter list name"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </GlassCard>

      {/* Include in Daily Toggle */}
      <GlassCard style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleTitle}>Include in Daily</Text>
            <Text style={styles.toggleSubtitle}>Mix words into daily learning</Text>
          </View>
          <Switch
            value={includeInDaily}
            onValueChange={handleToggleInDaily}
            trackColor={{ false: colors.card, true: colors.accentPurple }}
            thumbColor={colors.text}
          />
        </View>
      </GlassCard>

      {/* Word Count Header */}
      {isEditMode && (
        <Text style={styles.wordsHeader}>
          Words ({list?.words.length ?? 0}/{MAX_WORDS_PER_LIST})
        </Text>
      )}

      {/* Add Word Form - Only in Edit Mode */}
      {isEditMode && (
        <GlassCard style={styles.addWordCard}>
          <TextInput
            style={styles.addWordInput}
            value={newTerm}
            onChangeText={setNewTerm}
            placeholder="Word"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            returnKeyType="next"
          />
          <TextInput
            style={[styles.addWordInput, styles.definitionInput]}
            value={newDefinition}
            onChangeText={setNewDefinition}
            placeholder="Definition"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="sentences"
            returnKeyType="done"
            multiline
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              (!newTerm.trim() || !newDefinition.trim()) && styles.addButtonDisabled,
            ]}
            onPress={handleAddWord}
            activeOpacity={0.7}
            disabled={!newTerm.trim() || !newDefinition.trim()}
          >
            <Ionicons name="add" size={20} color={colors.text} />
            <Text style={styles.addButtonText}>Add Word</Text>
          </TouchableOpacity>
        </GlassCard>
      )}
    </View>
  );

  const ListFooter = () => (
    <View style={styles.footerSection}>
      {!isEditMode && (
        <GradientButton
          title="Create List"
          onPress={handleSaveList}
          variant="primary"
        />
      )}
    </View>
  );

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={isEditMode ? list?.words ?? [] : []}
          keyExtractor={(item) => item.id}
          renderItem={renderWordItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isEditMode ? (
              <View style={styles.emptyWords}>
                <Text style={styles.emptyWordsText}>
                  No words yet. Add your first word above.
                </Text>
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    marginBottom: spacing.md,
  },
  inputCard: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  nameInput: {
    ...typography.h3,
    color: colors.text,
    padding: 0,
  },
  toggleCard: {
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  toggleSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  wordsHeader: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  addWordCard: {
    marginBottom: spacing.md,
  },
  addWordInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  definitionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPurple,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  addButtonDisabled: {
    backgroundColor: colors.card,
    opacity: 0.5,
  },
  addButtonText: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
  },
  wordItem: {
    ...glassmorphism.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordContent: {
    flex: 1,
  },
  wordTerm: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  wordDefinition: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
    marginLeft: spacing.md,
  },
  emptyWords: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyWordsText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footerSection: {
    marginTop: spacing.md,
  },
});
