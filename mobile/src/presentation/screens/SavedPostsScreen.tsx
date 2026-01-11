import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as Network from 'expo-network';

import PostCard from '../components/PostCard';
import type { Post } from '../../domain/models/post';
import type { MainStackParamList } from '../navigation/MainStack';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import TopBar from '../components/TopBar';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { savedPostsCopy } from '../content/savedPostsCopy';
import GuestGateScreen from '../components/GuestGateScreen';
import { guestCopy } from '../content/guestCopy';

export default function SavedPostsScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { session, isGuest, exitGuest } = useAuth();
  const { posts: postRepository } = useRepositories();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const loadSaved = useCallback(async () => {
    if (!session?.user?.id) {
      setError(savedPostsCopy.errorSignInRequired);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await postRepository.getSavedPosts(session.user.id, 0);
      setPosts(data ?? []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [postRepository, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved])
  );

  if (isGuest) {
    return (
      <GuestGateScreen
        title={guestCopy.restricted.title(guestCopy.features.savedPosts)}
        body={guestCopy.restricted.body(guestCopy.features.savedPosts)}
        onSignIn={() => void exitGuest()}
      />
    );
  }

  const handleToggleSave = async (post: Post) => {
    if (!session?.user?.id) {
      Alert.alert(savedPostsCopy.alerts.signInRequired.title, savedPostsCopy.alerts.signInRequired.message);
      return;
    }

    const previous = posts;
    const nextSaved = !post.isSaved;
    if (!nextSaved) {
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
    } else {
      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, isSaved: true } : item)));
    }

    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      await enqueueWrite({
        id: `${Date.now()}`,
        type: nextSaved ? 'save_post' : 'unsave_post',
        payload: { postId: post.id, userId: session.user.id },
        createdAt: Date.now(),
      });
      Alert.alert(savedPostsCopy.alerts.offline.title, savedPostsCopy.alerts.offline.message);
      return;
    }

    try {
      if (nextSaved) {
        await postRepository.bookmarkPost(post.id, session.user.id);
      } else {
        await postRepository.unbookmarkPost(post.id, session.user.id);
      }
    } catch (err) {
      setPosts(previous);
      if (err instanceof Error) {
        Alert.alert(savedPostsCopy.alerts.savedFailed.title, err.message);
      }
    }
  };

  const handleToggleLike = async (post: Post) => {
    if (!session?.user?.id) {
      Alert.alert(savedPostsCopy.alerts.signInRequired.title, savedPostsCopy.alerts.signInRequired.message);
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
        Alert.alert(savedPostsCopy.alerts.likeFailed.title, err.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TopBar title={savedPostsCopy.title} titleSize={18} onBack={() => navigation.goBack()} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        testID={savedPostsCopy.testIds.list}
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
        ListEmptyComponent={null}
        ListFooterComponent={
          loading ? (
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
    list: {
      backgroundColor: theme.background,
    },
    error: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      color: theme.error,
    },
    footer: {
      paddingVertical: 16,
      alignItems: 'center',
    },
  });
