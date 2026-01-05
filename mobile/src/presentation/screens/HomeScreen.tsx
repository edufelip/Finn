import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { homeCopy } from '../content/homeCopy';

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
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const { posts: repository, users: userRepository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
        setHasMore(data.length > 0);
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
    if (loading || refreshing || !hasMore || posts.length === 0) return;
    loadPage(page + 1);
  };

  const handleToggleLike = async (post: Post) => {
    if (!session?.user?.id) {
      Alert.alert(homeCopy.alerts.signInRequired.title, homeCopy.alerts.signInRequired.message);
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
        Alert.alert(homeCopy.alerts.likeFailed.title, error.message);
      }
    }
  };

  const handleToggleSave = async (post: Post) => {
    if (!session?.user?.id) {
      Alert.alert(homeCopy.alerts.signInRequired.title, homeCopy.alerts.signInRequired.message);
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyGlowTop} />
      <View style={styles.emptyGlowBottom} />
      <View style={styles.emptyContent}>
        <View style={styles.planetStack}>
          <View style={styles.planet}>
            <View style={styles.planetIconWrap}>
              <MaterialIcons name="groups" size={54} color={theme.homeIconMuted} />
              <MaterialIcons name="chat-bubble" size={20} color={theme.homeIconSoft} style={styles.iconBubble} />
              <MaterialIcons name="favorite" size={24} color={theme.homeAccentSoft} style={styles.iconHeart} />
              <MaterialIcons name="bolt" size={18} color={theme.homeIconSoft} style={styles.iconBolt} />
            </View>
          </View>
          <View style={styles.planetShadow} />
        </View>
        <Text style={styles.emptyTitle}>{homeCopy.emptyTitle}</Text>
        <Text style={styles.emptyBody}>{homeCopy.emptyBody}</Text>
        <View style={styles.emptyCtas}>
            <Pressable
              style={styles.primaryCta}
              onPress={() => navigation.navigate('Search', { focus: true })}
              testID={homeCopy.testIds.explore}
              accessibilityLabel={homeCopy.testIds.explore}
            >
            <MaterialIcons name="explore" size={20} color={theme.white} />
            <Text style={styles.primaryCtaText}>{homeCopy.primaryCta}</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryCta}
            onPress={() => navigation.navigate('Search', { focus: true })}
            testID={homeCopy.testIds.connections}
            accessibilityLabel={homeCopy.testIds.connections}
          >
            <MaterialIcons name="person-add" size={20} color={theme.homeTextSub} />
            <Text style={styles.secondaryCtaText}>{homeCopy.secondaryCta}</Text>
          </Pressable>
        </View>
      </View>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.avatarCard}
          onPress={openDrawer}
          testID={homeCopy.testIds.avatar}
          accessibilityLabel={homeCopy.testIds.avatar}
        >
          <Image
            source={profilePhoto ? { uri: profilePhoto } : require('../../../assets/user_icon.png')}
            style={styles.avatar}
          />
        </Pressable>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.homeTextSub} />
          <Text style={styles.searchPlaceholder}>{homeCopy.searchPlaceholder}</Text>
          <Pressable
            style={styles.searchOverlay}
            onPress={() => navigation.navigate('Search', { focus: true })}
            testID={homeCopy.testIds.search}
            accessibilityLabel={homeCopy.testIds.search}
          />
        </View>
        <Pressable
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
          testID={homeCopy.testIds.notifications}
          accessibilityLabel={homeCopy.testIds.notifications}
        >
          <MaterialIcons name="notifications" size={20} color={theme.homeTextSub} />
          <View style={styles.notificationDot} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        testID={homeCopy.testIds.feedList}
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
        onEndReached={hasMore && posts.length > 0 ? handleLoadMore : undefined}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.homePrimary} />
            </View>
          ) : (
            renderEmptyState()
          )
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={theme.homePrimary} />
            </View>
          ) : null
        }
        style={styles.list}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.homeBackground,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      backgroundColor: theme.homeBackground,
    },
    avatarCard: {
      width: 38,
      height: 38,
      borderRadius: 19,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.homeBorder,
      backgroundColor: theme.homeSurfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    searchContainer: {
      flex: 1,
      height: 42,
      marginLeft: 12,
      borderRadius: 14,
      backgroundColor: theme.homeSurfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.homeBorder,
    },
    searchPlaceholder: {
      color: theme.homeTextSub,
      fontSize: 14,
      fontWeight: '600',
    },
    searchOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    notificationButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      marginLeft: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.homeSurfaceAlt,
      borderWidth: 1,
      borderColor: theme.homeBorder,
    },
    notificationDot: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.danger,
      borderWidth: 2,
      borderColor: theme.homeSurfaceAlt,
    },
    list: {
      backgroundColor: theme.homeBackground,
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
      color: theme.danger,
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
      backgroundColor: theme.homeGlowPrimary,
    },
    emptyGlowBottom: {
      position: 'absolute',
      bottom: 140,
      right: 20,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: theme.homeGlowSecondary,
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
      backgroundColor: theme.homeSurfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.homeBorder,
      shadowColor: theme.black,
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
      backgroundColor: theme.homeShadow,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.homeTextMain,
      marginBottom: 8,
    },
    emptyBody: {
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      color: theme.homeTextSub,
      marginBottom: 20,
    },
    emptyCtas: {
      width: '100%',
      gap: 12,
    },
    primaryCta: {
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.homePrimary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: theme.homePrimary,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    primaryCtaText: {
      color: theme.white,
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryCta: {
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.homeSurface,
      borderWidth: 1,
      borderColor: theme.homeBorder,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    secondaryCtaText: {
      color: theme.homeTextMain,
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
      color: theme.homeTextSub,
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
      backgroundColor: theme.homeSurface,
      borderWidth: 1,
      borderColor: theme.homeBorder,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.homeTextSub,
    },
  });
