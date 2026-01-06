import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';

import PostCard from '../components/PostCard';
import type { Community } from '../../domain/models/community';
import type { Subscription as CommunitySubscription } from '../../domain/models/subscription';
import type { Post } from '../../domain/models/post';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import type { MainStackParamList } from '../navigation/MainStack';
import Divider from '../components/Divider';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { communityDetailCopy } from '../content/communityDetailCopy';
import { formatMonthYear } from '../i18n/formatters';

type RouteParams = {
  communityId: number;
};

export default function CommunityDetailScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { communityId } = route.params as RouteParams;
  const { session } = useAuth();
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
      Alert.alert(
        communityDetailCopy.alerts.signInRequired.title,
        communityDetailCopy.alerts.signInRequired.message
      );
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
      Alert.alert(
        communityDetailCopy.alerts.signInRequired.title,
        communityDetailCopy.alerts.signInRequired.message
      );
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
      Alert.alert(
        communityDetailCopy.alerts.signInRequired.title,
        communityDetailCopy.alerts.signInRequired.message
      );
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

  const header = community ? (
    <View>
      <View style={styles.toolbar}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="keyboard-arrow-left" size={24} color={theme.onPrimary} />
        </Pressable>
      </View>
      <View style={styles.blueStrip} />
      <View style={styles.imageSpacer} />
      <View style={styles.imageWrapper}>
        <View style={styles.imageOuter}>
          <Image
            source={community.imageUrl ? { uri: community.imageUrl } : require('../../../assets/user_icon.png')}
            style={styles.communityImage}
            testID={communityDetailCopy.testIds.image}
            accessibilityLabel={communityDetailCopy.testIds.image}
          />
        </View>
      </View>
      <Pressable
        style={styles.subscribeButton}
        onPress={handleToggleSubscription}
        testID={communityDetailCopy.testIds.subscribe}
        accessibilityLabel={communityDetailCopy.testIds.subscribe}
      >
        <Text style={styles.subscribeText}>
          {subscription ? communityDetailCopy.unsubscribe : communityDetailCopy.subscribe}
        </Text>
      </Pressable>
      <Text style={styles.title} testID={communityDetailCopy.testIds.title}>
        {community.title}
      </Text>
      <Text style={styles.description} testID={communityDetailCopy.testIds.description}>
        {community.description}
      </Text>
      <View style={styles.subInfo}>
        <Text style={styles.subCount}>{communityDetailCopy.subscribers(subscribersCount)}</Text>
        <Text style={styles.sinceValue}>
          {communityDetailCopy.since(
            (community.createdAt ? formatMonthYear(community.createdAt) : '') || communityDetailCopy.emptyDash
          )}
        </Text>
      </View>
      <Divider />
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
        ListHeaderComponent={header}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{communityDetailCopy.empty}</Text> : null}
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : null
        }
        style={styles.list}
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
    toolbar: {
      height: 56,
      backgroundColor: theme.primary,
      justifyContent: 'center',
    },
    backButton: {
      padding: 8,
      marginLeft: 16,
    },
    blueStrip: {
      height: 72,
      backgroundColor: theme.primary,
    },
    imageSpacer: {
      height: 76,
    },
    imageWrapper: {
      position: 'absolute',
      left: 32,
      top: 56 + 12,
    },
    imageOuter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.outline,
    },
    communityImage: {
      width: 68,
      height: 68,
      borderRadius: 34,
    },
    subscribeButton: {
      position: 'absolute',
      right: 20,
      top: 56 + 72 + 12,
      height: 32,
      width: 128,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.primary,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subscribeText: {
      color: theme.primary,
      fontSize: 10,
    },
    title: {
      marginTop: 12,
      marginLeft: 24,
      fontSize: 20,
      color: theme.onBackground,
    },
    description: {
      marginTop: 4,
      marginHorizontal: 24,
      color: theme.onSurfaceVariant,
    },
    subInfo: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
      marginBottom: 16,
      gap: 4,
      paddingHorizontal: 24,
    },
    subCount: {
      fontWeight: '700',
      color: theme.onBackground,
    },
    sinceValue: {
      marginLeft: 4,
      color: theme.onSurfaceVariant,
    },
    list: {
      backgroundColor: theme.background,
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
