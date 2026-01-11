import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { Notification } from '../../domain/models/notification';
import type { MainStackParamList } from '../navigation/MainStack';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useTheme, useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { notificationsCopy } from '../content/notificationsCopy';
import { formatTimeAgo } from '../i18n/formatters';
import { commonCopy } from '../content/commonCopy';
import GuestGateScreen from '../components/GuestGateScreen';
import { guestCopy } from '../content/guestCopy';

type TabKey = 'all' | 'posts';

type NotificationSection = {
  key: 'new' | 'earlier';
  title: string;
  data: Notification[];
};

export default function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { session, isGuest, exitGuest } = useAuth();
  const { users: userRepository } = useRepositories();
  const theme = useThemeColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reduceMotion = useReducedMotion();
  const indicatorCenter = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabProgress = useSharedValue(0);
  const indicatorDuration = reduceMotion ? 0 : 200;
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [tabsRowX, setTabsRowX] = useState(0);
  const [tabLayouts, setTabLayouts] = useState<{
    all?: { center: number; width: number };
    posts?: { center: number; width: number };
  }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!session?.user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await userRepository.getNotifications(session.user.id);
      setNotifications(data);
    } catch {
      Alert.alert(notificationsCopy.alerts.loadFailed.title, notificationsCopy.alerts.loadFailed.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, userRepository]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const filtered = useMemo(() => {
    if (activeTab === 'posts') {
      return notifications.filter((item) => item.type !== 'follow');
    }
    return notifications;
  }, [activeTab, notifications]);

  const sections = useMemo<NotificationSection[]>(() => {
    const unread = filtered.filter((item) => !item.readAt);
    const read = filtered.filter((item) => item.readAt);
    const next: NotificationSection[] = [];
    if (unread.length) {
      next.push({ key: 'new', title: notificationsCopy.sections.new, data: unread });
    }
    if (read.length) {
      next.push({ key: 'earlier', title: notificationsCopy.sections.earlier, data: read });
    }
    return next;
  }, [filtered]);

  const animateIndicator = useCallback(
    (key: TabKey) => {
      const target = key === 'all' ? tabLayouts.all : tabLayouts.posts;
      if (!target) return;
      indicatorCenter.value = withTiming(target.center, { duration: indicatorDuration });
      indicatorWidth.value = withTiming(target.width, { duration: indicatorDuration });
      tabProgress.value = withTiming(key === 'all' ? 0 : 1, { duration: indicatorDuration });
    },
    [indicatorCenter, indicatorDuration, indicatorWidth, tabLayouts.all, tabLayouts.posts, tabProgress]
  );

  const handleTabPress = (key: TabKey) => {
    setActiveTab(key);
    animateIndicator(key);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorCenter.value - indicatorWidth.value / 2 }],
    width: indicatorWidth.value,
  }));

  const allLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 1], [theme.primary, theme.onSurfaceVariant]),
  }));

  const postsLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 1], [theme.onSurfaceVariant, theme.primary]),
  }));

  if (isGuest) {
    return (
      <GuestGateScreen
        title={guestCopy.restricted.title(guestCopy.features.notifications)}
        body={guestCopy.restricted.body(guestCopy.features.notifications)}
        onSignIn={() => void exitGuest()}
      />
    );
  }

  const handleMarkAllRead = async () => {
    if (!session?.user?.id || markingRead) return;
    setMarkingRead(true);
    try {
      await userRepository.markAllNotificationsRead(session.user.id);
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? now })));
    } catch {
      Alert.alert(notificationsCopy.alerts.markReadFailed.title, notificationsCopy.alerts.markReadFailed.message);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleFollowBack = async (notification: Notification) => {
    if (!session?.user?.id) return;
    const actorId = notification.actor.id;
    if (!actorId) return;
    try {
      await userRepository.followUser(session.user.id, actorId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isFollowedByMe: true } : item
        )
      );
    } catch {
      Alert.alert(notificationsCopy.alerts.followFailed.title, notificationsCopy.alerts.followFailed.message);
    }
  };

  const renderSectionHeader = ({ section }: { section: NotificationSection }) => {
    if (section.key === 'new') {
      const canMarkAll = section.data.length > 0 && !markingRead;
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Pressable
            disabled={!canMarkAll}
            onPress={handleMarkAllRead}
            testID={notificationsCopy.testIds.markAllRead}
            style={({ pressed }) => [
              styles.sectionAction,
              (!canMarkAll || pressed) && styles.sectionActionPressed,
            ]}
          >
            <Text style={[styles.sectionActionText, !canMarkAll && styles.sectionActionDisabled]}>
              {notificationsCopy.actions.markAllRead}
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.sectionHeaderSecondary}>
        <Text style={styles.sectionTitleSecondary}>{section.title}</Text>
      </View>
    );
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const name = item.actor?.name || commonCopy.unknownUser;
    const timeLabel = formatTimeAgo(item.createdAt);
    const unread = !item.readAt;
    const isFollow = item.type === 'follow';
    const isLike = item.type === 'post_like';
    const preview = item.metadata?.commentPreview || item.post?.content || '';

    const messageSuffix =
      item.type === 'follow'
        ? notificationsCopy.items.followedYouSuffix
        : item.type === 'post_like'
          ? notificationsCopy.items.likedPostSuffix
          : preview
            ? notificationsCopy.items.commentedPostSuffix(preview)
            : notificationsCopy.items.commentFallback;

    const badgeColor = isFollow ? theme.primary : isLike ? theme.secondary : theme.tertiary;
    const badgeIcon = isFollow ? 'person-add' : isLike ? 'thumb-up' : 'chat-bubble';

    return (
      <View style={[styles.card, unread && styles.cardUnread]}>
        <View style={styles.avatarWrap}>
          {item.actor.photoUrl ? (
            <Image source={{ uri: item.actor.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <MaterialIcons name="person" size={20} color={theme.onSurfaceVariant} />
            </View>
          )}
          <View style={[styles.avatarBadge, { backgroundColor: badgeColor }]}>
            <MaterialIcons name={badgeIcon} size={12} color={theme.onPrimary} />
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardText}>
            <Text style={styles.cardName}>{name}</Text> {messageSuffix}
          </Text>
          <Text style={styles.cardTime}>{timeLabel}</Text>
          {isFollow ? (
            <Pressable
              disabled={item.isFollowedByMe}
              onPress={() => handleFollowBack(item)}
              style={({ pressed }) => [
                styles.followButton,
                item.isFollowedByMe && styles.followButtonDisabled,
                pressed && !item.isFollowedByMe && styles.followButtonPressed,
              ]}
            >
              <Text style={[styles.followButtonText, item.isFollowedByMe && styles.followButtonTextDisabled]}>
                {item.isFollowedByMe ? notificationsCopy.actions.following : notificationsCopy.actions.followBack}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {item.post?.imageUrl ? (
          <Image source={{ uri: item.post.imageUrl }} style={styles.postThumb} />
        ) : item.type !== 'follow' ? (
          <View style={styles.postThumbPlaceholder}>
            <MaterialIcons name="image" size={18} color={theme.onSurfaceVariant} />
          </View>
        ) : null}
        {unread ? <View style={styles.unreadDot} /> : null}
      </View>
    );
  };

  const showEmpty = !loading && filtered.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor={theme.surface} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={22} color={theme.onSurfaceVariant} />
          </Pressable>
          <Text style={styles.title}>{notificationsCopy.title}</Text>
          <View style={styles.iconSpacer} />
        </View>
        <View style={styles.tabsContainer}>
          <View
            style={styles.tabsRow}
            onLayout={(event) => {
              const { x } = event.nativeEvent.layout;
              if (x !== tabsRowX) {
                setTabsRowX(x);
              }
            }}
          >
            <Pressable
              testID={notificationsCopy.testIds.tabAll}
              onPress={() => handleTabPress('all')}
              style={styles.tabButton}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                const center = tabsRowX + x + width / 2;
                setTabLayouts((prev) => {
                  if (prev.all && prev.all.center === center && prev.all.width === width) return prev;
                  return { ...prev, all: { center, width } };
                });
                if (activeTab === 'all') {
                  indicatorCenter.value = center;
                  indicatorWidth.value = width;
                }
              }}
            >
              <Animated.Text style={[styles.tabLabel, allLabelStyle]}>
                {notificationsCopy.tabs.all}
              </Animated.Text>
            </Pressable>
            <Pressable
              testID={notificationsCopy.testIds.tabMyPosts}
              onPress={() => handleTabPress('posts')}
              style={styles.tabButton}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                const center = tabsRowX + x + width / 2;
                setTabLayouts((prev) => {
                  if (prev.posts && prev.posts.center === center && prev.posts.width === width) return prev;
                  return { ...prev, posts: { center, width } };
                });
                if (activeTab === 'posts') {
                  indicatorCenter.value = center;
                  indicatorWidth.value = width;
                }
              }}
            >
              <Animated.Text style={[styles.tabLabel, postsLabelStyle]}>
                {notificationsCopy.tabs.myPosts}
              </Animated.Text>
            </Pressable>
          </View>
          <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
        </View>
      </View>
      <View style={[styles.contentWrap, { paddingBottom: insets.bottom }]}>
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : showEmpty ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-none" size={40} color={theme.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>{notificationsCopy.empty.title}</Text>
            <Text style={styles.emptyBody}>{notificationsCopy.empty.body}</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderNotificationItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            ListFooterComponent={
              loading ? (
                <View style={styles.footer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    header: {
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
    },
    contentWrap: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.onSurface,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconSpacer: {
      width: 36,
      height: 36,
    },
    tabsContainer: {
      paddingBottom: 10,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: 16,
      paddingHorizontal: 16,
    },
    tabButton: {
      paddingBottom: 8,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: '500',
    },
    tabIndicator: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: 0,
      height: 2,
      backgroundColor: theme.primary,
      borderRadius: 1,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.onSurface,
      textAlign: 'center',
    },
    emptyBody: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
    },
    listContent: {
      paddingBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.primaryContainer,
    },
    sectionHeaderSecondary: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.surfaceVariant,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.primary,
    },
    sectionTitleSecondary: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.onSurface,
    },
    sectionAction: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    sectionActionPressed: {
      opacity: 0.6,
    },
    sectionActionText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
    },
    sectionActionDisabled: {
      color: theme.outline,
    },
    card: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
    },
    cardUnread: {
      backgroundColor: theme.primaryContainer,
    },
    avatarWrap: {
      position: 'relative',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    avatarFallback: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardBody: {
      flex: 1,
      gap: 6,
    },
    cardText: {
      fontSize: 13,
      color: theme.onSurface,
      lineHeight: 18,
    },
    cardName: {
      fontWeight: '700',
      color: theme.onSurface,
    },
    cardTime: {
      fontSize: 11,
      color: theme.onSurfaceVariant,
    },
    followButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    followButtonPressed: {
      opacity: 0.7,
    },
    followButtonDisabled: {
      borderColor: theme.outline,
    },
    followButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    followButtonTextDisabled: {
      color: theme.onSurfaceVariant,
    },
    postThumb: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: theme.surfaceVariant,
    },
    postThumbPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadDot: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    footer: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
