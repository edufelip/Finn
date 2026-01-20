import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import type { MainStackParamList } from '../navigation/MainStack';
import { commonCopy } from '../content/commonCopy';
import { showGuestGateAlert } from '../components/GuestGateAlert';

const COVER_HEIGHT = 180;

export default function UserProfileScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'UserProfile'>>();
  const { userId } = route.params;
  const { session, isGuest, exitGuest } = useAuth();
  const { users: userRepository, posts: postRepository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media'>('posts');
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, followers, following, userPosts] = await Promise.all([
        userRepository.getUser(userId),
        userRepository.getFollowersCount(userId),
        userRepository.getFollowingCount(userId),
        postRepository.getPostsFromUser(userId, 0),
      ]);

      if (userData) {
        setUser({
          ...userData,
          followersCount: followers,
          followingCount: following,
        });
      }

      setPosts(userPosts ?? []);

      if (session?.user?.id) {
        const followingStatus = await userRepository.isFollowing(session.user.id, userId);
        setIsFollowing(followingStatus);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userRepository, postRepository, session?.user?.id]);

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
    } catch (err) {
      setIsFollowing(!nextFollowing);
      if (user) {
        setUser({
          ...user,
          followersCount: (user.followersCount ?? 0) + (nextFollowing ? -1 : 1),
        });
      }
      Alert.alert('Error', 'Failed to update follow status.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${user?.name || 'this profile'} on Finn!`,
        url: `finn://profile/${userId}`,
      });
    } catch (err) {
      // Ignore
    }
  };

  const handleMessage = () => {
    if (isGuest) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }
    Alert.alert('Message', 'Direct messaging feature coming soon!');
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCX4IQEx2PlwQcZWYhvDWWp6U61sndeT5UQM6O896fc-Ud2ihd3-uYJRmqyGiqMbCPp1WXPGiqgyiSchaGQTLckf-JL0LkFc1IBfFXgArURjbSDmyIGxgmoonZ7X-SZ20SNVZ3eXXsx1Ckp-OlCK1ouSvjN8_k3mvBkT8u9f8p1SQPENwQmYnVFDLsgz_z-2SdX9LBx1rkU6ZYfXeBtKflt8jxdDqU5I6PBDVlEidymHD4U69NsB3CeQdj5IX1Ihcfiw31dG_Uk225n' }}
          style={styles.coverImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', theme.background]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView edges={['top']} style={styles.topButtons}>
          <Pressable style={styles.circleButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
          <Pressable style={styles.circleButton} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color="#FFF" />
          </Pressable>
        </SafeAreaView>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarContainer}>
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {(user?.name || commonCopy.userFallback).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>
          
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
            <MaterialIcons name="verified" size={20} color="#3B82F6" style={styles.verifiedIcon} />
          </View>
          <Text style={styles.headline}>Senior AI Researcher</Text>
          
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
            {user?.bio || 'Dedicated to advancing human-centric AI. Currently focused on LLM optimization and ethical frameworks at the intersection of technology and society.'}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <MaterialIcons name="location-on" size={14} color={theme.onSurfaceVariant} />
              <Text style={styles.badgeText}>{user?.location || 'San Francisco, CA'}</Text>
            </View>
            <View style={styles.badge}>
              <MaterialIcons name="link" size={14} color={theme.onSurfaceVariant} />
              <Text style={styles.badgeText}>alexrivera.ai</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tabsSection}>
        <View style={styles.tabsHeader}>
          <Text style={styles.tabsTitle}>Recent Activities</Text>
          <View style={styles.tabsContainer}>
            <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
            <Pressable
              onLayout={(e) => setTabLayouts(prev => ({ ...prev, posts: e.nativeEvent.layout }))}
              onPress={() => setActiveTab('posts')}
              style={styles.tabItem}
            >
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
            </Pressable>
            <Pressable
              onLayout={(e) => setTabLayouts(prev => ({ ...prev, replies: e.nativeEvent.layout }))}
              onPress={() => setActiveTab('replies')}
              style={styles.tabItem}
            >
              <Text style={[styles.tabText, activeTab === 'replies' && styles.activeTabText]}>Replies</Text>
            </Pressable>
            <Pressable
              onLayout={(e) => setTabLayouts(prev => ({ ...prev, media: e.nativeEvent.layout }))}
              onPress={() => setActiveTab('media')}
              style={styles.tabItem}
            >
              <Text style={[styles.tabText, activeTab === 'media' && styles.activeTabText]}>Media</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activeTab === 'posts' ? posts : []}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.postWrapper}>
            <PostCard
              post={item}
              onOpenComments={() => navigation.navigate('PostDetail', { post: item })}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          activeTab === 'posts' ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="article" size={48} color={theme.outline} />
              <Text style={styles.emptyText}>No posts yet</Text>
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
      backgroundColor: theme.background,
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
    topButtons: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 10,
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
    },
    avatarRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
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
      marginBottom: 10,
    },
    followButton: {
      backgroundColor: '#3B82F6',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 999,
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
    verifiedIcon: {
      marginTop: 2,
    },
    headline: {
      fontSize: 14,
      color: '#3B82F6',
      fontWeight: '600',
      marginTop: 2,
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
    listContent: {
      paddingBottom: 40,
    },
    postWrapper: {
      paddingHorizontal: 16,
      marginBottom: 12,
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