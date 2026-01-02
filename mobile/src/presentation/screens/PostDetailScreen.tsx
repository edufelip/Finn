import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Network from 'expo-network';

import PostCard from '../components/PostCard';
import type { Comment } from '../../domain/models/comment';
import type { Post } from '../../domain/models/post';
import type { MainStackParamList } from '../navigation/MainStack';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import Divider from '../components/Divider';
import { colors } from '../theme/colors';

type RouteParams = {
  post: Post;
};

export default function PostDetailScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute();
  const { post: initialPost } = route.params as RouteParams;
  const { session } = useAuth();
  const { posts: postRepository, comments: commentsRepository } = useRepositories();
  const [post, setPost] = useState<Post>(initialPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    commentsRepository
      .getCommentsForPost(post.id)
      .then((data) => setComments(data))
      .catch((error) => {
        if (error instanceof Error) {
          Alert.alert('Failed to load comments', error.message);
        }
      });
  }, [commentsRepository, post.id]);

  const handleToggleLike = async () => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please sign in again.');
      return;
    }

    const nextLiked = !post.isLiked;
    setPost((prev) => ({
      ...prev,
      isLiked: nextLiked,
      likesCount: Math.max(0, (prev.likesCount ?? 0) + (nextLiked ? 1 : -1)),
    }));

    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      await enqueueWrite({
        id: `${Date.now()}`,
        type: nextLiked ? 'like_post' : 'unlike_post',
        payload: { postId: post.id, userId: session.user.id },
        createdAt: Date.now(),
      });
      return;
    }

    try {
      if (nextLiked) {
        await postRepository.likePost(post.id, session.user.id);
      } else {
        await postRepository.dislikePost(post.id, session.user.id);
      }
    } catch (error) {
      setPost((prev) => ({
        ...prev,
        isLiked: post.isLiked,
        likesCount: post.likesCount,
      }));
      if (error instanceof Error) {
        Alert.alert('Failed to update like', error.message);
      }
    }
  };

  const handleToggleSave = async () => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please sign in again.');
      return;
    }

    const nextSaved = !post.isSaved;
    setPost((prev) => ({
      ...prev,
      isSaved: nextSaved,
    }));

    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      await enqueueWrite({
        id: `${Date.now()}`,
        type: nextSaved ? 'save_post' : 'unsave_post',
        payload: { postId: post.id, userId: session.user.id },
        createdAt: Date.now(),
      });
      return;
    }

    try {
      if (nextSaved) {
        await postRepository.bookmarkPost(post.id, session.user.id);
      } else {
        await postRepository.unbookmarkPost(post.id, session.user.id);
      }
    } catch (error) {
      setPost((prev) => ({
        ...prev,
        isSaved: post.isSaved,
      }));
      if (error instanceof Error) {
        Alert.alert('Failed to update saved posts', error.message);
      }
    }
  };

  const handleShare = () => {
    Alert.alert('Not available', 'Sharing is not available yet.');
  };

  const submitComment = async () => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please sign in again.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Content required', 'Write a comment before sending.');
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    const newComment: Comment = {
      id: Date.now(),
      postId: post.id,
      userId: session.user.id,
      userName: session.user.email ?? 'You',
      content: content.trim(),
    };

    if (!status.isConnected) {
      await enqueueWrite({
        id: `${Date.now()}`,
        type: 'add_comment',
        payload: {
          postId: post.id,
          userId: session.user.id,
          content: content.trim(),
        },
        createdAt: Date.now(),
      });
      setComments((prev) => [...prev, newComment]);
      setPost((prev) => ({
        ...prev,
        commentsCount: (prev.commentsCount ?? 0) + 1,
      }));
      setContent('');
      setLoading(false);
      Alert.alert('Offline', 'Your comment will be posted when you are back online.');
      return;
    }

    try {
      const created = await commentsRepository.saveComment({
        id: 0,
        postId: post.id,
        userId: session.user.id,
        content: content.trim(),
      });
      setComments((prev) => [...prev, created]);
      setPost((prev) => ({
        ...prev,
        commentsCount: (prev.commentsCount ?? 0) + 1,
      }));
      setContent('');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Failed to comment', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="keyboard-arrow-left" size={24} color={colors.black} />
        </Pressable>
        <Divider />
      </View>
      <FlatList
        testID="post-detail-comments"
        data={comments}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <View style={styles.comment} testID={`comment-item-${item.id}`}>
            <View style={styles.commentHeader}>
              <View style={styles.commentAvatar}>
                <Image source={require('../../../assets/user_icon.png')} style={styles.commentAvatarImage} />
              </View>
              <Text style={styles.commentAuthor}>{item.userName ?? 'Unknown'}</Text>
              <Text style={styles.commentDate}> - 7 days ago</Text>
            </View>
            <Text style={styles.commentBody}>{item.content}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View>
            <PostCard
              post={post}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onShare={handleShare}
            />
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsHeaderText}>Comments</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
        style={styles.list}
      />
      <View style={styles.bottomBar}>
        <View style={styles.bottomAvatar}>
          <Image source={require('../../../assets/user_icon.png')} style={styles.bottomAvatarImage} />
        </View>
        <TextInput
          style={styles.commentInput}
          value={content}
          onChangeText={setContent}
          testID="post-detail-comment-input"
          accessibilityLabel="post-detail-comment-input"
        />
        <Pressable
          style={styles.commentButton}
          onPress={submitComment}
          disabled={loading}
          testID="post-detail-comment-submit"
          accessibilityLabel="post-detail-comment-submit"
        >
          <MaterialIcons name="add" size={24} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: 60,
    justifyContent: 'flex-end',
    backgroundColor: colors.white,
  },
  backButton: {
    marginLeft: 16,
    marginBottom: 8,
    padding: 8,
    alignSelf: 'flex-start',
  },
  list: {
    backgroundColor: colors.backgroundLight,
  },
  commentsHeader: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentsHeaderText: {
    fontWeight: '700',
  },
  comment: {
    backgroundColor: colors.white,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 8,
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  commentAuthor: {
    fontWeight: '700',
  },
  commentDate: {
    fontSize: 12,
    color: colors.borderGrey,
  },
  commentBody: {
    marginTop: 8,
  },
  empty: {
    textAlign: 'center',
    marginVertical: 16,
    color: colors.darkGrey,
  },
  bottomBar: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bottomAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  bottomAvatarImage: {
    width: '100%',
    height: '100%',
  },
  commentInput: {
    flex: 1,
    height: '100%',
    marginHorizontal: 8,
  },
  commentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mainBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
