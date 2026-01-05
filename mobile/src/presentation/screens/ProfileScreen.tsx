import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { SafeAreaView } from 'react-native-safe-area-context';

import PostCard from '../components/PostCard';
import type { Post } from '../../domain/models/post';
import type { User } from '../../domain/models/user';
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

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { session } = useAuth();
  const { users: userRepository, posts: postRepository } = useRepositories();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
  const joinedLabel = joinedDate ? profileCopy.memberSince(joinedDate) : null;

  const displayName = user?.name ?? session?.user?.email ?? commonCopy.userFallback;
  const displayEmail = session?.user?.email ?? commonCopy.emptyDash;
  const postsCount = posts.length;
  const followersCount = user?.followersCount ?? 0;
  const followingCount = user?.followingCount ?? 0;

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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios-new" size={22} color={theme.profileTextMain} />
          </Pressable>
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
            <MaterialIcons name="settings" size={22} color={theme.profileTextMain} />
          </Pressable>
        </View>
      </SafeAreaView>
      <FlatList
        testID={profileCopy.testIds.list}
        data={posts}
        keyExtractor={(item) => `${item.id}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.profileHeader}>
              <View style={styles.avatarGlow} />
              <View style={styles.avatarGroup}>
                <View style={styles.avatarOuter}>
                  <Image
                    source={user?.photoUrl ? { uri: user.photoUrl } : require('../../../assets/user_icon.png')}
                    style={styles.avatar}
                  />
                </View>
                <Pressable style={styles.editBadge}>
                  <MaterialIcons name="edit" size={16} color={theme.profilePrimary} />
                </Pressable>
              </View>
              <View style={styles.nameBlock}>
                <Text
                  style={styles.name}
                  testID={profileCopy.testIds.name}
                  accessibilityLabel={profileCopy.testIds.name}
                >
                  {displayName}
                </Text>
                <Text
                  style={styles.email}
                  testID={profileCopy.testIds.email}
                  accessibilityLabel={profileCopy.testIds.email}
                >
                  {displayEmail}
                </Text>
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
              <Pressable style={[styles.tabItem, styles.tabItemActive]}>
                <View style={styles.tabContent}>
                  <MaterialIcons
                    name="grid-view"
                    size={18}
                    color={theme.profileTextMain}
                    style={styles.tabIcon}
                  />
                  <Text style={styles.tabTextActive} testID={profileCopy.testIds.tabPosts}>
                    {profileCopy.tabs.posts}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.tabItem}
                onPress={() => navigation.navigate('SavedPosts')}
                testID={profileCopy.testIds.tabSaved}
              >
                <View style={styles.tabContent}>
                  <MaterialIcons
                    name="bookmark-border"
                    size={18}
                    color={theme.profileTextSub}
                    style={styles.tabIcon}
                  />
                  <Text style={styles.tabText}>{profileCopy.tabs.saved}</Text>
                </View>
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={() => handleToggleLike(item)}
            onToggleSave={() => handleToggleSave(item)}
            onOpenComments={() => navigation.navigate('PostDetail', { post: item })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <View style={styles.emptyIconInner}>
                  <MaterialIcons name="add" size={28} color={theme.profileMuted} />
                </View>
              </View>
              <Text style={styles.emptyTitle} testID={profileCopy.testIds.emptyTitle}>
                {profileCopy.empty.title}
              </Text>
              <Text style={styles.emptyBody}>{profileCopy.empty.body}</Text>
              <Pressable
                style={styles.emptyCta}
                onPress={() => navigation.navigate('CreatePost')}
                testID={profileCopy.testIds.createPost}
              >
                <MaterialIcons name="add-circle" size={18} color={theme.white} />
                <Text style={styles.emptyCtaText}>{profileCopy.empty.cta}</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={theme.profilePrimary} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.profileBackground,
    },
    safeArea: {
      backgroundColor: theme.profileBackground,
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
      color: theme.profileTextMain,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingBottom: 32,
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
      backgroundColor: theme.profilePrimarySoft,
    },
    avatarGroup: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarOuter: {
      width: 128,
      height: 128,
      borderRadius: 64,
      backgroundColor: theme.profileSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: theme.profileSurface,
      shadowColor: theme.profileCardShadow,
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
    editBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: theme.profileSurface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.profileBorder,
      padding: 6,
      shadowColor: theme.profileCardShadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 3,
    },
    nameBlock: {
      marginTop: 16,
      alignItems: 'center',
    },
    name: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.profileTextMain,
    },
    email: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: '500',
      color: theme.profileTextSub,
    },
    memberBadge: {
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.profilePrimarySoft,
      borderWidth: 1,
      borderColor: theme.profilePrimarySoft,
    },
    memberBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      color: theme.profilePrimary,
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
      backgroundColor: theme.profileSurface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.profileBorder,
      paddingVertical: 14,
      alignItems: 'center',
      shadowColor: theme.profileCardShadow,
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
      color: theme.profileTextMain,
    },
    statLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      color: theme.profileTextSub,
      letterSpacing: 0.8,
    },
    tabsRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.profileBorder,
      backgroundColor: theme.profileBackground,
      paddingHorizontal: 16,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: theme.transparent,
    },
    tabItemActive: {
      borderBottomColor: theme.profilePrimary,
    },
    tabContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tabIcon: {
      marginRight: 6,
    },
    tabTextActive: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.profileTextMain,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.profileTextSub,
    },
    emptyState: {
      paddingVertical: 40,
      paddingHorizontal: 32,
      alignItems: 'center',
    },
    emptyIconWrapper: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.profilePrimarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptyIconInner: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: theme.profileSurface,
      borderWidth: 1,
      borderColor: theme.profileBorder,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.profileCardShadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
      elevation: 2,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.profileTextMain,
      textAlign: 'center',
    },
    emptyBody: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: '400',
      color: theme.profileTextSub,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyCta: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.profilePrimary,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 18,
      shadowColor: theme.profilePrimaryGlow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 4,
    },
    emptyCtaText: {
      marginLeft: 8,
      fontSize: 12,
      fontWeight: '700',
      color: theme.white,
      letterSpacing: 0.6,
    },
    error: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: theme.danger,
      textAlign: 'center',
    },
    footer: {
      paddingVertical: 16,
      alignItems: 'center',
    },
  });
