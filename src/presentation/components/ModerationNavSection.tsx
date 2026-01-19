import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { editCommunityCopy } from '../content/editCommunityCopy';

type ModerationScreen = 'PendingContent' | 'ReportedContent' | 'ModerationLogs' | 'ManageModerators';

type ModerationNavSectionProps = {
  onNavigate: (screen: ModerationScreen) => void;
};

type ModerationButtonProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  testID: string;
  theme: ThemeColors;
};

const ModerationButton = React.memo<ModerationButtonProps>(
  ({ icon, label, onPress, testID, theme }) => {
    const styles = useMemo(() => createButtonStyles(theme), [theme]);

    return (
      <Pressable style={styles.moderationButton} onPress={onPress} testID={testID}>
        <MaterialIcons name={icon} size={24} color={theme.primary} />
        <Text style={styles.moderationButtonText}>{label}</Text>
        <MaterialIcons name="chevron-right" size={20} color={theme.onSurfaceVariant} />
      </Pressable>
    );
  }
);

ModerationButton.displayName = 'ModerationButton';

const ModerationNavSection = ({ onNavigate }: ModerationNavSectionProps) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{editCommunityCopy.moderationSection}</Text>
      <View style={styles.moderationButtons}>
        <ModerationButton
          icon="pending-actions"
          label={editCommunityCopy.pendingContentButton}
          onPress={() => onNavigate('PendingContent')}
          testID={editCommunityCopy.testIds.pendingContentButton}
          theme={theme}
        />
        <ModerationButton
          icon="flag"
          label={editCommunityCopy.reportedContentButton}
          onPress={() => onNavigate('ReportedContent')}
          testID={editCommunityCopy.testIds.reportedContentButton}
          theme={theme}
        />
        <ModerationButton
          icon="history"
          label={editCommunityCopy.moderationLogsButton}
          onPress={() => onNavigate('ModerationLogs')}
          testID={editCommunityCopy.testIds.moderationLogsButton}
          theme={theme}
        />
        <ModerationButton
          icon="manage-accounts"
          label={editCommunityCopy.manageModeratorsButton}
          onPress={() => onNavigate('ManageModerators')}
          testID={editCommunityCopy.testIds.manageModeratorsButton}
          theme={theme}
        />
      </View>
    </View>
  );
};

export default React.memo(ModerationNavSection);

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
      marginBottom: 12,
      marginHorizontal: 16,
    },
    moderationButtons: {
      marginHorizontal: 16,
      gap: 8,
    },
  });

const createButtonStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    moderationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
      gap: 12,
    },
    moderationButtonText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: theme.onSurface,
    },
  });
