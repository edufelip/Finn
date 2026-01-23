import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { ThemeColors } from '../../theme/colors';

type CommunityDetailEmptyStateProps = {
  theme: ThemeColors;
  onStartDiscussion: () => void;
  isDisabled?: boolean;
};

export default function CommunityDetailEmptyState({
  theme,
  onStartDiscussion,
  isDisabled,
}: CommunityDetailEmptyStateProps) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <View style={styles.emptyCircle1} />
        <View style={styles.emptyCircle2} />
        <View style={styles.emptyIconWrapper}>
          <MaterialIcons name="forum" size={60} color={theme.primary + '66'} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>No discussions yet</Text>
      <Text style={styles.emptyDescription}>
        Be the first to start the conversation! Share your insights or ask a question.
      </Text>
      <Pressable
        style={[styles.startDiscussionButton, isDisabled && styles.startDiscussionButtonDisabled]}
        onPress={onStartDiscussion}
        disabled={isDisabled}
      >
        <MaterialIcons name="add-circle" size={20} color={theme.primary} />
        <Text style={styles.startDiscussionText}>Start a Discussion</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyIconContainer: {
      width: 192,
      height: 192,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      position: 'relative',
    },
    emptyCircle1: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 96,
      backgroundColor: theme.primary,
      opacity: 0.05,
      transform: [{ scale: 1.1 }],
    },
    emptyCircle2: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 96,
      backgroundColor: theme.primary,
      opacity: 0.1,
    },
    emptyIconWrapper: {
      backgroundColor: theme.surface,
      padding: 24,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.outline + '40',
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.onBackground,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 32,
      maxWidth: 240,
      lineHeight: 20,
    },
    startDiscussionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.surface,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.outline,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    startDiscussionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onBackground,
    },
    startDiscussionButtonDisabled: {
      opacity: 0.6,
    },
  });
