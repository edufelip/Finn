import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import type { Community } from '../../domain/models/community';
import { PostSortOrder } from '../../domain/models/post';
import type { Post } from '../../domain/models/post';
import type { MainStackParamList } from '../navigation/MainStack';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { communityDetailCopy } from '../content/communityDetailCopy';
import { communityReportCopy } from '../content/communityReportCopy';
import { commonCopy } from '../content/commonCopy';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import CommunityOptionsModal from '../components/CommunityOptionsModal';
import ReportCommunityModal from '../components/ReportCommunityModal';
import CommunityDetailEmptyState from './community-detail/CommunityDetailEmptyState';
import CommunityDetailFeedHeader from './community-detail/CommunityDetailFeedHeader';
import CommunityDetailHeader from './community-detail/CommunityDetailHeader';
import CommunityDetailListFooter from './community-detail/CommunityDetailListFooter';
import CommunityPostListItem from './community-detail/CommunityPostListItem';
import { useCommunityDetail } from './community-detail/useCommunityDetail';
import { useCommunityModeration } from './community-detail/useCommunityModeration';
import { useCommunitySubscription } from './community-detail/useCommunitySubscription';
import { usePostActions } from './community-detail/usePostActions';
import { useLocalization } from '../../app/providers/LocalizationProvider';

type RouteParams = {
  communityId: number;
  initialCommunity?: Community;
};

export default function CommunityDetailScreen() {
  useLocalization();
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { communityId: communityIdParam, initialCommunity } = route.params as RouteParams;
  const communityId = Number(communityIdParam);
  const { session } = useAuth();
  const { communityReports } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });

  const {
    community,
    posts,
    loading,
    error,
    subscribersCount,
    setSubscribersCount,
    subscription,
    setSubscription,
    sortOrder,
    setSortOrder,
  } = useCommunityDetail({ communityId, initialCommunity });

  const { canModerate } = useCommunityModeration({ communityId, community });
  const { handleToggleLike, handleToggleSave, handleMarkForReview } = usePostActions({
    communityId,
    canModerate,
  });

  const { handleToggleSubscription, isGuest } = useCommunitySubscription({
    communityId,
    communityTitle: community?.title,
    subscribersCount,
    subscription,
    setSubscription,
    setSubscribersCount,
  });

  const handleOpenComments = useCallback(
    (post: Post) => {
      navigation.navigate('PostDetail', { post });
    },
    [navigation]
  );

  const handlePressCommunity = useCallback(
    (communityIdValue: number) => {
      navigation.navigate('CommunityDetail', { communityId: communityIdValue });
    },
    [navigation]
  );

  const handlePressUser = useCallback(
    (userId: string) => {
      if (session?.user?.id === userId) {
        navigation.navigate('Profile');
      } else {
        navigation.navigate('UserProfile', { userId });
      }
    },
    [navigation, session?.user?.id]
  );

  const handleStartDiscussion = useCallback(() => {
    navigation.navigate('CreatePost', { communityId: community?.id });
  }, [community?.id, navigation]);

  const handleSortPress = useCallback(() => {
    Alert.alert(communityDetailCopy.sortTitle, '', [
      { text: communityDetailCopy.sortOptions.newest, onPress: () => setSortOrder(PostSortOrder.Newest) },
      { text: communityDetailCopy.sortOptions.oldest, onPress: () => setSortOrder(PostSortOrder.Oldest) },
      { text: communityDetailCopy.sortOptions.mostLiked, onPress: () => setSortOrder(PostSortOrder.MostLiked) },
      {
        text: communityDetailCopy.sortOptions.mostCommented,
        onPress: () => setSortOrder(PostSortOrder.MostCommented),
      },
      { text: commonCopy.cancel, style: 'cancel' },
    ]);
  }, [setSortOrder]);

  const sortLabel = useMemo(() => {
    switch (sortOrder) {
      case PostSortOrder.Oldest:
        return communityDetailCopy.sortOptions.oldest;
      case PostSortOrder.MostLiked:
        return communityDetailCopy.sortOptions.mostLiked;
      case PostSortOrder.MostCommented:
        return communityDetailCopy.sortOptions.mostCommented;
      case PostSortOrder.Newest:
      default:
        return communityDetailCopy.sortOptions.newest;
    }
  }, [sortOrder]);

  const handleMorePress = useCallback((position: { x: number; y: number }) => {
    setOptionsPosition(position);
    setOptionsVisible(true);
  }, []);

  const handleReportCommunity = useCallback(
    async (reason: string) => {
      if (!session?.user?.id) {
        Alert.alert(communityReportCopy.report.error.title, communityReportCopy.report.error.notLoggedIn);
        throw new Error('User not logged in');
      }

      try {
        await communityReports.reportCommunity(communityId, session.user.id, reason);
        Alert.alert(communityReportCopy.report.success.title, communityReportCopy.report.success.message);
      } catch (error) {
        console.error('Report community error:', error);

        let errorMessage = communityReportCopy.report.failed.message;

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          const supabaseError = error as { message?: string; hint?: string; details?: string };
          if (supabaseError.message) {
            errorMessage = supabaseError.message;
            if (supabaseError.hint) {
              errorMessage += `\n\nHint: ${supabaseError.hint}`;
            }
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        Alert.alert(communityReportCopy.report.failed.title, errorMessage);
        throw error;
      }
    },
    [communityId, communityReports, session]
  );

  const keyExtractor = useCallback(
    (item: Post | number) => (typeof item === 'number' ? `skeleton-${item}` : `${item.id}`),
    []
  );

  const renderPost = useCallback(
    ({ item }: ListRenderItemInfo<Post | number>) => (
      <CommunityPostListItem
        item={item}
        canModerate={canModerate}
        onPressCommunity={handlePressCommunity}
        onPressBody={handleOpenComments}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
        onMarkForReview={handleMarkForReview}
        onOpenComments={handleOpenComments}
        onPressUser={handlePressUser}
      />
    ),
    [
      canModerate,
      handleMarkForReview,
      handleOpenComments,
      handlePressCommunity,
      handlePressUser,
      handleToggleLike,
      handleToggleSave,
    ]
  );

  const hasNoPosts = posts.length === 0 && !loading;

  const listHeader = community ? (
    <>
      <CommunityDetailHeader
        community={community}
        hasNoPosts={hasNoPosts}
        isGuest={isGuest}
        subscription={subscription ?? null}
        subscribersCount={subscribersCount}
        theme={theme}
        onPressBack={() => navigation.goBack()}
        onPressMore={handleMorePress}
        onPressSubscribe={handleToggleSubscription}
      />
      <CommunityDetailFeedHeader theme={theme} onPressSort={handleSortPress} sortLabel={sortLabel} />
    </>
  ) : null;

  return (
    <View style={styles.container}>
      {loading && !community ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <FlatList
            testID={communityDetailCopy.testIds.list}
            data={loading ? [1, 2, 3] : posts}
            keyExtractor={keyExtractor}
            renderItem={renderPost}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              !loading && posts.length === 0 ? (
                <CommunityDetailEmptyState
                  theme={theme}
                  onStartDiscussion={handleStartDiscussion}
                  isDisabled={!community}
                />
              ) : null
            }
            ListFooterComponent={loading && posts.length > 0 ? <CommunityDetailListFooter theme={theme} /> : null}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
          {community ? (
            <>
              <CommunityOptionsModal
                visible={optionsVisible}
                onClose={() => setOptionsVisible(false)}
                onReport={() => setReportModalVisible(true)}
                position={optionsPosition}
              />
              <ReportCommunityModal
                visible={reportModalVisible}
                onClose={() => setReportModalVisible(false)}
                onSubmit={handleReportCommunity}
                communityId={community.id}
              />
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    list: {
      flex: 1,
      backgroundColor: theme.background,
    },
    listContent: {
      paddingBottom: 100,
    },
    error: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      color: theme.error,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
