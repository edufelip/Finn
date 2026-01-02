import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../../app/providers/AuthProvider';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import LoadingScreen from '../screens/LoadingScreen';

export default function RootNavigator() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {session ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
