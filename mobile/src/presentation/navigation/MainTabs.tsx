import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CreateBottomSheet from '../components/CreateBottomSheet';
import type { MainStackParamList } from './MainStack';
import { colors } from '../theme/colors';
import { tabCopy } from '../content/tabCopy';

export type MainTabParamList = {
  Home: undefined;
  Add: undefined;
  Search: { focus?: boolean } | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const EmptyScreen = () => <View />;

export default function MainTabs() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [createOpen, setCreateOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);
  const tabColor = (focused?: boolean) => (focused ? colors.mainBlue : colors.darkGrey);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, { paddingBottom: 24 + insets.bottom, height: 72 + insets.bottom }],
          tabBarActiveTintColor: colors.mainBlue,
          tabBarInactiveTintColor: colors.darkGrey,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarButton: (props) => {
              const focused = props.accessibilityState?.selected;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={props.accessibilityState}
                  onPress={props.onPress}
                  onLongPress={props.onLongPress}
                  style={[styles.tabButton, props.style]}
                  testID={tabCopy.testIds.home}
                  accessibilityLabel={tabCopy.testIds.home}
                >
                  <MaterialIcons name="home" size={24} color={tabColor(focused)} />
                  <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tabCopy.home}</Text>
                </Pressable>
              );
            },
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
                  <MaterialIcons name="add" size={26} color={colors.white} />
                </View>
                <Text style={styles.tabLabel}>{tabCopy.add}</Text>
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
            tabBarButton: (props) => {
              const focused = props.accessibilityState?.selected;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={props.accessibilityState}
                  onPress={props.onPress}
                  onLongPress={props.onLongPress}
                  style={[styles.tabButton, props.style]}
                  testID={tabCopy.testIds.search}
                  accessibilityLabel={tabCopy.testIds.search}
                >
                  <MaterialIcons name="search" size={24} color={tabColor(focused)} />
                  <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tabCopy.search}</Text>
                </Pressable>
              );
            },
          }}
        />
        <Tab.Screen
          name="Profile"
          component={EmptyScreen}
          options={{
            tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
            tabBarLabel: tabCopy.profile,
            tabBarTestID: tabCopy.testIds.profile,
            tabBarButton: (props) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Profile')}
                style={[styles.tabButton, props.style]}
                testID={tabCopy.testIds.profile}
                accessibilityLabel={tabCopy.testIds.profile}
              >
                <MaterialIcons name="person" size={24} color={colors.darkGrey} />
                <Text style={styles.tabLabel}>{tabCopy.profile}</Text>
              </Pressable>
            ),
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
    height: 72,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.darkGrey,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.mainBlue,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.homePrimary,
    marginTop: -20,
    shadowColor: colors.homePrimary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
