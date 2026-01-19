import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { searchCopy } from '../content/searchCopy';
import { exploreCopy } from '../content/exploreCopy';

type SearchEmptyStateProps = {
  loading: boolean;
  initialLoad: boolean;
  hasSearch: boolean;
  hasTopicFilter: boolean;
  isGuest: boolean;
  onCreateCommunity: () => void;
};

export const SearchEmptyState = React.memo<SearchEmptyStateProps>(
  ({ loading, initialLoad, hasSearch, hasTopicFilter, isGuest, onCreateCommunity }) => {
    const theme = useThemeColors();
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (initialLoad && !hasSearch && !hasTopicFilter) {
      return (
        <View style={styles.emptyStateContainer}>
          <MaterialIcons name="search" size={64} color={theme.onSurfaceVariant} />
          <Text style={styles.emptyStateTitle}>{searchCopy.emptyStateTitle}</Text>
          <Text style={styles.emptyStateSubtitle}>{searchCopy.emptyStateSubtitle}</Text>
        </View>
      );
    }

    return (
      <View style={styles.footerSection}>
        <Text style={styles.empty}>{searchCopy.empty}</Text>
        <Text style={styles.footerText}>{exploreCopy.emptyTitle}</Text>
        <Pressable onPress={onCreateCommunity}>
          <Text style={styles.browseAllText}>{exploreCopy.secondaryCta}</Text>
        </Pressable>
      </View>
    );
  }
);

SearchEmptyState.displayName = 'SearchEmptyState';

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    emptyStateContainer: {
      marginTop: 80,
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.onBackground,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
    },
    empty: {
      textAlign: 'center',
      color: theme.onSurfaceVariant,
    },
    center: {
      marginTop: 32,
      alignItems: 'center',
    },
    footerSection: {
      marginTop: 32,
      alignItems: 'center',
      gap: 8,
    },
    footerText: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
    },
    browseAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
  });
