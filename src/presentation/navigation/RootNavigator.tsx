import React, { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Constants from 'expo-constants';

import { useAuth } from '../../app/providers/AuthProvider';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import LoadingScreen from '../screens/LoadingScreen';

export default function RootNavigator() {
  const { session, initializing, isGuest } = useAuth();

  const linking = useMemo(() => {
    const scheme = Constants.expoConfig?.scheme || 'finn';
    
    return {
      prefixes: [
        `${scheme}://`,
        'https://finn.app',
        'https://*.finn.app',
      ],
      config: {
        screens: {
          DrawerRoot: {
            path: '',
          },
          PostDetail: {
            path: 'post/:postId',
          },
          CommunityDetail: {
            path: 'community/:communityId',
          },
        },
      },
    };
  }, []);

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      {session || isGuest ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
