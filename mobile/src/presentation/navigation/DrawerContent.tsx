import React, { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { supabase } from '../../data/supabase/client';
import type { User } from '../../domain/models/user';
import { colors } from '../theme/colors';
import { drawerCopy } from '../content/drawerCopy';
import { commonCopy } from '../content/commonCopy';
import { links } from '../../config/links';

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const { session } = useAuth();
  const { users: userRepository } = useRepositories();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    userRepository
      .getUser(session.user.id)
      .then((data) => setUser(data))
      .catch(() => {
        setUser(null);
      });
  }, [session?.user?.id, userRepository]);

  const displayName = user?.name ?? session?.user?.email ?? commonCopy.userFallback;
  const email = session?.user?.email ?? '';
  const photo = user?.photoUrl ? { uri: user.photoUrl } : require('../../../assets/user_icon.png');

  const navigateTo = (screen: string) => {
    navigation.closeDrawer();
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate(screen as never);
    }
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarOuter}>
            <Image source={photo} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
        <View style={styles.menu}>
          <DrawerItem
            label={drawerCopy.profile}
            icon={({ color, size }) => <MaterialIcons name="person-outline" size={size} color={color} />}
            onPress={() => navigateTo('Profile')}
            labelStyle={styles.label}
            testID={drawerCopy.testIds.profile}
          />
          <DrawerItem
            label={drawerCopy.saved}
            icon={({ color, size }) => <MaterialIcons name="bookmark-border" size={size} color={color} />}
            onPress={() => navigateTo('SavedPosts')}
            labelStyle={styles.label}
            testID={drawerCopy.testIds.saved}
          />
          <DrawerItem
            label={drawerCopy.posts}
            icon={({ color, size }) => <MaterialIcons name="content-copy" size={size} color={color} />}
            onPress={() => navigateTo('Profile')}
            labelStyle={styles.label}
          />
          <DrawerItem
            label={drawerCopy.settings}
            icon={({ color, size }) => <MaterialIcons name="settings" size={size} color={color} />}
            onPress={() => navigateTo('Settings')}
            labelStyle={styles.label}
            testID={drawerCopy.testIds.settings}
          />
          <DrawerItem
            label={drawerCopy.privacyPolicy}
            icon={({ color, size }) => <MaterialIcons name="security" size={size} color={color} />}
            onPress={() => Linking.openURL(links.privacyPolicy)}
            labelStyle={styles.label}
          />
        </View>
      </DrawerContentScrollView>
      <Pressable
        style={styles.logout}
        onPress={() => {
          supabase.auth.signOut();
        }}
      >
        <Text style={styles.logoutText}>{drawerCopy.logout}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  header: {
    height: 180,
    backgroundColor: colors.mainBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    marginTop: 10,
    marginBottom: -10,
    color: colors.white,
    fontWeight: '600',
  },
  email: {
    marginTop: 8,
    color: colors.white,
  },
  menu: {
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
  },
  logout: {
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.darkGrey,
  },
});
