import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Network from 'expo-network';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import env from '../../config/env';
import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import { colors } from '../theme/colors';

WebBrowser.maybeCompleteAuthSession();

const emailRegex = /\S+@\S+\.\S+/;

export default function AuthScreen() {
  const navigation = useNavigation();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: env.googleIosClientId || undefined,
    androidClientId: env.googleAndroidClientId || undefined,
    webClientId: env.googleWebClientId || undefined,
    redirectUri: makeRedirectUri({
      scheme: 'finn',
      path: 'auth/callback',
    }),
  });

  const googleReady = useMemo(
    () => Boolean(env.googleIosClientId || env.googleAndroidClientId || env.googleWebClientId),
    []
  );

  useEffect(() => {
    let mounted = true;
    AppleAuthentication.isAvailableAsync().then((available) => {
      if (mounted) {
        setAppleAvailable(available);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (response?.type !== 'success') return;
    if (!response.authentication?.idToken) {
      Alert.alert('Google sign-in failed', 'Missing identity token.');
      return;
    }

    supabase.auth
      .signInWithIdToken({
        provider: 'google',
        token: response.authentication.idToken,
      })
      .catch((error) => {
        Alert.alert('Google sign-in failed', error.message);
      });
  }, [response]);

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter your email address.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    if (!password) {
      Alert.alert('Password required', 'Enter your password.');
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      setLoading(false);
      Alert.alert('Offline', 'Connect to the internet to sign in.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      Alert.alert('Sign in failed', error.message);
    }
    setLoading(false);
  };

  const handleAppleSignIn = async () => {
    if (!appleAvailable) {
      Alert.alert('Apple Sign In unavailable', 'Apple Sign In is not available on this device.');
      return;
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert('Apple sign-in failed', 'Missing identity token.');
        return;
      }

      await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.nonce ?? undefined,
      });
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Apple sign-in failed', error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome,</Text>
        <Text style={styles.subtitle}>Sign in if you have an account!</Text>
        <TextInput
          style={[styles.input, emailFocused && styles.inputFocused]}
          placeholder="e-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          testID="auth-email"
          accessibilityLabel="auth-email"
        />
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.passwordInput, passwordFocused && styles.inputFocused]}
            placeholder="password"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            testID="auth-password"
            accessibilityLabel="auth-password"
          />
          <Pressable
            style={styles.passwordToggle}
            onPress={() => setPasswordVisible((prev) => !prev)}
            accessibilityLabel="toggle-password"
          >
            <MaterialIcons
              name={passwordVisible ? 'visibility-off' : 'visibility'}
              size={18}
              color={colors.darkGrey}
            />
          </Pressable>
        </View>
        <Pressable
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleEmailSignIn}
          disabled={loading}
          testID="auth-signin"
          accessibilityLabel="auth-signin"
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Login...' : 'Login'}</Text>
        </Pressable>
        <View style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot your password?</Text>
          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            testID="auth-forgot"
            accessibilityLabel="auth-forgot"
          >
            <Text style={styles.forgotLink}>Click here</Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.googleButton, (!request || !googleReady) && styles.googleButtonDisabled]}
          onPress={() => promptAsync()}
          disabled={!request || !googleReady}
        >
          <MaterialCommunityIcons name="google" size={20} color={colors.darkGrey} />
          <Text style={styles.googleText}>Sign in with Google</Text>
        </Pressable>
        {appleAvailable ? (
          <Pressable style={styles.appleButton} onPress={handleAppleSignIn}>
            <MaterialCommunityIcons name="apple" size={20} color={colors.white} />
            <Text style={styles.appleText}>Continue with Apple</Text>
          </Pressable>
        ) : null}
        <Text style={styles.signupPrompt}>Don't have an account?</Text>
        <Pressable
          onPress={() => navigation.navigate('Register')}
          testID="auth-register"
          accessibilityLabel="auth-register"
        >
          <Text style={styles.signupLink}>Sign up here</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 45,
    fontWeight: '700',
    color: colors.black,
  },
  subtitle: {
    fontSize: 20,
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
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: colors.mainBlue,
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
    marginTop: 12,
    borderRadius: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 14,
  },
  forgotLink: {
    fontSize: 14,
    color: colors.linkBlue,
  },
  googleButton: {
    marginTop: 16,
    height: 65,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderRadius: 4,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleText: {
    fontSize: 16,
  },
  appleButton: {
    marginTop: 8,
    height: 65,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderRadius: 4,
  },
  appleText: {
    color: colors.white,
    fontSize: 16,
  },
  signupPrompt: {
    marginTop: 16,
    fontSize: 18,
    textAlign: 'center',
  },
  signupLink: {
    fontSize: 19,
    textAlign: 'center',
    color: colors.black,
  },
});
