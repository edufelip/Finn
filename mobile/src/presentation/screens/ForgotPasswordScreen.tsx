import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import { colors } from '../theme/colors';

const emailRegex = /\S+@\S+\.\S+/;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter your email address.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      setLoading(false);
      Alert.alert('Offline', 'Connect to the internet to reset your password.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      Alert.alert('Reset failed', error.message);
    } else {
      Alert.alert('Check your email', 'We sent a password reset link.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="keyboard-arrow-left" size={24} color={colors.black} />
      </Pressable>
      <View style={styles.container}>
        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>Confirm your email and we will send the instructions</Text>
        <View style={styles.inputRow}>
          <MaterialIcons name="person-outline" size={20} color={colors.darkGrey} />
          <TextInput
            style={styles.input}
            placeholder="e-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            testID="forgot-email"
            accessibilityLabel="forgot-email"
          />
        </View>
        <Pressable
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={submit}
          disabled={loading}
          testID="forgot-submit"
          accessibilityLabel="forgot-submit"
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
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
  },
  subtitle: {
    fontSize: 18,
  },
  inputRow: {
    marginTop: 24,
    height: 55,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGrey,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  primaryButton: {
    height: 65,
    backgroundColor: colors.mainBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 64,
    borderRadius: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
  },
});
