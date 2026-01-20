import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { LinearGradient } from 'expo-linear-gradient';

import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import type { Community } from '../../domain/models/community';
import type { Subscription as CommunitySubscription } from '../../domain/models/subscription';
import type { Post } from '../../domain/models/post';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import type { MainStackParamList } from '../navigation/MainStack';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { communityDetailCopy } from '../content/communityDetailCopy';
import { showGuestGateAlert } from '../components/GuestGateAlert';
import { useCommunityPosts, usePostsStore } from '../../app/store/postsStore';
import { useCommunityStore } from '../../app/store/communityStore';
import { getPlaceholderGradient } from '../theme/gradients';

type RouteParams = {
  communityId: number;
  initialCommunity?: Community;
};

const BANNER_HEIGHT = 224;
const BANNER_HEIGHT_EMPTY = 176;

export default function CommunityDetailScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { communityId: communityIdParam, initialCommunity } = route.params as RouteParams;
  const communityId = Number(communityIdParam);
  const { session, isGuest, exitGuest } = useAuth();
  const { 
    communities: communityRepository, 
    posts: postRepository,
    communityModerators: moderatorRepository,
    moderationLogs: logRepository,
  } = useRepositories();
  const [community, setCommunity] = useState<Community | null>(initialCommunity ?? null);
  const posts = useCommunityPosts(communityId);
  const setCommunityPosts = usePostsStore((state) => state.setCommunityPosts);
  const updatePost = usePostsStore((state) => state.updatePost);
  const { subscriptions, setSubscription } = useCommunityStore();
  const subscription = subscriptions[communityId];
  const [subscribersCount, setSubscribersCount] = useState(initialCommunity?.subscribersCount ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canModerate, setCanModerate] = useState(false);
  const likeInFlightRef = useRef<Set<number>>(new Set());
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Don't reset loading to true if we have initial data, just let skeleton show in list
      if (!initialCommunity) {
        setLoading(true);
      }
      setError(null);
      try {
        if (!Number.isFinite(communityId)) {
          setError(communityDetailCopy.errorNotFound);
          return;
        }

        const [communityResult, countResult, postResult, subscriptionResult, savedResult] =
          await Promise.allSettled([
            communityRepository.getCommunity(communityId),
            communityRepository.getCommunitySubscribersCount(communityId),
            postRepository.getPostsFromCommunity(communityId, 0),
            session?.user?.id
              ? communityRepository.getSubscription(session.user.id, communityId)
              : Promise.resolve(null),
            session?.user?.id ? postRepository.getSavedPosts(session.user.id, 0) : Promise.resolve([]),
          ]);
        if (!mounted) return;

        if (communityResult.status !== 'fulfilled' || !communityResult.value) {
          // If we had initial data, we might want to keep showing it or show error?
          // For now let's show error if remote fetch fails and we don't have local data
          if (!community) {
             const message =
              communityResult.status === 'rejected' && communityResult.reason instanceof Error
                ? communityResult.reason.message
                : communityDetailCopy.errorNotFound;
            setError(message);
            return;
          }
        } else {
            setCommunity(communityResult.value);
        }

        if (countResult.status === 'fulfilled') {
            setSubscribersCount(countResult.value ?? 0);
        }

        const savedPosts = savedResult.status === 'fulfilled' ? savedResult.value ?? [] : [];
        const savedSet = new Set(savedPosts.map((post) => post.id));
        const postData = postResult.status === 'fulfilled' ? postResult.value ?? [] : [];
        let mappedPosts = postData.map((post) => ({
          ...post,
          isSaved: savedSet.has(post.id),
        }));

        if (session?.user?.id && mappedPosts.length > 0) {
          const likes = await Promise.all(
            mappedPosts.map((postItem) => postRepository.findLike(postItem.id, session.user.id).catch(() => false))
          );
          mappedPosts = mappedPosts.map((postItem, index) => ({
            ...postItem,
            isLiked: likes[index],
          }));
        }

        setCommunityPosts(communityId, mappedPosts);
        setSubscription(communityId, subscriptionResult.status === 'fulfilled' ? subscriptionResult.value ?? null : null);
      } catch (err) {
        if (err instanceof Error && mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [communityId, communityRepository, postRepository, session?.user?.id, setCommunityPosts, setSubscription, initialCommunity]);

  // Check if user can moderate
  useEffect(() => {
    let mounted = true;
    const checkModeration = async () => {
      if (!session?.user?.id || !community) {
        setCanModerate(false);
        return;
      }

      try {
        // Check if user is owner
        if (community.ownerId === session.user.id) {
          if (mounted) setCanModerate(true);
          return;
        }

        // Check if user is moderator
        const isMod = await moderatorRepository.isModerator(communityId, session.user.id);
        if (mounted) setCanModerate(isMod);
      } catch (error) {
        if (mounted) setCanModerate(false);
      }
    };

    checkModeration();

    return () => {
      mounted = false;
    };
  }, [communityId, community, session?.user?.id, moderatorRepository]);

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
        Alert.alert(communityDetailCopy.alerts.likeFailed.title, err.message);
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
      if (err instanceof Error) {
        Alert.alert(communityDetailCopy.alerts.savedFailed.title, err.message);
      }
    }
  };

  const handleMarkForReview = async (post: Post) => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be logged in to mark posts for review');
      return;
    }

    if (!canModerate) {
      Alert.alert('Not Authorized', 'Only moderators and owners can mark posts for review');
      return;
    }

    Alert.alert(
      'Mark for Review',
      'Are you sure you want to mark this post for review? This will notify other moderators.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark',
          onPress: async () => {
            const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
            if (!status.isConnected) {
              Alert.alert('Offline', 'You must be online to mark posts for review');
              return;
            }

            try {
              await postRepository.markPostForReview(post.id);
              await logRepository.createLog({
                communityId,
                moderatorId: session.user.id,
                action: 'mark_for_review',
                postId: post.id,
              });
              Alert.alert('Marked', 'This post has been marked for review');
            } catch (err) {
              if (err instanceof Error) {
                Alert.alert('Failed', err.message);
              }
            }
          },
        },
      ]
    );
  };

  const handleOpenComments = useCallback((post: Post) => {
    navigation.navigate('PostDetail', { post });
  }, [navigation]);

  const keyExtractor = useCallback((item: Post | number) => 
    typeof item === 'number' ? `skeleton-${item}` : `${item.id}`,
    []
  );

  const renderPost = useCallback((info: ListRenderItemInfo<Post | number>) => {
    const { item } = info;
    
    if (typeof item === 'number') {
      return <PostSkeleton />;
    }
    
    return (
      <PostCard
        post={item}
        onPressCommunity={() => navigation.navigate('CommunityDetail', { communityId: item.communityId })}
        onPressBody={() => handleOpenComments(item)}
        onToggleLike={() => handleToggleLike(item)}
        onToggleSave={() => handleToggleSave(item)}
        onMarkForReview={() => handleMarkForReview(item)}
        onOpenComments={() => handleOpenComments(item)}
        onPressUser={() => {
          if (session?.user?.id === item.userId) {
            navigation.navigate('Tabs', { screen: 'Profile' });
          } else {
            navigation.navigate('UserProfile', { userId: item.userId });
          }
        }}
        canModerate={canModerate}
      />
    );
  }, [
    handleToggleLike,
    handleToggleSave,
    handleMarkForReview,
    handleOpenComments,
    canModerate,
    navigation,
    session?.user?.id,
  ]);

  const handleToggleSubscription = async () => {
    if (!session?.user?.id) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }

    const current = subscription as CommunitySubscription | null;
    const nextSubscribed = !current;

    if (!nextSubscribed) {
      Alert.alert(
        'Unsubscribe',
        `Are you sure you want to leave ${community?.title}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unsubscribe',
            style: 'destructive',
            onPress: () => performToggleSubscription(current, nextSubscribed),
          },
        ]
      );
    } else {
      await performToggleSubscription(current, nextSubscribed);
    }
  };

  const performToggleSubscription = async (current: CommunitySubscription | null, nextSubscribed: boolean) => {
    if (!session?.user?.id) return;

    const currentId = current?.id ?? 0;
    const previousCount = subscribersCount;
    setSubscription(
      communityId,
      nextSubscribed
        ? {
            id: currentId,
            userId: session.user.id,
            communityId,
          }
        : null
    );
    setSubscribersCount((prev) => Math.max(0, prev + (nextSubscribed ? 1 : -1)));

    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      await enqueueWrite({
        id: `${Date.now()}`,
        type: nextSubscribed ? 'subscribe_community' : 'unsubscribe_community',
        payload: {
          id: current?.id ?? 0,
          userId: session.user.id,
          communityId,
        },
        createdAt: Date.now(),
      });
      Alert.alert(communityDetailCopy.alerts.offline.title, communityDetailCopy.alerts.offline.message);
      return;
    }

    try {
      if (nextSubscribed) {
        const created = await communityRepository.subscribe({
          id: 0,
          userId: session.user.id,
          communityId,
        });
        setSubscription(communityId, created);
      } else {
        await communityRepository.unsubscribe({
          id: current?.id ?? 0,
          userId: session.user.id,
          communityId,
        });
        setSubscription(communityId, null);
      }
    } catch (err) {
      setSubscription(communityId, current ?? null);
      setSubscribersCount(previousCount);
      if (err instanceof Error) {
        Alert.alert(communityDetailCopy.alerts.subscriptionFailed.title, err.message);
      }
    }
  };

  const hasNoPosts = posts.length === 0 && !loading;

  const ListHeader = community ? (
    <View style={styles.headerContainer}>
      <View style={[styles.bannerContainer, hasNoPosts && styles.bannerContainerEmpty]}>
        {!community.imageUrl ? (
          <LinearGradient
            colors={getPlaceholderGradient(community.id)}
            style={styles.bannerImage}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ) : (
          <>
            <Image
              source={{ uri: community.imageUrl }}
              style={styles.bannerImage}
              blurRadius={10}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent', theme.background]}
              style={styles.gradientOverlay}
            />
          </>
        )}
        <Pressable style={[styles.backButton, hasNoPosts && styles.emptyStateButton]} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Pressable style={[styles.moreButton, hasNoPosts && styles.emptyStateButton]}>
          <MaterialIcons name="more-horiz" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              {community.imageUrl ? (
                <Image
                  source={{ uri: community.imageUrl }}
                  style={styles.communityIcon}
                  testID={communityDetailCopy.testIds.image}
                  accessibilityLabel={communityDetailCopy.testIds.image}
                />
              ) : (
                <LinearGradient
                  colors={getPlaceholderGradient(community.id)}
                  style={styles.communityIconPlaceholder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="groups" size={48} color="rgba(255,255,255,0.8)" />
                </LinearGradient>
              )}
            </View>
            {/* Online Indicator - only show in populated state */}
            {!hasNoPosts && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.joinButtonWrapper}>
            <Pressable
              style={[
                styles.joinButton,
                subscription && styles.joinedButton,
                isGuest && styles.lockedButton,
              ]}
              onPress={
                isGuest
                  ? () => showGuestGateAlert({ onSignIn: () => void exitGuest() })
                  : handleToggleSubscription
              }
              testID={communityDetailCopy.testIds.subscribe}
              accessibilityLabel={communityDetailCopy.testIds.subscribe}
            >
              <Text style={[styles.joinButtonText, subscription && styles.joinedButtonText]}>
                {subscription ? communityDetailCopy.unsubscribe : communityDetailCopy.subscribe}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title} testID={communityDetailCopy.testIds.title}>
              {community.title}
            </Text>
            <MaterialIcons name="verified" size={20} color={theme.primary} />
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.memberCount}>
              {communityDetailCopy.subscribers(subscribersCount)}
            </Text>
            <View style={styles.dotSeparator} />
            <View style={styles.onlineWrapper}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>842 Online</Text>
            </View>
          </View>
        </View>

        <Text style={styles.description} testID={communityDetailCopy.testIds.description}>
          {community.description}
        </Text>
      </View>

      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Latest Discussions</Text>
        <Pressable style={styles.sortButton}>
          <MaterialIcons name="sort" size={14} color={theme.primary} />
          <Text style={styles.sortButtonText}>Sort: Newest</Text>
        </Pressable>
      </View>
    </View>
  ) : null;

  const EmptyState = (
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
        style={styles.startDiscussionButton}
        onPress={() => navigation.navigate('CreatePost', { communityId: community?.id })}
      >
        <MaterialIcons name="add-circle" size={20} color={theme.primary} />
        <Text style={styles.startDiscussionText}>Start a Discussion</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && !community ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          <FlatList
            testID={communityDetailCopy.testIds.list}
            data={loading ? [1, 2, 3] : posts}
            keyExtractor={keyExtractor}
            renderItem={renderPost}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={!loading && posts.length === 0 ? EmptyState : null}
            ListFooterComponent={
              loading && posts.length > 0 ? (
                <View style={styles.footer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : null
            }
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerContainer: {
      marginBottom: 24,
    },
    bannerContainer: {
      height: BANNER_HEIGHT,
      width: '100%',
      position: 'relative',
    },
    bannerContainerEmpty: {
      height: BANNER_HEIGHT_EMPTY,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    backButton: {
      position: 'absolute',
      top: 80,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      // backdropFilter: 'blur(10px)' - Note: simplified for RN
    },
    emptyStateButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    moreButton: {
      position: 'absolute',
      top: 80,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentContainer: {
      paddingHorizontal: 20,
      marginTop: -48, // Negative margin to overlap
      position: 'relative',
      zIndex: 10,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    iconContainer: {
      position: 'relative',
    },
    iconWrapper: {
      width: 96,
      height: 96,
      borderRadius: 24,
      backgroundColor: theme.surface,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    communityIcon: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
      backgroundColor: theme.primary,
    },
    communityIconPlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#22C55E', // green-500
      borderWidth: 4,
      borderColor: theme.background,
    },
    joinButtonWrapper: {
      marginTop: 64,
    },
    joinButton: {
      marginBottom: 8,
      paddingHorizontal: 32,
      paddingVertical: 10,
      backgroundColor: theme.primary,
      borderRadius: 9999,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    joinedButton: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    lockedButton: {
      opacity: 0.8,
    },
    joinButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
    },
    joinedButtonText: {
      color: theme.primary,
    },
    infoSection: {
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: -0.5,
      color: theme.onBackground,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    memberCount: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.onSurfaceVariant,
    },
    dotSeparator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.onSurfaceVariant,
      opacity: 0.5,
    },
    onlineWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#22C55E',
    },
    onlineText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.onSurfaceVariant,
    },
    description: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.onSurfaceVariant,
      maxWidth: '90%',
    },
    feedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginTop: 32,
      marginBottom: 24,
    },
    feedTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.onBackground,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sortButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
    list: {
      flex: 1,
      backgroundColor: theme.background,
    },
    listContent: {
      paddingBottom: 100, // Space for bottom nav if needed
    },
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
      borderColor: theme.outline + '40', // Very light border
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
    error: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      color: theme.error,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: {
      paddingVertical: 16,
    },
  });
