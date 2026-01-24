import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import PostCard from '../components/PostCard';
import type { User } from '../../domain/models/user';
import type { Post } from '../../domain/models/post';
import type { Comment } from '../../domain/models/comment';
import type { MainStackParamList } from '../navigation/MainStack';
import { commonCopy } from '../content/commonCopy';
import { profileCopy } from '../content/profileCopy';
import { showGuestGateAlert } from '../components/GuestGateAlert';
import { usePostsStore } from '../../app/store/postsStore';
import { isMockMode } from '../../config/appConfig';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isUserOnline } from '../../domain/presence';

const COVER_HEIGHT = 180;

export default function UserProfileScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'UserProfile'>>();
  const { userId } = route.params;
  const { session, isGuest, exitGuest } = useAuth();
  const { users: userRepository, posts: postRepository, comments: commentRepository } = useRepositories();
  const updateStorePost = usePostsStore((state) => state.updatePost);
  const setSavedForUser = usePostsStore((state) => state.setSavedForUser);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  const showOnlineDot =
    user != null &&
    isUserOnline({
      onlineVisible: user.onlineVisible ?? true,
      lastSeenAt: user.lastSeenAt ?? null,
    });

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const likeInFlightRef = useRef<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, followers, following, userPosts, userComments] = await Promise.all([
        userRepository.getUser(userId),
        userRepository.getFollowersCount(userId),
        userRepository.getFollowingCount(userId),
        postRepository.getPostsFromUser(userId, 0),
        commentRepository.getCommentsFromUser(userId),
      ]);

      let mappedPosts = userPosts ?? [];
      if (session?.user?.id && mappedPosts.length > 0) {
        const [likes, saved] = await Promise.all([
          Promise.all(mappedPosts.map(p => postRepository.findLike(p.id, session.user.id).catch(() => false))),
          Promise.all(mappedPosts.map(p => postRepository.findSavedPost(p.id, session.user.id).catch(() => false)))
        ]);
        mappedPosts = mappedPosts.map((p, i) => ({
          ...p,
          isLiked: likes[i],
          isSaved: saved[i]
        }));
      }

      if (userData) {
        setUser({
          ...userData,
          followersCount: followers,
          followingCount: following,
        });
      }

      setPosts(mappedPosts);
      setComments(userComments ?? []);

      if (session?.user?.id) {
        const followingStatus = await userRepository.isFollowing(session.user.id, userId);
        setIsFollowing(followingStatus);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userRepository, postRepository, commentRepository, session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const layout = tabLayouts[activeTab];
    if (layout) {
      indicatorX.value = withTiming(layout.x, { duration: 250, easing: Easing.out(Easing.quad) });
      indicatorWidth.value = withTiming(layout.width, { duration: 250, easing: Easing.out(Easing.quad) });
    }
  }, [activeTab, tabLayouts, indicatorX, indicatorWidth]);

  const handleTabPress = (tab: 'posts' | 'comments') => {
    setActiveTab(tab);
  };

  const handleFollow = async () => {
    if (isGuest) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }
    if (!session?.user?.id) return;

    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    if (user) {
      setUser({
        ...user,
        followersCount: (user.followersCount ?? 0) + (nextFollowing ? 1 : -1),
      });
    }

    try {
      if (nextFollowing) {
        await userRepository.followUser(session.user.id, userId);
      } else {
        await userRepository.unfollowUser(session.user.id, userId);
      }
    } catch {
      setIsFollowing(!nextFollowing);
      if (user) {
        setUser({
          ...user,
          followersCount: (user.followersCount ?? 0) + (nextFollowing ? -1 : 1),
        });
      }
      Alert.alert(commonCopy.error, profileCopy.errorFollowFailed);
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

    const nextLiked = !post.isLiked;
    const nextLikesCount = Math.max(0, (post.likesCount ?? 0) + (nextLiked ? 1 : -1));
    
    // Update local state
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: nextLiked, likesCount: nextLikesCount } : p));
    // Update global store
    updateStorePost(post.id, { isLiked: nextLiked, likesCount: nextLikesCount });

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
      // Rollback
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: post.isLiked, likesCount: post.likesCount } : p));
      updateStorePost(post.id, { isLiked: post.isLiked, likesCount: post.likesCount });
      if (err instanceof Error) {
        Alert.alert(commonCopy.error, err.message);
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
    
    // Update local state
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isSaved: nextSaved } : p));
    // Update global store
    updateStorePost(post.id, { isSaved: nextSaved });
    if (session?.user?.id) {
      setSavedForUser(session.user.id, post.id, nextSaved);
    }

    try {
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

      if (nextSaved) {
        await postRepository.bookmarkPost(post.id, session.user.id);
      } else {
        await postRepository.unbookmarkPost(post.id, session.user.id);
      }
    } catch (err) {
      // Rollback
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isSaved: post.isSaved } : p));
      updateStorePost(post.id, { isSaved: post.isSaved });
      if (session?.user?.id) {
        setSavedForUser(session.user.id, post.id, post.isSaved ?? false);
      }
      if (err instanceof Error) {
        Alert.alert(commonCopy.error, err.message);
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${user?.name || 'this profile'} on Finn!`,
        url: `finn://profile/${userId}`,
      });
    } catch {
      // Ignore
    }
  };

  const handleMessage = () => {
    if (isGuest) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }
    if (user) {
      navigation.navigate('Chat', { userId, user });
    }
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  if (loading && !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCX4IQEx2PlwQcZWYhvDWWp6U61sndeT5UQM6O896fc-Ud2ihd3-uYJRmqyGiqMbCPp1WXPGiqgyiSchaGQTLckf-JL0LkFc1IBfFXgArURjbSDmyIGxgmoonZ7X-SZ20SNVZ3eXXsx1Ckp-OlCK1ouSvjN8_k3mvBkT8u9f8p1SQPENwQmYnVFDLsgz_z-2SdX9LBx1rkU6ZYfXeBtKflt8jxdDqU5I6PBDVlEidymHD4U69NsB3CeQdj5IX1Ihcfiw31dG_Uk225n' }}
              style={styles.coverImage}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(0,0,0,0.3)', 'transparent', theme.background]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            
            <View style={[styles.topButtonsContainer, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
              <View style={styles.topButtons} pointerEvents="box-none">
                <Pressable style={styles.circleButton} onPress={() => navigation.goBack()}>
                  <MaterialIcons name="arrow-back" size={24} color="#FFF" />
                </Pressable>
                <Pressable style={styles.circleButton} onPress={handleShare}>
                  <MaterialIcons name="share" size={20} color="#FFF" />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarRow}>
              <Pressable
                style={styles.avatarContainer}
                onPress={() => {
                  if (user?.photoUrl) {
                    setIsAvatarOpen(true);
                  }
                }}
              >
                {user?.photoUrl ? (
                  <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitial}>
                      {(user?.name || commonCopy.userFallback).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
            {showOnlineDot ? <View style={styles.onlineDot} /> : null}
          </Pressable>
              
              <View style={styles.actionButtons}>
                <Pressable
                  style={[
                    styles.followButton,
                    isFollowing && styles.followingButton,
                  ]}
                  onPress={handleFollow}
                >
                  <Text style={[
                    styles.followButtonText,
                    isFollowing && styles.followingButtonText,
                  ]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
                <Pressable style={styles.iconButton} onPress={handleMessage}>
                  <MaterialIcons name="mail-outline" size={22} color={theme.onSurface} />
                </Pressable>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{user?.name || commonCopy.userFallback}</Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.followersCount || 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.followingCount || 0}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>

              <Text style={styles.bio} numberOfLines={3}>
                {user?.bio || 'No bio available.'}
              </Text>

              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <MaterialIcons name="location-on" size={14} color={theme.onSurfaceVariant} />
                  <Text style={styles.badgeText}>{user?.location || profileCopy.locationNotSpecified}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.tabsSection}>
            <View style={styles.tabsHeader}>
              <Text style={styles.tabsTitle}>Recent Activities</Text>
              <View style={styles.tabsContainer}>
                <Animated.View style={[styles.tabIndicator, indicatorStyle]} pointerEvents="none" />
                <Pressable
                  onLayout={(e) => {
                    const layout = e.nativeEvent?.layout;
                    if (layout) {
                      setTabLayouts((prev) => ({ ...prev, posts: layout }));
                    }
                  }}
                  onPress={() => handleTabPress('posts')}
                  style={styles.tabItem}
                  hitSlop={12}
                >
                  <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>{profileCopy.tabLabels.posts}</Text>
                </Pressable>
                <Pressable
                  onLayout={(e) => {
                    const layout = e.nativeEvent?.layout;
                    if (layout) {
                      setTabLayouts((prev) => ({ ...prev, comments: layout }));
                    }
                  }}
                  onPress={() => handleTabPress('comments')}
                  style={styles.tabItem}
                  hitSlop={12}
                >
                  <Text style={[styles.tabText, activeTab === 'comments' && styles.activeTabText]}>{profileCopy.tabLabels.comments}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {activeTab === 'posts' ? (
            <View style={styles.tabContent}>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <View key={post.id} style={styles.postWrapper}>
                    <PostCard
                      post={post}
                      onPressCommunity={() => navigation.navigate('CommunityDetail', { communityId: post.communityId })}
                      onPressBody={() => navigation.navigate('PostDetail', { post })}
                      onToggleLike={() => handleToggleLike(post)}
                      onToggleSave={() => handleToggleSave(post)}
                      onOpenComments={() => navigation.navigate('PostDetail', { post })}
                      onPressUser={() => {
                        if (session?.user?.id === post.userId) {
                          navigation.navigate('Profile');
                        } else {
                          navigation.navigate('UserProfile', { userId: post.userId });
                        }
                      }}
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="article" size={48} color={theme.outline} />
                  <Text style={styles.emptyText}>No posts yet</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <MaterialIcons name="comment" size={16} color={theme.primary} />
                      <Text style={styles.commentPostTitle}>Commented on a post</Text>
                    </View>
                    <Text style={styles.commentBody}>{comment.content}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="comment" size={48} color={theme.outline} />
                  <Text style={styles.emptyText}>No comments yet</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      <Modal visible={isAvatarOpen} transparent animationType="fade" onRequestClose={() => setIsAvatarOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsAvatarOpen(false)}>
          {user?.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.fullscreenImage} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    headerContainer: {
      backgroundColor: theme.background,
    },
    coverContainer: {
      height: COVER_HEIGHT,
      width: '100%',
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    topButtonsContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3,
      elevation: 3,
    },
    topButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    circleButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileSection: {
      paddingHorizontal: 20,
      marginTop: -50,
      zIndex: 2,
    },
    avatarRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 30,
      backgroundColor: theme.surface,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 10,
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
    },
    avatarPlaceholder: {
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.onSurfaceVariant,
    },
    onlineDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#22C55E',
      borderWidth: 3,
      borderColor: theme.surface,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    followButton: {
      backgroundColor: '#3B82F6',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 999,
      height: 40,
      justifyContent: 'center',
    },
    followingButton: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    followButtonText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontSize: 14,
    },
    followingButtonText: {
      color: theme.onSurface,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoContainer: {
      marginTop: 15,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    name: {
      fontSize: 24,
      fontWeight: '900',
      color: theme.onSurface,
      marginRight: 6,
    },
    statsRow: {
      flexDirection: 'row',
      marginTop: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
    },
    statValue: {
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.onSurface,
      marginRight: 4,
    },
    statLabel: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
    },
    bio: {
      fontSize: 13,
      color: theme.onSurfaceVariant,
      lineHeight: 20,
      marginTop: 15,
    },
    badgeRow: {
      flexDirection: 'row',
      marginTop: 15,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.outline,
      marginRight: 10,
    },
    badgeText: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
      fontWeight: '500',
      marginLeft: 6,
    },
    tabsSection: {
      marginTop: 30,
      paddingHorizontal: 20,
      zIndex: 2,
    },
    tabsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    tabsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.onSurface,
    },
    tabsContainer: {
      flexDirection: 'row',
      position: 'relative',
    },
    tabItem: {
      paddingBottom: 4,
      marginHorizontal: 8,
    },
    tabText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.onSurfaceVariant,
    },
    activeTabText: {
      color: '#3B82F6',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      height: 2,
      backgroundColor: '#3B82F6',
      borderRadius: 1,
    },
    contentContainer: {
      marginTop: 10,
    },
    tabContent: {
      flex: 1,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    fullscreenImage: {
      width: '100%',
      height: '80%',
      borderRadius: 12,
    },
    postWrapper: {
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    commentCard: {
      backgroundColor: theme.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    commentPostTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
    },
    commentBody: {
      fontSize: 14,
      color: theme.onSurface,
      lineHeight: 20,
    },
    emptyState: {
      paddingTop: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      marginTop: 12,
      color: theme.onSurfaceVariant,
      fontSize: 16,
    },
  });
