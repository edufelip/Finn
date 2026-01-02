import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as Network from 'expo-network';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import TopBar from '../components/TopBar';
import { colors } from '../theme/colors';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { users: userRepository } = useRepositories();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const showUnavailable = () => {
    Alert.alert('Not available', 'This setting is not available yet.');
  };

  const handleDelete = () => {
    Alert.alert('Delete account', 'Are you sure you want to delete your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!session?.user?.id) {
            Alert.alert('Sign in required', 'Please sign in again.');
            return;
          }
          setLoading(true);
          const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
          if (!status.isConnected) {
            setLoading(false);
            Alert.alert('Offline', 'Connect to the internet to delete your account.');
            return;
          }
          try {
            await userRepository.deleteUser(session.user.id);
            await supabase.auth.signOut();
            Alert.alert('Account deleted', 'Your profile data has been deleted.');
          } catch (error) {
            if (error instanceof Error) {
              Alert.alert('Delete failed', error.message);
            }
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TopBar onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.sectionBox}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MaterialIcons name="wb-sunny" size={18} color={colors.darkGrey} />
            <Text style={styles.rowText}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={(value) => {
              setDarkMode(value);
              showUnavailable();
            }}
            testID="settings-dark-toggle"
            accessibilityLabel="settings-dark-toggle"
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MaterialIcons name="content-copy" size={18} color={colors.darkGrey} />
            <Text style={styles.rowText}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(value) => {
              setNotificationsEnabled(value);
              showUnavailable();
            }}
            testID="settings-notifications-toggle"
            accessibilityLabel="settings-notifications-toggle"
          />
        </View>
      </View>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.sectionBox}>
        <View style={styles.deleteRow}>
          <Text style={styles.deleteLabel}>Delete Account</Text>
          <Pressable
            style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={loading}
            testID="settings-delete"
            accessibilityLabel="settings-delete"
          >
            <Text style={styles.deleteButtonText}>{loading ? 'Deleting...' : 'delete'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 16,
    marginLeft: 32,
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 16,
    marginLeft: 36,
  },
  sectionBox: {
    marginTop: 8,
    marginHorizontal: 36,
  },
  row: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowText: {
    fontSize: 18,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteLabel: {
    fontSize: 14,
  },
  deleteButton: {
    height: 42,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontSize: 11,
    color: colors.danger,
    textTransform: 'lowercase',
  },
});
