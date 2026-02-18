import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { forgotPasswordCopy } from '../content/forgotPasswordCopy';
import { useLocalization } from '../../app/providers/LocalizationProvider';

const emailRegex = /\S+@\S+\.\S+/;

export default function ForgotPasswordScreen() {
  useLocalization();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const submit = async () => {
    if (!email.trim()) {
      Alert.alert(forgotPasswordCopy.alerts.emailRequired.title, forgotPasswordCopy.alerts.emailRequired.message);
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert(forgotPasswordCopy.alerts.invalidEmail.title, forgotPasswordCopy.alerts.invalidEmail.message);
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      setLoading(false);
      Alert.alert(forgotPasswordCopy.alerts.offline.title, forgotPasswordCopy.alerts.offline.message);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      Alert.alert(forgotPasswordCopy.alerts.failed.title, error.message);
    } else {
      Alert.alert(forgotPasswordCopy.alerts.success.title, forgotPasswordCopy.alerts.success.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="keyboard-arrow-left" size={24} color={theme.onBackground} />
      </Pressable>
      <View style={styles.container}>
        <Text style={styles.title}>{forgotPasswordCopy.title}</Text>
        <Text style={styles.subtitle}>{forgotPasswordCopy.subtitle}</Text>
        <View style={styles.inputRow}>
          <MaterialIcons name="person-outline" size={20} color={theme.onSurfaceVariant} />
          <TextInput
            style={styles.input}
            placeholder={forgotPasswordCopy.emailPlaceholder}
            placeholderTextColor={theme.onSurfaceVariant}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            testID={forgotPasswordCopy.testIds.email}
            accessibilityLabel={forgotPasswordCopy.testIds.email}
          />
        </View>
        <Pressable
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={submit}
          disabled={loading}
          testID={forgotPasswordCopy.testIds.submit}
          accessibilityLabel={forgotPasswordCopy.testIds.submit}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? forgotPasswordCopy.submitLoading : forgotPasswordCopy.submit}
          </Text>
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
    backButton: {
      position: 'absolute',
      left: 32,
      top: 32,
      padding: 8,
      zIndex: 2,
    },
    container: {
      flex: 1,
      paddingHorizontal: 32,
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
      color: theme.onBackground,
    },
    subtitle: {
      fontSize: 18,
      color: theme.onSurfaceVariant,
    },
    inputRow: {
      marginTop: 24,
      height: 55,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.outline,
      paddingHorizontal: 12,
      backgroundColor: theme.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    input: {
      flex: 1,
      height: '100%',
      color: theme.onSurface,
    },
    primaryButton: {
      height: 56,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      borderRadius: 16,
      shadowColor: theme.surfaceTint,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: theme.onPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
  });
