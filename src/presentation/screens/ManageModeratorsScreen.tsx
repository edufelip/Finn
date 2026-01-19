import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import type { CommunityModerator } from '../../domain/models/communityModerator';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { manageModeratorsCopy } from '../content/manageModeratorsCopy';
import { formatTimeAgo } from '../i18n/formatters';
import { useModerationAuth } from '../hooks/useModerationAuth';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'ManageModerators'>;
type Route = RouteProp<MainStackParamList, 'ManageModerators'>;

export default function ManageModeratorsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { session } = useAuth();
  const {
    communityModerators: moderatorRepository,
    moderationLogs: logRepository,
  } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { communityId } = route.params;

  // Use moderation auth hook to handle authorization
  const { community, loading: authLoading, isAuthorized, isOwner } = useModerationAuth({
    communityId,
    requireOwner: false, // Allow both owners and moderators
    alerts: {
      signInRequired: manageModeratorsCopy.alerts.signInRequired,
      notFound: { title: manageModeratorsCopy.alerts.failed.title, message: 'Community not found' },
      notAuthorized: manageModeratorsCopy.alerts.notAuthorized,
      failed: manageModeratorsCopy.alerts.failed,
    },
  });

  const [loading, setLoading] = useState(true);
  const [moderators, setModerators] = useState<CommunityModerator[]>([]);
  const [removingModeratorId, setRemovingModeratorId] = useState<number | null>(null);

  const loadModerators = useCallback(async () => {
    if (!isAuthorized) {
      return;
    }

    setLoading(true);
    try {
      const moderatorData = await moderatorRepository.getModerators(communityId);
      setModerators(moderatorData);
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert(manageModeratorsCopy.alerts.failed.title, err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [communityId, moderatorRepository, isAuthorized]);

  useEffect(() => {
    loadModerators();
  }, [loadModerators]);

  const handleAddModerator = useCallback(
    async () => {
      if (!session?.user?.id) {
        return;
      }

      Alert.prompt(
        manageModeratorsCopy.addModerator.title,
        'Enter the user ID of the person you want to add as a moderator',
        [
          {
            text: manageModeratorsCopy.addModerator.cancel,
            style: 'cancel',
          },
          {
            text: manageModeratorsCopy.addModerator.confirm,
            onPress: async (userId?: string) => {
              if (!userId || !userId.trim()) {
                return;
              }

              const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
              if (!status.isConnected) {
                Alert.alert(
                  manageModeratorsCopy.alerts.offline.title,
                  manageModeratorsCopy.alerts.offline.message
                );
                return;
              }

              try {
                const newModerator = await moderatorRepository.addModerator(
                  communityId,
                  userId.trim(),
                  session.user.id
                );
                await logRepository.createLog({
                  communityId,
                  moderatorId: session.user.id,
                  action: 'moderator_added',
                  postId: null,
                });

                setModerators((prev) => [...prev, newModerator]);
                Alert.alert(
                  manageModeratorsCopy.alerts.added.title,
                  manageModeratorsCopy.alerts.added.message(newModerator.userName ?? 'User')
                );
              } catch (err) {
                if (err instanceof Error) {
                  Alert.alert(manageModeratorsCopy.alerts.failed.title, err.message);
                }
              }
            },
          },
        ],
        'plain-text'
      );
    },
    [communityId, logRepository, moderatorRepository, session?.user?.id]
  );

  const handleRemoveModerator = useCallback(
    async (moderator: CommunityModerator) => {
      if (!session?.user?.id) {
        return;
      }

      // Only owner can remove moderators
      if (!isOwner) {
        Alert.alert(
          manageModeratorsCopy.alerts.notAuthorized.title,
          'Only the community owner can remove moderators'
        );
        return;
      }

      Alert.alert(
        manageModeratorsCopy.confirmRemove.title,
        manageModeratorsCopy.confirmRemove.message(moderator.userName ?? 'this user'),
        [
          {
            text: manageModeratorsCopy.confirmRemove.cancel,
            style: 'cancel',
          },
          {
            text: manageModeratorsCopy.confirmRemove.confirm,
            style: 'destructive',
            onPress: async () => {
              const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
              if (!status.isConnected) {
                Alert.alert(
                  manageModeratorsCopy.alerts.offline.title,
                  manageModeratorsCopy.alerts.offline.message
                );
                return;
              }

              setRemovingModeratorId(moderator.id);
              try {
                await moderatorRepository.removeModerator(communityId, moderator.userId);
                await logRepository.createLog({
                  communityId,
                  moderatorId: session.user.id,
                  action: 'moderator_removed',
                  postId: null,
                });

                setModerators((prev) => prev.filter((m) => m.id !== moderator.id));
                Alert.alert(
                  manageModeratorsCopy.alerts.removed.title,
                  manageModeratorsCopy.alerts.removed.message(moderator.userName ?? 'Moderator')
                );
              } catch (err) {
                if (err instanceof Error) {
                  Alert.alert(manageModeratorsCopy.alerts.failed.title, err.message);
                }
              } finally {
                setRemovingModeratorId(null);
              }
            },
          },
        ]
      );
    },
    [communityId, isOwner, logRepository, moderatorRepository, session?.user?.id]
  );

  const renderModerator = useCallback(
    ({ item }: { item: CommunityModerator }) => {
      const isRemoving = removingModeratorId === item.id;

      return (
        <View style={styles.moderatorCard}>
          <View style={styles.moderatorInfo}>
            {item.userPhotoUrl ? (
              <Image source={{ uri: item.userPhotoUrl }} style={styles.moderatorAvatar} />
            ) : (
              <View style={[styles.moderatorAvatar, styles.moderatorAvatarPlaceholder]}>
                <MaterialIcons name="person" size={24} color={theme.onSurfaceVariant} />
              </View>
            )}
            <View style={styles.moderatorText}>
              <Text style={styles.moderatorName}>{item.userName ?? 'Unknown User'}</Text>
              <Text style={styles.moderatorMeta}>
                {manageModeratorsCopy.assignedBy('Owner')} • {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
          {isOwner && (
            <Pressable
              style={[styles.removeButton, isRemoving && styles.removeButtonDisabled]}
              onPress={() => handleRemoveModerator(item)}
              disabled={isRemoving}
              testID={`${manageModeratorsCopy.testIds.removeButton}-${item.id}`}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" color={theme.error} />
              ) : (
                <MaterialIcons name="person-remove" size={20} color={theme.error} />
              )}
            </Pressable>
          )}
        </View>
      );
    },
    [handleRemoveModerator, isOwner, removingModeratorId, styles, theme]
  );

  // Show loading during both auth and data fetch
  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.onBackground} />
          </Pressable>
          <Text style={styles.headerTitle}>{manageModeratorsCopy.title}</Text>
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
        <Text style={styles.headerTitle}>{manageModeratorsCopy.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={moderators}
        keyExtractor={(item) => `moderator-${item.id}`}
        renderItem={renderModerator}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <MaterialIcons name="supervisor-account" size={64} color={theme.onSurfaceVariant} />
            </View>
            <Text style={styles.emptyTitle}>{manageModeratorsCopy.emptyState.title}</Text>
            <Text style={styles.emptyMessage}>{manageModeratorsCopy.emptyState.message}</Text>
          </View>
        }
      />
      {isOwner && (
        <View style={styles.footer}>
          <Pressable
            style={styles.addButton}
            onPress={handleAddModerator}
            testID={manageModeratorsCopy.testIds.addButton}
          >
            <MaterialIcons name="person-add" size={20} color={theme.onPrimary} />
            <Text style={styles.addButtonText}>{manageModeratorsCopy.addButton}</Text>
          </Pressable>
        </View>
      )}
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
      paddingVertical: 16,
      paddingHorizontal: 16,
      gap: 12,
    },
    moderatorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
      padding: 14,
      shadowColor: theme.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      elevation: 1,
    },
    moderatorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    moderatorAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    moderatorAvatarPlaceholder: {
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moderatorText: {
      flex: 1,
    },
    moderatorName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.onBackground,
      marginBottom: 4,
    },
    moderatorMeta: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
    },
    removeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.errorContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonDisabled: {
      opacity: 0.5,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.outline,
      backgroundColor: theme.background,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 14,
      gap: 8,
      shadowColor: theme.surfaceTint,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 3,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onPrimary,
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
