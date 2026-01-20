import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';

import type { MainStackParamList } from '../navigation/MainStack';
import type { Post } from '../../domain/models/post';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { pendingContentCopy } from '../content/pendingContentCopy';
import PostCard from '../components/PostCard';
import { useModerationAuth } from '../hooks/useModerationAuth';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'PendingContent'>;
type Route = RouteProp<MainStackParamList, 'PendingContent'>;

export default function PendingContentScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { session } = useAuth();
  const {
    posts: postRepository,
    moderationLogs: moderationLogRepository,
  } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { communityId } = route.params;

  // Memoize alerts to prevent infinite loops in useModerationAuth
  const authAlerts = useMemo(() => ({
    signInRequired: pendingContentCopy.alerts.signInRequired,
    notFound: { title: pendingContentCopy.alerts.failed.title, message: 'Community not found' },
    notAuthorized: pendingContentCopy.alerts.notAuthorized,
    failed: pendingContentCopy.alerts.failed,
  }), []);

  // Use moderation auth hook to handle authorization
  const { community, loading: authLoading, isAuthorized } = useModerationAuth({
    communityId,
    requireOwner: false, // Allow both owners and moderators
    alerts: authAlerts,
  });

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [processingPostIds, setProcessingPostIds] = useState<Set<number>>(new Set());

  const loadPendingPosts = useCallback(async () => {
    if (!isAuthorized) {
      return;
    }

    setLoading(true);
    try {
      const pendingPosts = await postRepository.getPendingPosts(communityId);
      setPosts(pendingPosts);
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert(pendingContentCopy.alerts.failed.title, err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [communityId, postRepository, isAuthorized]);

  useEffect(() => {
    loadPendingPosts();
  }, [loadPendingPosts]);

  const handleApprove = useCallback(
    async (post: Post) => {
      if (!session?.user?.id) {
        return;
      }

      Alert.alert(
        pendingContentCopy.confirmApprove.title,
        pendingContentCopy.confirmApprove.message,
        [
          {
            text: pendingContentCopy.confirmApprove.cancel,
            style: 'cancel',
          },
          {
            text: pendingContentCopy.confirmApprove.confirm,
            style: 'default',
            onPress: async () => {
              const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
              if (!status.isConnected) {
                Alert.alert(
                  pendingContentCopy.alerts.offline.title,
                  pendingContentCopy.alerts.offline.message
                );
                return;
              }

              setProcessingPostIds((prev) => new Set(prev).add(post.id));
              try {
                await postRepository.updateModerationStatus(post.id, 'approved');
                await moderationLogRepository.createLog({
                  communityId,
                  moderatorId: session.user.id,
                  action: 'approve_post',
                  postId: post.id,
                });

                setPosts((prev) => prev.filter((p) => p.id !== post.id));
                Alert.alert(
                  pendingContentCopy.alerts.approved.title,
                  pendingContentCopy.alerts.approved.message
                );
              } catch (err) {
                if (err instanceof Error) {
                  Alert.alert(pendingContentCopy.alerts.failed.title, err.message);
                }
              } finally {
                setProcessingPostIds((prev) => {
                  const next = new Set(prev);
                  next.delete(post.id);
                  return next;
                });
              }
            },
          },
        ]
      );
    },
    [communityId, moderationLogRepository, postRepository, session?.user?.id]
  );

  const handleReject = useCallback(
    async (post: Post) => {
      if (!session?.user?.id) {
        return;
      }

      Alert.alert(
        pendingContentCopy.confirmReject.title,
        pendingContentCopy.confirmReject.message,
        [
          {
            text: pendingContentCopy.confirmReject.cancel,
            style: 'cancel',
          },
          {
            text: pendingContentCopy.confirmReject.confirm,
            style: 'destructive',
            onPress: async () => {
              const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
              if (!status.isConnected) {
                Alert.alert(
                  pendingContentCopy.alerts.offline.title,
                  pendingContentCopy.alerts.offline.message
                );
                return;
              }

              setProcessingPostIds((prev) => new Set(prev).add(post.id));
              try {
                await postRepository.updateModerationStatus(post.id, 'rejected');
                await moderationLogRepository.createLog({
                  communityId,
                  moderatorId: session.user.id,
                  action: 'reject_post',
                  postId: post.id,
                });

                setPosts((prev) => prev.filter((p) => p.id !== post.id));
                Alert.alert(
                  pendingContentCopy.alerts.rejected.title,
                  pendingContentCopy.alerts.rejected.message
                );
              } catch (err) {
                if (err instanceof Error) {
                  Alert.alert(pendingContentCopy.alerts.failed.title, err.message);
                }
              } finally {
                setProcessingPostIds((prev) => {
                  const next = new Set(prev);
                  next.delete(post.id);
                  return next;
                });
              }
            },
          },
        ]
      );
    },
    [communityId, moderationLogRepository, postRepository, session?.user?.id]
  );

  const renderPost = useCallback(
    ({ item }: { item: Post }) => {
      const isProcessing = processingPostIds.has(item.id);

      return (
        <View style={styles.postContainer}>
          <PostCard
            post={item}
            onPressUser={() => {
              if (session?.user?.id === item.userId) {
                navigation.navigate('Tabs', { screen: 'Profile' });
              } else {
                navigation.navigate('UserProfile', { userId: item.userId });
              }
            }}
            onPressCommunity={() => navigation.navigate('CommunityDetail', { communityId: item.communityId })}
            onPressBody={() => navigation.navigate('PostDetail', { post: item })}
            onOpenComments={() => navigation.navigate('PostDetail', { post: item })}
          />
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleApprove(item)}
              disabled={isProcessing}
              testID={`${pendingContentCopy.testIds.approveButton}-${item.id}`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={20} color={theme.onPrimary} />
                  <Text style={styles.approveButtonText}>{pendingContentCopy.approveButton}</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleReject(item)}
              disabled={isProcessing}
              testID={`${pendingContentCopy.testIds.rejectButton}-${item.id}`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.error} />
              ) : (
                <>
                  <MaterialIcons name="cancel" size={20} color={theme.error} />
                  <Text style={styles.rejectButtonText}>{pendingContentCopy.rejectButton}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      );
    },
    [handleApprove, handleReject, navigation, processingPostIds, styles, theme]
  );

  // Show loading during both auth and data fetch
  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.onBackground} />
          </Pressable>
          <Text style={styles.headerTitle}>{pendingContentCopy.title}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthorized || !community) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.onBackground} />
        </Pressable>
        <Text style={styles.headerTitle}>{pendingContentCopy.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => `pending-post-${item.id}`}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <MaterialIcons name="check-circle-outline" size={64} color={theme.onSurfaceVariant} />
            </View>
            <Text style={styles.emptyTitle}>{pendingContentCopy.emptyState.title}</Text>
            <Text style={styles.emptyMessage}>{pendingContentCopy.emptyState.message}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.outline,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: theme.onBackground,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 44,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: 16,
    },
    postContainer: {
      marginBottom: 16,
    },
    actionsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 12,
    },
    approveButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 12,
      gap: 8,
      shadowColor: theme.surfaceTint,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
    approveButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.onPrimary,
    },
    rejectButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.error,
      paddingVertical: 12,
      gap: 8,
    },
    rejectButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.error,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    emptyIconWrapper: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.onBackground,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 14,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
