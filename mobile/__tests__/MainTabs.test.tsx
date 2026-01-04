import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MainTabs from '../src/presentation/navigation/MainTabs';
import { tabCopy } from '../src/presentation/content/tabCopy';

describe('MainTabs', () => {
  it('renders tab labels and add button', () => {
    const { getByText, getByTestId } = render(
      <SafeAreaProvider>
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    );

    expect(getByText(tabCopy.home)).toBeTruthy();
    expect(getByText(tabCopy.add)).toBeTruthy();
    expect(getByText(tabCopy.search)).toBeTruthy();
    expect(getByText(tabCopy.profile)).toBeTruthy();
    expect(getByTestId(tabCopy.testIds.add)).toBeTruthy();
  });
});
