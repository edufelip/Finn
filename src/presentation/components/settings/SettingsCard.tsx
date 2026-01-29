import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useThemeColors } from '../../../app/providers/ThemeProvider';
import type { ThemeColors } from '../../theme/colors';

type SettingsCardProps = ViewProps;

export function SettingsCard({ children, style, ...rest }: SettingsCardProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
      shadowColor: theme.shadow,
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
      overflow: 'hidden',
    },
  });
