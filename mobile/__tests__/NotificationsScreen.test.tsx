import React from 'react';
import { render } from '@testing-library/react-native';

import NotificationsScreen from '../src/presentation/screens/NotificationsScreen';
import { notificationsCopy } from '../src/presentation/content/notificationsCopy';

describe('NotificationsScreen', () => {
  it('renders copy', () => {
    const { getByText } = render(<NotificationsScreen />);

    expect(getByText(notificationsCopy.title)).toBeTruthy();
    expect(getByText(notificationsCopy.body)).toBeTruthy();
  });
});
