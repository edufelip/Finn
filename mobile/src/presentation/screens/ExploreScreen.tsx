import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import HomeExploreHeader from '../components/HomeExploreHeader';
import ScreenFade from '../components/ScreenFade';
import Shimmer from '../components/Shimmer';
import type { Community } from '../../domain/models/community';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import type { MainStackParamList } from '../navigation/MainStack';
import type { MainTabParamList } from '../navigation/MainTabs';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { palette } from '../theme/palette';
import { exploreCopy } from '../content/exploreCopy';
import { formatCompactNumber } from '../i18n/formatters';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Explore'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type TopicTone = 'orange' | 'green' | 'purple' | 'blue';

const MIN_SKELETON_MS = 350;

export default function ExploreScreen() {
  const navigation = useNavigation<Navigation>();
  const { session } = useAuth();
  const { communities: communityRepository, users: userRepository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [trending, setTrending] = useState<Community[]>([]);
  const [feedItems, setFeedItems] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadToken = useRef(0);
  const isMounted = useRef(true);
  const skeletonOpacity = useSharedValue(1);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      skeletonOpacity.value = withTiming(1, { duration: 120 });
      contentOpacity.value = withTiming(0, { duration: 120 });
      return;
    }
    skeletonOpacity.value = withTiming(0, { duration: 180 });
    contentOpacity.value = withTiming(1, { duration: 240 });
  }, [contentOpacity, loading, skeletonOpacity]);

  useEffect(() => {
    if (!session?.user?.id) return;
    userRepository
      .getUser(session.user.id)
      .then((data) => setProfilePhoto(data?.photoUrl ?? null))
      .catch(() => setProfilePhoto(null));
  }, [session?.user?.id, userRepository]);

  const loadTrending = useCallback(async () => {
    const token = ++loadToken.current;
    const start = Date.now();
    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await communityRepository.getCommunities();
      const sorted = [...data].sort(
        (a, b) => (b.subscribersCount ?? 0) - (a.subscribersCount ?? 0)
      );
      const trendingItems = sorted.slice(0, exploreCopy.trendingLimit);
      const feedCandidates = sorted.slice(
        exploreCopy.trendingLimit,
        exploreCopy.trendingLimit + exploreCopy.feedLimit
      );
      if (isMounted.current && loadToken.current === token) {
        setTrending(trendingItems);
        setFeedItems(feedCandidates);
      }
    } catch (err) {
      if (err instanceof Error && isMounted.current && loadToken.current === token) {
        setError(err.message);
      }
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      if (isMounted.current && loadToken.current === token) {
        setLoading(false);
      }
    }
  }, [communityRepository]);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  const tagPalette = useMemo(
    () =>
      exploreCopy.trendingTags.map((tag) => ({
        label: tag.label,
        background:
          tag.tone === 'tech'
            ? theme.primary
            : tag.tone === 'travel'
              ? theme.secondary
              : theme.tertiary,
        text:
          tag.tone === 'tech'
            ? theme.onPrimary
            : tag.tone === 'travel'
              ? theme.onSecondary
              : theme.onTertiary,
      })),
    [theme]
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

  const openDrawer = () => {
    const parent = navigation.getParent();
    if (parent && 'openDrawer' in parent) {
      (parent as { openDrawer: () => void }).openDrawer();
    }
  };

  const handleSeeAll = () => {
    navigation.navigate('SearchResults', { focus: true });
  };

  const renderTrendingItem = ({
    item,
    index,
  }: {
    item: Community;
    index: number;
  }) => {
    const tag = tagPalette[index % tagPalette.length];
    const members = formatCompactNumber(item.subscribersCount ?? 0);
    const meta = exploreCopy.trendingMembersLabel(members);
    const cardContent = (
      <View style={styles.trendingContent}>
        <View style={[styles.trendingTag, { backgroundColor: tag.background }]}>
          <Text style={[styles.trendingTagText, { color: tag.text }]}>{tag.label}</Text>
        </View>
        <Text
          style={styles.trendingTitle}
          numberOfLines={1}
          testID={exploreCopy.testIds.trendingTitle}
        >
          {item.title || exploreCopy.communityFallback}
        </Text>
        <Text style={styles.trendingMeta}>{meta}</Text>
      </View>
    );

    return (
      <Pressable
        style={styles.trendingCard}
        onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
        testID={exploreCopy.testIds.trendingCard}
      >
        {item.imageUrl ? (
          <ImageBackground source={{ uri: item.imageUrl }} style={styles.trendingImage} imageStyle={styles.imageRadius}>
            <LinearGradient colors={[palette.transparent, theme.scrim]} style={styles.trendingOverlay} />
            {cardContent}
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={[theme.primaryContainer, theme.primary]}
            style={styles.trendingImage}
          >
            <LinearGradient colors={[palette.transparent, theme.scrim]} style={styles.trendingOverlay} />
            {cardContent}
          </LinearGradient>
        )}
      </Pressable>
    );
  };

  const renderTrendingSkeleton = () => (
    <View style={styles.trendingSkeletonRow} testID={exploreCopy.testIds.trendingSkeleton}>
      {Array.from({ length: exploreCopy.trendingLimit }).map((_, index) => (
        <Shimmer
          key={`trending-skeleton-${index}`}
          baseColor={theme.surfaceVariant}
          highlightColor={theme.surface}
          style={styles.trendingSkeletonCard}
          borderRadius={20}
        />
      ))}
    </View>
  );

  const renderFeedSkeleton = () => (
    <View style={styles.feedSkeletonWrap} testID={exploreCopy.testIds.feedSkeleton}>
      {Array.from({ length: exploreCopy.feedSkeletonCount }).map((_, index) => (
        <Shimmer
          key={`feed-skeleton-${index}`}
          baseColor={theme.surfaceVariant}
          highlightColor={theme.surface}
          style={styles.feedSkeletonCard}
          borderRadius={20}
        />
      ))}
    </View>
  );

  const renderTopicsSkeleton = () => (
    <View style={styles.topicsGrid}>
      {exploreCopy.topics.map((topic) => (
        <Shimmer
          key={`topic-skeleton-${topic.id}`}
          baseColor={theme.surfaceVariant}
          highlightColor={theme.surface}
          style={styles.topicSkeleton}
          borderRadius={16}
        />
      ))}
    </View>
  );

  const skeletonStyle = useAnimatedStyle(() => ({ opacity: skeletonOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  const showTrendingSection = loading || trending.length > 0 || Boolean(error);
  const showFeedSection = !loading && feedItems.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeExploreHeader
        profilePhoto={profilePhoto}
        placeholder={exploreCopy.searchPlaceholder}
        onPressAvatar={openDrawer}
        onPressSearch={() => navigation.navigate('SearchResults', { focus: true })}
        onPressNotifications={() => navigation.navigate('Notifications')}
        testIds={{
          avatar: exploreCopy.testIds.avatar,
          search: exploreCopy.testIds.search,
          notifications: exploreCopy.testIds.notifications,
        }}
      />
      <ScreenFade>
        <View style={styles.scrollStack}>
          <Animated.View
            style={[styles.scrollLayer, contentStyle]}
            pointerEvents={loading ? 'none' : 'auto'}
          >
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {showTrendingSection ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{exploreCopy.trendingTitle}</Text>
                    {trending.length > 0 ? (
                      <Pressable
                        onPress={handleSeeAll}
                        testID={exploreCopy.testIds.seeAll}
                        accessibilityLabel={exploreCopy.testIds.seeAll}
                      >
                        <Text style={styles.seeAll}>{exploreCopy.trendingSeeAll}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <FlatList
                    testID={exploreCopy.testIds.trendingList}
                    horizontal
                    data={trending}
                    keyExtractor={(item) => `${item.id}`}
                    renderItem={renderTrendingItem}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.trendingList}
                    ItemSeparatorComponent={() => <View style={styles.trendingSeparator} />}
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                </View>
              ) : null}

              {showFeedSection ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{exploreCopy.feedTitle}</Text>
                  {feedItems.map((item) => (
                    <Pressable
                      key={`feed-${item.id}`}
                      style={styles.feedItem}
                      onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
                    >
                      <View style={styles.feedItemBadge} />
                      <View style={styles.feedItemContent}>
                        <Text style={styles.feedItemTitle} numberOfLines={1}>
                          {item.title || exploreCopy.communityFallback}
                        </Text>
                        {item.description ? (
                          <Text style={styles.feedItemBody} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                        <Text style={styles.feedItemMeta}>
                          {exploreCopy.trendingMembersLabel(
                            formatCompactNumber(item.subscribersCount ?? 0)
                          )}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.topicsTitle}>{exploreCopy.topicsTitle}</Text>
                <View style={styles.topicsGrid}>
                  {exploreCopy.topics.map((topic) => {
                    const tonePalette = topicPalette[topic.tone as TopicTone];
                    return (
                      <Pressable
                        key={topic.id}
                        style={[
                          styles.topicCard,
                          { backgroundColor: tonePalette.background, borderColor: tonePalette.border },
                        ]}
                      >
                        <View style={[styles.topicIconWrap, { backgroundColor: tonePalette.border }]}>
                          <MaterialIcons name={topic.icon} size={18} color={tonePalette.icon} />
                        </View>
                        <Text style={styles.topicLabel}>{topic.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
          <Animated.View
            style={[styles.scrollLayer, skeletonStyle]}
            pointerEvents={loading ? 'auto' : 'none'}
          >
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              scrollEnabled={loading}
            >
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{exploreCopy.trendingTitle}</Text>
                  <Text style={styles.seeAll}>{exploreCopy.trendingSeeAll}</Text>
                </View>
                {renderTrendingSkeleton()}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{exploreCopy.feedTitle}</Text>
                {renderFeedSkeleton()}
              </View>

              <View style={styles.section}>
                <Text style={styles.topicsTitle}>{exploreCopy.topicsTitle}</Text>
                {renderTopicsSkeleton()}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </ScreenFade>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 120,
    },
    scrollStack: {
      flex: 1,
    },
    scrollLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    section: {
      marginTop: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.onBackground,
    },
    seeAll: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    trendingList: {
      paddingVertical: 4,
    },
    trendingSeparator: {
      width: 16,
    },
    trendingSkeletonRow: {
      flexDirection: 'row',
      gap: 16,
    },
    trendingSkeletonCard: {
      width: 240,
      height: 150,
      borderRadius: 20,
    },
    trendingCard: {
      width: 240,
      height: 150,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: theme.shadow,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    trendingImage: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    imageRadius: {
      borderRadius: 20,
    },
    trendingOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    trendingContent: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 4,
    },
    trendingTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    trendingTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.onPrimary,
    },
    trendingTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onPrimary,
    },
    trendingMeta: {
      fontSize: 11,
      color: theme.onSurfaceVariant,
    },
    loadingWrap: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    error: {
      marginTop: 8,
      color: theme.error,
      fontSize: 12,
    },
    feedSkeletonWrap: {
      gap: 12,
    },
    feedSkeletonCard: {
      width: '100%',
      height: 92,
      borderRadius: 20,
    },
    feedItem: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      marginBottom: 12,
      flexDirection: 'row',
      gap: 12,
      shadowColor: theme.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    feedItemBadge: {
      width: 6,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    feedItemContent: {
      flex: 1,
      gap: 6,
    },
    feedItemTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.onSurface,
    },
    feedItemBody: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
    feedItemMeta: {
      fontSize: 11,
      color: theme.onSurfaceVariant,
    },
    topicsTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 12,
    },
    topicsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    topicSkeleton: {
      width: '48%',
      height: 54,
      borderRadius: 16,
      marginBottom: 12,
    },
    topicCard: {
      width: '48%',
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    topicIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.onSurface,
    },
  });
