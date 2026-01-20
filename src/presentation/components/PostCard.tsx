import React, { useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import type { Post } from '../../domain/models/post';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { postCardCopy } from '../content/postCardCopy';
import PostOptionsModal from './PostOptionsModal';
import ReportPostModal from './ReportPostModal';
import { sharePost } from '../../utils/shareUtils';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';

type PostCardProps = {
  post: Post;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
  onToggleSave?: () => void;
  onShare?: () => void;
  onMarkForReview?: () => void;
  canModerate?: boolean;
  isFirst?: boolean;
  onPressUser?: () => void;
};

const PostCard = ({
  post,
  onToggleLike,
  onOpenComments,
  onToggleSave,
  onShare,
  onMarkForReview,
  canModerate = false,
  isFirst = false,
  onPressUser,
}: PostCardProps & { isFirst?: boolean }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const likeScale = useSharedValue(1);
  const likeSpring = useMemo(() => ({ duration: 133, dampingRatio: 0.7 }), []);
  const [modalVisible, setModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const optionsButtonRef = useRef<View>(null);
  const { session } = useAuth();
  const { postReports } = useRepositories();

  const likeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handleOptions = () => {
    if (process.env.NODE_ENV === 'test') {
      setModalPosition({ x: 0, y: 0 });
      setModalVisible(true);
      return;
    }
    // Use a small timeout to ensure the ref is ready
    setTimeout(() => {
      optionsButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setModalPosition({ x: pageX + width, y: pageY + height });
        setModalVisible(true);
      });
    }, 0);
  };

  const handleLikePress = () => {
    // eslint-disable-next-line react-hooks/immutability
    likeScale.value = withSequence(
      withSpring(1.15, likeSpring),
      withSpring(1, likeSpring)
    );
    onToggleLike?.();
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      void sharePost(post);
    }
  };

  const handleReport = async (reason: string) => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be logged in to report a post');
      throw new Error('User not logged in');
    }

    try {
      await postReports.reportPost(post.id, session.user.id, reason);
      Alert.alert('Report Submitted', 'Thank you for helping keep our community safe. We will review your report.');
    } catch (error) {
      console.error('Report post error:', error);
      
      // Handle different error types
      let errorMessage = 'Failed to submit report. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase error objects
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
      
      Alert.alert('Report Failed', errorMessage);
      throw error; // Re-throw to keep modal open
    }
  };

  return (
    <View
      style={[styles.wrapper, isFirst && styles.firstCardSpacer]}
      testID={`post-card-${post.id}`}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerLeft} onPress={onPressUser} hitSlop={8}>
            <View style={styles.avatarWrapper}>
              {post.userPhotoUrl ? (
                <Image
                  source={{ uri: post.userPhotoUrl }}
                  style={styles.avatar}
                  testID={`post-user-image-${post.id}`}
                  accessibilityLabel={`post-user-image-${post.id}`}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {(post.userName ?? postCardCopy.authorFallback).charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.authorName}>{post.userName ?? postCardCopy.authorFallback}</Text>
              <Text style={styles.subline}>
                {post.communityTitle ?? postCardCopy.communityFallback}
              </Text>
            </View>
          </Pressable>
          <View ref={optionsButtonRef} collapsable={false} style={styles.optionsButton}>
            <Pressable
              onPress={handleOptions}
              testID={`post-options-${post.id}`}
              accessibilityLabel={`post-options-${post.id}`}
              hitSlop={8}
            >
              <MaterialIcons name="more-vert" size={22} color={theme.onSurfaceVariant} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.content}>{post.content}</Text>

        {post.imageUrl ? (
          <View style={styles.imageFrame}>
            <Image
              source={{ uri: post.imageUrl }}
              style={styles.postImage}
              testID={`post-image-${post.id}`}
            />
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionGroup}
            onPress={handleLikePress}
            testID={`post-like-${post.id}`}
            accessibilityLabel={`post-like-${post.id}`}
          >
            <Animated.View style={likeStyle}>
              <MaterialIcons
                name={post.isLiked ? 'favorite' : 'favorite-border'}
                size={22}
                color={post.isLiked ? theme.primary : theme.onSurfaceVariant}
              />
            </Animated.View>
            <Text style={styles.actionText}>{post.likesCount ?? 0}</Text>
          </Pressable>
          <Pressable
            style={styles.actionGroup}
            onPress={onOpenComments}
            testID={`post-comment-${post.id}`}
            accessibilityLabel={`post-comment-${post.id}`}
          >
            <MaterialIcons name="chat-bubble-outline" size={20} color={theme.onSurfaceVariant} />
            <Text style={styles.actionText}>{post.commentsCount ?? 0}</Text>
          </Pressable>
          <Pressable
            style={styles.actionGroup}
            onPress={handleShare}
            testID={`post-share-${post.id}`}
            accessibilityLabel={`post-share-${post.id}`}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color={theme.onSurfaceVariant} />
            <Text style={styles.actionText}>{postCardCopy.share}</Text>
          </Pressable>
        </View>
      </View>
      <PostOptionsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => onToggleSave?.()}
        onReport={() => setReportModalVisible(true)}
        onMarkForReview={onMarkForReview}
        isSaved={post.isSaved ?? false}
        canModerate={canModerate}
        position={modalPosition}
      />
      <ReportPostModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReport}
        postId={post.id}
      />
    </View>
  );
};

export default React.memo(PostCard);

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    card: {
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      position: 'relative',
      shadowColor: theme.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    firstCardSpacer: {
      marginTop: 8,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },
    avatarWrapper: {
      width: 44,
      height: 44,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    avatarFallback: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onSurface,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    authorName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.onSurface,
    },
    subline: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
    optionsButton: {
      marginLeft: 12,
    },
    content: {
      marginTop: 4,
      color: theme.onSurface,
      fontSize: 14,
      lineHeight: 20,
    },
    imageFrame: {
      marginTop: 12,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    postImage: {
      width: '100%',
      height: 200,
      resizeMode: 'cover',
    },
    actionsRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: theme.outlineVariant,
      paddingTop: 12,
    },
    actionGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
    },
  });
