import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import { colors } from '../theme/colors';

const emailRegex = /\S+@\S+\.\S+/;

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter your name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter your email address.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    if (!password) {
      Alert.alert('Password required', 'Enter a password.');
      return;
    }
    if (!confirm) {
      Alert.alert('Confirm password', 'Enter your password again.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Make sure both passwords match.');
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      setLoading(false);
      Alert.alert('Offline', 'Connect to the internet to create your account.');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    if (error) {
      Alert.alert('Registration failed', error.message);
    } else {
      Alert.alert('Check your email', 'Confirm your email to finish creating your account.');
      navigation.goBack();
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="keyboard-arrow-left" size={24} color={colors.black} />
      </Pressable>
      <View style={styles.container}>
        <Text style={styles.title}>Create your account</Text>
        <TextInput
          style={[styles.input, styles.firstInput]}
          placeholder="name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          testID="register-name"
          accessibilityLabel="register-name"
        />
        <TextInput
          style={[styles.input, styles.inputSpacing]}
          placeholder="e-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          testID="register-email"
          accessibilityLabel="register-email"
        />
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.inputSpacing, styles.passwordInput]}
            placeholder="password"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
            testID="register-password"
            accessibilityLabel="register-password"
          />
          <Pressable style={styles.passwordToggle} onPress={() => setPasswordVisible((prev) => !prev)}>
            <MaterialIcons
              name={passwordVisible ? 'visibility-off' : 'visibility'}
              size={18}
              color={colors.darkGrey}
            />
          </Pressable>
        </View>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.inputSpacing, styles.passwordInput]}
            placeholder="password again"
            secureTextEntry={!confirmVisible}
            value={confirm}
            onChangeText={setConfirm}
            testID="register-confirm"
            accessibilityLabel="register-confirm"
          />
          <Pressable style={styles.passwordToggle} onPress={() => setConfirmVisible((prev) => !prev)}>
            <MaterialIcons
              name={confirmVisible ? 'visibility-off' : 'visibility'}
              size={18}
              color={colors.darkGrey}
            />
          </Pressable>
        </View>
        <Pressable
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={submit}
          disabled={loading}
          testID="register-submit"
          accessibilityLabel="register-submit"
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Registering...' : 'Register'}</Text>
        </Pressable>
        <Text style={styles.orText}>or</Text>
        <Pressable style={styles.googleButton}>
          <MaterialCommunityIcons name="google" size={20} color={colors.darkGrey} />
          <Text style={styles.googleText}>Sign in with Google</Text>
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
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 24,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 55,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGrey,
    paddingHorizontal: 15,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  firstInput: {
    marginTop: 8,
  },
  inputSpacing: {
    marginTop: 16,
  },
  passwordInput: {
    paddingRight: 36,
  },
  passwordToggle: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  primaryButton: {
    height: 65,
    backgroundColor: colors.mainBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderRadius: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  orText: {
    marginTop: 16,
    textAlign: 'center',
  },
  googleButton: {
    marginTop: 8,
    height: 65,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderRadius: 4,
    marginHorizontal: 32,
  },
  googleText: {
    fontSize: 16,
  },
});
