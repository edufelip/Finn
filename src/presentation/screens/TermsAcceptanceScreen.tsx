import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { termsAcceptanceCopy } from '../content/termsAcceptanceCopy';
import { links } from '../../config/links';
import { TERMS_VERSION } from '../../config/appConfig';
import { useUserStore } from '../../app/store/userStore';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function TermsAcceptanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();
  const { users: userRepository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const openTerms = () => {
    navigation.navigate('WebView', {
      title: termsAcceptanceCopy.linkLabel,
      url: links.termsOfService,
    });
  };

  const handleAccept = async () => {
    if (!session?.user?.id || !accepted) {
      return;
    }
    setSaving(true);
    try {
      const updated = await userRepository.acceptTerms(session.user.id, TERMS_VERSION);
      useUserStore.getState().setUser(updated);
    } catch {
      Alert.alert(termsAcceptanceCopy.alerts.failed.title, termsAcceptanceCopy.alerts.failed.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.card}>
        <MaterialIcons name="policy" size={48} color={theme.primary} />
        <Text style={styles.title}>{termsAcceptanceCopy.title}</Text>
        <Text style={styles.description}>{termsAcceptanceCopy.description}</Text>

        <Pressable style={styles.link} onPress={openTerms} testID={termsAcceptanceCopy.testIds.link}>
          <MaterialIcons name="open-in-new" size={18} color={theme.primary} />
          <Text style={styles.linkText}>{termsAcceptanceCopy.linkLabel}</Text>
        </Pressable>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setAccepted((prev) => !prev)}
          testID={termsAcceptanceCopy.testIds.checkbox}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted ? <MaterialIcons name="check" size={16} color={theme.onPrimary} /> : null}
          </View>
          <Text style={styles.checkboxLabel}>{termsAcceptanceCopy.checkboxLabel}</Text>
        </Pressable>

        <Pressable
          style={[styles.acceptButton, (!accepted || saving) && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={!accepted || saving}
          testID={termsAcceptanceCopy.testIds.accept}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.onPrimary} />
          ) : (
            <Text style={styles.acceptButtonText}>{termsAcceptanceCopy.acceptButton}</Text>
          )}
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
    description: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
    },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    linkText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.outline,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    checkboxChecked: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 14,
      color: theme.onSurface,
    },
    acceptButton: {
      width: '100%',
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    acceptButtonDisabled: {
      opacity: 0.5,
    },
    acceptButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.onPrimary,
    },
  });
