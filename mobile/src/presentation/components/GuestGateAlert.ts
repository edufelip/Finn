import { Alert } from 'react-native';

import { guestCopy } from '../content/guestCopy';

type GuestGateAlertOptions = {
  onSignIn: () => void;
  title?: string;
  message?: string;
};

export const showGuestGateAlert = ({ onSignIn, title, message }: GuestGateAlertOptions) => {
  Alert.alert(title ?? guestCopy.action.title, message ?? guestCopy.action.body, [
    { text: guestCopy.action.cancel, style: 'cancel' },
    { text: guestCopy.action.signIn, onPress: onSignIn },
  ]);
};
