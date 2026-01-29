import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColors } from '../../../app/providers/ThemeProvider';
import type { ThemeColors } from '../../theme/colors';

type SettingsRowTone = 'default' | 'danger';

type SettingsRowProps = {
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  right?: React.ReactNode;
  divider?: boolean;
  disabled?: boolean;
  tone?: SettingsRowTone;
  iconColor?: string;
  iconBackgroundColor?: string;
  labelColor?: string;
  iconSize?: number;
  chevron?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

export function SettingsRow({
  label,
  iconName,
  onPress,
  right,
  divider = false,
  disabled = false,
  tone = 'default',
  iconColor,
  iconBackgroundColor,
  labelColor,
  iconSize = 20,
  chevron = false,
  testID,
  accessibilityLabel,
}: SettingsRowProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDanger = tone === 'danger';
  const resolvedIconColor = iconColor ?? (isDanger ? theme.error : theme.onSurfaceVariant);
  const resolvedIconBackground = iconBackgroundColor ?? (isDanger ? theme.errorContainer : theme.surfaceVariant);
  const resolvedLabelColor = labelColor ?? (isDanger ? theme.error : theme.onSurface);
  const rightContent = right ?? (chevron
    ? <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />
    : null
  );

  const content = (
    <>
      <View style={styles.rowLeft}>
        <View style={[styles.iconCircle, { backgroundColor: resolvedIconBackground }]}>
          <MaterialIcons name={iconName} size={iconSize} color={resolvedIconColor} />
        </View>
        <Text style={[styles.rowText, { color: resolvedLabelColor }]}>{label}</Text>
      </View>
      {rightContent ? <View style={styles.rowRight}>{rightContent}</View> : null}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[styles.row, divider && styles.rowDivider, disabled && styles.rowDisabled]}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        disabled && styles.rowDisabled,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: theme.outlineVariant,
    },
    rowPressed: {
      backgroundColor: theme.surfaceVariant,
    },
    rowDisabled: {
      opacity: 0.6,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      paddingRight: 12,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceVariant,
    },
    rowText: {
      fontSize: 15,
      color: theme.onSurface,
      fontWeight: '500',
    },
  });
