import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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
import { useFeatureConfigStore } from '../../app/store/featureConfigStore';
import env from '../../config/env';
import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import {
  FEATURE_CONFIG_DESCRIPTIONS,
  FEATURE_CONFIG_KEYS,
  formatStringArrayConfig,
  parseStringArrayConfig,
  parseStringConfig,
} from '../../config/featureConfig';
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
import { AdminToolsSection } from '../components/settings/AdminToolsSection';
import { AdminTermsModal } from '../components/settings/AdminTermsModal';
import { DeleteAccountModal } from '../components/settings/DeleteAccountModal';
import { SettingsCard } from '../components/settings/SettingsCard';
import { SettingsRow } from '../components/settings/SettingsRow';
import { SettingsSection } from '../components/settings/SettingsSection';

type AdminConfigValueType = 'stringArray' | 'string';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { session, isGuest, exitGuest } = useAuth();
  const { locale, setLocale, supportedLocales } = useLocalization();
  const { users: userRepository, userBans: userBanRepository, featureConfigs: featureConfigRepository } = useRepositories();
  const featureConfigValues = useFeatureConfigStore((state) => state.values);
  const setFeatureConfigValue = useFeatureConfigStore((state) => state.setValue);
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
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsInput, setTermsInput] = useState('');
  const [termsKey, setTermsKey] = useState<string | null>(null);
  const [termsLabel, setTermsLabel] = useState('');
  const [termsDescription, setTermsDescription] = useState('');
  const [termsMessage, setTermsMessage] = useState('');
  const [termsSaving, setTermsSaving] = useState(false);
  const [termsValueType, setTermsValueType] = useState<AdminConfigValueType>('stringArray');

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
  const blockedTerms = useMemo(
    () => parseStringArrayConfig(featureConfigValues[FEATURE_CONFIG_KEYS.blockedTerms]),
    [featureConfigValues]
  );
  const reviewTerms = useMemo(
    () => parseStringArrayConfig(featureConfigValues[FEATURE_CONFIG_KEYS.reviewTerms]),
    [featureConfigValues]
  );
  const currentTermsVersion = useMemo(
    () => parseStringConfig(featureConfigValues[FEATURE_CONFIG_KEYS.termsVersion]),
    [featureConfigValues]
  );
  const currentTermsUrl = useMemo(
    () => parseStringConfig(featureConfigValues[FEATURE_CONFIG_KEYS.termsUrl]),
    [featureConfigValues]
  );

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

  const openTermsModal = (
    key: string,
    label: string,
    description: string,
    message: string,
    defaultValue: string[] | string | null,
    valueType: AdminConfigValueType
  ) => {
    if (!session?.user?.id) {
      Alert.alert(settingsCopy.alerts.signInRequired.title, settingsCopy.alerts.signInRequired.message);
      return;
    }
    if (!isAdmin) {
      return;
    }
    setTermsKey(key);
    setTermsLabel(label);
    setTermsDescription(description);
    setTermsMessage(message);
    setTermsValueType(valueType);
    if (valueType === 'stringArray') {
      setTermsInput(formatStringArrayConfig(Array.isArray(defaultValue) ? defaultValue : []));
    } else {
      setTermsInput(typeof defaultValue === 'string' ? defaultValue : '');
    }
    setTermsModalVisible(true);
  };

  const closeTermsModal = (force = false) => {
    if (termsSaving && !force) {
      return;
    }
    setTermsModalVisible(false);
    setTermsKey(null);
    setTermsLabel('');
    setTermsDescription('');
    setTermsMessage('');
    setTermsInput('');
    setTermsValueType('stringArray');
  };

  const saveTerms = async () => {
    if (!termsKey) {
      return;
    }
    const isOnline = await ensureAdminOnline();
    if (!isOnline) {
      return;
    }
    try {
      setTermsSaving(true);
      let value: string[] | string;
      if (termsValueType === 'stringArray') {
        value = parseStringArrayConfig(termsInput);
      } else {
        const trimmed = termsInput.trim();
        if (!trimmed) {
          Alert.alert(settingsCopy.admin.alerts.failedTitle, settingsCopy.admin.alerts.failedMessage);
          return;
        }
        value = trimmed;
      }
      await featureConfigRepository.upsertConfig(termsKey, value, termsDescription);
      setFeatureConfigValue(termsKey, value);
      Alert.alert(
        settingsCopy.admin.alerts.successTitle,
        settingsCopy.admin.alerts.configSuccess(termsLabel)
      );
      closeTermsModal(true);
    } catch (error) {
      showAdminError(error);
    } finally {
      setTermsSaving(false);
    }
  };

  const handleUpdateBlockedTerms = () => {
    openTermsModal(
      FEATURE_CONFIG_KEYS.blockedTerms,
      settingsCopy.options.adminBlockedTerms,
      FEATURE_CONFIG_DESCRIPTIONS.blockedTerms,
      settingsCopy.admin.prompts.termsMessage,
      blockedTerms,
      'stringArray'
    );
  };

  const handleUpdateReviewTerms = () => {
    openTermsModal(
      FEATURE_CONFIG_KEYS.reviewTerms,
      settingsCopy.options.adminReviewTerms,
      FEATURE_CONFIG_DESCRIPTIONS.reviewTerms,
      settingsCopy.admin.prompts.termsMessage,
      reviewTerms,
      'stringArray'
    );
  };

  const handleUpdateTermsVersion = () => {
    openTermsModal(
      FEATURE_CONFIG_KEYS.termsVersion,
      settingsCopy.options.adminTermsVersion,
      FEATURE_CONFIG_DESCRIPTIONS.termsVersion,
      settingsCopy.admin.prompts.termsVersionMessage,
      currentTermsVersion,
      'string'
    );
  };

  const handleUpdateTermsUrl = () => {
    openTermsModal(
      FEATURE_CONFIG_KEYS.termsUrl,
      settingsCopy.options.adminTermsUrl,
      FEATURE_CONFIG_DESCRIPTIONS.termsUrl,
      settingsCopy.admin.prompts.termsUrlMessage,
      currentTermsUrl,
      'string'
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
        <SettingsSection title={settingsCopy.sections.preferences} note={settingsCopy.sections.preferencesNote}>
          <SettingsCard>
            <SettingsRow
              label={settingsCopy.options.darkMode}
              iconName="dark-mode"
              right={(
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
              )}
            />
            <SettingsRow
              label={settingsCopy.options.onlineStatus}
              iconName="visibility"
              divider
              right={(
                <Switch
                  value={isOnlineVisible}
                  onValueChange={handleOnlineStatusChange}
                  testID={settingsCopy.testIds.onlineStatus}
                  accessibilityLabel={settingsCopy.testIds.onlineStatus}
                  disabled={updatingOnlineStatus}
                  trackColor={{ false: theme.outline, true: theme.primary }}
                  thumbColor={isOnlineVisible ? theme.onPrimary : theme.onSurface}
                />
              )}
            />
            <SettingsRow
              label={settingsCopy.options.notifications}
              iconName="notifications"
              divider
              right={(
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                  testID={settingsCopy.testIds.notifications}
                  accessibilityLabel={settingsCopy.testIds.notifications}
                  trackColor={{ false: theme.outline, true: theme.primary }}
                  thumbColor={notificationsEnabled ? theme.onPrimary : theme.onSurface}
                />
              )}
            />
            <SettingsRow
              label={settingsCopy.options.language}
              iconName="language"
              divider
              onPress={showLanguagePicker}
              right={(
                <View style={styles.languageValue}>
                  <Text style={styles.languageValueText}>{t(`language.${locale}`)}</Text>
                  <MaterialIcons name="chevron-right" size={22} color={theme.onSurfaceVariant} />
                </View>
              )}
              testID="settings-language"
              accessibilityLabel="settings-language"
            />
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title={settingsCopy.sections.account} note={settingsCopy.sections.accountNote}>
          <SettingsCard>
            <SettingsRow
              label={settingsCopy.options.editProfile}
              iconName="edit"
              onPress={() => navigation.navigate('EditProfile')}
              chevron
              testID="settings-edit-profile"
              accessibilityLabel="settings-edit-profile"
            />
            <SettingsRow
              label={settingsCopy.options.logout}
              iconName="logout"
              divider
              onPress={handleLogout}
              chevron
              testID={settingsCopy.testIds.logout}
              accessibilityLabel={settingsCopy.testIds.logout}
            />
            <SettingsRow
              label={settingsCopy.options.deleteAccount}
              iconName="delete"
              tone="danger"
              divider
              onPress={openDeleteModal}
              disabled={loading}
              chevron
              testID={settingsCopy.testIds.delete}
              accessibilityLabel={settingsCopy.testIds.delete}
            />
          </SettingsCard>
        </SettingsSection>

        <AdminToolsSection
          canManageUsers={canManageUsers}
          isAdmin={isAdmin}
          onBanUser={handleGlobalBan}
          onUnbanUser={handleGlobalUnban}
          onSetRole={handleSetRole}
          onEditBlockedTerms={handleUpdateBlockedTerms}
          onEditReviewTerms={handleUpdateReviewTerms}
          onEditTermsVersion={handleUpdateTermsVersion}
          onEditTermsUrl={handleUpdateTermsUrl}
        />

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
              onPress={() => openWebView(settingsCopy.footer.terms, currentTermsUrl ?? undefined)}
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
      <DeleteAccountModal
        visible={deleteModalVisible}
        title={settingsCopy.deleteModal.title}
        body={settingsCopy.deleteModal.body}
        hint={settingsCopy.deleteModal.hint(maskedEmail)}
        placeholder={settingsCopy.deleteModal.placeholder}
        value={deleteEmailInput}
        onChange={setDeleteEmailInput}
        showMismatch={showMismatch}
        mismatchText={settingsCopy.deleteModal.mismatch}
        confirmDisabled={confirmDisabled}
        onCancel={closeDeleteModal}
        onConfirm={async () => {
          if (confirmDisabled) return;
          const deleted = await handleDelete();
          if (deleted) {
            closeDeleteModal();
          }
        }}
        cancelLabel={settingsCopy.deleteModal.cancel}
        confirmLabel={settingsCopy.deleteModal.confirm}
        testIds={{
          modal: settingsCopy.testIds.deleteModal,
          input: settingsCopy.testIds.deleteEmail,
          cancel: settingsCopy.testIds.deleteCancel,
          confirm: settingsCopy.testIds.deleteConfirm,
        }}
      />
      <AdminTermsModal
        visible={termsModalVisible}
        title={termsLabel}
        message={termsMessage}
        value={termsInput}
        onChange={setTermsInput}
        onCancel={() => closeTermsModal()}
        onConfirm={saveTerms}
        cancelLabel={settingsCopy.admin.prompts.cancel}
        confirmLabel={settingsCopy.admin.prompts.confirm}
        loading={termsSaving}
        testIds={{
          modal: settingsCopy.testIds.adminTermsModal,
          input: settingsCopy.testIds.adminTermsInput,
          cancel: settingsCopy.testIds.adminTermsCancel,
          confirm: settingsCopy.testIds.adminTermsConfirm,
        }}
      />
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
