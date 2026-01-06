import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import HomeExploreHeader from '../components/HomeExploreHeader';
import type { Community } from '../../domain/models/community';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import type { MainStackParamList } from '../navigation/MainStack';
import type { MainTabParamList } from '../navigation/MainTabs';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { palette } from '../theme/palette';
import { exploreCopy } from '../content/exploreCopy';
import { formatCompactNumber } from '../i18n/formatters';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Explore'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type TopicTone = 'orange' | 'green' | 'purple' | 'blue';

export default function ExploreScreen() {
  const navigation = useNavigation<Navigation>();
  const { session } = useAuth();
  const { communities: communityRepository, users: userRepository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [trending, setTrending] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    userRepository
      .getUser(session.user.id)
      .then((data) => setProfilePhoto(data?.photoUrl ?? null))
      .catch(() => setProfilePhoto(null));
  }, [session?.user?.id, userRepository]);

  const loadTrending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityRepository.getCommunities();
      const sorted = [...data].sort(
        (a, b) => (b.subscribersCount ?? 0) - (a.subscribersCount ?? 0)
      );
      setTrending(sorted.slice(0, exploreCopy.trendingLimit));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [communityRepository]);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  const tagPalette = useMemo(
    () =>
      exploreCopy.trendingTags.map((tag) => ({
        label: tag.label,
        background:
          tag.tone === 'tech'
            ? theme.primary
            : tag.tone === 'travel'
              ? theme.secondary
              : theme.tertiary,
        text:
          tag.tone === 'tech'
            ? theme.onPrimary
            : tag.tone === 'travel'
              ? theme.onSecondary
              : theme.onTertiary,
      })),
    [theme]
  );

  const topicPalette = useMemo(
    () => ({
      orange: {
        background: theme.surfaceVariant,
        border: theme.outlineVariant,
        icon: theme.onSurfaceVariant,
      },
      green: {
        background: theme.secondaryContainer,
        border: theme.secondary,
        icon: theme.onSecondaryContainer,
      },
      purple: {
        background: theme.tertiaryContainer,
        border: theme.tertiary,
        icon: theme.onTertiaryContainer,
      },
      blue: {
        background: theme.primaryContainer,
        border: theme.primary,
        icon: theme.onPrimaryContainer,
      },
    }),
    [theme]
  );

  const openDrawer = () => {
    const parent = navigation.getParent();
    if (parent && 'openDrawer' in parent) {
      (parent as { openDrawer: () => void }).openDrawer();
    }
  };

  const handleSeeAll = () => {
    navigation.navigate('SearchResults', { focus: true });
  };

  const renderTrendingItem = ({
    item,
    index,
  }: {
    item: Community;
    index: number;
  }) => {
    const tag = tagPalette[index % tagPalette.length];
    const members = formatCompactNumber(item.subscribersCount ?? 0);
    const meta = exploreCopy.trendingMembersLabel(members);
    const cardContent = (
      <View style={styles.trendingContent}>
        <View style={[styles.trendingTag, { backgroundColor: tag.background }]}>
          <Text style={[styles.trendingTagText, { color: tag.text }]}>{tag.label}</Text>
        </View>
        <Text
          style={styles.trendingTitle}
          numberOfLines={1}
          testID={exploreCopy.testIds.trendingTitle}
        >
          {item.title || exploreCopy.communityFallback}
        </Text>
        <Text style={styles.trendingMeta}>{meta}</Text>
      </View>
    );

    return (
      <Pressable
        style={styles.trendingCard}
        onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
        testID={exploreCopy.testIds.trendingCard}
      >
        {item.imageUrl ? (
          <ImageBackground source={{ uri: item.imageUrl }} style={styles.trendingImage} imageStyle={styles.imageRadius}>
            <LinearGradient colors={[palette.transparent, theme.scrim]} style={styles.trendingOverlay} />
            {cardContent}
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={[theme.primaryContainer, theme.primary]}
            style={styles.trendingImage}
          >
            <LinearGradient colors={[palette.transparent, theme.scrim]} style={styles.trendingOverlay} />
            {cardContent}
          </LinearGradient>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeExploreHeader
        profilePhoto={profilePhoto}
        placeholder={exploreCopy.searchPlaceholder}
        onPressAvatar={openDrawer}
        onPressSearch={() => navigation.navigate('SearchResults', { focus: true })}
        onPressNotifications={() => navigation.navigate('Notifications')}
        testIds={{
          avatar: exploreCopy.testIds.avatar,
          search: exploreCopy.testIds.search,
          notifications: exploreCopy.testIds.notifications,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{exploreCopy.trendingTitle}</Text>
            <Pressable
              onPress={handleSeeAll}
              testID={exploreCopy.testIds.seeAll}
              accessibilityLabel={exploreCopy.testIds.seeAll}
            >
              <Text style={styles.seeAll}>{exploreCopy.trendingSeeAll}</Text>
            </Pressable>
          </View>
          {loading && trending.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : (
            <FlatList
              testID={exploreCopy.testIds.trendingList}
              horizontal
              data={trending}
              keyExtractor={(item) => `${item.id}`}
              renderItem={renderTrendingItem}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingList}
              ItemSeparatorComponent={() => <View style={styles.trendingSeparator} />}
            />
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{exploreCopy.feedTitle}</Text>
          <View style={styles.feedCard} testID={exploreCopy.testIds.feedCard}>
            <View style={styles.feedIllustration}>
              <View style={styles.feedGlowOuter} />
              <View style={styles.feedGlowInner} />
              <MaterialIcons name="explore" size={54} color={theme.primary} style={styles.feedIcon} />
              <MaterialIcons name="star" size={20} color={theme.tertiary} style={styles.feedStar} />
              <MaterialIcons name="favorite" size={20} color={theme.error} style={styles.feedHeart} />
              <MaterialIcons name="chat-bubble" size={18} color={theme.secondary} style={styles.feedChat} />
            </View>
            <Text style={styles.feedTitle}>{exploreCopy.emptyTitle}</Text>
            <Text style={styles.feedBody}>{exploreCopy.emptyBody}</Text>
            <View style={styles.feedActions}>
              <Pressable style={styles.primaryButton} onPress={handleSeeAll}>
                <MaterialIcons name="explore" size={16} color={theme.onPrimary} />
                <Text style={styles.primaryButtonText}>{exploreCopy.primaryCta}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('CreateCommunity')}
              >
                <MaterialIcons name="add-circle" size={16} color={theme.onSurface} />
                <Text style={styles.secondaryButtonText}>{exploreCopy.secondaryCta}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.topicsTitle}>{exploreCopy.topicsTitle}</Text>
          <View style={styles.topicsGrid}>
            {exploreCopy.topics.map((topic) => {
              const tonePalette = topicPalette[topic.tone as TopicTone];
              return (
                <Pressable
                  key={topic.id}
                  style={[
                    styles.topicCard,
                    { backgroundColor: tonePalette.background, borderColor: tonePalette.border },
                  ]}
                >
                  <View style={[styles.topicIconWrap, { backgroundColor: tonePalette.border }]}>
                    <MaterialIcons name={topic.icon} size={18} color={tonePalette.icon} />
                  </View>
                  <Text style={styles.topicLabel}>{topic.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 120,
    },
    section: {
      marginTop: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.onBackground,
    },
    seeAll: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    trendingList: {
      paddingVertical: 4,
    },
    trendingSeparator: {
      width: 16,
    },
    trendingCard: {
      width: 240,
      height: 150,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: theme.shadow,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    trendingImage: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    imageRadius: {
      borderRadius: 20,
    },
    trendingOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    trendingContent: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 4,
    },
    trendingTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    trendingTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.onPrimary,
    },
    trendingTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onPrimary,
    },
    trendingMeta: {
      fontSize: 11,
      color: theme.onSurfaceVariant,
    },
    loadingWrap: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    error: {
      marginTop: 8,
      color: theme.error,
      fontSize: 12,
    },
    feedCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.outline,
      shadowColor: theme.shadow,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    feedIllustration: {
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    feedGlowOuter: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.surfaceTint,
      opacity: 0.12,
    },
    feedGlowInner: {
      position: 'absolute',
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.surfaceTint,
      opacity: 0.2,
    },
    feedIcon: {
      transform: [{ rotate: '-12deg' }],
    },
    feedStar: {
      position: 'absolute',
      top: 12,
      right: 32,
    },
    feedHeart: {
      position: 'absolute',
      bottom: 10,
      left: 24,
    },
    feedChat: {
      position: 'absolute',
      top: 48,
      left: 12,
    },
    feedTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.onBackground,
      textAlign: 'center',
    },
    feedBody: {
      fontSize: 13,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    feedActions: {
      gap: 12,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.primary,
      borderRadius: 14,
      paddingVertical: 12,
    },
    primaryButtonText: {
      color: theme.onPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.outline,
      paddingVertical: 12,
      backgroundColor: theme.surfaceVariant,
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onSurface,
    },
    topicsTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 12,
    },
    topicsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    topicCard: {
      width: '48%',
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    topicIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.onSurface,
    },
  });
