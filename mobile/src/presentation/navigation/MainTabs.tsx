import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CreateBottomSheet from '../components/CreateBottomSheet';
import type { MainStackParamList } from './MainStack';
import { colors } from '../theme/colors';

export type MainTabParamList = {
  Home: undefined;
  Add: undefined;
  Search: { focus?: boolean } | undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const EmptyScreen = () => <View />;

export default function MainTabs() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [createOpen, setCreateOpen] = useState(false);

  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.mainBlue,
          tabBarInactiveTintColor: colors.darkGrey,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
            tabBarTestID: 'tab-home',
          }}
        />
        <Tab.Screen
          name="Add"
          component={EmptyScreen}
          options={{
            tabBarLabel: 'Add',
            tabBarIcon: ({ color }) => <MaterialIcons name="add" size={24} color={color} />,
            tabBarButton: (props) => (
              <Pressable
                accessibilityRole="button"
                onPress={openCreate}
                style={[styles.tabButton, props.style]}
                testID="tab-add"
                accessibilityLabel="tab-add"
              >
                <MaterialIcons name="add" size={24} color={colors.darkGrey} />
                <Text style={styles.tabLabel}>Add</Text>
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
          name="Search"
          component={SearchScreen}
          options={{
            tabBarIcon: ({ color }) => <MaterialIcons name="search" size={24} color={color} />,
            tabBarTestID: 'tab-search',
          }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            tabBarIcon: ({ color }) => <MaterialIcons name="notifications" size={24} color={color} />,
            tabBarTestID: 'tab-notifications',
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

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: colors.darkGrey,
    marginTop: 2,
  },
});
