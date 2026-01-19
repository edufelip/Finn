import React, { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

export default function PostSkeleton() {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const opacity = useMemo(() => new Animated.Value(0.3), []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { opacity, backgroundColor: theme.surfaceVariant }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.title, { opacity, backgroundColor: theme.surfaceVariant }]} />
          <Animated.View style={[styles.subtitle, { opacity, backgroundColor: theme.surfaceVariant }]} />
        </View>
      </View>
      <Animated.View style={[styles.content, { opacity, backgroundColor: theme.surfaceVariant }]} />
      <Animated.View style={[styles.image, { opacity, backgroundColor: theme.surfaceVariant }]} />
      <View style={styles.footer}>
        <Animated.View style={[styles.action, { opacity, backgroundColor: theme.surfaceVariant }]} />
        <Animated.View style={[styles.action, { opacity, backgroundColor: theme.surfaceVariant }]} />
        <Animated.View style={[styles.action, { opacity, backgroundColor: theme.surfaceVariant }]} />
      </View>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    headerText: {
      gap: 6,
    },
    title: {
      width: 120,
      height: 14,
      borderRadius: 4,
    },
    subtitle: {
      width: 80,
      height: 12,
      borderRadius: 4,
    },
    content: {
      width: '100%',
      height: 16,
      borderRadius: 4,
      marginBottom: 8,
    },
    image: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 16,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
    },
    action: {
      width: 60,
      height: 24,
      borderRadius: 12,
    },
  });
