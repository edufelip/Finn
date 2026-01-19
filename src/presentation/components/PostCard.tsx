import React, { useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
};

export default function PostCard({
  post,
  onToggleLike,
  onOpenComments,
  onToggleSave,
  onShare,
  onMarkForReview,
  canModerate = false,
}: PostCardProps) {
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
    <View style={styles.wrapper} testID={`post-card-${post.id}`}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.communityImageWrapper}>
            {post.userPhotoUrl ? (
              <Image
                source={{ uri: post.userPhotoUrl }}
                style={styles.communityImage}
                testID={`post-user-image-${post.id}`}
                accessibilityLabel={`post-user-image-${post.id}`}
              />
            ) : (
              <Image source={require('../../../assets/user_icon.png')} style={styles.communityImage} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.community}>{post.userName ?? postCardCopy.authorFallback}</Text>
            <Text style={styles.author}>
              Posted in {post.communityTitle ?? postCardCopy.communityFallback}
            </Text>
          </View>
        </View>
        <View ref={optionsButtonRef} collapsable={false} style={styles.optionsButton}>
          <Pressable
            onPress={handleOptions}
            testID={`post-options-${post.id}`}
            accessibilityLabel={`post-options-${post.id}`}
          >
            <MaterialIcons name="more-vert" size={20} color={theme.onSurfaceVariant} />
          </Pressable>
        </View>
        <Text style={styles.content}>{post.content}</Text>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} testID={`post-image-${post.id}`} />
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
                name="keyboard-arrow-up"
                size={24}
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
            <MaterialIcons name="chat" size={16} color={theme.onSurfaceVariant} />
            <Text style={styles.actionText}>{post.commentsCount ?? 0}</Text>
          </Pressable>
          <Pressable
            style={styles.actionGroup}
            onPress={handleShare}
            testID={`post-share-${post.id}`}
            accessibilityLabel={`post-share-${post.id}`}
          >
            <MaterialIcons name="share" size={16} color={theme.onSurfaceVariant} />
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
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 16,
    },
    card: {
      backgroundColor: theme.surface,
      paddingBottom: 8,
      position: 'relative',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      marginHorizontal: 16,
    },
    communityImageWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: 'hidden',
      marginRight: 8,
    },
    communityImage: {
      width: '100%',
      height: '100%',
    },
    headerText: {
      flex: 1,
    },
    community: {
      fontSize: 16,
      color: theme.onSurface,
    },
    author: {
      marginTop: 2,
      color: theme.onSurfaceVariant,
    },
    optionsButton: {
      position: 'absolute',
      top: 16,
      right: 16,
    },
    content: {
      marginTop: 16,
      marginHorizontal: 16,
      color: theme.onSurface,
    },
    postImage: {
      marginTop: 8,
      width: '100%',
      height: 200,
      resizeMode: 'cover',
    },
    actionsRow: {
      marginTop: 5,
      marginHorizontal: 16,
      flexDirection: 'row',
      height: 35,
    },
    actionGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
  });
