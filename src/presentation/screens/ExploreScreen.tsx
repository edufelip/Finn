import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import HomeExploreHeader from '../components/HomeExploreHeader';
import ScreenFade from '../components/ScreenFade';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import type { MainStackParamList } from '../navigation/MainStack';
import type { MainTabParamList } from '../navigation/MainTabs';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import { showGuestGateAlert } from '../components/GuestGateAlert';
import { exploreCopy } from '../content/exploreCopy';
import { useExploreData } from './ExploreScreen/hooks/useExploreData';
import TrendingSection from './ExploreScreen/components/TrendingSection';
import FeedSection from './ExploreScreen/components/FeedSection';
import TopicsSection from './ExploreScreen/components/TopicsSection';
import { TrendingSkeleton, FeedSkeleton, TopicsSkeleton } from './ExploreScreen/components/ExploreSkeletons';
import { createStyles } from './ExploreScreen/styles';
import { useHeaderProfile } from '../hooks/useHeaderProfile';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Explore'>,
  NativeStackNavigationProp<MainStackParamList>
>;

export default function ExploreScreen() {
  const navigation = useNavigation<Navigation>();
  const { isGuest, exitGuest } = useAuth();
  const { communities: communityRepository, topics: topicRepository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tabBarHeight = useBottomTabBarHeight();
  const { profilePhoto, displayInitial } = useHeaderProfile();

  const { trending, feedItems, topics, loading, error } = useExploreData(communityRepository, topicRepository);

  const skeletonOpacity = useSharedValue(1);
  const contentOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (loading) {
      skeletonOpacity.value = withTiming(1, { duration: 120 });
      contentOpacity.value = withTiming(0, { duration: 120 });
      return;
    }
    skeletonOpacity.value = withTiming(0, { duration: 180 });
    contentOpacity.value = withTiming(1, { duration: 240 });
  }, [contentOpacity, loading, skeletonOpacity]);

  const openDrawer = () => {
    const parent = navigation.getParent();
    if (parent && 'openDrawer' in parent) {
      (parent as { openDrawer: () => void }).openDrawer();
    }
  };

  const handleSeeAll = () => {
    navigation.navigate('SearchResults', {});
  };

  const handleCommunityPress = (communityId: number) => {
    navigation.navigate('CommunityDetail', { communityId });
  };

  const handleTopicPress = (topicId: number) => {
    navigation.navigate('SearchResults', { topicId });
  };

  const skeletonStyle = useAnimatedStyle(() => ({ opacity: skeletonOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  const showTrendingSection = loading || trending.length > 0 || Boolean(error);
  const showFeedSection = !loading && feedItems.length > 0;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <HomeExploreHeader
        profilePhoto={profilePhoto}
        displayInitial={displayInitial}
        placeholder={exploreCopy.searchPlaceholder}
        onPressAvatar={openDrawer}
        onPressSearch={() => navigation.navigate('SearchResults', { focus: true })}
        onPressNotifications={() => {
          if (isGuest) {
            showGuestGateAlert({ onSignIn: () => void exitGuest() });
            return;
          }
          navigation.navigate('Notifications');
        }}
        testIds={{
          avatar: 'explore-avatar',
          search: 'explore-search',
          notifications: 'explore-notifications',
        }}
      />
      <ScreenFade onlyOnTabSwitch>
        <View style={styles.scrollStack}>
          <Animated.View
            style={[styles.scrollLayer, contentStyle]}
            pointerEvents={loading ? 'none' : 'auto'}
          >
            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight }]} showsVerticalScrollIndicator={false}>
              {showTrendingSection ? (
                <TrendingSection
                  trending={trending}
                  topics={topics}
                  error={error}
                  theme={theme}
                  onSeeAll={handleSeeAll}
                  onCardPress={handleCommunityPress}
                />
              ) : null}

              {showFeedSection ? (
                <FeedSection
                  feedItems={feedItems}
                  theme={theme}
                  onItemPress={handleCommunityPress}
                />
              ) : null}

              <TopicsSection
                topics={topics}
                theme={theme}
                onTopicPress={handleTopicPress}
              />
            </ScrollView>
          </Animated.View>

          <Animated.View
            style={[styles.scrollLayer, skeletonStyle]}
            pointerEvents={loading ? 'auto' : 'none'}
          >
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight }]}
              showsVerticalScrollIndicator={false}
              scrollEnabled={loading}
            >
              <TrendingSkeleton theme={theme} />
              <FeedSkeleton theme={theme} />
              <TopicsSkeleton theme={theme} />
            </ScrollView>
          </Animated.View>
        </View>
      </ScreenFade>
    </SafeAreaView>
  );
}
