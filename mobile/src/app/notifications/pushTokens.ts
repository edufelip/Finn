import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { UserRepository } from '../../domain/repositories/UserRepository';

let notificationsEnabled = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: notificationsEnabled,
    shouldPlaySound: notificationsEnabled,
    shouldSetBadge: notificationsEnabled,
  }),
});

export const setNotificationGatePreference = (enabled: boolean) => {
  notificationsEnabled = enabled;
  if (!enabled) {
    Notifications.dismissAllNotificationsAsync().catch(() => {
      // ignore
    });
  }
};

export const registerPushToken = async (userRepository: UserRepository, userId: string) => {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync();

  if (tokenResponse?.data) {
    await userRepository.savePushToken(userId, tokenResponse.data, Platform.OS);
  }
};
