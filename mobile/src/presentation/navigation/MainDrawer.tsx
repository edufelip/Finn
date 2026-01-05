import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import MainTabs from './MainTabs';
import DrawerContent from './DrawerContent';
import { colors } from '../theme/colors';

export type MainDrawerParamList = {
  Tabs: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export default function MainDrawer() {
  const drawerWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return Math.min(screenWidth * 0.8, 320);
  }, []);

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: drawerWidth,
          backgroundColor: colors.drawerBackground,
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          overflow: 'hidden',
        },
        overlayColor: colors.overlayDark,
        drawerActiveTintColor: colors.drawerTextMain,
        drawerInactiveTintColor: colors.drawerTextSub,
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="Tabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}
