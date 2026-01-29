import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../app/providers/AuthProvider';
import { useLocalization } from '../../app/providers/LocalizationProvider';
import { usePresence } from '../../app/providers/PresenceProvider';
import { useTheme, useThemeColors } from '../../app/providers/ThemeProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import env from '../../config/env';
import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import { links } from '../../config/links';
import type { UserRole } from '../../domain/models/user';
import type { ThemeColors } from '../theme/colors';
import type { MainStackParamList } from '../navigation/MainStack';
import { settingsCopy } from '../content/settingsCopy';
import { commonCopy } from '../content/commonCopy';
import { maskEmail } from '../i18n/formatters';
import { t } from '../i18n';
import { registerPushToken, setNotificationGatePreference } from '../../app/notifications/pushTokens';
import GuestGateScreen from '../components/GuestGateScreen';
import { guestCopy } from '../content/guestCopy';
import { useUserStore } from '../../app/store/userStore';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { session, isGuest, exitGuest } = useAuth();
  const { locale, setLocale, supportedLocales } = useLocalization();
  const { users: userRepository, userBans: userBanRepository } = useRepositories();
  const { isOnlineVisible, setOnlineVisibility } = usePresence();
  const { isDark, toggleTheme } = useTheme();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const mountedRef = useRef(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [updatingOnlineStatus, setUpdatingOnlineStatus] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const currentUser = useUserStore((state) => state.currentUser);
  const isAdmin = currentUser?.role === 'admin';
  const canManageUsers = currentUser?.role === 'staff' || isAdmin;
  const userNotificationsEnabled = currentUser?.notificationsEnabled ?? true;

  useEffect(() => {
    setNotificationsEnabled(userNotificationsEnabled);
    setNotificationGatePreference(userNotificationsEnabled);
  }, [userNotificationsEnabled]);

  const showUnavailable = () => {
    Alert.alert(settingsCopy.alerts.unavailable.title, settingsCopy.alerts.unavailable.message);
  };

  const showLanguagePicker = () => {
    const languageButtons = supportedLocales.map((loc) => ({
      text: t(`language.${loc}`),
      onPress: () => setLocale(loc),
    }));

    Alert.alert(
      t('settings.alert.language.title'),
      undefined,
      [
        ...languageButtons,
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const ensurePushPermission = async () => {
    if (isMockMode()) {
      return true;
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') {
      return true;
    }
    if (current.canAskAgain) {
      const requested = await Notifications.requestPermissionsAsync();
      return requested.status === 'granted';
    }
    return false;
  };

  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? commonCopy.emptyDash;
  const versionLabel = settingsCopy.footer.version(appVersion);
  const sessionEmail = session?.user?.email ?? '';
  const maskedEmail = useMemo(() => maskEmail(sessionEmail), [sessionEmail]);
  const normalizedTargetEmail = sessionEmail.trim().toLowerCase();
  const normalizedInputEmail = deleteEmailInput.trim().toLowerCase();
  const canConfirmDelete = Boolean(normalizedTargetEmail) && normalizedInputEmail === normalizedTargetEmail;
  const showMismatch = Boolean(deleteEmailInput) && !canConfirmDelete;
  const confirmDisabled = !canConfirmDelete || loading;

  if (isGuest) {
    return (
      <GuestGateScreen
        title={guestCopy.restricted.title(guestCopy.features.settings)}
        body={guestCopy.restricted.body(guestCopy.features.settings)}
        onSignIn={() => void exitGuest()}
      />
    );
  }

  const openWebView = (title: string, url?: string) => {
    if (!url) {
      showUnavailable();
      return;
    }
    navigation.navigate('WebView', { title, url });
  };

  const handleDelete = async (): Promise<boolean> => {
    if (!session?.user?.id) {
      Alert.alert(settingsCopy.alerts.signInRequired.title, settingsCopy.alerts.signInRequired.message);
      return false;
    }
    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      setLoading(false);
      Alert.alert(settingsCopy.alerts.offline.title, settingsCopy.alerts.offline.message);
      return false;
    }
    try {
      await userRepository.deleteUser(session.user.id);
      try {
        await supabase.functions.invoke('delete-user-assets', {
          body: { userId: session.user.id },
        });
      } catch {
        // Ignore cleanup failures to avoid blocking account deletion.
      }
      await supabase.auth.signOut();
      Alert.alert(settingsCopy.alerts.deleted.title, settingsCopy.alerts.deleted.message);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(settingsCopy.alerts.failed.title, error.message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = () => {
    if (!sessionEmail) {
      Alert.alert(settingsCopy.alerts.signInRequired.title, settingsCopy.alerts.signInRequired.message);
      return;
    }
    setDeleteEmailInput('');
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setDeleteEmailInput('');
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

  const handleNotificationsToggle = async (value: boolean) => {
    const previous = notificationsEnabled;
    setNotificationsEnabled(value);
    setNotificationGatePreference(value);
    if (!session?.user?.id) {
      Alert.alert(settingsCopy.alerts.signInRequired.title, settingsCopy.alerts.signInRequired.message);
      if (mountedRef.current) {
        setNotificationsEnabled(previous);
        setNotificationGatePreference(previous);
      }
      return;
    }

    let valueToSave = value;

    if (value) {
      const granted = await ensurePushPermission();
      if (!granted) {
        if (!mountedRef.current) {
          return;
        }
        valueToSave = false;
        setNotificationsEnabled(false);
        setNotificationGatePreference(false);
        Alert.alert(settingsCopy.alerts.notificationsPermission.title, settingsCopy.alerts.notificationsPermission.message, [
          { text: settingsCopy.alerts.notificationsPermission.cancel, style: 'cancel' },
          {
            text: settingsCopy.alerts.notificationsPermission.confirm,
            style: 'default',
            onPress: () => {
              Linking.openSettings().catch(() => {
                // ignore
              });
            },
          },
        ]);
      } else if (session?.user?.id) {
        try {
          await registerPushToken(userRepository, session.user.id, env.appEnv);
        } catch {
          // Ignore token registration failures.
        }
      }
    }

    try {
      await userRepository.setNotificationsEnabled(session.user.id, valueToSave);
      useUserStore.getState().updateUser({ notificationsEnabled: valueToSave });
    } catch {
      if (mountedRef.current) {
        setNotificationsEnabled(previous);
        setNotificationGatePreference(previous);
        Alert.alert(settingsCopy.alerts.notificationsFailed.title, settingsCopy.alerts.notificationsFailed.message);
      }
    }
  };

  const ensureAdminOnline = async (): Promise<boolean> => {
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      Alert.alert(settingsCopy.admin.alerts.offlineTitle, settingsCopy.admin.alerts.offlineMessage);
      return false;
    }
    return true;
  };

  const showAdminError = (error: unknown) => {
    if (error instanceof Error) {
      Alert.alert(settingsCopy.admin.alerts.failedTitle, error.message || settingsCopy.admin.alerts.failedMessage);
      return;
    }
    Alert.alert(settingsCopy.admin.alerts.failedTitle, settingsCopy.admin.alerts.failedMessage);
  };

  const promptForUserId = (onConfirm: (userId: string) => void) => {
    Alert.prompt(
      settingsCopy.admin.prompts.userIdTitle,
      settingsCopy.admin.prompts.userIdMessage,
      [
        { text: settingsCopy.admin.prompts.cancel, style: 'cancel' },
        {
          text: settingsCopy.admin.prompts.confirm,
          onPress: (value?: string) => {
            const trimmed = value?.trim();
            if (!trimmed) {
              return;
            }
            onConfirm(trimmed);
          },
        },
      ],
      'plain-text'
    );
  };

  const handleGlobalBan = () => {
    if (!session?.user?.id) {
      Alert.alert(settingsCopy.alerts.signInRequired.title, settingsCopy.alerts.signInRequired.message);
      return;
    }
    if (!canManageUsers) {
      return;
    }
    promptForUserId(async (targetUserId) => {
      const isOnline = await ensureAdminOnline();
      if (!isOnline) {
        return;
      }

      Alert.prompt(
        settingsCopy.admin.prompts.reasonTitle,
        settingsCopy.admin.prompts.reasonMessage,
        [
          { text: settingsCopy.admin.prompts.cancel, style: 'cancel' },
          {
            text: settingsCopy.admin.prompts.confirm,
            style: 'destructive',
            onPress: async (value?: string) => {
              try {
                await userBanRepository.banUser(
                  targetUserId,
                  session.user.id,
                  value?.trim() || null,
                  null
                );
                Alert.alert(
                  settingsCopy.admin.alerts.successTitle,
                  settingsCopy.admin.alerts.banSuccess(targetUserId)
                );
              } catch (error) {
                showAdminError(error);
              }
            },
          },
        ],
        'plain-text'
      );
    });
  };

  const handleGlobalUnban = () => {
    if (!session?.user?.id) {
      Alert.alert(settingsCopy.alerts.signInRequired.title, settingsCopy.alerts.signInRequired.message);
      return;
    }
    if (!canManageUsers) {
      return;
    }
    promptForUserId(async (targetUserId) => {
      const isOnline = await ensureAdminOnline();
      if (!isOnline) {
        return;
      }
      try {
        await userBanRepository.unbanUser(targetUserId);
        Alert.alert(
          settingsCopy.admin.alerts.successTitle,
          settingsCopy.admin.alerts.unbanSuccess(targetUserId)
        );
      } catch (error) {
        showAdminError(error);
      }
    });
  };

  const handleSetRole = () => {
    if (!session?.user?.id) {
      Alert.alert(settingsCopy.alerts.signInRequired.title, settingsCopy.alerts.signInRequired.message);
      return;
    }
    if (!isAdmin) {
      return;
    }
    promptForUserId(async (targetUserId) => {
      const isOnline = await ensureAdminOnline();
      if (!isOnline) {
        return;
      }

      const applyRole = async (role: UserRole) => {
        try {
          await userRepository.updateUserRole(targetUserId, role);
          if (currentUser?.id === targetUserId) {
            useUserStore.getState().updateUser({ role });
          }
          const roleLabel = role === 'admin'
            ? settingsCopy.admin.roles.admin
            : role === 'staff'
              ? settingsCopy.admin.roles.staff
              : settingsCopy.admin.roles.user;
          Alert.alert(
            settingsCopy.admin.alerts.successTitle,
            settingsCopy.admin.alerts.roleSuccess(targetUserId, roleLabel)
          );
        } catch (error) {
          showAdminError(error);
        }
      };

      Alert.alert(
        settingsCopy.admin.prompts.roleTitle,
        settingsCopy.admin.prompts.roleMessage,
        [
          { text: settingsCopy.admin.roles.user, onPress: () => void applyRole('user') },
          { text: settingsCopy.admin.roles.staff, onPress: () => void applyRole('staff') },
          { text: settingsCopy.admin.roles.admin, onPress: () => void applyRole('admin') },
          { text: settingsCopy.admin.prompts.cancel, style: 'cancel' },
        ]
      );
    });
  };

  const handleLogout = () => {
    Alert.alert(settingsCopy.alerts.logout.title, settingsCopy.alerts.logout.message, [
      { text: settingsCopy.alerts.logout.cancel, style: 'cancel' },
      {
        text: settingsCopy.alerts.logout.confirm,
        style: 'destructive',
        onPress: () => {
          supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back-ios-new" size={20} color={theme.onBackground} />
        </Pressable>
        <Text style={styles.title}>{settingsCopy.title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{settingsCopy.sections.preferences}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="dark-mode" size={20} color={theme.onSurfaceVariant} />
              </View>
              <Text style={styles.rowText}>{settingsCopy.options.darkMode}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => {
                toggleTheme();
              }}
              testID={settingsCopy.testIds.darkMode}
              accessibilityLabel={settingsCopy.testIds.darkMode}
              trackColor={{ false: theme.outline, true: theme.primary }}
              thumbColor={isDark ? theme.onPrimary : theme.onSurface}
            />
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="visibility" size={20} color={theme.onSurfaceVariant} />
              </View>
              <Text style={styles.rowText}>{settingsCopy.options.onlineStatus}</Text>
            </View>
            <Switch
              value={isOnlineVisible}
              onValueChange={handleOnlineStatusChange}
              testID={settingsCopy.testIds.onlineStatus}
              accessibilityLabel={settingsCopy.testIds.onlineStatus}
              disabled={updatingOnlineStatus}
              trackColor={{ false: theme.outline, true: theme.primary }}
              thumbColor={isOnlineVisible ? theme.onPrimary : theme.onSurface}
            />
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="notifications" size={20} color={theme.onSurfaceVariant} />
              </View>
              <Text style={styles.rowText}>{settingsCopy.options.notifications}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              testID={settingsCopy.testIds.notifications}
              accessibilityLabel={settingsCopy.testIds.notifications}
              trackColor={{ false: theme.outline, true: theme.primary }}
              thumbColor={notificationsEnabled ? theme.onPrimary : theme.onSurface}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.row, styles.rowDivider, pressed && styles.rowPressed]}
            onPress={showLanguagePicker}
            testID="settings-language"
            accessibilityLabel="settings-language"
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="language" size={20} color={theme.onSurfaceVariant} />
              </View>
              <Text style={styles.rowText}>{settingsCopy.options.language}</Text>
            </View>
            <View style={styles.languageValue}>
              <Text style={styles.languageValueText}>{t(`language.${locale}`)}</Text>
              <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />
            </View>
          </Pressable>
        </View>
        <Text style={styles.sectionNote}>{settingsCopy.sections.preferencesNote}</Text>

        <Text style={styles.sectionLabel}>{settingsCopy.sections.account}</Text>
        <View style={styles.card}>
          {/* Edit Profile */}
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => navigation.navigate('EditProfile')}
            testID="settings-edit-profile"
            accessibilityLabel="settings-edit-profile"
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="edit" size={20} color={theme.onSurfaceVariant} />
              </View>
              <Text style={styles.rowText}>{settingsCopy.options.editProfile}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />
          </Pressable>
          {/* Logout */}
          <Pressable
            style={({ pressed }) => [styles.row, styles.rowDivider, pressed && styles.rowPressed]}
            onPress={handleLogout}
            testID={settingsCopy.testIds.logout}
            accessibilityLabel={settingsCopy.testIds.logout}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="logout" size={20} color={theme.onSurfaceVariant} />
              </View>
              <Text style={styles.rowText}>{settingsCopy.options.logout}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.row, styles.rowDivider, pressed && styles.rowPressed]}
            onPress={openDeleteModal}
            disabled={loading}
            testID={settingsCopy.testIds.delete}
            accessibilityLabel={settingsCopy.testIds.delete}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, styles.dangerIconCircle]}>
                <MaterialIcons name="delete" size={20} color={theme.error} />
              </View>
              <Text style={[styles.rowText, styles.dangerText]}>{settingsCopy.options.deleteAccount}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />
          </Pressable>
        </View>
        <Text style={styles.sectionNote}>{settingsCopy.sections.accountNote}</Text>

        {canManageUsers ? (
          <>
            <Text style={styles.sectionLabel}>{settingsCopy.sections.admin}</Text>
            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={handleGlobalBan}
                testID={settingsCopy.testIds.adminBanUser}
                accessibilityLabel={settingsCopy.testIds.adminBanUser}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconCircle, styles.dangerIconCircle]}>
                    <MaterialIcons name="block" size={20} color={theme.error} />
                  </View>
                  <Text style={[styles.rowText, styles.dangerText]}>{settingsCopy.options.adminBanUser}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.row, styles.rowDivider, pressed && styles.rowPressed]}
                onPress={handleGlobalUnban}
                testID={settingsCopy.testIds.adminUnbanUser}
                accessibilityLabel={settingsCopy.testIds.adminUnbanUser}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="lock-open" size={20} color={theme.onSurfaceVariant} />
                  </View>
                  <Text style={styles.rowText}>{settingsCopy.options.adminUnbanUser}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />
              </Pressable>
              {isAdmin ? (
                <Pressable
                  style={({ pressed }) => [styles.row, styles.rowDivider, pressed && styles.rowPressed]}
                  onPress={handleSetRole}
                  testID={settingsCopy.testIds.adminSetRole}
                  accessibilityLabel={settingsCopy.testIds.adminSetRole}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="admin-panel-settings" size={20} color={theme.onSurfaceVariant} />
                    </View>
                    <Text style={styles.rowText}>{settingsCopy.options.adminSetRole}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.sectionNote}>{settingsCopy.sections.adminNote}</Text>
          </>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerVersion}>{versionLabel}</Text>
          <View style={styles.footerLinks}>
            <Pressable
              onPress={() => openWebView(settingsCopy.footer.privacy, links.privacyPolicy)}
              testID={settingsCopy.testIds.privacy}
              accessibilityLabel={settingsCopy.testIds.privacy}
            >
              <Text style={styles.footerLinkText}>{settingsCopy.footer.privacy}</Text>
            </Pressable>
            <Pressable
              onPress={() => openWebView(settingsCopy.footer.terms, links.termsOfService)}
              testID={settingsCopy.testIds.terms}
              accessibilityLabel={settingsCopy.testIds.terms}
            >
              <Text style={styles.footerLinkText}>{settingsCopy.footer.terms}</Text>
            </Pressable>
            <Pressable
              onPress={showUnavailable}
              testID={settingsCopy.testIds.help}
              accessibilityLabel={settingsCopy.testIds.help}
            >
              <Text style={styles.footerLinkText}>{settingsCopy.footer.help}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={closeDeleteModal}
        testID={settingsCopy.testIds.deleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{settingsCopy.deleteModal.title}</Text>
            <Text style={styles.modalBody}>{settingsCopy.deleteModal.body}</Text>
            <Text style={styles.modalHint}>{settingsCopy.deleteModal.hint(maskedEmail)}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={settingsCopy.deleteModal.placeholder}
              placeholderTextColor={theme.onSurfaceVariant}
              value={deleteEmailInput}
              onChangeText={setDeleteEmailInput}
              autoCapitalize="none"
              keyboardType="email-address"
              testID={settingsCopy.testIds.deleteEmail}
              accessibilityLabel={settingsCopy.testIds.deleteEmail}
            />
            {showMismatch ? (
              <Text style={styles.modalError}>{settingsCopy.deleteModal.mismatch}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalCancel, pressed && styles.modalButtonPressed]}
                onPress={closeDeleteModal}
                testID={settingsCopy.testIds.deleteCancel}
                accessibilityLabel={settingsCopy.testIds.deleteCancel}
              >
                <Text style={styles.modalCancelText}>{settingsCopy.deleteModal.cancel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalConfirm,
                  confirmDisabled && styles.modalConfirmDisabled,
                  pressed && !confirmDisabled && styles.modalButtonPressed,
                ]}
                onPress={async () => {
                  if (confirmDisabled) return;
                  const deleted = await handleDelete();
                  if (deleted) {
                    closeDeleteModal();
                  }
                }}
                disabled={confirmDisabled}
                testID={settingsCopy.testIds.deleteConfirm}
                accessibilityLabel={settingsCopy.testIds.deleteConfirm}
              >
                <Text style={styles.modalConfirmText}>{settingsCopy.deleteModal.confirm}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 12,
      backgroundColor: theme.background,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonPressed: {
      backgroundColor: theme.surfaceVariant,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.onBackground,
    },
    content: {
      paddingBottom: 32,
      paddingTop: 4,
    },
    sectionLabel: {
      marginTop: 16,
      marginBottom: 8,
      marginHorizontal: 20,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.onSurfaceVariant,
      fontWeight: '600',
    },
    sectionNote: {
      marginTop: 8,
      marginHorizontal: 20,
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
    card: {
      marginHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
      shadowColor: theme.shadow,
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: theme.outlineVariant,
    },
    rowPressed: {
      backgroundColor: theme.surfaceVariant,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.scrim,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.onSurface,
      marginBottom: 8,
    },
    modalBody: {
      color: theme.onSurfaceVariant,
      fontSize: 13,
      marginBottom: 12,
    },
    modalHint: {
      color: theme.onSurface,
      fontSize: 12,
      marginBottom: 12,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.outline,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.onSurface,
      backgroundColor: theme.surfaceVariant,
    },
    modalError: {
      color: theme.error,
      fontSize: 12,
      marginTop: 8,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 12,
    },
    modalCancel: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
      alignItems: 'center',
    },
    modalCancelText: {
      color: theme.onSurface,
      fontWeight: '600',
    },
    modalConfirm: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.error,
      alignItems: 'center',
    },
    modalConfirmDisabled: {
      backgroundColor: theme.outlineVariant,
    },
    modalConfirmText: {
      color: theme.onError,
      fontWeight: '600',
    },
    modalButtonPressed: {
      opacity: 0.8,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      paddingRight: 12,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceVariant,
    },
    rowText: {
      fontSize: 15,
      color: theme.onSurface,
      fontWeight: '500',
    },
    dangerIconCircle: {
      backgroundColor: theme.errorContainer,
    },
    dangerText: {
      color: theme.error,
    },
    footer: {
      marginTop: 24,
      alignItems: 'center',
      paddingBottom: 24,
    },
    footerVersion: {
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: theme.onSurfaceVariant,
      fontWeight: '600',
    },
    footerLinks: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
      marginTop: 12,
    },
    footerLinkText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
    },
    languageValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    languageValueText: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
      fontWeight: '500',
    },
  });
