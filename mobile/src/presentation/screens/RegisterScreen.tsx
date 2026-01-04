import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import { colors } from '../theme/colors';
import { registerCopy } from '../content/registerCopy';

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
      Alert.alert(registerCopy.alerts.nameRequired.title, registerCopy.alerts.nameRequired.message);
      return;
    }
    if (!email.trim()) {
      Alert.alert(registerCopy.alerts.emailRequired.title, registerCopy.alerts.emailRequired.message);
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert(registerCopy.alerts.invalidEmail.title, registerCopy.alerts.invalidEmail.message);
      return;
    }
    if (!password) {
      Alert.alert(registerCopy.alerts.passwordRequired.title, registerCopy.alerts.passwordRequired.message);
      return;
    }
    if (!confirm) {
      Alert.alert(registerCopy.alerts.confirmRequired.title, registerCopy.alerts.confirmRequired.message);
      return;
    }
    if (password !== confirm) {
      Alert.alert(registerCopy.alerts.mismatch.title, registerCopy.alerts.mismatch.message);
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      setLoading(false);
      Alert.alert(registerCopy.alerts.offline.title, registerCopy.alerts.offline.message);
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
      Alert.alert(registerCopy.alerts.failed.title, error.message);
    } else {
      Alert.alert(registerCopy.alerts.checkEmail.title, registerCopy.alerts.checkEmail.message);
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
        <Text style={styles.title}>{registerCopy.title}</Text>
        <TextInput
          style={[styles.input, styles.firstInput]}
          placeholder={registerCopy.placeholders.name}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          testID={registerCopy.testIds.name}
          accessibilityLabel={registerCopy.testIds.name}
        />
        <TextInput
          style={[styles.input, styles.inputSpacing]}
          placeholder={registerCopy.placeholders.email}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          testID={registerCopy.testIds.email}
          accessibilityLabel={registerCopy.testIds.email}
        />
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.inputSpacing, styles.passwordInput]}
            placeholder={registerCopy.placeholders.password}
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
            testID={registerCopy.testIds.password}
            accessibilityLabel={registerCopy.testIds.password}
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
            placeholder={registerCopy.placeholders.confirm}
            secureTextEntry={!confirmVisible}
            value={confirm}
            onChangeText={setConfirm}
            testID={registerCopy.testIds.confirm}
            accessibilityLabel={registerCopy.testIds.confirm}
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
          testID={registerCopy.testIds.submit}
          accessibilityLabel={registerCopy.testIds.submit}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? registerCopy.submitLoading : registerCopy.submit}
          </Text>
        </Pressable>
        <Text style={styles.orText}>{registerCopy.or}</Text>
        <Pressable style={styles.googleButton}>
          <MaterialCommunityIcons name="google" size={20} color={colors.darkGrey} />
          <Text style={styles.googleText}>{registerCopy.google}</Text>
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
    borderColor: colors.borderLight,
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
