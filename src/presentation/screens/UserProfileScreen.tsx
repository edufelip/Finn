import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

export default function UserProfileScreen() {
  const theme = useThemeColors();
  const styles = createStyles(theme);

  // Placeholder blank screen per request.
  return <SafeAreaView style={styles.container} />;
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
  });
