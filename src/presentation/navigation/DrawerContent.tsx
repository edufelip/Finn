import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../app/providers/AuthProvider';
import { usePresence } from '../../app/providers/PresenceProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useTheme, useThemeColors } from '../../app/providers/ThemeProvider';
import { supabase } from '../../data/supabase/client';
import type { User } from '../../domain/models/user';
import type { ThemeColors } from '../theme/colors';
import { drawerCopy } from '../content/drawerCopy';
import { commonCopy } from '../content/commonCopy';
import { links } from '../../config/links';
import { guestCopy } from '../content/guestCopy';

const iconSize = 20;

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const { session, isGuest, exitGuest } = useAuth();
  const { users: userRepository, posts: postRepository } = useRepositories();
  const { isOnline, isOnlineVisible } = usePresence();
  const { toggleTheme, isDark } = useTheme();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [user, setUser] = useState<User | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

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

  const displayName = isGuest ? guestCopy.userLabel : user?.name ?? session?.user?.email ?? commonCopy.userFallback;
  const email = isGuest ? guestCopy.banner.title : session?.user?.email ?? commonCopy.emptyDash;
  const photo = user?.photoUrl ? { uri: user.photoUrl } : require('../../../assets/user_icon.png');
  const statusColor = isOnline && isOnlineVisible ? theme.secondary : theme.outlineVariant;
  const savedBadge = savedCount && savedCount > 0 ? String(savedCount) : null;

  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? commonCopy.emptyDash;
  const versionLabel = drawerCopy.versionLabel(appVersion);
  const navigate = navigation.navigate as unknown as (screen: string, params?: Record<string, unknown>) => void;
  const parentNavigate = navigation.getParent()?.navigate as
    | ((screen: string, params?: Record<string, unknown>) => void)
    | undefined;

  const navigateTo = (screen: string) => {
    navigation.closeDrawer();
    if (screen === 'Profile') {
      navigate('Tabs', { screen: 'Profile' });
      return;
    }
    if (parentNavigate) {
      parentNavigate(screen);
    }
  };

  const openWebView = (title: string, url?: string) => {
    if (!url) {
      Alert.alert(drawerCopy.alerts.unavailable.title, drawerCopy.alerts.unavailable.message);
      return;
    }
    navigation.closeDrawer();
    if (parentNavigate) {
      parentNavigate('WebView', { title, url });
    }
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
        {isGuest ? (
          <View style={styles.guestCtaRow}>
            <Pressable
              style={({ pressed }) => [styles.guestCta, pressed && styles.guestCtaPressed]}
              onPress={() => {
                navigation.closeDrawer();
                void exitGuest();
              }}
            >
              <Text style={styles.guestCtaText}>{guestCopy.restricted.cta}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{drawerCopy.sections.main}</Text>
          <Pressable
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
            onPress={() => navigateTo('Profile')}
            testID={drawerCopy.testIds.profile}
          >
            <MaterialIcons name="person" size={iconSize} color={theme.onSurfaceVariant} />
            <Text style={styles.navLabel}>{drawerCopy.profile}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
            onPress={() => navigateTo('SavedPosts')}
            testID={drawerCopy.testIds.saved}
          >
            <MaterialIcons name="bookmark-border" size={iconSize} color={theme.onSurfaceVariant} />
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
            <MaterialIcons name="article" size={iconSize} color={theme.onSurfaceVariant} />
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
            <MaterialIcons name="settings" size={iconSize} color={theme.onSurfaceVariant} />
            <Text style={styles.navLabel}>{drawerCopy.settings}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
            onPress={() => openWebView(drawerCopy.privacyPolicy, links.privacyPolicy)}
            testID={drawerCopy.testIds.privacy}
          >
            <MaterialIcons name="security" size={iconSize} color={theme.onSurfaceVariant} />
            <Text style={styles.navLabel}>{drawerCopy.privacyPolicy}</Text>
          </Pressable>
        </View>
      </DrawerContentScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <MaterialIcons name="dark-mode" size={18} color={theme.onSurfaceVariant} />
            <Text style={styles.toggleText}>{drawerCopy.darkMode}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(value) => {
              toggleTheme();
            }}
            trackColor={{ false: theme.outline, true: theme.primary }}
            thumbColor={isDark ? theme.onPrimary : theme.onSurface}
            testID={drawerCopy.testIds.darkMode}
            accessibilityLabel={drawerCopy.testIds.darkMode}
          />
        </View>
        {isGuest ? null : (
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
            <MaterialIcons name="logout" size={18} color={theme.error} />
            <Text style={styles.logoutText}>{drawerCopy.logout}</Text>
          </Pressable>
        )}
        <Text style={styles.version}>{versionLabel}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
    },
    avatarWrapper: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.outline,
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
      borderColor: theme.surface,
    },
    headerText: {
      gap: 4,
    },
    name: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onSurface,
    },
    email: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
    section: {
      paddingHorizontal: 12,
      paddingTop: 20,
    },
    guestCtaRow: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    guestCta: {
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guestCtaPressed: {
      opacity: 0.9,
    },
    guestCtaText: {
      color: theme.onPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionTitle: {
      paddingHorizontal: 8,
      marginBottom: 8,
      fontSize: 10,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: theme.onSurfaceVariant,
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
      backgroundColor: theme.surfaceVariant,
    },
    navLabel: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
      fontWeight: '600',
    },
    badge: {
      marginLeft: 'auto',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: theme.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.onSurfaceVariant,
    },
    sectionDivider: {
      marginTop: 16,
      height: 1,
      backgroundColor: theme.outlineVariant,
      marginHorizontal: 20,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: theme.outlineVariant,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: theme.surfaceVariant,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
      backgroundColor: theme.surface,
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
      color: theme.onSurface,
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
      backgroundColor: theme.errorContainer,
    },
    logoutText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.error,
    },
    version: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: 10,
      color: theme.onSurfaceVariant,
      fontWeight: '600',
    },
  });
