import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as Network from 'expo-network';

import PostCard from '../components/PostCard';
import type { Post } from '../../domain/models/post';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import type { MainStackParamList } from '../navigation/MainStack';
import type { MainTabParamList } from '../navigation/MainTabs';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import { colors } from '../theme/colors';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const { posts: repository, users: userRepository } = useRepositories();

  useEffect(() => {
    if (!session?.user?.id) return;
    userRepository
      .getUser(session.user.id)
      .then((data) => setProfilePhoto(data?.photoUrl ?? null))
      .catch(() => setProfilePhoto(null));
  }, [session?.user?.id, userRepository]);

  const loadPage = useCallback(
    async (pageToLoad: number, replace = false) => {
      if (!session?.user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await repository.getUserFeed(session.user.id, pageToLoad);
        setPosts((prev) => (replace ? data : [...prev, ...data]));
        setPage(pageToLoad);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session?.user?.id, repository]
  );

  useEffect(() => {
    if (!session?.user?.id) return;
    loadPage(0, true);
  }, [loadPage, session?.user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPage(0, true);
  };

  const handleLoadMore = () => {
    if (loading) return;
    loadPage(page + 1);
  };

  const handleToggleLike = async (post: Post) => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please sign in again.');
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
        await repository.likePost(post.id, session.user.id);
      } else {
        await repository.dislikePost(post.id, session.user.id);
      }
    } catch (error) {
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
      if (error instanceof Error) {
        Alert.alert('Failed to update like', error.message);
      }
    }
  };

  const handleToggleSave = async (post: Post) => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please sign in again.');
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
        await repository.bookmarkPost(post.id, session.user.id);
      } else {
        await repository.unbookmarkPost(post.id, session.user.id);
      }
    } catch (error) {
      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, isSaved: post.isSaved } : item)));
      if (error instanceof Error) {
        Alert.alert('Failed to update saved posts', error.message);
      }
    }
  };

  const openDrawer = () => {
    const parent = navigation.getParent();
    if (parent && 'openDrawer' in parent) {
      (parent as { openDrawer: () => void }).openDrawer();
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.avatarCard}
          onPress={openDrawer}
          testID="home-avatar"
          accessibilityLabel="home-avatar"
        >
          <Image
            source={profilePhoto ? { uri: profilePhoto } : require('../../../assets/user_icon.png')}
            style={styles.avatar}
          />
        </Pressable>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={18} color={colors.darkGrey} />
          <Text style={styles.searchPlaceholder}>Search</Text>
          <Pressable
            style={styles.searchOverlay}
            onPress={() => navigation.navigate('Search', { focus: true })}
            testID="home-search"
            accessibilityLabel="home-search"
          />
        </View>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Home</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        testID="home-feed-list"
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
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReachedThreshold={0.3}
        onEndReached={handleLoadMore}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.mainBlueDeep} />
            </View>
          ) : (
            <Text style={styles.empty}>Subscribe to a community to start seeing posts =D</Text>
          )
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.mainBlueDeep} />
            </View>
          ) : null
        }
        style={styles.list}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  avatarCard: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flex: 1,
    height: 44,
    marginTop: 8,
    marginBottom: 8,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: colors.searchBackground,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchPlaceholder: {
    color: colors.darkGrey,
  },
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionHeader: {
    height: 50,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
    backgroundColor: colors.white,
  },
  sectionTitle: {
    fontSize: 16,
  },
  list: {
    backgroundColor: colors.backgroundLight,
  },
  empty: {
    width: 240,
    textAlign: 'center',
    marginTop: 32,
    alignSelf: 'center',
  },
  emptyContainer: {
    paddingTop: 0,
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
    color: colors.danger,
  },
});
