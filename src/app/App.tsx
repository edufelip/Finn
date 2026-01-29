import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { AuthProvider } from './providers/AuthProvider';
import { FeatureConfigProvider } from './providers/FeatureConfigProvider';
import { InboxBadgeProvider } from './providers/InboxBadgeProvider';
import { LocalizationProvider } from './providers/LocalizationProvider';
import { PresenceProvider } from './providers/PresenceProvider';
import { RepositoryProvider } from './providers/RepositoryProvider';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import RootNavigator from '../presentation/navigation/RootNavigator';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <LocalizationProvider>
          <ThemeProvider>
            <RepositoryProvider>
              <FeatureConfigProvider>
                <AuthProvider>
                  <InboxBadgeProvider>
                    <PresenceProvider>
                      <RootNavigator />
                      <ThemedStatusBar />
                    </PresenceProvider>
                  </InboxBadgeProvider>
                </AuthProvider>
              </FeatureConfigProvider>
            </RepositoryProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
