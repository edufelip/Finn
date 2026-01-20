import React, { useMemo } from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

import { useAuth } from '../../app/providers/AuthProvider';
import { useAppStore } from '../../app/store/appStore';
import AuthStack, { AuthStackParamList } from './AuthStack';
import MainStack, { MainStackParamList } from './MainStack';
import LoadingScreen from '../screens/LoadingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session, initializing, isGuest } = useAuth();
  const { hasSeenOnboarding } = useAppStore();

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
          Onboarding: 'onboarding',
          Auth: {
            screens: {
              Auth: 'login',
              Register: 'register',
              ForgotPassword: 'forgot-password',
            },
          },
          Main: {
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
        },
      },
    } as any;
  }, []);

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : session || isGuest ? (
          <RootStack.Screen 
            name="Main" 
            component={MainStack} 
            options={{ 
              animationTypeForReplace: 'push',
              animation: 'slide_from_right'
            }} 
          />
        ) : (
          <RootStack.Screen 
            name="Auth" 
            component={AuthStack} 
            options={{ 
              animationTypeForReplace: 'push',
              animation: 'slide_from_right'
            }} 
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
