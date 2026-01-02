import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import MainTabs from './MainTabs';
import DrawerContent from './DrawerContent';
import { colors } from '../theme/colors';

export type MainDrawerParamList = {
  Tabs: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export default function MainDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 280 },
        drawerActiveTintColor: colors.mainBlue,
        drawerInactiveTintColor: colors.darkGrey,
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="Tabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}
