import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as Network from 'expo-network';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../app/providers/AuthProvider';
import { usePresence } from '../../app/providers/PresenceProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import TopBar from '../components/TopBar';
import { colors } from '../theme/colors';
import { settingsCopy } from '../content/settingsCopy';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { users: userRepository } = useRepositories();
  const { isOnlineVisible, setOnlineVisibility } = usePresence();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [updatingOnlineStatus, setUpdatingOnlineStatus] = useState(false);

  const showUnavailable = () => {
    Alert.alert(settingsCopy.alerts.unavailable.title, settingsCopy.alerts.unavailable.message);
  };

  const handleDelete = () => {
    Alert.alert(settingsCopy.alerts.deleteConfirm.title, settingsCopy.alerts.deleteConfirm.message, [
      { text: settingsCopy.alerts.deleteConfirm.cancel, style: 'cancel' },
      {
        text: settingsCopy.alerts.deleteConfirm.confirm,
        style: 'destructive',
        onPress: async () => {
          if (!session?.user?.id) {
            Alert.alert(settingsCopy.alerts.signInRequired.title, settingsCopy.alerts.signInRequired.message);
            return;
          }
          setLoading(true);
          const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
          if (!status.isConnected) {
            setLoading(false);
            Alert.alert(settingsCopy.alerts.offline.title, settingsCopy.alerts.offline.message);
            return;
          }
          try {
            await userRepository.deleteUser(session.user.id);
            await supabase.auth.signOut();
            Alert.alert(settingsCopy.alerts.deleted.title, settingsCopy.alerts.deleted.message);
          } catch (error) {
            if (error instanceof Error) {
              Alert.alert(settingsCopy.alerts.failed.title, error.message);
            }
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleOnlineStatusChange = async (value: boolean) => {
    if (!session?.user?.id) {
      Alert.alert(settingsCopy.alerts.signInRequired.title, settingsCopy.alerts.signInRequired.message);
      return;
    }
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      Alert.alert(settingsCopy.alerts.offline.title, settingsCopy.alerts.offline.message);
      return;
    }
    try {
      setUpdatingOnlineStatus(true);
      await setOnlineVisibility(value);
    } catch {
      Alert.alert(settingsCopy.alerts.onlineStatusFailed.title, settingsCopy.alerts.onlineStatusFailed.message);
    } finally {
      setUpdatingOnlineStatus(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar onBack={() => navigation.goBack()} />
      <Text style={styles.title}>{settingsCopy.title}</Text>
      <Text style={styles.sectionTitle}>{settingsCopy.sections.preferences}</Text>
      <View style={styles.sectionBox}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MaterialIcons name="wb-sunny" size={18} color={colors.darkGrey} />
            <Text style={styles.rowText}>{settingsCopy.options.darkMode}</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={(value) => {
              setDarkMode(value);
              showUnavailable();
            }}
            testID={settingsCopy.testIds.darkMode}
            accessibilityLabel={settingsCopy.testIds.darkMode}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MaterialIcons name="visibility" size={18} color={colors.darkGrey} />
            <Text style={styles.rowText}>{settingsCopy.options.onlineStatus}</Text>
          </View>
          <Switch
            value={isOnlineVisible}
            onValueChange={handleOnlineStatusChange}
            testID={settingsCopy.testIds.onlineStatus}
            accessibilityLabel={settingsCopy.testIds.onlineStatus}
            disabled={updatingOnlineStatus}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MaterialIcons name="content-copy" size={18} color={colors.darkGrey} />
            <Text style={styles.rowText}>{settingsCopy.options.notifications}</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(value) => {
              setNotificationsEnabled(value);
              showUnavailable();
            }}
            testID={settingsCopy.testIds.notifications}
            accessibilityLabel={settingsCopy.testIds.notifications}
          />
        </View>
      </View>
      <Text style={styles.sectionTitle}>{settingsCopy.sections.account}</Text>
      <View style={styles.sectionBox}>
        <View style={styles.deleteRow}>
          <Text style={styles.deleteLabel}>{settingsCopy.options.deleteAccount}</Text>
          <Pressable
            style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={loading}
            testID={settingsCopy.testIds.delete}
            accessibilityLabel={settingsCopy.testIds.delete}
          >
            <Text style={styles.deleteButtonText}>
              {loading ? settingsCopy.deleteButtonLoading : settingsCopy.deleteButton}
            </Text>
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
