import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { guestCopy } from '../content/guestCopy';

type GuestBannerProps = {
  onSignIn: () => void;
};

export default function GuestBanner({ onSignIn }: GuestBannerProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{guestCopy.banner.title}</Text>
        <Text style={styles.body}>{guestCopy.banner.body}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={onSignIn}
        testID={guestCopy.testIds.bannerCta}
        accessibilityLabel={guestCopy.testIds.bannerCta}
      >
        <MaterialIcons name="login" size={16} color={theme.onPrimary} />
        <Text style={styles.ctaText}>{guestCopy.banner.cta}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.primaryContainer,
      borderWidth: 1,
      borderColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    textBlock: {
      flex: 1,
    },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.onPrimaryContainer,
      marginBottom: 4,
    },
    body: {
      fontSize: 12,
      color: theme.onPrimaryContainer,
      opacity: 0.9,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    ctaPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    ctaText: {
      color: theme.onPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
  });
