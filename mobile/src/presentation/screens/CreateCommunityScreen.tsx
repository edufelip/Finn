import React, { useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import { persistOfflineImage } from '../../data/offline/offlineImages';
import { colors } from '../theme/colors';

export default function CreateCommunityScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { communities: communityRepository } = useRepositories();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to your photos to select an image.');
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
      Alert.alert('Sign in required', 'Please sign in again.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Title required', 'Provide a community title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description required', 'Provide a community description.');
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      const persistedImageUri = imageUri ? await persistOfflineImage(imageUri) : null;
      await enqueueWrite({
        id: `${Date.now()}`,
        type: 'create_community',
        payload: {
          title: title.trim(),
          description: description.trim(),
          ownerId: session.user.id,
          imageUri: persistedImageUri,
        },
        createdAt: Date.now(),
      });
      setLoading(false);
      Alert.alert('Offline', 'Your community will be created when you are back online.');
      navigation.goBack();
      return;
    }

    try {
      await communityRepository.saveCommunity(
        {
          id: 0,
          title: title.trim(),
          description: description.trim(),
          ownerId: session.user.id,
        },
        imageUri ?? null
      );
      Alert.alert('Community created', 'Your community is live.');
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Failed to create community', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="keyboard-arrow-left" size={24} color={colors.black} />
      </Pressable>
      <View style={styles.container}>
        <Text style={styles.title}>Your community name</Text>
        <TextInput
          style={styles.input}
          placeholder="Community Name"
          value={title}
          onChangeText={setTitle}
          maxLength={25}
          testID="create-community-title"
          accessibilityLabel="create-community-title"
        />
        <Text style={styles.title}>Tell us what is your community is about</Text>
        <TextInput
          style={styles.input}
          placeholder="About your community"
          value={description}
          onChangeText={setDescription}
          maxLength={100}
          testID="create-community-description"
          accessibilityLabel="create-community-description"
        />
        <Text style={styles.title}>Choose your icon</Text>
        <Pressable
          style={styles.iconSelect}
          onPress={pickImage}
          testID="create-community-image"
          accessibilityLabel="create-community-image"
        >
          <View style={styles.iconOuter}>
            <Image
              source={imageUri ? { uri: imageUri } : require('../../../assets/user_icon.png')}
              style={styles.iconImage}
              testID={imageUri ? 'create-community-image-preview' : undefined}
              accessibilityLabel={imageUri ? 'create-community-image-preview' : undefined}
            />
          </View>
          <View style={styles.iconBadge}>
            <MaterialIcons name="date-range" size={18} color={colors.white} />
          </View>
        </Pressable>
        <Pressable
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={submit}
          disabled={loading}
          testID="create-community-submit"
          accessibilityLabel="create-community-submit"
        >
          <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'Create'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 24,
    padding: 8,
    zIndex: 2,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: colors.borderGrey,
    paddingVertical: 8,
  },
  iconSelect: {
    alignSelf: 'center',
    marginTop: 16,
    width: 64,
    height: 64,
  },
  iconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  iconBadge: {
    position: 'absolute',
    left: 32,
    top: 32,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 150,
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.mainBlue,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: 16,
    color: colors.mainBlue,
  },
});
