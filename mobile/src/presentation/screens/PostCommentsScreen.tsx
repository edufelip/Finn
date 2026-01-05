import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Network from 'expo-network';
import { useRoute } from '@react-navigation/native';

import ScreenLayout from './ScreenLayout';
import type { Comment } from '../../domain/models/comment';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { postCommentsCopy } from '../content/postCommentsCopy';

type RouteParams = {
  postId: number;
};

export default function PostCommentsScreen() {
  const route = useRoute();
  const { postId } = route.params as RouteParams;
  const { session } = useAuth();
  const { comments: commentsRepository } = useRepositories();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    commentsRepository
      .getCommentsForPost(postId)
      .then((data) => setComments(data))
      .catch((error) => {
        if (error instanceof Error) {
          Alert.alert(postCommentsCopy.alerts.loadFailed.title, error.message);
        }
      });
  }, [commentsRepository, postId]);

  const submit = async () => {
    if (!session?.user?.id) {
      Alert.alert(postCommentsCopy.alerts.signInRequired.title, postCommentsCopy.alerts.signInRequired.message);
      return;
    }
    if (!content.trim()) {
      Alert.alert(postCommentsCopy.alerts.contentRequired.title, postCommentsCopy.alerts.contentRequired.message);
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    const newComment: Comment = {
      id: Date.now(),
      postId,
      userId: session.user.id,
      userName: session.user.email ?? postCommentsCopy.currentUserFallback,
      content: content.trim(),
    };

    if (!status.isConnected) {
      await enqueueWrite({
        id: `${Date.now()}`,
        type: 'add_comment',
        payload: {
          postId,
          userId: session.user.id,
          content: content.trim(),
        },
        createdAt: Date.now(),
      });
      setComments((prev) => [...prev, newComment]);
      setContent('');
      setLoading(false);
      Alert.alert(postCommentsCopy.alerts.offline.title, postCommentsCopy.alerts.offline.message);
      return;
    }

    try {
      const created = await commentsRepository.saveComment({
        id: 0,
        postId,
        userId: session.user.id,
        content: content.trim(),
      });
      setComments((prev) => [...prev, created]);
      setContent('');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(postCommentsCopy.alerts.commentFailed.title, error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title={postCommentsCopy.title}>
      <FlatList
        testID={postCommentsCopy.testIds.list}
        data={comments}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <View style={styles.comment} testID={`comment-item-${item.id}`}>
            <Text style={styles.author}>{item.userName ?? postCommentsCopy.commentAuthorFallback}</Text>
            <Text style={styles.body}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{postCommentsCopy.empty}</Text>}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={postCommentsCopy.inputPlaceholder}
          placeholderTextColor={theme.textSecondary}
          value={content}
          onChangeText={setContent}
          testID={postCommentsCopy.testIds.input}
          accessibilityLabel={postCommentsCopy.testIds.input}
        />
        <Button
          title={loading ? postCommentsCopy.submitLoading : postCommentsCopy.submit}
          onPress={submit}
          disabled={loading}
          testID={postCommentsCopy.testIds.submit}
          accessibilityLabel={postCommentsCopy.testIds.submit}
        />
      </View>
    </ScreenLayout>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    comment: {
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.slate200,
      backgroundColor: theme.surface,
      marginBottom: 8,
    },
    author: {
      fontWeight: '600',
      color: theme.slate900,
    },
    body: {
      marginTop: 4,
      color: theme.slate700,
    },
    empty: {
      textAlign: 'center',
      marginVertical: 16,
      color: theme.slate500,
    },
    inputRow: {
      marginTop: 12,
      gap: 8,
    },
    input: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.slate200,
      padding: 10,
      backgroundColor: theme.surface,
      color: theme.slate900,
    },
  });
