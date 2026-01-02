import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { Post } from '../../domain/models/post';
import { colors } from '../theme/colors';

type PostCardProps = {
  post: Post;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
  onToggleSave?: () => void;
  onShare?: () => void;
};

export default function PostCard({
  post,
  onToggleLike,
  onOpenComments,
  onToggleSave,
  onShare,
}: PostCardProps) {
  const handleOptions = () => {
    if (!onToggleSave) return;
    Alert.alert('Options', undefined, [
      {
        text: post.isSaved ? 'Unsave' : 'Save',
        onPress: onToggleSave,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrapper} testID={`post-card-${post.id}`}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.communityImageWrapper}>
            {post.communityImageUrl ? (
              <Image
                source={{ uri: post.communityImageUrl }}
                style={styles.communityImage}
                testID={`post-community-image-${post.id}`}
                accessibilityLabel={`post-community-image-${post.id}`}
              />
            ) : (
              <Image source={require('../../../assets/user_icon.png')} style={styles.communityImage} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.community}>{post.communityTitle ?? 'Community'}</Text>
            <Text style={styles.author}>Posted by {post.userName ?? 'Unknown'}</Text>
          </View>
        </View>
        <Pressable
          onPress={handleOptions}
          style={styles.optionsButton}
          testID={`post-options-${post.id}`}
          accessibilityLabel={`post-options-${post.id}`}
        >
          <Text style={styles.options}>⋮</Text>
        </Pressable>
        <Text style={styles.content}>{post.content}</Text>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} testID={`post-image-${post.id}`} />
        ) : null}
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionGroup}
            onPress={onToggleLike}
            testID={`post-like-${post.id}`}
            accessibilityLabel={`post-like-${post.id}`}
          >
            <MaterialIcons
              name="keyboard-arrow-up"
              size={24}
              color={post.isLiked ? colors.mainBlue : colors.darkGrey}
            />
            <Text style={styles.actionText}>{post.likesCount ?? 0}</Text>
          </Pressable>
          <Pressable
            style={styles.actionGroup}
            onPress={onOpenComments}
            testID={`post-comment-${post.id}`}
            accessibilityLabel={`post-comment-${post.id}`}
          >
            <MaterialIcons name="chat" size={16} color={colors.darkGrey} />
            <Text style={styles.actionText}>{post.commentsCount ?? 0}</Text>
          </Pressable>
          <Pressable
            style={styles.actionGroup}
            onPress={onShare}
            testID={`post-share-${post.id}`}
            accessibilityLabel={`post-share-${post.id}`}
          >
            <MaterialIcons name="share" size={16} color={colors.darkGrey} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
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
  },
  author: {
    marginTop: 2,
    color: colors.darkGrey,
  },
  options: {
    fontSize: 20,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  optionsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  content: {
    marginTop: 16,
    marginHorizontal: 16,
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
  },
});
