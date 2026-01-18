import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { LinearGradient } from 'expo-linear-gradient';

import PostCard from '../components/PostCard';
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

type RouteParams = {
  communityId: number;
};

const BANNER_HEIGHT = 224;

export default function CommunityDetailScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { communityId } = route.params as RouteParams;
  const { session, isGuest, exitGuest } = useAuth();
  const { communities: communityRepository, posts: postRepository } = useRepositories();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [subscription, setSubscription] = useState<CommunitySubscription | null>(null);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [communityData, count, postData, subscriptionData, savedPosts] = await Promise.all([
          communityRepository.getCommunity(communityId),
          communityRepository.getCommunitySubscribersCount(communityId),
          postRepository.getPostsFromCommunity(communityId, 0),
          session?.user?.id
            ? communityRepository.getSubscription(session.user.id, communityId)
            : Promise.resolve(null),
          session?.user?.id ? postRepository.getSavedPosts(session.user.id, 0) : Promise.resolve([]),
        ]);
        if (!mounted) return;
        if (!communityData) {
          setError(communityDetailCopy.errorNotFound);
          return;
        }
        setCommunity(communityData);
        setSubscribersCount(count ?? 0);
        const savedSet = new Set((savedPosts ?? []).map((post) => post.id));
        let mappedPosts = (postData ?? []).map((post) => ({
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

        setPosts(mappedPosts);
        setSubscription(subscriptionData ?? null);
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
  }, [communityId, communityRepository, postRepository, session?.user?.id]);

  const handleToggleLike = async (post: Post) => {
    if (!session?.user?.id) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }

    const nextLiked = !post.isLiked;
    setPosts((prev) =>
      prev.map((item) =>
        item.id === post.id
          ? {
              ...item,
              isLiked: nextLiked,
              likesCount: Math.max(0, (item.likesCount ?? 0) + (nextLiked ? 1 : -1)),
            }
          : item
      )
    );

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

    try {
      if (nextLiked) {
        await postRepository.likePost(post.id, session.user.id);
      } else {
        await postRepository.dislikePost(post.id, session.user.id);
      }
    } catch (err) {
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? {
                ...item,
                isLiked: post.isLiked,
                likesCount: post.likesCount,
              }
            : item
        )
      );
      if (err instanceof Error) {
        Alert.alert(communityDetailCopy.alerts.likeFailed.title, err.message);
      }
    }
  };

  const handleToggleSave = async (post: Post) => {
    if (!session?.user?.id) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }

    const nextSaved = !post.isSaved;
    setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, isSaved: nextSaved } : item)));

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
      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, isSaved: post.isSaved } : item)));
      if (err instanceof Error) {
        Alert.alert(communityDetailCopy.alerts.savedFailed.title, err.message);
      }
    }
  };

  const handleToggleSubscription = async () => {
    if (!session?.user?.id) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }

    const current = subscription as CommunitySubscription | null;
    const currentId = current?.id ?? 0;
    const nextSubscribed = !current;
    const previousCount = subscribersCount;
    setSubscription(
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
        setSubscription(created);
      } else {
        await communityRepository.unsubscribe({
          id: current?.id ?? 0,
          userId: session.user.id,
          communityId,
        });
        setSubscription(null);
      }
    } catch (err) {
      setSubscription(current ?? null);
      setSubscribersCount(previousCount);
      if (err instanceof Error) {
        Alert.alert(communityDetailCopy.alerts.subscriptionFailed.title, err.message);
      }
    }
  };

  const ListHeader = community ? (
    <View style={styles.headerContainer}>
      <View style={styles.bannerContainer}>
        <Image
          source={
            community.imageUrl
              ? { uri: community.imageUrl }
              : require('../../../assets/user_icon.png')
          }
          style={styles.bannerImage}
          blurRadius={community.imageUrl ? 10 : 0}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', theme.background]}
          style={styles.gradientOverlay}
        />
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.moreButton}>
          <MaterialIcons name="more-horiz" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              <Image
                source={
                  community.imageUrl
                    ? { uri: community.imageUrl }
                    : require('../../../assets/user_icon.png')
                }
                style={styles.communityIcon}
                testID={communityDetailCopy.testIds.image}
                accessibilityLabel={communityDetailCopy.testIds.image}
              />
            </View>
            {/* Online Indicator Mock */}
            <View style={styles.onlineIndicator} />
          </View>

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

  return (
    <View style={styles.container}>
      {loading && !community ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <FlatList
        testID={communityDetailCopy.testIds.list}
        data={posts}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={() => handleToggleLike(item)}
            onToggleSave={() => handleToggleSave(item)}
            onOpenComments={() => navigation.navigate('PostDetail', { post: item })}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{communityDetailCopy.empty}</Text> : null}
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
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      // backdropFilter: 'blur(10px)' - Note: simplified for RN
    },
    moreButton: {
      position: 'absolute',
      top: 50,
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
      backgroundColor: theme.background,
    },
    listContent: {
      paddingBottom: 100, // Space for bottom nav if needed
    },
    empty: {
      marginTop: 32,
      alignSelf: 'center',
      color: theme.onSurfaceVariant,
    },
    error: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      color: theme.error,
    },
    center: {
      marginTop: 24,
      alignItems: 'center',
    },
    footer: {
      paddingVertical: 16,
    },
  });
