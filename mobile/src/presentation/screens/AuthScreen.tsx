import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Network from 'expo-network';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import env from '../../config/env';
import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import { useAuth } from '../../app/providers/AuthProvider';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { palette } from '../theme/palette';
import { authCopy } from '../content/authCopy';
import type { AuthStackParamList } from '../navigation/AuthStack';

WebBrowser.maybeCompleteAuthSession();

const emailRegex = /\S+@\S+\.\S+/;

const GoogleLogo = ({ size = 20 }: { size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill={palette.googleRed}
        d="M24 9.5c3.54 0 6.71 1.22 9.22 3.6l6.9-6.9C35.9 2.4 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.34 6.48C12.5 13.04 17.76 9.5 24 9.5z"
      />
      <Path
        fill={palette.googleBlue}
        d="M46.1 24.5c0-1.54-.14-3.02-.4-4.5H24v9h12.5c-.54 2.9-2.1 5.36-4.44 7.04l6.8 5.3C43.98 37.36 46.1 31.47 46.1 24.5z"
      />
      <Path
        fill={palette.googleYellow}
        d="M10.9 28.7c-.48-1.44-.76-2.97-.76-4.7s.27-3.26.76-4.7L2.56 12.82C.92 16.06 0 19.79 0 24c0 4.21.92 7.94 2.56 11.18l8.34-6.48z"
      />
      <Path
        fill={palette.googleGreen}
        d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-6.8-5.3c-1.9 1.28-4.34 2.04-9.1 2.04-6.24 0-11.5-3.54-13.1-8.74l-8.34 6.48C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
};

export default function AuthScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { enterGuest } = useAuth();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Use dynamic scheme from Expo config to support both dev (finn-dev) and prod (finn) environments
  const configScheme = Constants.expoConfig?.scheme;
  const appScheme = Array.isArray(configScheme) ? configScheme[0] : configScheme ?? 'finn';

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: env.googleIosClientId || undefined,
    androidClientId: env.googleAndroidClientId || undefined,
    webClientId: env.googleWebClientId || undefined,
    redirectUri: makeRedirectUri({
      scheme: appScheme,
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
    if (!response) return;
    if (response.type !== 'success') {
      setLoading(false);
      return;
    }
    if (!response.authentication?.idToken) {
      Alert.alert(authCopy.alerts.googleFailed.title, authCopy.alerts.googleFailed.missingToken);
      setLoading(false);
      return;
    }

    let mounted = true;
    const signIn = async () => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.authentication?.idToken ?? '',
        });
        if (error) {
          Alert.alert(authCopy.alerts.googleFailed.title, error.message);
        }
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert(authCopy.alerts.googleFailed.title, error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    signIn();
    return () => {
      mounted = false;
    };
  }, [response]);

  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      Alert.alert(authCopy.alerts.emailRequired.title, authCopy.alerts.emailRequired.message);
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert(authCopy.alerts.invalidEmail.title, authCopy.alerts.invalidEmail.message);
      return;
    }
    if (!password) {
      Alert.alert(authCopy.alerts.passwordRequired.title, authCopy.alerts.passwordRequired.message);
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      setLoading(false);
      Alert.alert(authCopy.alerts.offline.title, authCopy.alerts.offline.message);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      Alert.alert(authCopy.alerts.signInFailed.title, error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!request || !googleReady || loading) return;
    try {
      setLoading(true);
      const result = await promptAsync();
      if (result.type !== 'success') {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      if (error instanceof Error) {
        Alert.alert(authCopy.alerts.googleFailed.title, error.message);
      }
    }
  };

  const handleAppleSignIn = async () => {
    if (!appleAvailable) {
      Alert.alert(authCopy.alerts.appleUnavailable.title, authCopy.alerts.appleUnavailable.message);
      return;
    }

    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert(authCopy.alerts.appleFailed.title, authCopy.alerts.appleFailed.missingToken);
        return;
      }

      await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(authCopy.alerts.appleFailed.title, error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{authCopy.heading}</Text>
          <Text style={styles.subtitle}>{authCopy.subheading}</Text>
        </View>
        <View style={styles.inputStack}>
          <View style={[styles.inputGroup, emailFocused && styles.inputGroupFocused]}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={theme.onSurfaceVariant}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={authCopy.emailPlaceholder}
              placeholderTextColor={theme.onSurfaceVariant}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              testID={authCopy.testIds.email}
              accessibilityLabel={authCopy.testIds.email}
            />
          </View>
          <View style={[styles.inputGroup, passwordFocused && styles.inputGroupFocused]}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={20}
              color={theme.onSurfaceVariant}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={authCopy.passwordPlaceholder}
              placeholderTextColor={theme.onSurfaceVariant}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              testID={authCopy.testIds.password}
              accessibilityLabel={authCopy.testIds.password}
            />
            <Pressable
              style={styles.passwordToggle}
              onPress={() => setPasswordVisible((prev) => !prev)}
              accessibilityLabel={authCopy.testIds.togglePassword}
            >
              <MaterialIcons
                name={passwordVisible ? 'visibility-off' : 'visibility'}
                size={18}
                color={theme.onSurfaceVariant}
              />
            </Pressable>
          </View>
        </View>
        <Pressable
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleEmailSignIn}
          disabled={loading}
          testID={authCopy.testIds.signin}
          accessibilityLabel={authCopy.testIds.signin}
        >
          <Text style={styles.primaryButtonText}>{authCopy.login}</Text>
        </Pressable>
        <View style={styles.forgotRow}>
          <Text style={styles.forgotText}>{authCopy.forgotPrompt}</Text>
          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            testID={authCopy.testIds.forgot}
            accessibilityLabel={authCopy.testIds.forgot}
          >
            <Text style={styles.forgotLink}>{authCopy.forgotAction}</Text>
          </Pressable>
        </View>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{authCopy.divider}</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.socialStack}>
          <Pressable
            style={[
              styles.socialButton,
              styles.googleButton,
              (!request || !googleReady || loading) && styles.socialButtonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={!request || !googleReady || loading}
          >
            <GoogleLogo size={20} />
            <Text style={styles.googleText}>{authCopy.google}</Text>
          </Pressable>
          {appleAvailable ? (
            <Pressable
              style={[styles.socialButton, styles.appleButton, loading && styles.socialButtonDisabled]}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <MaterialCommunityIcons name="apple" size={20} color={palette.white} />
              <Text style={styles.appleText}>{authCopy.apple}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>{authCopy.signupPrompt}</Text>
          <Pressable
            onPress={() => navigation.navigate('Register')}
            testID={authCopy.testIds.register}
            accessibilityLabel={authCopy.testIds.register}
          >
            <Text style={styles.signupLink}>{authCopy.signupAction}</Text>
          </Pressable>
        </View>
        <View style={styles.guestRow}>
          <Pressable
            style={({ pressed }) => [styles.guestButton, pressed && styles.guestButtonPressed]}
            onPress={() => {
              void enterGuest();
            }}
            testID={authCopy.testIds.guest}
            accessibilityLabel={authCopy.testIds.guest}
          >
            <Text style={styles.guestText}>{authCopy.guestCta}</Text>
          </Pressable>
          <Text style={styles.guestHint}>{authCopy.guestHint}</Text>
        </View>
      </View>
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : null}
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
      paddingHorizontal: 24,
      paddingVertical: 24,
      justifyContent: 'center',
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 34,
      fontWeight: '800',
      color: theme.onBackground,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 18,
      color: theme.onSurfaceVariant,
      fontWeight: '500',
      marginTop: 6,
    },
    inputStack: {
      marginBottom: 16,
    },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceVariant,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    inputGroupFocused: {
      borderColor: theme.primary,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.onSurface,
    },
    passwordToggle: {
      paddingVertical: 6,
      paddingHorizontal: 6,
    },
    primaryButton: {
      height: 56,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
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
    forgotRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
    },
    forgotText: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
    },
    forgotLink: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
      marginLeft: 6,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 26,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.outline,
    },
    dividerText: {
      fontSize: 13,
      color: theme.onSurfaceVariant,
      fontWeight: '600',
      paddingHorizontal: 12,
    },
    socialStack: {
      gap: 10,
    },
    socialButton: {
      height: 54,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    socialButtonDisabled: {
      opacity: 0.6,
    },
    googleButton: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    googleText: {
      marginLeft: 10,
      fontSize: 15,
      fontWeight: '600',
      color: theme.onSurface,
    },
    appleButton: {
      backgroundColor: palette.appleBlack,
    },
    appleText: {
      marginLeft: 10,
      color: palette.white,
      fontSize: 15,
      fontWeight: '600',
    },
    signupRow: {
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signupPrompt: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
    },
    signupLink: {
      marginLeft: 6,
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
    },
    guestRow: {
      marginTop: 24,
      alignItems: 'center',
      gap: 8,
    },
    guestButton: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.outline,
      backgroundColor: theme.surface,
    },
    guestButtonPressed: {
      opacity: 0.85,
    },
    guestText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.onSurface,
    },
    guestHint: {
      fontSize: 12,
      textAlign: 'center',
      color: theme.onSurfaceVariant,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.scrim,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
