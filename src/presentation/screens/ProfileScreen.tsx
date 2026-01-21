import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import PostCard from '../components/PostCard';
import ManagedCommunityCard from '../components/ManagedCommunityCard';
import ScreenFade from '../components/ScreenFade';
import type { Post } from '../../domain/models/post';
import type { Community } from '../../domain/models/community';
import type { MainStackParamList } from '../navigation/MainStack';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { profileCopy } from '../content/profileCopy';
import { commonCopy } from '../content/commonCopy';
import { formatMonthYear } from '../i18n/formatters';
import { palette } from '../theme/palette';
import GuestGateScreen from '../components/GuestGateScreen';
import { guestCopy } from '../content/guestCopy';
import { showGuestGateAlert } from '../components/GuestGateAlert';
import { useUserStore } from '../../app/store/userStore';
import { usePostsStore, useProfilePosts, useSavedPosts } from '../../app/store/postsStore';

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { session, isGuest, exitGuest } = useAuth();
  const { users: userRepository, posts: postRepository, communities: communityRepository } = useRepositories();
  const currentUser = useUserStore((state) => state.currentUser);
  const hasProfileLoaded = currentUser !== null;
  const tabBarHeight = useBottomTabBarHeight();
  const posts = useProfilePosts(session?.user?.id);
  const savedPosts = useSavedPosts(session?.user?.id);
  const setProfilePosts = usePostsStore((state) => state.setProfilePosts);
  const setSavedPosts = usePostsStore((state) => state.setSavedPosts);
  const updatePost = usePostsStore((state) => state.updatePost);
  const setSavedForUser = usePostsStore((state) => state.setSavedForUser);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'communities'>('posts');
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [communitiesLoaded, setCommunitiesLoaded] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [tabLayouts, setTabLayouts] = useState<{
    posts?: { x: number; width: number };
    saved?: { x: number; width: number };
    communities?: { x: number; width: number };
  }>({});
  const activeTabRef = useRef(activeTab);
  const likeInFlightRef = useRef<Set<number>>(new Set());
  const countsLoadedRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const tabProgress = useSharedValue(activeTab === 'posts' ? 0 : activeTab === 'saved' ? 0.5 : 1);
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const indicatorDuration = reduceMotion ? 0 : 220;

  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setPostsError(profileCopy.errorSignInRequired);
      return;
    }

    setLoadingPosts(true);
    setPostsError(null);
    try {
      const postData = await postRepository.getPostsFromUser(session.user.id, 0);
      let nextPosts = postData ?? [];
      if (nextPosts.length) {
        const likes = await Promise.all(
          nextPosts.map((postItem) => postRepository.findLike(postItem.id, session.user.id).catch(() => false))
        );
        const saved = await Promise.all(
          nextPosts.map((postItem) => postRepository.findSavedPost(postItem.id, session.user.id).catch(() => false))
        );
        nextPosts = nextPosts.map((postItem, index) => ({
          ...postItem,
          isLiked: likes[index],
          isSaved: saved[index],
        }));
      }
      setProfilePosts(session.user.id, nextPosts);
    } catch (err) {
      if (err instanceof Error) {
        setPostsError(err.message);
      }
    } finally {
      setLoadingPosts(false);
    }
  }, [postRepository, session?.user?.id, setProfilePosts]);

  useEffect(() => {
    if (!session?.user?.id || hasProfileLoaded) {
      return;
    }

    let active = true;
    const loadStoredUser = async () => {
      try {
        const profile = await userRepository.getUser(session.user.id);
        if (active && profile) {
          useUserStore.getState().setUser(profile);
        }
      } catch {
        // Swallow errors; fallback to auth email remains.
      }
    };

    loadStoredUser();
    return () => {
      active = false;
    };
  }, [hasProfileLoaded, session?.user?.id, userRepository]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  useEffect(() => {
    countsLoadedRef.current = false;
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      const userId = session?.user?.id;
      if (!userId || countsLoadedRef.current) {
        return;
      }
      let active = true;
      const loadCounts = async () => {
        try {
          const [followers, following] = await Promise.all([
            userRepository.getFollowersCount(userId),
            userRepository.getFollowingCount(userId),
          ]);
          if (active) {
            useUserStore.getState().updateUser({
              followersCount: followers,
              followingCount: following,
            });
            countsLoadedRef.current = true;
          }
        } catch {
          // Ignore follow count failures to avoid blocking UI.
        }
      };
      loadCounts();
      return () => {
        active = false;
      };
    }, [session?.user?.id, userRepository])
  );

  const loadSavedPosts = useCallback(async () => {
    if (!session?.user?.id) {
      setSavedError(profileCopy.errorSignInRequired);
      return;
    }

    setLoadingSaved(true);
    setSavedError(null);
    try {
      const saved = await postRepository.getSavedPosts(session.user.id, 0);
      let nextSaved = saved ?? [];
      if (nextSaved.length) {
        const likes = await Promise.all(
          nextSaved.map((postItem) => postRepository.findLike(postItem.id, session.user.id).catch(() => false))
        );
        nextSaved = nextSaved.map((postItem, index) => ({
          ...postItem,
          isLiked: likes[index],
          isSaved: true,
        }));
      }
      setSavedPosts(session.user.id, nextSaved);
      setSavedLoaded(true);
    } catch (err) {
      if (err instanceof Error) {
        setSavedError(err.message);
      }
      setSavedLoaded(true);
    } finally {
      setLoadingSaved(false);
    }
  }, [postRepository, session?.user?.id, setSavedPosts]);

  const loadCommunities = useCallback(async () => {
    if (!session?.user?.id) {
      setCommunitiesError(profileCopy.errorSignInRequired);
      return;
    }

    setLoadingCommunities(true);
    setCommunitiesError(null);
    try {
      const communityData = await communityRepository.getCommunitiesFromUser(session.user.id);
      setCommunities(communityData ?? []);
      setCommunitiesLoaded(true);
    } catch (err) {
      if (err instanceof Error) {
        setCommunitiesError(err.message);
      }
      setCommunitiesLoaded(true);
    } finally {
      setLoadingCommunities(false);
    }
  }, [communityRepository, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'saved' && !savedLoaded) {
        loadSavedPosts();
      } else if (activeTab === 'communities' && !communitiesLoaded) {
        loadCommunities();
      }
    }, [activeTab, loadSavedPosts, savedLoaded, loadCommunities, communitiesLoaded])
  );

  const handleToggleLike = async (post: Post) => {
    if (!session?.user?.id) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }

    if (likeInFlightRef.current.has(post.id)) {
      return;
    }
    likeInFlightRef.current.add(post.id);

    const nextLiked = !post.isLiked;
    updatePost(post.id, {
      isLiked: nextLiked,
      likesCount: Math.max(0, (post.likesCount ?? 0) + (nextLiked ? 1 : -1)),
    });

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
        await postRepository.likePost(post.id, session.user.id);
      } else {
        await postRepository.dislikePost(post.id, session.user.id);
      }
    } catch (err) {
      updatePost(post.id, {
        isLiked: post.isLiked,
        likesCount: post.likesCount,
      });
      if (err instanceof Error) {
        Alert.alert(profileCopy.alerts.likeFailed.title, err.message);
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

    const nextSaved = !post.isSaved;
    updatePost(post.id, { isSaved: nextSaved });
    setSavedForUser(session.user.id, post.id, nextSaved);

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
        await postRepository.bookmarkPost(post.id, session.user.id);
      } else {
        await postRepository.unbookmarkPost(post.id, session.user.id);
      }
    } catch (err) {
      updatePost(post.id, { isSaved: post.isSaved });
      setSavedForUser(session.user.id, post.id, post.isSaved ?? false);
      if (err instanceof Error) {
        Alert.alert(profileCopy.alerts.savedFailed.title, err.message);
      }
    }
  };

  const joinedDate = currentUser?.createdAt ? formatMonthYear(currentUser.createdAt) : '';
  const joinedLabel = joinedDate ? profileCopy.memberSince(joinedDate) : null;

  const displayName = currentUser?.name ?? session?.user?.email ?? commonCopy.userFallback;
  const displayBio = currentUser?.bio ?? null;
  const postsCount = posts.length;
  const followersCount = currentUser?.followersCount ?? 0;
  const followingCount = currentUser?.followingCount ?? 0;

  const currentPosts = activeTab === 'posts' ? posts : activeTab === 'saved' ? savedPosts : [];
  const currentLoading = activeTab === 'posts' ? loadingPosts : activeTab === 'saved' ? loadingSaved : loadingCommunities;
  const currentError = activeTab === 'posts' ? postsError : activeTab === 'saved' ? savedError : communitiesError;
  const emptyCopy = activeTab === 'posts' ? profileCopy.empty : activeTab === 'saved' ? profileCopy.savedEmpty : profileCopy.communitiesEmpty;

  const stats = [
    {
      key: profileCopy.testIds.statsPosts,
      label: profileCopy.stats.posts,
      value: postsCount,
    },
    {
      key: profileCopy.testIds.statsFollowers,
      label: profileCopy.stats.followers,
      value: followersCount,
    },
    {
      key: profileCopy.testIds.statsFollowing,
      label: profileCopy.stats.following,
      value: followingCount,
    },
  ];

  useEffect(() => {
    const progress = activeTab === 'posts' ? 0 : activeTab === 'saved' ? 0.5 : 1;
    tabProgress.value = withTiming(progress, {
      duration: indicatorDuration,
      easing: Easing.out(Easing.cubic),
    });
    activeTabRef.current = activeTab;
  }, [activeTab, indicatorDuration, tabProgress]);

  useEffect(() => {
    const layout = tabLayouts[activeTab];
    if (!layout) return;
    indicatorX.value = withTiming(layout.x, {
      duration: indicatorDuration,
      easing: Easing.out(Easing.cubic),
    });
    indicatorWidth.value = withTiming(layout.width, {
      duration: indicatorDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeTab, indicatorDuration, indicatorWidth, indicatorX, tabLayouts]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  const postsLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 0.5, 1], [theme.onBackground, theme.onSurfaceVariant, theme.onSurfaceVariant]),
    opacity: interpolate(tabProgress.value, [0, 0.5, 1], [1, 0.72, 0.72]),
    transform: [{ scale: interpolate(tabProgress.value, [0, 0.5, 1], [1, 0.96, 0.96]) }],
  }));

  const savedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 0.5, 1], [theme.onSurfaceVariant, theme.onBackground, theme.onSurfaceVariant]),
    opacity: interpolate(tabProgress.value, [0, 0.5, 1], [0.72, 1, 0.72]),
    transform: [{ scale: interpolate(tabProgress.value, [0, 0.5, 1], [0.96, 1, 0.96]) }],
  }));

  const communitiesLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 0.5, 1], [theme.onSurfaceVariant, theme.onSurfaceVariant, theme.onBackground]),
    opacity: interpolate(tabProgress.value, [0, 0.5, 1], [0.72, 0.72, 1]),
    transform: [{ scale: interpolate(tabProgress.value, [0, 0.5, 1], [0.96, 0.96, 1]) }],
  }));

  if (isGuest) {
    return (
      <ScreenFade onlyOnTabSwitch>
        <GuestGateScreen
          title={guestCopy.profile.title}
          body={guestCopy.profile.body}
          onSignIn={() => void exitGuest()}
          ctaLabel={guestCopy.profile.cta}
        />
      </ScreenFade>
    );
  }

  const handleTabChange = (nextTab: 'posts' | 'saved' | 'communities') => {
    if (nextTab === activeTabRef.current) {
      return;
    }
    setActiveTab(nextTab);
  };

  const handleManageCommunity = useCallback(
    (community: Community) => {
      navigation.navigate('EditCommunity', { communityId: community.id });
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <View style={styles.iconSpacer} />
          <Text
            style={styles.topTitle}
            testID={profileCopy.testIds.title}
            accessibilityLabel={profileCopy.testIds.title}
          >
            {profileCopy.title}
          </Text>
          <Pressable
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialIcons name="settings" size={22} color={theme.onBackground} />
          </Pressable>
        </View>
      </SafeAreaView>
      <ScreenFade onlyOnTabSwitch>
        <FlatList
          testID={profileCopy.testIds.list}
          data={activeTab === 'communities' ? [] : currentPosts}
          keyExtractor={(item) => `${activeTab}-${item.id}`}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight }]}
          ListHeaderComponent={
            <View>
              <View style={styles.profileHeader}>
                <View style={styles.avatarGlow} />
                <View style={styles.avatarGroup}>
                  <View style={styles.avatarOuter}>
                    {currentUser?.photoUrl ? (
                      <Image source={{ uri: currentUser.photoUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.nameBlock}>
                  <Text
                    style={styles.name}
                    testID={profileCopy.testIds.name}
                    accessibilityLabel={profileCopy.testIds.name}
                  >
                    {displayName}
                  </Text>
                  {displayBio ? (
                    <Text
                      style={styles.bio}
                      testID={profileCopy.testIds.bio}
                      accessibilityLabel={profileCopy.testIds.bio}
                      numberOfLines={3}
                    >
                      {displayBio}
                    </Text>
                  ) : null}
                  {joinedLabel ? (
                    <View style={styles.memberBadge}>
                      <Text
                        style={styles.memberBadgeText}
                        testID={profileCopy.testIds.memberSince}
                        accessibilityLabel={profileCopy.testIds.memberSince}
                      >
                        {joinedLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={styles.statsRow}>
                {stats.map((stat, index) => (
                  <View
                    key={stat.key}
                    style={[styles.statCard, index !== stats.length - 1 && styles.statCardSpacing]}
                  >
                    <Text style={styles.statValue} testID={stat.key}>
                      {stat.value}
                    </Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.tabsRow}>
                <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
                <Pressable
                  style={styles.tabItem}
                  onPress={() => handleTabChange('posts')}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setTabLayouts((prev) => ({
                      ...prev,
                      posts: { x, width },
                    }));
                  }}
                  testID={profileCopy.testIds.tabPosts}
                >
                  <View style={styles.tabContent}>
                    <MaterialIcons
                      name="grid-view"
                      size={18}
                      color={activeTab === 'posts' ? theme.onBackground : theme.onSurfaceVariant}
                      style={styles.tabIcon}
                    />
                    <Animated.Text style={[styles.tabText, postsLabelStyle]}>
                      {profileCopy.tabs.posts}
                    </Animated.Text>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.tabItem}
                  onPress={() => handleTabChange('saved')}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setTabLayouts((prev) => ({
                      ...prev,
                      saved: { x, width },
                    }));
                  }}
                  testID={profileCopy.testIds.tabSaved}
                >
                  <View style={styles.tabContent}>
                    <MaterialIcons
                      name="bookmark-border"
                      size={18}
                      color={activeTab === 'saved' ? theme.onBackground : theme.onSurfaceVariant}
                      style={styles.tabIcon}
                    />
                    <Animated.Text style={[styles.tabText, savedLabelStyle]}>
                      {profileCopy.tabs.saved}
                    </Animated.Text>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.tabItem}
                  onPress={() => handleTabChange('communities')}
                  onLayout={(event) => {
                    const { x, width } = event.nativeEvent.layout;
                    setTabLayouts((prev) => ({
                      ...prev,
                      communities: { x, width },
                    }));
                  }}
                  testID={profileCopy.testIds.tabCommunities}
                >
                  <View style={styles.tabContent}>
                    <MaterialIcons
                      name="people"
                      size={18}
                      color={activeTab === 'communities' ? theme.onBackground : theme.onSurfaceVariant}
                      style={styles.tabIcon}
                    />
                    <Animated.Text style={[styles.tabText, communitiesLabelStyle]}>
                      {profileCopy.tabs.communities}
                    </Animated.Text>
                  </View>
                </Pressable>
              </View>
              {currentError ? <Text style={styles.error}>{currentError}</Text> : null}
              {activeTab === 'communities' && !currentLoading ? (
                communities.length > 0 ? (
                  <View testID={profileCopy.testIds.communityList} style={styles.communityList}>
                    {communities.map((community) => (
                      <ManagedCommunityCard
                        key={community.id}
                        community={community}
                        onPress={() => navigation.navigate('CommunityDetail', { communityId: community.id, initialCommunity: community })}
                        showManageButton
                        onManagePress={() => handleManageCommunity(community)}
                      />
                    ))}
                  </View>
                ) : null
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPressUser={() => {
                if (session?.user?.id === item.userId) {
                  navigation.navigate('Profile');
                } else {
                  navigation.navigate('UserProfile', { userId: item.userId });
                }
              }}
              onPressCommunity={() => navigation.navigate('CommunityDetail', { communityId: item.communityId })}
              onPressBody={() => navigation.navigate('PostDetail', { post: item })}
              onToggleLike={() => handleToggleLike(item)}
              onToggleSave={() => handleToggleSave(item)}
              onOpenComments={() => navigation.navigate('PostDetail', { post: item })}
            />
          )}
          ListEmptyComponent={
            currentLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.loadingTitle} testID={profileCopy.testIds.loadingTitle}>
                  {profileCopy.loading.title}
                </Text>
                <Text style={styles.loadingBody}>{profileCopy.loading.body}</Text>
              </View>
            ) : activeTab === 'communities' && communities.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyContent}>
                  <View style={styles.emptyIconWrapper}>
                    <View style={styles.emptyIconInner}>
                      <MaterialIcons name="add" size={28} color={theme.onSurfaceVariant} />
                    </View>
                  </View>
                  <Text
                    style={styles.emptyTitle}
                    testID={profileCopy.testIds.communitiesEmptyTitle}
                  >
                    {emptyCopy.title}
                  </Text>
                  <Text style={styles.emptyBody}>{emptyCopy.body}</Text>
                </View>
              </View>
            ) : activeTab !== 'communities' ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyContent}>
                  <View style={styles.emptyIconWrapper}>
                    <View style={styles.emptyIconInner}>
                      <MaterialIcons name="add" size={28} color={theme.onSurfaceVariant} />
                    </View>
                  </View>
                  <Text
                    style={styles.emptyTitle}
                    testID={
                      activeTab === 'posts'
                        ? profileCopy.testIds.emptyTitle
                        : profileCopy.testIds.savedEmptyTitle
                    }
                  >
                    {emptyCopy.title}
                  </Text>
                  <Text style={styles.emptyBody}>{emptyCopy.body}</Text>
                  {activeTab === 'posts' ? (
                    <Pressable
                      style={styles.emptyCta}
                      onPress={() => navigation.navigate('CreatePost')}
                      testID={profileCopy.testIds.createPost}
                    >
                      <MaterialIcons name="add-circle" size={18} color={theme.onPrimary} />
                      <Text style={styles.emptyCtaText}>{profileCopy.empty.cta}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={
            currentLoading && currentPosts.length > 0 ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : null
          }
        />
      </ScreenFade>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      backgroundColor: theme.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    topTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '700',
      color: theme.onBackground,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconSpacer: {
      width: 40,
      height: 40,
    },
    listContent: {
      flexGrow: 1,
    },
    profileHeader: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      alignItems: 'center',
    },
    avatarGlow: {
      position: 'absolute',
      top: 18,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.primaryContainer,
    },
    avatarGroup: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarOuter: {
      width: 128,
      height: 128,
      borderRadius: 64,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: theme.surface,
      shadowColor: theme.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 18,
      elevation: 6,
    },
    avatar: {
      width: 118,
      height: 118,
      borderRadius: 59,
    },
    avatarFallback: {
      width: 118,
      height: 118,
      borderRadius: 59,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceVariant,
    },
    avatarText: {
      color: theme.onSurface,
      fontWeight: '700',
      fontSize: 32,
    },
    nameBlock: {
      marginTop: 16,
      alignItems: 'center',
    },
    name: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.onBackground,
    },
    bio: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 20,
    },
    memberBadge: {
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.primaryContainer,
      borderWidth: 1,
      borderColor: theme.primaryContainer,
    },
    memberBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      color: theme.primary,
      letterSpacing: 0.6,
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    statCard: {
      flex: 1,
      minWidth: 90,
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.outline,
      paddingVertical: 14,
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 2,
    },
    statCardSpacing: {
      marginRight: 12,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.onBackground,
    },
    statLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      color: theme.onSurfaceVariant,
      letterSpacing: 0.8,
    },
    tabsRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.outline,
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      position: 'relative',
    },
    tabItem: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: palette.transparent,
    },
    tabIndicator: {
      position: 'absolute',
      bottom: -1,
      height: 3,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    tabContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tabIcon: {
      marginRight: 6,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.onSurfaceVariant,
    },
    emptyState: {
      flex: 1,
      paddingHorizontal: 32,
      marginTop: 24,
    },
    emptyContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyIconWrapper: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptyIconInner: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
      elevation: 2,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.onBackground,
      textAlign: 'center',
    },
    emptyBody: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    loadingState: {
      paddingVertical: 40,
      paddingHorizontal: 32,
      alignItems: 'center',
    },
    loadingTitle: {
      marginTop: 16,
      fontSize: 15,
      fontWeight: '700',
      color: theme.onBackground,
      textAlign: 'center',
    },
    loadingBody: {
      marginTop: 6,
      fontSize: 12,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
    },
    emptyCta: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 18,
      shadowColor: theme.surfaceTint,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 4,
    },
    emptyCtaText: {
      marginLeft: 8,
      fontSize: 12,
      fontWeight: '700',
      color: theme.onPrimary,
      letterSpacing: 0.6,
    },
    error: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: theme.error,
      textAlign: 'center',
    },
    footer: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    communityList: {
      paddingTop: 8,
    },
  });
