import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Network from 'expo-network';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import PostCard from '../components/PostCard';
import HomeExploreHeader from '../components/HomeExploreHeader';
import ScreenFade from '../components/ScreenFade';
import type { Post } from '../../domain/models/post';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import type { MainStackParamList } from '../navigation/MainStack';
import type { MainTabParamList } from '../navigation/MainTabs';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { homeCopy } from '../content/homeCopy';
import GuestBanner from '../components/GuestBanner';
import { showGuestGateAlert } from '../components/GuestGateAlert';
import { usePostsStore } from '../../app/store/postsStore';
import { useHomePosts, useFollowingPosts } from '../hooks/useFilteredPosts';
import { applyOptimisticLike, applyOptimisticSave } from '../utils/postToggleUtils';
import { useHeaderProfile } from '../hooks/useHeaderProfile';
import TabSafeAreaView from '../components/TabSafeAreaView';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type Tab = 'communities' | 'people';

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { session, isGuest, exitGuest } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const { profilePhoto, displayInitial } = useHeaderProfile();
  
  const [activeTab, setActiveTab] = useState<Tab>('communities');
  const [tabLayouts, setTabLayouts] = useState<{
    communities?: { x: number; width: number };
    people?: { x: number; width: number };
  }>({});

  const tabProgress = useSharedValue(0);
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const homePosts = useHomePosts();
  const followingPosts = useFollowingPosts();
  const setHomePosts = usePostsStore((state) => state.setHomePosts);
  const setFollowingPosts = usePostsStore((state) => state.setFollowingPosts);
  const updatePost = usePostsStore((state) => state.updatePost);
  const setSavedForUser = usePostsStore((state) => state.setSavedForUser);

  const [homePage, setHomePage] = useState(0);
  const [homeHasMore, setHomeHasMore] = useState(true);
  const [homeLoading, setHomeLoading] = useState(false);

  const [followingPage, setFollowingPage] = useState(0);
  const [followingHasMore, setFollowingHasMore] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const likeInFlightRef = useRef<Set<number>>(new Set());
  const { posts: repository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    const isPeople = activeTab === 'people';
    tabProgress.value = withTiming(isPeople ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    });

    const layout = tabLayouts[activeTab];
    if (layout) {
      indicatorX.value = withTiming(layout.x, {
        duration: 300,
        easing: Easing.bezier(0.33, 1, 0.68, 1),
      });
      indicatorWidth.value = withTiming(layout.width, {
        duration: 300,
        easing: Easing.bezier(0.33, 1, 0.68, 1),
      });
    }
  }, [activeTab, tabLayouts, tabProgress, indicatorX, indicatorWidth]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    // Slide exactly one screen width to reveal the second tab; avoids percent strings that break RN transforms.
    transform: [{ translateX: -tabProgress.value * screenWidth }],
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  useFocusEffect(
    useCallback(() => {
      navigation.navigate('Home');
    }, [navigation])
  );

  const loadHomeFeed = useCallback(
    async (pageToLoad: number, replace = false) => {
      setHomeLoading(true);
      setError(null);
      try {
        const data = isGuest
          ? await repository.getPublicFeed(pageToLoad)
          : session?.user?.id
            ? await repository.getUserFeed(session.user.id, pageToLoad)
            : [];
        setHomePosts(data, !replace);
        setHomePage(pageToLoad);
        setHomeHasMore(data.length > 0);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setHomeLoading(false);
        setRefreshing(false);
      }
    },
    [isGuest, repository, session?.user?.id, setHomePosts]
  );

  const loadFollowingFeed = useCallback(
    async (pageToLoad: number, replace = false) => {
      if (isGuest || !session?.user?.id) {
        setFollowingLoading(false);
        setRefreshing(false);
        setFollowingHasMore(false);
        return;
      }

      setFollowingLoading(true);
      setError(null);
      try {
        const data = await repository.getFollowingFeed(session.user.id, pageToLoad);
        setFollowingPosts(data, !replace);
        setFollowingPage(pageToLoad);
        setFollowingHasMore(data.length > 0);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setFollowingLoading(false);
        setRefreshing(false);
      }
    },
    [isGuest, repository, session?.user?.id, setFollowingPosts]
  );

  useEffect(() => {
    if (!session?.user?.id && !isGuest) return;
    loadHomeFeed(0, true);
  }, [isGuest, loadHomeFeed, session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id && activeTab === 'people' && followingPosts.length === 0 && followingHasMore) {
      loadFollowingFeed(0, true);
    }
  }, [activeTab, followingHasMore, followingPosts.length, loadFollowingFeed, session?.user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'communities') {
      loadHomeFeed(0, true);
    } else {
      loadFollowingFeed(0, true);
    }
  };

  const handleLoadMore = () => {
    if (activeTab === 'communities') {
      if (homeLoading || refreshing || !homeHasMore || homePosts.length === 0) return;
      loadHomeFeed(homePage + 1);
    } else {
      if (followingLoading || refreshing || !followingHasMore || followingPosts.length === 0) return;
      loadFollowingFeed(followingPage + 1);
    }
  };

  const handleToggleLike = async (post: Post) => {
    if (!session?.user?.id) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }

    if (likeInFlightRef.current.has(post.id)) {
      return;
    }
    likeInFlightRef.current.add(post.id);

    const { nextLiked, rollback } = applyOptimisticLike({ post, updatePost });

    try {
      const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
      if (!status.isConnected) {
        await enqueueWrite({
          id: `${Date.now()}`,
          type: nextLiked ? 'like_post' : 'unlike_post',
          payload: { postId: post.id, userId: session.user.id },
          createdAt: Date.now(),
        });
        return;
      }

      if (nextLiked) {
        await repository.likePost(post.id, session.user.id);
      } else {
        await repository.dislikePost(post.id, session.user.id);
      }
    } catch (error) {
      rollback();
      if (error instanceof Error) {
        Alert.alert(homeCopy.alerts.likeFailed.title, error.message);
      }
    } finally {
      likeInFlightRef.current.delete(post.id);
    }
  };

  const handleToggleSave = async (post: Post) => {
    if (!session?.user?.id) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }

    const { nextSaved, rollback } = applyOptimisticSave({
      post,
      userId: session.user.id,
      updatePost,
      setSavedForUser,
    });

    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      await enqueueWrite({
        id: `${Date.now()}`,
        type: nextSaved ? 'save_post' : 'unsave_post',
        payload: { postId: post.id, userId: session.user.id },
        createdAt: Date.now(),
      });
      return;
    }

    try {
      if (nextSaved) {
        await repository.bookmarkPost(post.id, session.user.id);
      } else {
        await repository.unbookmarkPost(post.id, session.user.id);
      }
    } catch (error) {
      rollback();
      if (error instanceof Error) {
        Alert.alert(homeCopy.alerts.savedFailed.title, error.message);
      }
    }
  };

  const openDrawer = () => {
    const parent = navigation.getParent();
    if (parent && 'openDrawer' in parent) {
      (parent as { openDrawer: () => void }).openDrawer();
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <Animated.View style={[styles.tabIndicator, indicatorAnimatedStyle]} />
      <Pressable
        onPress={() => setActiveTab('communities')}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          setTabLayouts((prev) => ({ ...prev, communities: { x, width } }));
        }}
        style={styles.tab}
      >
        <Text style={[styles.tabText, activeTab === 'communities' && styles.activeTabText]}>
          {homeCopy.tabs.communities}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setActiveTab('people')}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          setTabLayouts((prev) => ({ ...prev, people: { x, width } }));
        }}
        style={styles.tab}
      >
        <Text style={[styles.tabText, activeTab === 'people' && styles.activeTabText]}>
          {homeCopy.tabs.people}
        </Text>
      </Pressable>
    </View>
  );

  const renderEmptyState = () => {
    const isFollowingTab = activeTab === 'people';
    const title = isFollowingTab ? homeCopy.followingEmptyTitle : homeCopy.emptyTitle;
    const body = isFollowingTab
      ? isGuest
        ? homeCopy.followingGuestBody
        : homeCopy.followingEmptyBody
      : homeCopy.emptyBody;

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyGlowTop} />
        <View style={styles.emptyGlowBottom} />
        <View style={styles.emptyContent}>
          <View style={styles.planetStack}>
            <View style={styles.planet}>
              <View style={styles.planetIconWrap}>
                <MaterialIcons
                  name={isFollowingTab ? 'person-add' : 'groups'}
                  size={54}
                  color={theme.onSurfaceVariant}
                />
                <MaterialIcons
                  name="chat-bubble"
                  size={20}
                  color={theme.onSurfaceVariant}
                  style={styles.iconBubble}
                />
                <MaterialIcons
                  name="favorite"
                  size={24}
                  color={theme.primaryContainer}
                  style={styles.iconHeart}
                />
                <MaterialIcons
                  name="bolt"
                  size={18}
                  color={theme.onSurfaceVariant}
                  style={styles.iconBolt}
                />
              </View>
            </View>
            <View style={styles.planetShadow} />
          </View>
          <Text style={styles.emptyTitle}>{title}</Text>
          <Text style={styles.emptyBody}>{body}</Text>
          <View style={styles.emptyCtas}>
            {isFollowingTab && isGuest ? (
              <Pressable style={styles.primaryCta} onPress={() => exitGuest()}>
                <MaterialIcons name="login" size={20} color={theme.onPrimary} />
                <Text style={styles.primaryCtaText}>{homeCopy.alerts.signInRequired.title}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.primaryCta}
                onPress={() => navigation.navigate('Explore')}
                testID={homeCopy.testIds.explore}
                accessibilityLabel={homeCopy.testIds.explore}
              >
                <MaterialIcons name="explore" size={20} color={theme.onPrimary} />
                <Text style={styles.primaryCtaText}>{homeCopy.primaryCta}</Text>
              </Pressable>
            )}
            {!isFollowingTab && (
              <Pressable
                style={styles.secondaryCta}
                onPress={() => navigation.navigate('Explore')}
                testID={homeCopy.testIds.connections}
                accessibilityLabel={homeCopy.testIds.connections}
              >
                <MaterialIcons name="person-add" size={20} color={theme.onSurfaceVariant} />
                <Text style={styles.secondaryCtaText}>{homeCopy.secondaryCta}</Text>
              </Pressable>
            )}
          </View>
        </View>
        {!isFollowingTab && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>{homeCopy.tagsTitle}</Text>
            <View style={styles.tagsRow}>
              {homeCopy.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <TabSafeAreaView style={styles.safeArea}>
      <HomeExploreHeader
        profilePhoto={profilePhoto}
        displayInitial={displayInitial}
        placeholder={homeCopy.searchPlaceholder}
        onPressAvatar={openDrawer}
        onPressSearch={() => navigation.navigate('SearchResults', { focus: true })}
        onPressNotifications={() => {
          if (isGuest) {
            showGuestGateAlert({ onSignIn: () => void exitGuest() });
            return;
          }
          navigation.navigate('Notifications');
        }}
        testIds={{
          avatar: homeCopy.testIds.avatar,
          search: homeCopy.testIds.search,
          notifications: homeCopy.testIds.notifications,
        }}
      />
      {isGuest ? <GuestBanner onSignIn={() => void exitGuest()} /> : null}
      {renderTabBar()}
      <ScreenFade onlyOnTabSwitch>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Animated.View style={[styles.animatedContent, contentAnimatedStyle]}>
          <View style={styles.tabContentWrapper}>
            <FlatList
              testID={homeCopy.testIds.feedList}
              data={homePosts}
              keyExtractor={(item) => `home-${item.id}`}
              renderItem={({ item, index }) => (
                <PostCard
                  post={item}
                  isFirst={index === 0}
                  onPressUser={() => {
                    if (session?.user?.id === item.userId) {
                      navigation.navigate('Profile');
                    } else {
                      navigation.navigate('UserProfile', { userId: item.userId });
                    }
                  }}
                  onPressCommunity={() =>
                    item.communityId &&
                    navigation.navigate('CommunityDetail', {
                      communityId: item.communityId,
                    })
                  }
                  onPressBody={() => navigation.navigate('PostDetail', { post: item })}
                  onToggleLike={() => handleToggleLike(item)}
                  onToggleSave={() => handleToggleSave(item)}
                  onOpenComments={() => navigation.navigate('PostDetail', { post: item })}
                />
              )}
              refreshing={refreshing && activeTab === 'communities'}
              onRefresh={handleRefresh}
              onEndReachedThreshold={0.3}
              onEndReached={homeHasMore && homePosts.length > 0 ? handleLoadMore : undefined}
              ListEmptyComponent={
                homeLoading ? (
                  <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                  </View>
                ) : (
                  renderEmptyState()
                )
              }
              ListFooterComponent={
                homeLoading && homePosts.length > 0 ? (
                  <View style={styles.footer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                  </View>
                ) : null
              }
              style={styles.list}
              contentContainerStyle={
                homePosts.length === 0 ? styles.emptyContainer : { paddingBottom: tabBarHeight }
              }
            />
          </View>
          <View style={styles.tabContentWrapper}>
            <FlatList
              testID="following-feed-list"
              data={followingPosts}
              keyExtractor={(item) => `following-${item.id}`}
              renderItem={({ item, index }) => (
                <PostCard
                  post={item}
                  isFirst={index === 0}
                  onPressUser={() => {
                    if (session?.user?.id === item.userId) {
                      navigation.navigate('Profile');
                    } else {
                      navigation.navigate('UserProfile', { userId: item.userId });
                    }
                  }}
                  onPressCommunity={() =>
                    item.communityId &&
                    navigation.navigate('CommunityDetail', {
                      communityId: item.communityId,
                    })
                  }
                  onPressBody={() => navigation.navigate('PostDetail', { post: item })}
                  onToggleLike={() => handleToggleLike(item)}
                  onToggleSave={() => handleToggleSave(item)}
                  onOpenComments={() => navigation.navigate('PostDetail', { post: item })}
                />
              )}
              refreshing={refreshing && activeTab === 'people'}
              onRefresh={handleRefresh}
              onEndReachedThreshold={0.3}
              onEndReached={
                followingHasMore && followingPosts.length > 0 ? handleLoadMore : undefined
              }
              ListEmptyComponent={
                followingLoading ? (
                  <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                  </View>
                ) : (
                  renderEmptyState()
                )
              }
              ListFooterComponent={
                followingLoading && followingPosts.length > 0 ? (
                  <View style={styles.footer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                  </View>
                ) : null
              }
              style={styles.list}
              contentContainerStyle={
                followingPosts.length === 0 ? styles.emptyContainer : { paddingBottom: tabBarHeight }
              }
            />
          </View>
        </Animated.View>
      </ScreenFade>
    </TabSafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
      position: 'relative',
    },
    tab: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginRight: 8,
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      height: 2,
      backgroundColor: theme.primary,
      borderRadius: 1,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
    },
    activeTabText: {
      color: theme.primary,
    },
    animatedContent: {
      flex: 1,
      flexDirection: 'row',
      width: '200%',
    },
    tabContentWrapper: {
      flex: 1,
      width: '50%',
    },
    flex1: {
      flex: 1,
    },
    list: {
      backgroundColor: theme.background,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    center: {
      marginTop: 24,
      alignItems: 'center',
    },
    footer: {
      paddingVertical: 16,
    },
    error: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      color: theme.error,
    },
    emptyState: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 24,
      justifyContent: 'center',
    },
    emptyGlowTop: {
      position: 'absolute',
      top: 80,
      left: 30,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.surfaceTint,
      opacity: 0.18,
    },
    emptyGlowBottom: {
      position: 'absolute',
      bottom: 140,
      right: 20,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: theme.surfaceTint,
      opacity: 0.1,
    },
    emptyContent: {
      alignItems: 'center',
    },
    planetStack: {
      alignItems: 'center',
      marginBottom: 24,
    },
    planet: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.outline,
      shadowColor: theme.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    planetIconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBubble: {
      position: 'absolute',
      top: -18,
      right: -18,
    },
    iconHeart: {
      position: 'absolute',
      bottom: -12,
      left: -24,
    },
    iconBolt: {
      position: 'absolute',
      top: 16,
      left: -28,
    },
    planetShadow: {
      marginTop: 14,
      width: 90,
      height: 10,
      borderRadius: 50,
      backgroundColor: theme.shadow,
      opacity: 0.2,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.onBackground,
      marginBottom: 8,
    },
    emptyBody: {
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      color: theme.onSurfaceVariant,
      marginBottom: 20,
    },
    emptyCtas: {
      width: '100%',
      gap: 12,
    },
    primaryCta: {
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: theme.surfaceTint,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    primaryCtaText: {
      color: theme.onPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryCta: {
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    secondaryCtaText: {
      color: theme.onSurface,
      fontSize: 15,
      fontWeight: '600',
    },
    tagsSection: {
      marginTop: 28,
      alignItems: 'center',
      gap: 10,
    },
    tagsTitle: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: theme.onSurfaceVariant,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    tagChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
    },
  });
