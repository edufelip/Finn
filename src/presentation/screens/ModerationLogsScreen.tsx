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

import type { MainStackParamList } from '../navigation/MainStack';
import type { ModerationLog, ModerationAction } from '../../domain/models/moderationLog';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { moderationLogsCopy } from '../content/moderationLogsCopy';
import { formatTimeAgo } from '../i18n/formatters';
import { useModerationAuth } from '../hooks/useModerationAuth';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'ModerationLogs'>;
type Route = RouteProp<MainStackParamList, 'ModerationLogs'>;

export default function ModerationLogsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { session } = useAuth();
  const { moderationLogs: logRepository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { communityId } = route.params;

  // Memoize alerts to prevent infinite loops in useModerationAuth
  const authAlerts = useMemo(() => ({
    signInRequired: moderationLogsCopy.alerts.signInRequired,
    notFound: { title: moderationLogsCopy.alerts.failed.title, message: 'Community not found' },
    notAuthorized: moderationLogsCopy.alerts.notAuthorized,
    failed: moderationLogsCopy.alerts.failed,
  }), []);

  // Use moderation auth hook to handle authorization
  const { community, loading: authLoading, isAuthorized } = useModerationAuth({
    communityId,
    requireOwner: false, // Allow both owners and moderators
    alerts: authAlerts,
  });

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ModerationLog[]>([]);

  const loadLogs = useCallback(async () => {
    if (!isAuthorized) {
      return;
    }

    setLoading(true);
    try {
      const logData = await logRepository.getLogs(communityId);
      setLogs(logData);
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert(moderationLogsCopy.alerts.failed.title, err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [communityId, logRepository, isAuthorized]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionIcon = (action: ModerationAction): keyof typeof MaterialIcons.glyphMap => {
    switch (action) {
      case 'approve_post':
        return 'check-circle';
      case 'reject_post':
        return 'cancel';
      case 'delete_post':
        return 'delete';
      case 'mark_safe':
        return 'verified-user';
      case 'mark_for_review':
        return 'flag';
      case 'moderator_added':
        return 'person-add';
      case 'moderator_removed':
        return 'person-remove';
      case 'settings_changed':
        return 'settings';
      default:
        return 'info';
    }
  };

  const getActionColor = (action: ModerationAction): string => {
    switch (action) {
      case 'approve_post':
      case 'mark_safe':
        return theme.primary;
      case 'reject_post':
      case 'delete_post':
        return theme.error;
      case 'moderator_added':
      case 'settings_changed':
        return theme.tertiary;
      case 'moderator_removed':
        return theme.onSurfaceVariant;
      case 'mark_for_review':
        return theme.secondary;
      default:
        return theme.onSurfaceVariant;
    }
  };

  const getActionLabel = (action: ModerationAction): string => {
    // Map action to copy key
    const copyKey = action as keyof typeof moderationLogsCopy.actions;
    return moderationLogsCopy.actions[copyKey] || action;
  };

  const renderLog = useCallback(
    ({ item }: { item: ModerationLog }) => {
      const actionIcon = getActionIcon(item.action);
      const actionColor = getActionColor(item.action);
      const actionLabel = getActionLabel(item.action);

      return (
        <View
          style={styles.logCard}
          testID={`${moderationLogsCopy.testIds.logItem}-${item.id}`}
        >
          <View style={[styles.iconWrapper, { backgroundColor: `${actionColor}20` }]}>
            <MaterialIcons name={actionIcon} size={24} color={actionColor} />
          </View>
          <View style={styles.logContent}>
            <Text style={styles.actionText}>{actionLabel}</Text>
            <View style={styles.metaRow}>
              {item.moderatorPhotoUrl ? (
                <Image source={{ uri: item.moderatorPhotoUrl }} style={styles.moderatorAvatar} />
              ) : (
                <View style={[styles.moderatorAvatar, styles.moderatorAvatarPlaceholder]}>
                  <MaterialIcons name="person" size={12} color={theme.onSurfaceVariant} />
                </View>
              )}
              <Text style={styles.metaText}>
                {moderationLogsCopy.by(item.moderatorName ?? moderationLogsCopy.unknownModerator)}
              </Text>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.metaText}>{formatTimeAgo(item.createdAt)}</Text>
            </View>
          </View>
        </View>
      );
    },
    [getActionColor, getActionIcon, getActionLabel, styles, theme.onSurfaceVariant]
  );

  // Show loading during both auth and data fetch
  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.onBackground} />
          </Pressable>
          <Text style={styles.headerTitle}>{moderationLogsCopy.title}</Text>
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
        <Text style={styles.headerTitle}>{moderationLogsCopy.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => `log-${item.id}`}
        renderItem={renderLog}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <MaterialIcons name="history" size={64} color={theme.onSurfaceVariant} />
            </View>
            <Text style={styles.emptyTitle}>{moderationLogsCopy.emptyState.title}</Text>
            <Text style={styles.emptyMessage}>{moderationLogsCopy.emptyState.message}</Text>
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
      paddingVertical: 16,
      paddingHorizontal: 16,
      gap: 12,
    },
    logCard: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
      padding: 14,
      gap: 12,
      shadowColor: theme.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      elevation: 1,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logContent: {
      flex: 1,
      justifyContent: 'center',
    },
    actionText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.onBackground,
      marginBottom: 6,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    moderatorAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    moderatorAvatarPlaceholder: {
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metaText: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
    },
    metaSeparator: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
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
