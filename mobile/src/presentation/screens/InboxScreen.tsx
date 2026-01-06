import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { inboxCopy, type InboxMessage, type InboxTabKey } from '../content/inboxCopy';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import ScreenFade from '../components/ScreenFade';

type SectionKey = 'unread' | 'earlier';

type Section = {
  key: SectionKey;
  title: string;
  data: InboxMessage[];
};

export default function InboxScreen() {
  const theme = useThemeColors();
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

  const messages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return inboxCopy.messages.filter((item) => {
      if (item.category !== activeTab) return false;
      if (!normalized) return true;
      return (
        item.name.toLowerCase().includes(normalized) ||
        item.role.toLowerCase().includes(normalized) ||
        item.message.toLowerCase().includes(normalized)
      );
    });
  }, [activeTab, query]);

  const sections = useMemo<Section[]>(() => {
    const unread = messages.filter((item) => item.unread);
    const earlier = messages.filter((item) => !item.unread);
    const result: Section[] = [];
    if (unread.length) result.push({ key: 'unread', title: inboxCopy.sections.unread, data: unread });
    if (earlier.length) result.push({ key: 'earlier', title: inboxCopy.sections.earlier, data: earlier });
    return result;
  }, [messages]);

  const unreadCount = useMemo(
    () => inboxCopy.messages.filter((item) => item.category === 'primary' && item.unread).length,
    []
  );

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

  const renderSection = (section: Section) => (
    <View key={section.key}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      {section.data.map((item) => (
        <Pressable key={item.id} style={({ pressed }) => [styles.messageRow, pressed && styles.messageRowPressed]}>
          {item.unread ? <View style={styles.unreadIndicator} /> : null}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
            {item.online ? <View style={styles.onlineDot} /> : null}
          </View>
          <View style={styles.messageBody}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.messageTime, item.unread && styles.messageTimeUnread]}>{item.time}</Text>
            </View>
            <Text style={styles.messageRole} numberOfLines={1}>
              {item.role}
            </Text>
            <Text style={styles.messagePreview} numberOfLines={1}>
              {item.message}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const showEmpty = messages.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={theme.surface} barStyle="dark-content" />
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
            {unreadCount > 0 && activeTab === 'primary' ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            ) : null}
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
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            showEmpty ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="mail-outline" size={40} color={theme.onSurfaceVariant} />
                <Text style={styles.emptyTitle}>{inboxCopy.empty.title}</Text>
                <Text style={styles.emptyBody}>{inboxCopy.empty.body}</Text>
              </View>
            ) : null
          }
        />
      </ScreenFade>
    </SafeAreaView>
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
    header: {
      backgroundColor: theme.surface,
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
      borderBottomColor: theme.surface,
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
    unreadBadge: {
      position: 'absolute',
      top: -6,
      right: -18,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    unreadBadgeText: {
      fontSize: 10,
      color: theme.onPrimary,
      fontWeight: '700',
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
