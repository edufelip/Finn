import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { Topic } from '../../domain/models/topic';
import type { CommunitySortOrder } from '../../domain/repositories/CommunityRepository';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { searchCopy } from '../content/searchCopy';

type TopicTone = 'orange' | 'green' | 'purple' | 'blue';

type SearchFiltersProps = {
  sortOrder: CommunitySortOrder;
  selectedTopic?: Topic;
  onSortPress: () => void;
  onTopicPress: () => void;
  onClearTopic: () => void;
};

const TOPIC_PALETTE = {
  orange: {
    icon: '#D97706',
  },
  green: {
    icon: '#059669',
  },
  purple: {
    icon: '#7C3AED',
  },
  blue: {
    icon: '#2563EB',
  },
} as const;

export const SearchFilters = React.memo<SearchFiltersProps>(
  ({ sortOrder, selectedTopic, onSortPress, onTopicPress, onClearTopic }) => {
    const theme = useThemeColors();
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    const getSortLabel = (sort: CommunitySortOrder) => {
      switch (sort) {
        case 'mostFollowed':
          return searchCopy.sortMostFollowed;
        case 'leastFollowed':
          return searchCopy.sortLeastFollowed;
        case 'newest':
          return searchCopy.sortNewest;
        case 'oldest':
          return searchCopy.sortOldest;
        default:
          return searchCopy.sortMostFollowed;
      }
    };

    return (
      <View style={styles.filtersRow}>
        <Pressable
          style={styles.filterButton}
          onPress={onSortPress}
          testID={searchCopy.testIds.sortButton}
        >
          <MaterialIcons name="sort" size={18} color={theme.onSurfaceVariant} />
          <Text style={styles.filterButtonText}>{getSortLabel(sortOrder)}</Text>
        </Pressable>

        <Pressable
          style={[styles.filterButton, selectedTopic ? styles.filterButtonActive : null]}
          onPress={onTopicPress}
          testID={searchCopy.testIds.topicFilterButton}
        >
          {selectedTopic ? (
            <>
              <MaterialIcons
                name={selectedTopic.icon as any}
                size={18}
                color={TOPIC_PALETTE[selectedTopic.tone as TopicTone].icon}
              />
              <Text style={styles.filterButtonText}>{selectedTopic.label}</Text>
              <Pressable onPress={onClearTopic} hitSlop={8}>
                <MaterialIcons name="close" size={16} color={theme.onSurfaceVariant} />
              </Pressable>
            </>
          ) : (
            <>
              <MaterialIcons name="filter-list" size={18} color={theme.onSurfaceVariant} />
              <Text style={styles.filterButtonText}>{searchCopy.filterByTopic}</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }
);

SearchFilters.displayName = 'SearchFilters';

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    filtersRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    filterButtonActive: {
      backgroundColor: theme.primaryContainer,
      borderColor: theme.primary,
    },
    filterButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.onSurface,
    },
  });
