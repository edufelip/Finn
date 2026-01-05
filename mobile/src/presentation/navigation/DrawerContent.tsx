import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../app/providers/AuthProvider';
import { usePresence } from '../../app/providers/PresenceProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { supabase } from '../../data/supabase/client';
import type { User } from '../../domain/models/user';
import { colors } from '../theme/colors';
import { drawerCopy } from '../content/drawerCopy';
import { commonCopy } from '../content/commonCopy';
import { links } from '../../config/links';

const iconSize = 20;

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { users: userRepository, posts: postRepository } = useRepositories();
  const { isOnline, isOnlineVisible } = usePresence();
  const [user, setUser] = useState<User | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    let mounted = true;
    userRepository
      .getUser(session.user.id)
      .then((data) => {
        if (mounted) {
          setUser(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [session?.user?.id, userRepository]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let mounted = true;
    postRepository
      .getSavedPostsCount(session.user.id)
      .then((count) => {
        if (mounted) {
          setSavedCount(count);
        }
      })
      .catch(() => {
        if (mounted) {
          setSavedCount(0);
        }
      });

    return () => {
      mounted = false;
    };
  }, [session?.user?.id, postRepository]);

  const displayName = user?.name ?? session?.user?.email ?? commonCopy.userFallback;
  const email = session?.user?.email ?? commonCopy.emptyDash;
  const photo = user?.photoUrl ? { uri: user.photoUrl } : require('../../../assets/user_icon.png');
  const statusColor = isOnline && isOnlineVisible ? colors.drawerStatusOnline : colors.drawerStatusOffline;
  const savedBadge = savedCount && savedCount > 0 ? String(savedCount) : null;

  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? commonCopy.emptyDash;
  const versionLabel = drawerCopy.versionLabel(appVersion);

  const navigateTo = (screen: string) => {
    navigation.closeDrawer();
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate(screen as never);
    }
  };

  const showUnavailable = () => {
    Alert.alert(drawerCopy.alerts.unavailable.title, drawerCopy.alerts.unavailable.message);
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image source={photo} style={styles.avatar} />
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{drawerCopy.sections.main}</Text>
          <Pressable
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
            onPress={() => navigateTo('Profile')}
            testID={drawerCopy.testIds.profile}
          >
            <MaterialIcons name="person" size={iconSize} color={colors.drawerIcon} />
            <Text style={styles.navLabel}>{drawerCopy.profile}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
            onPress={() => navigateTo('SavedPosts')}
            testID={drawerCopy.testIds.saved}
          >
            <MaterialIcons name="bookmark-border" size={iconSize} color={colors.drawerIcon} />
            <Text style={styles.navLabel}>{drawerCopy.saved}</Text>
            {savedBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{savedBadge}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
            onPress={() => navigateTo('Profile')}
            testID={drawerCopy.testIds.posts}
          >
            <MaterialIcons name="article" size={iconSize} color={colors.drawerIcon} />
            <Text style={styles.navLabel}>{drawerCopy.posts}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{drawerCopy.sections.system}</Text>
          <Pressable
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
            onPress={() => navigateTo('Settings')}
            testID={drawerCopy.testIds.settings}
          >
            <MaterialIcons name="settings" size={iconSize} color={colors.drawerIcon} />
            <Text style={styles.navLabel}>{drawerCopy.settings}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
            onPress={() => Linking.openURL(links.privacyPolicy)}
            testID={drawerCopy.testIds.privacy}
          >
            <MaterialIcons name="security" size={iconSize} color={colors.drawerIcon} />
            <Text style={styles.navLabel}>{drawerCopy.privacyPolicy}</Text>
          </Pressable>
        </View>
      </DrawerContentScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
      >
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <MaterialIcons name="dark-mode" size={18} color={colors.drawerIcon} />
            <Text style={styles.toggleText}>{drawerCopy.darkMode}</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={(value) => {
              setDarkMode(value);
              showUnavailable();
            }}
            trackColor={{ false: colors.drawerToggleTrack, true: colors.drawerToggleTrackActive }}
            thumbColor={darkMode ? colors.drawerToggleThumbActive : colors.drawerToggleThumb}
            testID={drawerCopy.testIds.darkMode}
            accessibilityLabel={drawerCopy.testIds.darkMode}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
          onPress={() => {
            Alert.alert(drawerCopy.alerts.logout.title, drawerCopy.alerts.logout.message, [
              { text: drawerCopy.alerts.logout.cancel, style: 'cancel' },
              {
                text: drawerCopy.alerts.logout.confirm,
                style: 'destructive',
                onPress: () => {
                  supabase.auth.signOut();
                },
              },
            ]);
          }}
          testID={drawerCopy.testIds.logout}
        >
          <MaterialIcons name="logout" size={18} color={colors.drawerLogout} />
          <Text style={styles.logoutText}>{drawerCopy.logout}</Text>
        </Pressable>
        <Text style={styles.version}>{versionLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.drawerBackground,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.drawerDivider,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.drawerBorder,
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.drawerBackground,
  },
  headerText: {
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.drawerTextMain,
  },
  email: {
    fontSize: 12,
    color: colors.drawerTextSub,
  },
  section: {
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  sectionTitle: {
    paddingHorizontal: 8,
    marginBottom: 8,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.drawerSectionLabel,
    fontWeight: '700',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  navItemPressed: {
    backgroundColor: colors.drawerItemHover,
  },
  navLabel: {
    fontSize: 14,
    color: colors.drawerTextSub,
    fontWeight: '600',
  },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.drawerBadgeBackground,
    borderWidth: 1,
    borderColor: colors.drawerBadgeBorder,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.drawerBadgeText,
  },
  sectionDivider: {
    marginTop: 16,
    height: 1,
    backgroundColor: colors.drawerSectionDivider,
    marginHorizontal: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.drawerDivider,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.drawerFooterBackground,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.drawerBorder,
    backgroundColor: colors.drawerBackground,
    marginBottom: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.drawerTextMain,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  logoutPressed: {
    backgroundColor: colors.drawerLogoutHover,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.drawerLogout,
  },
  version: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 10,
    color: colors.drawerVersion,
    fontWeight: '600',
  },
});
