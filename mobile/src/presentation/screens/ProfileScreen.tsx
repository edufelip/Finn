import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';

import PostCard from '../components/PostCard';
import type { Post } from '../../domain/models/post';
import type { User } from '../../domain/models/user';
import type { MainStackParamList } from '../navigation/MainStack';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import Divider from '../components/Divider';
import { colors } from '../theme/colors';
import { profileCopy } from '../content/profileCopy';
import { commonCopy } from '../content/commonCopy';
import { formatMonthYear } from '../i18n/formatters';

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { session } = useAuth();
  const { users: userRepository, posts: postRepository } = useRepositories();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setError(profileCopy.errorSignInRequired);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [profile, postData] = await Promise.all([
        userRepository.getUser(session.user.id),
        postRepository.getPostsFromUser(session.user.id, 0),
      ]);
      setUser(profile);
      let nextPosts = postData ?? [];
      if (nextPosts.length) {
        const likes = await Promise.all(
          nextPosts.map((postItem) => postRepository.findLike(postItem.id, session.user.id).catch(() => false))
        );
        nextPosts = nextPosts.map((postItem, index) => ({
          ...postItem,
          isLiked: likes[index],
        }));
      }
      setPosts(nextPosts);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [postRepository, session?.user?.id, userRepository]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleToggleLike = async (post: Post) => {
    if (!session?.user?.id) {
      Alert.alert(profileCopy.alerts.signInRequired.title, profileCopy.alerts.signInRequired.message);
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
        Alert.alert(profileCopy.alerts.likeFailed.title, err.message);
      }
    }
  };

  const handleToggleSave = async (post: Post) => {
    if (!session?.user?.id) {
      Alert.alert(profileCopy.alerts.signInRequired.title, profileCopy.alerts.signInRequired.message);
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
        Alert.alert(profileCopy.alerts.savedFailed.title, err.message);
      }
    }
  };

  const joinedDate = user?.createdAt ? formatMonthYear(user.createdAt) : '';
  const joinedLabel = joinedDate ? profileCopy.joinedSince(joinedDate) : null;

  const displayName = user?.name ?? session?.user?.email ?? commonCopy.userFallback;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="keyboard-arrow-left" size={24} color={colors.white} />
        </Pressable>
        <View style={styles.headerFill} />
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarOuter}>
            <Image
              source={user?.photoUrl ? { uri: user.photoUrl } : require('../../../assets/user_icon.png')}
              style={styles.avatar}
            />
          </View>
        </View>
      </View>
      <Text
        style={styles.name}
        testID={profileCopy.testIds.name}
        accessibilityLabel={profileCopy.testIds.name}
      >
        {displayName}
      </Text>
      {joinedLabel ? (
        <View style={styles.joinedRow}>
          <MaterialIcons name="date-range" size={16} color={colors.darkGrey} />
          <Text
            style={styles.joinedText}
            testID={profileCopy.testIds.joined}
            accessibilityLabel={profileCopy.testIds.joined}
          >
            {joinedLabel}
          </Text>
        </View>
      ) : null}
      <View style={styles.tabHeader}>
        <Text style={styles.tabText}>{profileCopy.postsTab}</Text>
      </View>
      <Divider />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        testID={profileCopy.testIds.list}
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
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{profileCopy.emptyPosts}</Text> : null}
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.mainBlueDeep} />
            </View>
          ) : null
        }
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: 125,
    backgroundColor: colors.mainBlue,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 2,
    padding: 8,
  },
  headerFill: {
    height: 125,
    backgroundColor: colors.mainBlue,
  },
  avatarWrapper: {
    position: 'absolute',
    left: 32,
    top: 60,
  },
  avatarOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  name: {
    marginTop: 16,
    marginLeft: 24,
    fontSize: 20,
    fontWeight: '600',
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 24,
    marginTop: 8,
    gap: 4,
  },
  joinedText: {
    fontSize: 14,
  },
  tabHeader: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  tabText: {
    fontSize: 16,
  },
  list: {
    backgroundColor: colors.backgroundLight,
  },
  empty: {
    marginTop: 32,
    alignSelf: 'center',
    color: colors.darkGrey,
  },
  error: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: colors.danger,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
