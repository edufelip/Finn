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

const PRIVACY_POLICY_URL = 'https://portfolio-edufelip.vercel.app/projects/finn/privacy_policy';

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

  const displayName = user?.name ?? session?.user?.email ?? 'User';
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
            label="Profile"
            icon={({ color, size }) => <MaterialIcons name="person-outline" size={size} color={color} />}
            onPress={() => navigateTo('Profile')}
            labelStyle={styles.label}
            testID="drawer-profile"
          />
          <DrawerItem
            label="Saved"
            icon={({ color, size }) => <MaterialIcons name="bookmark-border" size={size} color={color} />}
            onPress={() => navigateTo('SavedPosts')}
            labelStyle={styles.label}
            testID="drawer-saved"
          />
          <DrawerItem
            label="Posts"
            icon={({ color, size }) => <MaterialIcons name="content-copy" size={size} color={color} />}
            onPress={() => navigateTo('Profile')}
            labelStyle={styles.label}
          />
          <DrawerItem
            label="Settings"
            icon={({ color, size }) => <MaterialIcons name="settings" size={size} color={color} />}
            onPress={() => navigateTo('Settings')}
            labelStyle={styles.label}
            testID="drawer-settings"
          />
          <DrawerItem
            label="Privacy Policy"
            icon={({ color, size }) => <MaterialIcons name="security" size={size} color={color} />}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
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
        <Text style={styles.logoutText}>Log out</Text>
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
