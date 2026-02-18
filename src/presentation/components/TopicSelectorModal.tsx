import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useLocalization } from '../../app/providers/LocalizationProvider';
import { t } from '../i18n';

const CATEGORY_NAME_ALIASES: Record<string, string> = {
  fashin: 'fashion',
};

const getNormalizedCategoryKey = (name?: string | null) => {
  const normalized = (name ?? '').trim().toLowerCase();
  if (!normalized) return '';
  return CATEGORY_NAME_ALIASES[normalized] ?? normalized;
};

const getLocalizedCategoryLabel = (topic: Topic) => {
  const normalizedCategory = getNormalizedCategoryKey(topic.name);
  if (!normalizedCategory) return topic.label;

  const key = `topic.categories.${normalizedCategory}`;
  const translated = t(key);
  return translated === key ? topic.label : translated;
};

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
  const { locale } = useLocalization();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { topics: topicRepository } = useRepositories();
  
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const handleShow = useCallback(() => {
    setLoading(true);
    topicRepository
      .getTopics()
      .then((data) => {
        if (!isMountedRef.current) return;
        setAllTopics(data);
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setAllTopics([]);
      })
      .finally(() => {
        if (!isMountedRef.current) return;
        setLoading(false);
      });
  }, [topicRepository]);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => {
      handleShow();
    }, 0);
    return () => {
      clearTimeout(timeout);
    };
  }, [handleShow, visible]);

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTopics;
    }
    const query = searchQuery.toLowerCase();
    return allTopics.filter(
      (topic) =>
        getLocalizedCategoryLabel(topic).toLowerCase().includes(query) ||
        topic.label.toLowerCase().includes(query) ||
        topic.name.toLowerCase().includes(query)
    );
  }, [allTopics, searchQuery, locale]);

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
        background: theme.errorContainer,
        border: theme.error,
        icon: theme.onErrorContainer,
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
      const label = getLocalizedCategoryLabel(item);

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
              {label}
            </Text>
          </View>
          {isSelected && (
            <MaterialIcons name="check-circle" size={24} color={theme.primary} />
          )}
        </Pressable>
      );
    },
    [handleSelectTopic, selectedTopicId, styles, theme, topicPalette, locale]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('topic.selector.title')}</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color={theme.onSurface} />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('topic.selector.searchPlaceholder')}
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
                <Text style={styles.emptyText}>{t('topic.selector.empty')}</Text>
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
