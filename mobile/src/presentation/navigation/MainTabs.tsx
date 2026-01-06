import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import InboxScreen from '../screens/InboxScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateBottomSheet from '../components/CreateBottomSheet';
import type { MainStackParamList } from './MainStack';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { tabCopy } from '../content/tabCopy';

export type MainTabParamList = {
  Home: undefined;
  Add: undefined;
  Explore: undefined;
  Inbox: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const EmptyScreen = () => <View />;

export default function MainTabs() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [createOpen, setCreateOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);
  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, { paddingBottom: 24 + insets.bottom, height: 72 + insets.bottom }],
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.onSurfaceVariant,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: tabCopy.home,
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
            tabBarAccessibilityLabel: tabCopy.testIds.home,
          }}
        />
        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            tabBarLabel: tabCopy.explore,
            tabBarIcon: ({ color }) => <MaterialIcons name="explore" size={24} color={color} />,
            tabBarAccessibilityLabel: tabCopy.testIds.explore,
          }}
        />
        <Tab.Screen
          name="Add"
          component={EmptyScreen}
          options={{
            tabBarLabel: tabCopy.add,
            tabBarIcon: ({ color }) => <MaterialIcons name="add" size={24} color={color} />,
            tabBarButton: (props) => (
              <Pressable
                accessibilityRole="button"
                onPress={openCreate}
                style={[styles.tabButton, props.style]}
                testID={tabCopy.testIds.add}
                accessibilityLabel={tabCopy.testIds.add}
              >
                <View style={styles.fab}>
                  <MaterialIcons name="add" size={26} color={theme.onPrimary} />
                </View>
                <Text style={[styles.tabLabel, styles.tabLabelInactive]}>{tabCopy.add}</Text>
              </Pressable>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
        <Tab.Screen
          name="Inbox"
          component={InboxScreen}
          options={{
            tabBarLabel: tabCopy.inbox,
            tabBarIcon: ({ color }) => <MaterialIcons name="inbox" size={24} color={color} />,
            tabBarAccessibilityLabel: tabCopy.testIds.inbox,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
            tabBarLabel: tabCopy.profile,
            tabBarAccessibilityLabel: tabCopy.testIds.profile,
          }}
        />
      </Tab.Navigator>
      <CreateBottomSheet
        visible={createOpen}
        onClose={closeCreate}
        onCreateCommunity={() => {
          closeCreate();
          navigation.navigate('CreateCommunity');
        }}
        onCreatePost={() => {
          closeCreate();
          navigation.navigate('CreatePost');
        }}
      />
    </>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    tabBar: {
      height: 72,
      paddingBottom: 24,
      paddingTop: 8,
      backgroundColor: theme.surface,
      borderTopColor: theme.outlineVariant,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    tabLabel: {
      fontSize: 10,
      marginTop: 2,
    },
    tabLabelInactive: {
      color: theme.onSurfaceVariant,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      marginTop: -20,
      shadowColor: theme.surfaceTint,
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  });
