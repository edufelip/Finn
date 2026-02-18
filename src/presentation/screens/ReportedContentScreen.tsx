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
import type { PostReport } from '../../domain/models/postReport';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useUserStore } from '../../app/store/userStore';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { reportedContentCopy } from '../content/reportedContentCopy';
import ReportCard from '../components/ReportCard';
import { useModerationAuth } from '../hooks/useModerationAuth';
import { useLocalization } from '../../app/providers/LocalizationProvider';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'ReportedContent'>;

type Route = RouteProp<MainStackParamList, 'ReportedContent'>;

export default function ReportedContentScreen() {
  useLocalization();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { session } = useAuth();
  const {
    posts: postRepository,
    postReports: reportRepository,
    moderationLogs: moderationLogRepository,
    communityBans: communityBanRepository,
    userBans: userBanRepository,
  } = useRepositories();
  const currentUser = useUserStore((state) => state.currentUser);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { communityId } = route.params;

  // Memoize alerts to prevent infinite loops in useModerationAuth
  const authAlerts = useMemo(() => ({
    signInRequired: reportedContentCopy.alerts.signInRequired,
    notFound: { title: reportedContentCopy.alerts.failed.title, message: 'Community not found' },
    notAuthorized: reportedContentCopy.alerts.notAuthorized,
    failed: reportedContentCopy.alerts.failed,
  }), []);

  // Use moderation auth hook to handle authorization
  const { community, loading: authLoading, isAuthorized, isOwner } = useModerationAuth({
    communityId,
    requireOwner: false, // Allow both owners and moderators
    allowStaff: true,
    alerts: authAlerts,
  });
  const canGlobalBan = Boolean(isOwner || currentUser?.role === 'admin' || currentUser?.role === 'staff');

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [processingReportIds, setProcessingReportIds] = useState<Set<number>>(new Set());

  const loadReports = useCallback(async () => {
    if (!isAuthorized) {
      return;
    }

    setLoading(true);
    try {
      const reportedPosts = await reportRepository.getReportsForCommunity(communityId);
      // Filter to only show pending reports
      setReports(reportedPosts.filter((report) => report.status === 'pending' || !report.status));
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert(reportedContentCopy.alerts.failed.title, err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [communityId, reportRepository, isAuthorized]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const executeBan = useCallback(
    async (report: PostReport, scope: 'community' | 'global') => {
      if (!session?.user?.id) {
        return;
      }

      const postAuthorId = report.postAuthorId;
      if (!postAuthorId) {
        Alert.alert(reportedContentCopy.alerts.failed.title, reportedContentCopy.alerts.failed.missingAuthor);
        return;
      }

      const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
      if (!status.isConnected) {
        Alert.alert(
          reportedContentCopy.alerts.offline.title,
          reportedContentCopy.alerts.offline.message
        );
        return;
      }

      setProcessingReportIds((prev) => new Set(prev).add(report.id));
      try {
        await postRepository.deletePost(report.postId);
        await reportRepository.updateReportStatus(report.id, 'resolved_deleted');

        if (scope === 'community') {
          await communityBanRepository.banUser(
            communityId,
            postAuthorId,
            session.user.id,
            report.reason,
            report.postId
          );
        } else {
          await userBanRepository.banUser(
            postAuthorId,
            session.user.id,
            report.reason,
            report.postId
          );
        }

        await moderationLogRepository.createLog({
          communityId,
          moderatorId: session.user.id,
          action: 'user_banned',
          postId: report.postId,
        });

        setReports((prev) => prev.filter((r) => r.id !== report.id));
        Alert.alert(
          reportedContentCopy.alerts.deleted.title,
          reportedContentCopy.alerts.deleted.message
        );
      } catch (err) {
        if (err instanceof Error) {
          Alert.alert(reportedContentCopy.alerts.failed.title, err.message);
        }
      } finally {
        setProcessingReportIds((prev) => {
          const next = new Set(prev);
          next.delete(report.id);
          return next;
        });
      }
    },
    [
      communityBanRepository,
      communityId,
      moderationLogRepository,
      postRepository,
      reportRepository,
      session?.user?.id,
      userBanRepository,
    ]
  );

  const handleDelete = useCallback(
    async (report: PostReport) => {
      Alert.alert(
        reportedContentCopy.confirmDeleteAndBan.title,
        reportedContentCopy.confirmDeleteAndBan.message,
        [
          {
            text: reportedContentCopy.confirmDeleteAndBan.cancel,
            style: 'cancel',
          },
          {
            text: reportedContentCopy.confirmDeleteAndBan.confirmCommunity,
            style: 'destructive',
            onPress: () => {
              void executeBan(report, 'community');
            },
          },
          ...(canGlobalBan
            ? [
                {
                  text: reportedContentCopy.confirmDeleteAndBan.confirmGlobal,
                  style: 'destructive' as const,
                  onPress: () => {
                    void executeBan(report, 'global');
                  },
                },
              ]
            : []),
        ]
      );
    },
    [canGlobalBan, executeBan]
  );

  const handleMarkSafe = useCallback(
    async (report: PostReport) => {
      if (!session?.user?.id) {
        return;
      }

      Alert.alert(
        reportedContentCopy.confirmMarkSafe.title,
        reportedContentCopy.confirmMarkSafe.message,
        [
          {
            text: reportedContentCopy.confirmMarkSafe.cancel,
            style: 'cancel',
          },
          {
            text: reportedContentCopy.confirmMarkSafe.confirm,
            style: 'default',
            onPress: async () => {
              const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
              if (!status.isConnected) {
                Alert.alert(
                  reportedContentCopy.alerts.offline.title,
                  reportedContentCopy.alerts.offline.message
                );
                return;
              }

              setProcessingReportIds((prev) => new Set(prev).add(report.id));
              try {
                await reportRepository.updateReportStatus(report.id, 'resolved_safe');
                await moderationLogRepository.createLog({
                  communityId,
                  moderatorId: session.user.id,
                  action: 'mark_safe',
                  postId: report.postId,
                });

                setReports((prev) => prev.filter((r) => r.id !== report.id));
                Alert.alert(
                  reportedContentCopy.alerts.markedSafe.title,
                  reportedContentCopy.alerts.markedSafe.message
                );
              } catch (err) {
                if (err instanceof Error) {
                  Alert.alert(reportedContentCopy.alerts.failed.title, err.message);
                }
              } finally {
                setProcessingReportIds((prev) => {
                  const next = new Set(prev);
                  next.delete(report.id);
                  return next;
                });
              }
            },
          },
        ]
      );
    },
    [communityId, moderationLogRepository, reportRepository, session?.user?.id]
  );

  const renderReport = useCallback(
    ({ item }: { item: PostReport }) => {
      const isProcessing = processingReportIds.has(item.id);

      return (
        <ReportCard
          report={item}
          onDelete={handleDelete}
          onMarkSafe={handleMarkSafe}
          isProcessing={isProcessing}
        />
      );
    },
    [handleDelete, handleMarkSafe, processingReportIds]
  );

  // Show loading during both auth and data fetch
  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.onBackground} />
          </Pressable>
          <Text style={styles.headerTitle}>{reportedContentCopy.title}</Text>
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
        <Text style={styles.headerTitle}>{reportedContentCopy.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => `report-${item.id}`}
        renderItem={renderReport}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <MaterialIcons name="verified-user" size={64} color={theme.onSurfaceVariant} />
            </View>
            <Text style={styles.emptyTitle}>{reportedContentCopy.emptyState.title}</Text>
            <Text style={styles.emptyMessage}>{reportedContentCopy.emptyState.message}</Text>
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
