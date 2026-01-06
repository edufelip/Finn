import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

type DividerProps = {
  height?: number;
};

export default function Divider({ height = 2 }: DividerProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <LinearGradient
      colors={[theme.outlineVariant, theme.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.divider, { height }]}
    />
  );
}

const createStyles = (_theme: ThemeColors) =>
  StyleSheet.create({
    divider: {
      width: '100%',
    },
  });
