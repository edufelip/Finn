import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Topic } from '../../domain/models/topic';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { useRepositories } from '../../app/providers/RepositoryProvider';

type TopicSelectorModalProps = {
  visible: boolean;
  selectedTopicId?: number | null;
  onClose: () => void;
  onSelectTopic: (topic: Topic) => void;
};

export default function TopicSelectorModal({
  visible,
  selectedTopicId,
  onClose,
  onSelectTopic,
}: TopicSelectorModalProps) {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { topics: topicRepository } = useRepositories();
  
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      topicRepository
        .getTopics()
        .then((data) => setAllTopics(data))
        .catch(() => setAllTopics([]))
        .finally(() => setLoading(false));
    }
  }, [visible, topicRepository]);

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTopics;
    }
    const query = searchQuery.toLowerCase();
    return allTopics.filter(
      (topic) =>
        topic.label.toLowerCase().includes(query) ||
        topic.name.toLowerCase().includes(query)
    );
  }, [allTopics, searchQuery]);

  const handleSelectTopic = useCallback(
    (topic: Topic) => {
      onSelectTopic(topic);
      onClose();
    },
    [onSelectTopic, onClose]
  );

  const topicPalette = useMemo(
    () => ({
      orange: {
        background: theme.surfaceVariant,
        border: theme.outlineVariant,
        icon: theme.onSurfaceVariant,
      },
      green: {
        background: theme.secondaryContainer,
        border: theme.secondary,
        icon: theme.onSecondaryContainer,
      },
      purple: {
        background: theme.tertiaryContainer,
        border: theme.tertiary,
        icon: theme.onTertiaryContainer,
      },
      blue: {
        background: theme.primaryContainer,
        border: theme.primary,
        icon: theme.onPrimaryContainer,
      },
    }),
    [theme]
  );

  const renderTopic = useCallback(
    ({ item }: { item: Topic }) => {
      const isSelected = item.id === selectedTopicId;
      const tonePalette = topicPalette[item.tone];

      return (
        <Pressable
          style={[
            styles.topicItem,
            isSelected && styles.topicItemSelected,
            { borderColor: isSelected ? theme.primary : theme.outlineVariant },
          ]}
          onPress={() => handleSelectTopic(item)}
        >
          <View
            style={[
              styles.topicIcon,
              {
                backgroundColor: isSelected ? theme.primary : tonePalette.background,
                borderColor: isSelected ? theme.primary : tonePalette.border,
              },
            ]}
          >
            <MaterialIcons
              name={item.icon as any}
              size={20}
              color={isSelected ? theme.onPrimary : tonePalette.icon}
            />
          </View>
          <View style={styles.topicInfo}>
            <Text style={[styles.topicLabel, isSelected && { color: theme.primary }]}>
              {item.label}
            </Text>
          </View>
          {isSelected && (
            <MaterialIcons name="check-circle" size={24} color={theme.primary} />
          )}
        </Pressable>
      );
    },
    [selectedTopicId, theme, topicPalette, styles, handleSelectTopic]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Select a Topic</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color={theme.onSurface} />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            placeholderTextColor={theme.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color={theme.onSurfaceVariant} />
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredTopics}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTopic}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 16 },
            ]}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search-off" size={48} color={theme.onSurfaceVariant} />
                <Text style={styles.emptyText}>No topics found</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.onBackground,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.onSurface,
      padding: 0,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    topicItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      marginBottom: 8,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.outlineVariant,
    },
    topicItemSelected: {
      backgroundColor: theme.primaryContainer,
    },
    topicIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicInfo: {
      flex: 1,
    },
    topicLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.onSurface,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 16,
      color: theme.onSurfaceVariant,
    },
  });
