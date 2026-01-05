import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import Divider from '../components/Divider';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { notificationsCopy } from '../content/notificationsCopy';

export default function NotificationsScreen() {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{notificationsCopy.title}</Text>
        <Divider />
      </View>
      <View style={styles.body}>
        <MaterialIcons name="settings" size={40} color={theme.iconMuted} />
        <Text style={styles.bodyText}>{notificationsCopy.body}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundLight,
    },
    header: {
      height: 60,
      justifyContent: 'flex-end',
      paddingLeft: 16,
      paddingBottom: 8,
      backgroundColor: theme.backgroundLight,
    },
    headerText: {
      fontSize: 16,
      color: theme.textPrimary,
    },
    body: {
      flex: 1,
      backgroundColor: theme.backgroundLight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    bodyText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
  });
