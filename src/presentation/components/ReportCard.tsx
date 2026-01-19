import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { PostReport } from '../../domain/models/postReport';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { reportedContentCopy } from '../content/reportedContentCopy';
import { formatTimeAgo } from '../i18n/formatters';

type ReportCardProps = {
  report: PostReport;
  onDelete: (report: PostReport) => void;
  onMarkSafe: (report: PostReport) => void;
  isProcessing: boolean;
};

const ReportCard = ({ report, onDelete, onMarkSafe, isProcessing }: ReportCardProps) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reporterInfo}>
          {report.userPhotoUrl ? (
            <Image source={{ uri: report.userPhotoUrl }} style={styles.reporterAvatar} />
          ) : (
            <View style={[styles.reporterAvatar, styles.reporterAvatarPlaceholder]}>
              <MaterialIcons name="person" size={16} color={theme.onSurfaceVariant} />
            </View>
          )}
          <View style={styles.reporterText}>
            <Text style={styles.reportedByText}>
              {reportedContentCopy.reportedBy(report.userName ?? 'Unknown User')}
            </Text>
            <Text style={styles.reportDate}>{formatTimeAgo(report.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.reportBadge}>
          <MaterialIcons name="flag" size={16} color={theme.error} />
        </View>
      </View>

      <View style={styles.reasonContainer}>
        <Text style={styles.reasonLabel}>{reportedContentCopy.reason}</Text>
        <Text style={styles.reasonText}>{report.reason}</Text>
      </View>

      {report.postContent || report.postImageUrl ? (
        <View style={styles.postPreview}>
          <Text style={styles.postPreviewLabel}>Reported Post:</Text>
          {report.postContent ? (
            <Text style={styles.postPreviewContent} numberOfLines={3}>
              {report.postContent}
            </Text>
          ) : null}
          {report.postImageUrl ? (
            <Image source={{ uri: report.postImageUrl }} style={styles.postPreviewImage} />
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.deleteButton, isProcessing && styles.buttonDisabled]}
          onPress={() => onDelete(report)}
          disabled={isProcessing}
          testID={`${reportedContentCopy.testIds.deleteButton}-${report.id}`}
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
          onPress={() => onMarkSafe(report)}
          disabled={isProcessing}
          testID={`${reportedContentCopy.testIds.markSafeButton}-${report.id}`}
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
};

export default React.memo(ReportCard);

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    reportCard: {
      backgroundColor: theme.surface,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    reportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    reporterInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    reporterAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
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
      fontSize: 15,
      fontWeight: '600',
      color: theme.onSurface,
      marginBottom: 2,
    },
    reportDate: {
      fontSize: 13,
      color: theme.onSurfaceVariant,
    },
    reportBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.errorContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },
    reasonContainer: {
      marginBottom: 12,
    },
    reasonLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
      marginBottom: 4,
    },
    reasonText: {
      fontSize: 15,
      color: theme.onSurface,
      lineHeight: 20,
    },
    postPreview: {
      backgroundColor: theme.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    postPreviewLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
      marginBottom: 8,
    },
    postPreviewContent: {
      fontSize: 14,
      color: theme.onSurface,
      lineHeight: 20,
      marginBottom: 8,
    },
    postPreviewImage: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      resizeMode: 'cover',
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
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    markSafeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryContainer,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    deleteButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
    markSafeButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.primary,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });
