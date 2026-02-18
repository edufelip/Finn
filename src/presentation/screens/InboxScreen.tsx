import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { inboxCopy, type InboxTabKey } from '../content/inboxCopy';
import { useTheme, useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import ScreenFade from '../components/ScreenFade';
import { useAuth } from '../../app/providers/AuthProvider';
import { useInboxBadge } from '../../app/providers/InboxBadgeProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import GuestGateScreen from '../components/GuestGateScreen';
import { guestCopy } from '../content/guestCopy';
import type { ChatThread } from '../../domain/models/chat';
import type { User } from '../../domain/models/user';
import type { MainStackParamList } from '../navigation/MainStack';
import { supabase } from '../../data/supabase/client';
import { isMockMode } from '../../config/appConfig';
import TabSafeAreaView from '../components/TabSafeAreaView';
import { formatTimeAgo } from '../i18n/formatters';

import { useLocalization } from '../../app/providers/LocalizationProvider';

type SectionKey = 'unread' | 'earlier';

type ThreadWithUser = ChatThread & {
  peer: User | null;
  unread: boolean;
};

type Section = {
  key: SectionKey;
  title: string;
  data: ThreadWithUser[];
};

export default function InboxScreen() {
  useLocalization();
  const { isGuest, exitGuest, session } = useAuth();
  const { chats: chatRepository, users: userRepository } = useRepositories();
  const { setHasUnread } = useInboxBadge();
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const theme = useThemeColors();
  const { isDark } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reduceMotion = useReducedMotion();
  const indicatorCenter = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabProgress = useSharedValue(0);
  const indicatorDuration = reduceMotion ? 0 : 200;
  const [activeTab, setActiveTab] = useState<InboxTabKey>('primary');
  const [tabLayouts, setTabLayouts] = useState<{
    primary?: { center: number; width: number };
    requests?: { center: number; width: number };
    archived?: { center: number; width: number };
  }>({});
  const [query, setQuery] = useState('');
  const [allThreads, setAllThreads] = useState<ThreadWithUser[]>([]); // Cache all threads
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Refetch function to update threads
  const refetchThreads = useCallback(async () => {
    if (!session?.user?.id || isGuest) return;

    try {
      // Fetch threads from all three tabs
      const [primaryThreads, requestThreads, archivedThreads] = await Promise.all([
        chatRepository.getThreadsForUser(session.user.id, 'primary'),
        chatRepository.getThreadsForUser(session.user.id, 'requests'),
        chatRepository.getThreadsForUser(session.user.id, 'archived'),
      ]);

      // Combine all threads (use a Set to avoid duplicates)
      const allRawThreads = [...primaryThreads, ...requestThreads, ...archivedThreads];
      const uniqueThreads = Array.from(
        new Map(allRawThreads.map((t) => [t.id, t])).values()
      );

      // Extract unique peer IDs
      const peerIds = uniqueThreads.map((thread) =>
        thread.participantA === session.user.id ? thread.participantB : thread.participantA
      );

      // Batch fetch all peer users
      const peerMap = await userRepository.getUsersBatch(peerIds);

      // Fetch member status for unread detection
      const threadsWithUsers = await Promise.all(
        uniqueThreads.map(async (thread) => {
          const peerId =
            thread.participantA === session.user.id ? thread.participantB : thread.participantA;
          const peer = peerMap.get(peerId) ?? null;
          const memberStatus = await chatRepository.getMemberStatus(thread.id, session.user.id);

          // Calculate unread status (only when the last message is from someone else)
          let unread = false;
          if (thread.lastMessageAt) {
            const lastReadAt = memberStatus?.lastReadAt;
            const lastSenderId = thread.lastMessageSenderId;
            if (lastSenderId && lastSenderId !== session.user.id) {
              if (!lastReadAt) {
                // Never read, so it's unread
                unread = true;
              } else {
                // Compare timestamps - unread if last message is newer than last read
                unread = new Date(thread.lastMessageAt) > new Date(lastReadAt);
              }
            }
          }

          return {
            ...thread,
            peer,
            unread,
          };
        })
      );

      setAllThreads(threadsWithUsers);
    } catch (error) {
      console.error('Failed to refetch threads:', error);
    }
  }, [session?.user?.id, isGuest, chatRepository, userRepository]);

  // Fetch ALL threads once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchAllThreads = async () => {
      if (!session?.user?.id || isGuest) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await refetchThreads();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchAllThreads();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, isGuest, refetchThreads]);

  // Real-time subscription for new messages and thread updates
  useEffect(() => {
    if (!session?.user?.id || isGuest || isMockMode()) return;

    const channel = supabase
      .channel('inbox-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_threads',
          filter: `participant_a=eq.${session.user.id},participant_b=eq.${session.user.id}`,
        },
        () => {
          // Refetch threads when any thread is updated
          void refetchThreads();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          // Refetch threads when new messages arrive
          void refetchThreads();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [session?.user?.id, isGuest, refetchThreads]);

  // Filter threads based on active tab (client-side filtering)
  const filteredThreads = useMemo(() => {
    if (!session?.user?.id) return [];

    return allThreads.filter((thread) => {
      if (activeTab === 'primary') {
        // Primary: accepted threads not archived by user
        return thread.requestStatus === 'accepted' && !thread.archivedBy.includes(session.user.id);
      } else if (activeTab === 'requests') {
        // Requests: pending threads where user is recipient (not creator) and not archived
        return (
          thread.requestStatus === 'pending' &&
          thread.createdBy !== session.user.id &&
          !thread.archivedBy.includes(session.user.id)
        );
      } else if (activeTab === 'archived') {
        // Archived: threads archived by user
        return thread.archivedBy.includes(session.user.id);
      }
      return false;
    });
  }, [allThreads, activeTab, session?.user?.id]);

  const messages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return filteredThreads.filter((thread) => {
      if (!normalized) return true;
      const peerName = thread.peer?.name || '';
      const preview = thread.lastMessagePreview || '';
      return (
        peerName.toLowerCase().includes(normalized) ||
        preview.toLowerCase().includes(normalized)
      );
    });
  }, [filteredThreads, query]);

  const sections = useMemo<Section[]>(() => {
    const unread = messages.filter((item) => item.unread);
    const earlier = messages.filter((item) => !item.unread);
    const result: Section[] = [];
    if (unread.length) result.push({ key: 'unread', title: inboxCopy.sections.unread, data: unread });
    if (earlier.length) result.push({ key: 'earlier', title: inboxCopy.sections.earlier, data: earlier });
    return result;
  }, [messages]);

  // Update global badge state whenever we have unread messages or requests
  useEffect(() => {
    const totalUnread = allThreads.filter((thread) => {
      if (!session?.user?.id) return false;
      // Count unread in primary (accepted, not archived)
      if (thread.requestStatus === 'accepted' && !thread.archivedBy.includes(session.user.id)) {
        return thread.unread;
      }
      return false;
    }).length;

    setHasUnread(totalUnread > 0);
  }, [allThreads, session?.user?.id, setHasUnread]);

  const animateIndicator = (key: InboxTabKey) => {
    const target = tabLayouts[key];
    if (!target) return;
    indicatorCenter.value = withTiming(target.center, { duration: indicatorDuration });
    indicatorWidth.value = withTiming(target.width, { duration: indicatorDuration });
    const nextIndex = key === 'primary' ? 0 : key === 'requests' ? 1 : 2;
    tabProgress.value = withTiming(nextIndex, { duration: indicatorDuration });
  };

  const handleTabPress = (key: InboxTabKey) => {
    setActiveTab(key);
    animateIndicator(key);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorCenter.value - indicatorWidth.value / 2 }],
    width: indicatorWidth.value,
  }));

  const primaryLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 1, 2], [theme.primary, theme.onSurfaceVariant, theme.onSurfaceVariant]),
  }));

  const requestsLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 1, 2], [theme.onSurfaceVariant, theme.primary, theme.onSurfaceVariant]),
  }));

  const archivedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 1, 2], [theme.onSurfaceVariant, theme.onSurfaceVariant, theme.primary]),
  }));

  if (isGuest) {
    return (
      <ScreenFade onlyOnTabSwitch>
        <GuestGateScreen
          title={guestCopy.restricted.title(guestCopy.features.inbox)}
          body={guestCopy.restricted.body(guestCopy.features.inbox)}
          onSignIn={() => void exitGuest()}
        />
      </ScreenFade>
    );
  }

  const renderSection = (section: Section) => {
    const handleThreadPress = (thread: ThreadWithUser) => {
      if (!thread.peer) return;
      
      navigation.navigate('Chat', {
        userId: thread.peer.id,
        user: thread.peer,
        threadId: thread.id,
        isRequest: activeTab === 'requests',
      });
    };

    return (
      <View key={section.key}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        {section.data.map((thread) => {
          const peerName = thread.peer?.name || 'Unknown User';
          const peerPhoto = thread.peer?.photoUrl;
          const isOnline = thread.peer?.lastSeenAt && new Date(thread.peer.lastSeenAt) > new Date(Date.now() - 5 * 60 * 1000);
          const timeAgo = thread.lastMessageAt ? formatTimeAgo(thread.lastMessageAt) : '';
          
          return (
            <Pressable 
              key={thread.id} 
              style={({ pressed }) => [styles.messageRow, pressed && styles.messageRowPressed]}
              onPress={() => handleThreadPress(thread)}
            >
              {thread.unread ? <View style={styles.unreadIndicator} /> : null}
              <View style={styles.avatarWrap}>
                {peerPhoto ? (
                  <Image source={{ uri: peerPhoto }} style={styles.avatarCircle} />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{getInitials(peerName)}</Text>
                  </View>
                )}
                {isOnline ? <View style={styles.onlineDot} /> : null}
              </View>
              <View style={styles.messageBody}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageName} numberOfLines={1}>
                    {peerName}
                  </Text>
                  <Text style={[styles.messageTime, thread.unread && styles.messageTimeUnread]}>
                    {timeAgo}
                  </Text>
                </View>
                <Text style={styles.messagePreview} numberOfLines={2}>
                  {thread.lastMessagePreview || 'No messages yet'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const showEmpty = !loading && messages.length === 0;

  return (
    <TabSafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={theme.background} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{inboxCopy.title}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={18} color={theme.onSurfaceVariant} />
            <TextInput
              testID={inboxCopy.testIds.searchInput}
              placeholder={inboxCopy.searchPlaceholder}
              placeholderTextColor={theme.onSurfaceVariant}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
          </View>
          <View style={styles.tabsRow}>
            <Pressable
              testID={inboxCopy.testIds.tabPrimary}
              onPress={() => handleTabPress('primary')}
              style={styles.tabButton}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                const center = x + width / 2;
                setTabLayouts((prev) => {
                  if (prev.primary && prev.primary.center === center && prev.primary.width === width) return prev;
                  return { ...prev, primary: { center, width } };
                });
                if (activeTab === 'primary') {
                  // Reanimated shared values are mutable by design.
                  // eslint-disable-next-line react-hooks/immutability
                  indicatorCenter.value = center;
                  // eslint-disable-next-line react-hooks/immutability
                  indicatorWidth.value = width;
                }
              }}
            >
              <Animated.Text style={[styles.tabLabel, primaryLabelStyle]}>
                {inboxCopy.tabs.primary}
              </Animated.Text>
            </Pressable>
            <Pressable
              testID={inboxCopy.testIds.tabRequests}
              onPress={() => handleTabPress('requests')}
              style={styles.tabButton}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                const center = x + width / 2;
                setTabLayouts((prev) => {
                  if (prev.requests && prev.requests.center === center && prev.requests.width === width) return prev;
                  return { ...prev, requests: { center, width } };
                });
                if (activeTab === 'requests') {
                  // Reanimated shared values are mutable by design.
                  // eslint-disable-next-line react-hooks/immutability
                  indicatorCenter.value = center;
                  // eslint-disable-next-line react-hooks/immutability
                  indicatorWidth.value = width;
                }
              }}
            >
              <Animated.Text style={[styles.tabLabel, requestsLabelStyle]}>
                {inboxCopy.tabs.requests}
              </Animated.Text>
            </Pressable>
            <Pressable
              testID={inboxCopy.testIds.tabArchived}
              onPress={() => handleTabPress('archived')}
              style={styles.tabButton}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                const center = x + width / 2;
                setTabLayouts((prev) => {
                  if (prev.archived && prev.archived.center === center && prev.archived.width === width) return prev;
                  return { ...prev, archived: { center, width } };
                });
                if (activeTab === 'archived') {
                  // Reanimated shared values are mutable by design.
                  // eslint-disable-next-line react-hooks/immutability
                  indicatorCenter.value = center;
                  // eslint-disable-next-line react-hooks/immutability
                  indicatorWidth.value = width;
                }
              }}
            >
              <Animated.Text style={[styles.tabLabel, archivedLabelStyle]}>
                {inboxCopy.tabs.archived}
              </Animated.Text>
            </Pressable>
            <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
          </View>
        </View>
        <ScreenFade onlyOnTabSwitch>
          <FlatList
            data={sections}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => renderSection(item)}
            contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight }]}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              ) : showEmpty ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="mail-outline" size={40} color={theme.onSurfaceVariant} />
                  <Text style={styles.emptyTitle}>{inboxCopy.empty.title}</Text>
                  <Text style={styles.emptyBody}>{inboxCopy.empty.body}</Text>
                </View>
              ) : null
            }
          />
        </ScreenFade>
      </View>
    </TabSafeAreaView>
  );
}

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[1][0] : '';
  return `${first}${second}`.toUpperCase();
};


const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    body: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 6,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.onSurface,
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 12,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      gap: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: theme.onSurface,
    },
    tabsRow: {
      position: 'relative',
      flexDirection: 'row',
      gap: 20,
      paddingHorizontal: 16,
      marginTop: 8,
      marginBottom: 0,
    },
    tabButton: {
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: theme.background,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: '500',
    },
    tabIndicator: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: 2,
      backgroundColor: theme.primary,
      borderRadius: 1,
      pointerEvents: 'none',
    },
    listContent: {
      backgroundColor: theme.background,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: theme.onSurfaceVariant,
      letterSpacing: 0.6,
    },
    messageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
      gap: 12,
    },
    messageRowPressed: {
      backgroundColor: theme.surfaceVariant,
    },
    unreadIndicator: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: theme.primary,
    },
    avatarWrap: {
      position: 'relative',
    },
    avatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.onSurface,
    },
    onlineDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.secondary,
      borderWidth: 2,
      borderColor: theme.surface,
    },
    messageBody: {
      flex: 1,
      gap: 4,
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    messageName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: theme.onSurface,
    },
    messageTime: {
      fontSize: 11,
      color: theme.onSurfaceVariant,
      fontWeight: '600',
    },
    messageTimeUnread: {
      color: theme.primary,
    },
    messageRole: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
      fontWeight: '500',
    },
    messagePreview: {
      fontSize: 13,
      color: theme.onSurface,
      fontWeight: '600',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 32,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onSurface,
      textAlign: 'center',
    },
    emptyBody: {
      fontSize: 13,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
    },
  });
