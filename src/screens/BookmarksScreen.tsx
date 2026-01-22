import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  getBookmarks,
  removeBookmark,
  BookmarkEntry,
} from "../services/storage/mmkvStorage";
import { GradientBackground, GlassCard } from "../components";
import { colors, typography, spacing, borderRadius } from "../theme";

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);

  // Refresh bookmarks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const all = getBookmarks();
      // Sort by bookmarkedAt descending (newest first)
      const sorted = Array.from(all.values()).sort(
        (a, b) => b.bookmarkedAt - a.bookmarkedAt
      );
      setBookmarks(sorted);
    }, [])
  );

  const handleRemoveBookmark = (wordId: string) => {
    removeBookmark(wordId);
    setBookmarks((prev) => prev.filter((b) => b.wordId !== wordId));
  };

  const renderItem = ({ item }: { item: BookmarkEntry }) => (
    <GlassCard style={styles.bookmarkCard}>
      <View style={styles.cardContent}>
        <View style={styles.textContent}>
          <Text style={styles.term}>{item.term}</Text>
          <Text style={styles.definition} numberOfLines={2}>
            {item.definition}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveBookmark(item.wordId)}
          activeOpacity={0.7}
        >
          <Ionicons name="heart-dislike" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  if (bookmarks.length === 0) {
    return (
      <GradientBackground>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon while learning to save words here.
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.wordId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
  },
  bookmarkCard: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContent: {
    flex: 1,
  },
  term: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  definition: {
    ...typography.body,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
    marginLeft: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
  },
});
