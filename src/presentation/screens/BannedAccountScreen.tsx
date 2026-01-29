import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { supabase } from '../../data/supabase/client';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import { useLocalization } from '../../app/providers/LocalizationProvider';
import type { ThemeColors } from '../theme/colors';
import { bannedAccountCopy } from '../content/bannedAccountCopy';

export default function BannedAccountScreen() {
  const theme = useThemeColors();
  useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.card}>
        <MaterialIcons name="block" size={48} color={theme.error} />
        <Text style={styles.title}>{bannedAccountCopy.title}</Text>
        <Text style={styles.message}>{bannedAccountCopy.message}</Text>
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            supabase.auth.signOut();
          }}
          testID={bannedAccountCopy.testIds.action}
        >
          <Text style={styles.actionText}>{bannedAccountCopy.action}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.outline,
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.onSurface,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
    },
    actionButton: {
      width: '100%',
      backgroundColor: theme.error,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    actionText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.onError,
    },
  });
