import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import type { Community } from '../../domain/models/community';
import type { Post } from '../../domain/models/post';
import type { MainStackParamList } from '../navigation/MainStack';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { communityDetailCopy } from '../content/communityDetailCopy';
import { useAuth } from '../../app/providers/AuthProvider';
import CommunityDetailEmptyState from './community-detail/CommunityDetailEmptyState';
import CommunityDetailFeedHeader from './community-detail/CommunityDetailFeedHeader';
import CommunityDetailHeader from './community-detail/CommunityDetailHeader';
import CommunityDetailListFooter from './community-detail/CommunityDetailListFooter';
import CommunityPostListItem from './community-detail/CommunityPostListItem';
import { useCommunityDetail } from './community-detail/useCommunityDetail';
import { useCommunityModeration } from './community-detail/useCommunityModeration';
import { useCommunitySubscription } from './community-detail/useCommunitySubscription';
import { usePostActions } from './community-detail/usePostActions';

type RouteParams = {
  communityId: number;
  initialCommunity?: Community;
};

export default function CommunityDetailScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { communityId: communityIdParam, initialCommunity } = route.params as RouteParams;
  const communityId = Number(communityIdParam);
  const { session } = useAuth();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    community,
    posts,
    loading,
    error,
    subscribersCount,
    setSubscribersCount,
    subscription,
    setSubscription,
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
        onPressMore={undefined}
        onPressSubscribe={handleToggleSubscription}
      />
      <CommunityDetailFeedHeader theme={theme} />
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
