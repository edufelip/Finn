import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Network from 'expo-network';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import type { Community } from '../../domain/models/community';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { isMockMode } from '../../config/appConfig';
import { enqueueWrite } from '../../data/offline/queueStore';
import { persistOfflineImage } from '../../data/offline/offlineImages';
import TopBar from '../components/TopBar';
import Divider from '../components/Divider';
import { colors } from '../theme/colors';
import { createPostCopy } from '../content/createPostCopy';

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [content, setContent] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { communities: communityRepository, posts: postRepository } = useRepositories();

  useEffect(() => {
    communityRepository
      .getCommunities()
      .then((data) => {
        setCommunities(data);
        if (data.length && selectedCommunityId === null) {
          setSelectedCommunityId(data[0].id);
        }
      })
      .catch((error) => {
        if (error instanceof Error) {
          Alert.alert(createPostCopy.alerts.loadCommunitiesFailed.title, error.message);
        }
      });
  }, [communityRepository, selectedCommunityId]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(createPostCopy.alerts.permission.title, createPostCopy.alerts.permission.message);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!session?.user?.id) {
      Alert.alert(createPostCopy.alerts.signInRequired.title, createPostCopy.alerts.signInRequired.message);
      return;
    }
    if (!content.trim()) {
      Alert.alert(createPostCopy.alerts.contentRequired.title, createPostCopy.alerts.contentRequired.message);
      return;
    }
    if (!selectedCommunityId) {
      Alert.alert(createPostCopy.alerts.communityRequired.title, createPostCopy.alerts.communityRequired.message);
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      const persistedImageUri = imageUri ? await persistOfflineImage(imageUri) : null;
      await enqueueWrite({
        id: `${Date.now()}`,
        type: 'create_post',
        payload: {
          content: content.trim(),
          communityId: selectedCommunityId,
          userId: session.user.id,
          imageUri: persistedImageUri,
        },
        createdAt: Date.now(),
      });
      setLoading(false);
      Alert.alert(createPostCopy.alerts.offline.title, createPostCopy.alerts.offline.message);
      navigation.goBack();
      return;
    }

    try {
      await postRepository.savePost(
        {
          id: 0,
          content: content.trim(),
          communityId: selectedCommunityId,
          userId: session.user.id,
        },
        imageUri ?? null
      );
      Alert.alert(createPostCopy.alerts.posted.title, createPostCopy.alerts.posted.message);
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(createPostCopy.alerts.failed.title, error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedCommunity = communities.find((item) => item.id === selectedCommunityId);

  return (
    <View style={styles.container}>
      <TopBar title={createPostCopy.title} onBack={() => navigation.goBack()} />
      <Pressable
        style={styles.communityPicker}
        onPress={() => setPickerOpen(true)}
        testID={createPostCopy.testIds.communityPicker}
        accessibilityLabel={createPostCopy.testIds.communityPicker}
      >
        <MaterialIcons name="language" size={20} color={colors.darkGrey} />
        <Text style={styles.communityText}>
          {selectedCommunity?.title ?? createPostCopy.communityPlaceholder}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.darkGrey} />
      </Pressable>
      <Divider />
      <TextInput
        style={styles.textArea}
        placeholder={createPostCopy.contentPlaceholder}
        value={content}
        onChangeText={setContent}
        multiline
        testID={createPostCopy.testIds.content}
        accessibilityLabel={createPostCopy.testIds.content}
      />
      <Divider />
      <View style={styles.imageCard}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.imagePreview}
            testID={createPostCopy.testIds.imagePreview}
            accessibilityLabel={createPostCopy.testIds.imagePreview}
          />
        ) : null}
        <Pressable
          style={styles.fab}
          onPress={pickImage}
          testID={createPostCopy.testIds.image}
          accessibilityLabel={createPostCopy.testIds.image}
        >
          <MaterialIcons name="add" size={24} color={colors.black} />
        </Pressable>
      </View>
      <Pressable
        style={[styles.createButton, loading && styles.createButtonDisabled]}
        onPress={submit}
        disabled={loading}
        testID={createPostCopy.testIds.submit}
        accessibilityLabel={createPostCopy.testIds.submit}
      >
        <Text style={styles.createButtonText}>
          {loading ? createPostCopy.submitLoading : createPostCopy.submit}
        </Text>
      </Pressable>
      <Modal visible={pickerOpen} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{createPostCopy.modalTitle}</Text>
          <FlatList
            data={communities}
            keyExtractor={(item) => `${item.id}`}
            renderItem={({ item }) => (
              <Pressable
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCommunityId(item.id);
                  setPickerOpen(false);
                }}
                testID={`community-option-${item.id}`}
                accessibilityLabel={`community-option-${item.id}`}
              >
                <Text style={styles.modalItemText}>{item.title}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  communityPicker: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  communityText: {
    flex: 1,
    fontSize: 16,
  },
  textArea: {
    height: 300,
    padding: 16,
    textAlignVertical: 'top',
    backgroundColor: colors.transparent,
  },
  imageCard: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginTop: 24,
    borderRadius: 4,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
  },
  createButton: {
    alignSelf: 'center',
    height: 58,
    paddingHorizontal: 32,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: colors.mainBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: 12,
    color: colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlayDark,
  },
  modalSheet: {
    backgroundColor: colors.white,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalItem: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 16,
  },
});
