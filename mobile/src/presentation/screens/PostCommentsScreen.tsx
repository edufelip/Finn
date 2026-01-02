import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Network from 'expo-network';
import { useRoute } from '@react-navigation/native';

import ScreenLayout from './ScreenLayout';
import type { Comment } from '../../domain/models/comment';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';

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

  useEffect(() => {
    commentsRepository
      .getCommentsForPost(postId)
      .then((data) => setComments(data))
      .catch((error) => {
        if (error instanceof Error) {
          Alert.alert('Failed to load comments', error.message);
        }
      });
  }, [commentsRepository, postId]);

  const submit = async () => {
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
      postId,
      userId: session.user.id,
      userName: session.user.email ?? 'You',
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
      Alert.alert('Offline', 'Your comment will be posted when you are back online.');
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
        Alert.alert('Failed to comment', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Comments">
      <FlatList
        testID="comment-list"
        data={comments}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <View style={styles.comment} testID={`comment-item-${item.id}`}>
            <Text style={styles.author}>{item.userName ?? 'Unknown'}</Text>
            <Text style={styles.body}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={content}
          onChangeText={setContent}
          testID="comment-input"
          accessibilityLabel="comment-input"
        />
        <Button
          title={loading ? 'Sending...' : 'Send'}
          onPress={submit}
          disabled={loading}
          testID="comment-submit"
          accessibilityLabel="comment-submit"
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  comment: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  author: {
    fontWeight: '600',
    color: '#0f172a',
  },
  body: {
    marginTop: 4,
    color: '#334155',
  },
  empty: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#64748b',
  },
  inputRow: {
    marginTop: 12,
    gap: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    backgroundColor: '#ffffff',
  },
});
