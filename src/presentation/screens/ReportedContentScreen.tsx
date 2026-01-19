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
import type { PostReport } from '../../domain/models/postReport';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { reportedContentCopy } from '../content/reportedContentCopy';
import { formatTimeAgo } from '../i18n/formatters';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'ReportedContent'>;
type Route = RouteProp<MainStackParamList, 'ReportedContent'>;

export default function ReportedContentScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { session } = useAuth();
  const {
    posts: postRepository,
    postReports: reportRepository,
    communities: communityRepository,
    communityModerators: moderatorRepository,
    moderationLogs: moderationLogRepository,
  } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { communityId } = route.params;

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [processingReportIds, setProcessingReportIds] = useState<Set<number>>(new Set());

  const loadReports = useCallback(async () => {
    if (!session?.user?.id) {
      Alert.alert(
        reportedContentCopy.alerts.signInRequired.title,
        reportedContentCopy.alerts.signInRequired.message
      );
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      // Verify user is owner or moderator
      const community = await communityRepository.getCommunity(communityId);
      if (!community) {
        Alert.alert(reportedContentCopy.alerts.failed.title, 'Community not found');
        navigation.goBack();
        return;
      }

      const isOwner = community.ownerId === session.user.id;
      const isModerator = await moderatorRepository.isModerator(communityId, session.user.id);

      if (!isOwner && !isModerator) {
        Alert.alert(
          reportedContentCopy.alerts.notAuthorized.title,
          reportedContentCopy.alerts.notAuthorized.message
        );
        navigation.goBack();
        return;
      }

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
  }, [communityId, communityRepository, moderatorRepository, navigation, reportRepository, session?.user?.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDelete = useCallback(
    async (report: PostReport) => {
      if (!session?.user?.id) {
        return;
      }

      Alert.alert(
        reportedContentCopy.confirmDelete.title,
        reportedContentCopy.confirmDelete.message,
        [
          {
            text: reportedContentCopy.confirmDelete.cancel,
            style: 'cancel',
          },
          {
            text: reportedContentCopy.confirmDelete.confirm,
            style: 'destructive',
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
                await postRepository.deletePost(report.postId);
                await reportRepository.updateReportStatus(report.id, 'resolved_deleted');
                await moderationLogRepository.createLog({
                  communityId,
                  moderatorId: session.user.id,
                  action: 'delete_post',
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
          },
        ]
      );
    },
    [communityId, moderationLogRepository, postRepository, reportRepository, session?.user?.id]
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
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <View style={styles.reporterInfo}>
              {item.userPhotoUrl ? (
                <Image source={{ uri: item.userPhotoUrl }} style={styles.reporterAvatar} />
              ) : (
                <View style={[styles.reporterAvatar, styles.reporterAvatarPlaceholder]}>
                  <MaterialIcons name="person" size={16} color={theme.onSurfaceVariant} />
                </View>
              )}
              <View style={styles.reporterText}>
                <Text style={styles.reportedByText}>
                  {reportedContentCopy.reportedBy(item.userName ?? 'Unknown User')}
                </Text>
                <Text style={styles.reportDate}>{formatTimeAgo(item.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.reportBadge}>
              <MaterialIcons name="flag" size={16} color={theme.error} />
            </View>
          </View>

          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>{reportedContentCopy.reason}</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>

          {item.postContent || item.postImageUrl ? (
            <View style={styles.postPreview}>
              <Text style={styles.postPreviewLabel}>Reported Post:</Text>
              {item.postContent ? (
                <Text style={styles.postPreviewContent} numberOfLines={3}>
                  {item.postContent}
                </Text>
              ) : null}
              {item.postImageUrl ? (
                <Image source={{ uri: item.postImageUrl }} style={styles.postPreviewImage} />
              ) : null}
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.deleteButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleDelete(item)}
              disabled={isProcessing}
              testID={`${reportedContentCopy.testIds.deleteButton}-${item.id}`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="delete" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>{reportedContentCopy.deleteButton}</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.markSafeButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleMarkSafe(item)}
              disabled={isProcessing}
              testID={`${reportedContentCopy.testIds.markSafeButton}-${item.id}`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color={theme.primary} />
                  <Text style={styles.markSafeButtonText}>{reportedContentCopy.markSafeButton}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      );
    },
    [handleDelete, handleMarkSafe, processingReportIds, styles, theme]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.onBackground} />
        </Pressable>
        <Text style={styles.headerTitle}>{reportedContentCopy.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
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
      gap: 16,
    },
    reportCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.outline,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    reportHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    reporterInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },
    reporterAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    reporterAvatarPlaceholder: {
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reporterText: {
      flex: 1,
    },
    reportedByText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onBackground,
    },
    reportDate: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
      marginTop: 2,
    },
    reportBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.errorContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reasonContainer: {
      marginBottom: 12,
    },
    reasonLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    reasonText: {
      fontSize: 14,
      fontWeight: '400',
      color: theme.onBackground,
      lineHeight: 20,
    },
    postPreview: {
      backgroundColor: theme.surfaceVariant,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    postPreviewLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.onSurfaceVariant,
      marginBottom: 8,
    },
    postPreviewContent: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.onBackground,
      lineHeight: 18,
      marginBottom: 8,
    },
    postPreviewImage: {
      width: '100%',
      height: 120,
      borderRadius: 8,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    deleteButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.error,
      borderRadius: 12,
      paddingVertical: 12,
      gap: 8,
      shadowColor: theme.error,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
    deleteButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
    },
    markSafeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.primary,
      paddingVertical: 12,
      gap: 8,
    },
    markSafeButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
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
