import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { guestCopy } from '../content/guestCopy';

type GuestGateScreenProps = {
  title: string;
  body: string;
  onSignIn: () => void;
  ctaLabel?: string;
};

export default function GuestGateScreen({ title, body, onSignIn, ctaLabel }: GuestGateScreenProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="lock" size={28} color={theme.onSurfaceVariant} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Pressable style={styles.cta} onPress={onSignIn} testID={guestCopy.testIds.gateCta}>
          <MaterialIcons name="login" size={18} color={theme.onPrimary} />
          <Text style={styles.ctaText}>{ctaLabel ?? guestCopy.restricted.cta}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 12,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.outline,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.onBackground,
      textAlign: 'center',
    },
    body: {
      fontSize: 13,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    ctaText: {
      color: theme.onPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
  });
