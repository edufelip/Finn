import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { Community } from '../../domain/models/community';
import type { MainStackParamList } from '../navigation/MainStack';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { searchCopy } from '../content/searchCopy';
import { showGuestGateAlert } from '../components/GuestGateAlert';
import { CommunityCard } from '../components/CommunityCard';
import { SearchFilters } from '../components/SearchFilters';
import { SearchEmptyState } from '../components/SearchEmptyState';
import { useSearchCommunities } from '../hooks/useSearchCommunities';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'SearchResults'>;

export default function SearchScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProp<MainStackParamList, 'SearchResults'>>();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [searchText, setSearchText] = React.useState('');
  const inputRef = useRef<TextInput>(null);

  // Load on mount unless user explicitly wants to focus the search input
  const shouldLoadOnMount = !route.params?.focus;

  const {
    communities,
    topics,
    selectedTopicId,
    sortOrder,
    loading,
    initialLoad,
    loadingMore,
    hasMore,
    userSubscriptions,
    isGuest,
    exitGuest,
    searchCommunities,
    applyTopicFilter,
    applySortOrder,
    loadMore,
    handleToggleSubscription,
  } = useSearchCommunities({
    initialSort: route.params?.sort || 'mostFollowed',
    initialTopicId: route.params?.topicId,
    shouldLoadOnMount,
  });

  // Focus input if requested
  useEffect(() => {
    if (route.params?.focus) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [route.params?.focus]);

  const handleSearch = useCallback(() => {
    searchCommunities(searchText);
  }, [searchCommunities, searchText]);

  const handleCommunityPress = useCallback(
    (community: Community) => {
      navigation.navigate('CommunityDetail', { communityId: community.id, initialCommunity: community });
    },
    [navigation]
  );

  const handleToggleSubscriptionWithGuest = useCallback(
    (community: Community) => {
      const result = handleToggleSubscription(community);
      if (result === 'guest') {
        showGuestGateAlert({ onSignIn: () => void exitGuest() });
      }
    },
    [handleToggleSubscription, exitGuest]
  );

  const handleSortPress = useCallback(() => {
    Alert.alert(searchCopy.sortBy, '', [
      { text: searchCopy.sortMostFollowed, onPress: () => applySortOrder('mostFollowed') },
      { text: searchCopy.sortLeastFollowed, onPress: () => applySortOrder('leastFollowed') },
      { text: searchCopy.sortNewest, onPress: () => applySortOrder('newest') },
      { text: searchCopy.sortOldest, onPress: () => applySortOrder('oldest') },
      { text: searchCopy.cancel, style: 'cancel' },
    ]);
  }, [applySortOrder]);

  const handleTopicPress = useCallback(() => {
    const options = [
      { text: searchCopy.allTopics, onPress: () => applyTopicFilter(undefined) },
      ...topics.map((topic) => ({
        text: topic.label,
        onPress: () => applyTopicFilter(topic.id),
      })),
      { text: searchCopy.cancel, style: 'cancel' as const },
    ];
    Alert.alert(searchCopy.filterByTopic, '', options);
  }, [topics, applyTopicFilter]);

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId),
    [topics, selectedTopicId]
  );

  const renderCommunityItem = useCallback(
    ({ item, index }: { item: Community; index: number }) => (
      <CommunityCard
        community={item}
        index={index}
        isSubscribed={!!userSubscriptions[item.id]}
        onPress={handleCommunityPress}
        onToggleSubscription={handleToggleSubscriptionWithGuest}
      />
    ),
    [userSubscriptions, handleCommunityPress, handleToggleSubscriptionWithGuest]
  );

  const renderEmptyState = useCallback(
    () => (
      <SearchEmptyState
        loading={loading}
        initialLoad={initialLoad}
        hasSearch={!!searchText}
        hasTopicFilter={!!selectedTopicId}
        isGuest={isGuest}
      />
    ),
    [loading, initialLoad, searchText, selectedTopicId, isGuest]
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore || communities.length === 0 || !hasMore) return null;
    return (
      <View style={styles.footerSection}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }, [communities.length, hasMore, loadingMore, styles.footerSection, theme.primary]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color={theme.onBackground} />
        </Pressable>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={22} color={theme.onSurfaceVariant} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={searchCopy.placeholder}
            placeholderTextColor={theme.onSurfaceVariant}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            testID={searchCopy.testIds.searchInput}
          />
        </View>
      </View>

      <SearchFilters
        sortOrder={sortOrder}
        selectedTopic={selectedTopic}
        onSortPress={handleSortPress}
        onTopicPress={handleTopicPress}
        onClearTopic={() => applyTopicFilter(undefined)}
      />

      <FlatList
        testID={searchCopy.testIds.list}
        data={communities}
        keyExtractor={(item) => `${item.id}`}
        contentContainerStyle={styles.listContent}
        renderItem={renderCommunityItem}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      backgroundColor: theme.background,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surfaceVariant,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      height: '100%',
      color: theme.onSurface,
      fontSize: 14,
      fontWeight: '500',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    footerSection: {
      marginTop: 32,
      alignItems: 'center',
      gap: 8,
    },
  });
