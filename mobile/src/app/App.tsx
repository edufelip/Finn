import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './providers/AuthProvider';
import { PresenceProvider } from './providers/PresenceProvider';
import { RepositoryProvider } from './providers/RepositoryProvider';
import RootNavigator from '../presentation/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RepositoryProvider>
          <AuthProvider>
            <PresenceProvider>
              <RootNavigator />
              <StatusBar style="dark" />
            </PresenceProvider>
          </AuthProvider>
        </RepositoryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
