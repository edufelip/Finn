import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

type HeaderTestIds = {
  avatar: string;
  search: string;
  notifications: string;
};

type HomeExploreHeaderProps = {
  profilePhoto: string | null;
  displayInitial?: string;
  placeholder: string;
  onPressAvatar: () => void;
  onPressSearch: () => void;
  onPressNotifications: () => void;
  testIds: HeaderTestIds;
};

export default function HomeExploreHeader({
  profilePhoto,
  displayInitial,
  placeholder,
  onPressAvatar,
  onPressSearch,
  onPressNotifications,
  testIds,
}: HomeExploreHeaderProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.headerRow}>
      <Pressable
        style={styles.avatarCard}
        onPress={onPressAvatar}
        testID={testIds.avatar}
        accessibilityLabel={testIds.avatar}
      >
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{displayInitial ?? '?'}</Text>
        </View>
      </Pressable>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={theme.onSurfaceVariant} />
        <Text style={styles.searchPlaceholder}>{placeholder}</Text>
        <Pressable
          style={styles.searchOverlay}
          onPress={onPressSearch}
          testID={testIds.search}
          accessibilityLabel={testIds.search}
        />
      </View>
      <Pressable
        style={styles.notificationButton}
        onPress={onPressNotifications}
        testID={testIds.notifications}
        accessibilityLabel={testIds.notifications}
      >
        <MaterialIcons name="notifications" size={20} color={theme.onSurfaceVariant} />
        <View style={styles.notificationDot} />
      </Pressable>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      backgroundColor: theme.background,
    },
    avatarCard: {
      width: 38,
      height: 38,
      borderRadius: 19,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.outline,
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    avatarFallback: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: theme.onSurface,
      fontWeight: '700',
      fontSize: 16,
    },
    searchContainer: {
      flex: 1,
      height: 42,
      marginLeft: 12,
      borderRadius: 14,
      backgroundColor: theme.surfaceVariant,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    searchPlaceholder: {
      color: theme.onSurfaceVariant,
      fontSize: 14,
      fontWeight: '600',
    },
    searchOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    notificationButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      marginLeft: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    notificationDot: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.error,
      borderWidth: 2,
      borderColor: theme.surfaceVariant,
    },
  });
