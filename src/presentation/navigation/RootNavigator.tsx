import React, { useMemo } from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

import { useAuth } from '../../app/providers/AuthProvider';
import { useAppStore } from '../../app/store/appStore';
import { useUserStore } from '../../app/store/userStore';
import { useFeatureConfigStore } from '../../app/store/featureConfigStore';
import { FEATURE_CONFIG_KEYS, parseStringConfig } from '../../config/featureConfig';
import AuthStack, { AuthStackParamList } from './AuthStack';
import MainStack, { MainStackParamList } from './MainStack';
import LoadingScreen from '../screens/LoadingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import TermsAcceptanceScreen from '../screens/TermsAcceptanceScreen';
import BannedAccountScreen from '../screens/BannedAccountScreen';
import WebViewScreen from '../screens/WebViewScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Terms: undefined;
  Banned: undefined;
  WebView: { title: string; url: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session, initializing, isGuest } = useAuth();
  const { hasSeenOnboarding } = useAppStore();
  const { currentUser, isLoading: isUserLoading, banStatus } = useUserStore();
  const featureConfigValues = useFeatureConfigStore((state) => state.values);
  const featureConfigLoading = useFeatureConfigStore((state) => state.isLoading);
  const currentTermsVersion = parseStringConfig(featureConfigValues[FEATURE_CONFIG_KEYS.termsVersion]);
  const needsTerms = Boolean(
    session &&
      !isGuest &&
      (!currentUser ||
        (currentTermsVersion
          ? currentUser.termsVersion !== currentTermsVersion
          : !currentUser.termsVersion))
  );
  const isBanned = Boolean(session && !isGuest && banStatus.isBanned);

  const linking = useMemo(() => {
    const scheme = Constants.expoConfig?.scheme || 'finn';
    
    return {
      prefixes: [
        `${scheme}://`,
        'https://finnsocial.fun',
        'https://www.finnsocial.fun',
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

  if (initializing || (session && !isGuest && isUserLoading)) {
    return <LoadingScreen />;
  }

  if (session && !isGuest && featureConfigLoading && !isBanned) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isBanned ? (
          <RootStack.Screen name="Banned" component={BannedAccountScreen} />
        ) : !hasSeenOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : needsTerms ? (
          <>
            <RootStack.Screen name="Terms" component={TermsAcceptanceScreen} />
            <RootStack.Screen name="WebView" component={WebViewScreen} />
          </>
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
