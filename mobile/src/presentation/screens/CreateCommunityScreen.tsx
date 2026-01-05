import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import { persistOfflineImage } from '../../data/offline/offlineImages';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { createCommunityCopy } from '../content/createCommunityCopy';

export default function CreateCommunityScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { communities: communityRepository } = useRepositories();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        createCommunityCopy.alerts.permission.title,
        createCommunityCopy.alerts.permission.message
      );
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
      Alert.alert(
        createCommunityCopy.alerts.signInRequired.title,
        createCommunityCopy.alerts.signInRequired.message
      );
      return;
    }
    if (!title.trim()) {
      Alert.alert(
        createCommunityCopy.alerts.titleRequired.title,
        createCommunityCopy.alerts.titleRequired.message
      );
      return;
    }
    if (!description.trim()) {
      Alert.alert(
        createCommunityCopy.alerts.descriptionRequired.title,
        createCommunityCopy.alerts.descriptionRequired.message
      );
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
      Alert.alert(createCommunityCopy.alerts.offline.title, createCommunityCopy.alerts.offline.message);
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
      Alert.alert(createCommunityCopy.alerts.created.title, createCommunityCopy.alerts.created.message);
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(createCommunityCopy.alerts.failed.title, error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="keyboard-arrow-left" size={24} color={theme.textPrimary} />
      </Pressable>
      <View style={styles.container}>
        <Text style={styles.title}>{createCommunityCopy.titleLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={createCommunityCopy.titlePlaceholder}
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
          maxLength={25}
          testID={createCommunityCopy.testIds.title}
          accessibilityLabel={createCommunityCopy.testIds.title}
        />
        <Text style={styles.title}>{createCommunityCopy.descriptionLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={createCommunityCopy.descriptionPlaceholder}
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          maxLength={100}
          testID={createCommunityCopy.testIds.description}
          accessibilityLabel={createCommunityCopy.testIds.description}
        />
        <Text style={styles.title}>{createCommunityCopy.iconLabel}</Text>
        <Pressable
          style={styles.iconSelect}
          onPress={pickImage}
          testID={createCommunityCopy.testIds.image}
          accessibilityLabel={createCommunityCopy.testIds.image}
        >
          <View style={styles.iconOuter}>
            <Image
              source={imageUri ? { uri: imageUri } : require('../../../assets/user_icon.png')}
              style={styles.iconImage}
              testID={imageUri ? createCommunityCopy.testIds.imagePreview : undefined}
              accessibilityLabel={imageUri ? createCommunityCopy.testIds.imagePreview : undefined}
            />
          </View>
          <View style={styles.iconBadge}>
            <MaterialIcons name="date-range" size={18} color={theme.white} />
          </View>
        </Pressable>
        <Pressable
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={submit}
          disabled={loading}
          testID={createCommunityCopy.testIds.submit}
          accessibilityLabel={createCommunityCopy.testIds.submit}
        >
          <Text style={styles.createButtonText}>
            {loading ? createCommunityCopy.submitLoading : createCommunityCopy.submit}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.backgroundLight,
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
      color: theme.textPrimary,
    },
    input: {
      borderBottomWidth: 1,
      borderColor: theme.borderGrey,
      paddingVertical: 8,
      color: theme.textPrimary,
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
      backgroundColor: theme.accentOrange,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createButton: {
      width: 150,
      height: 60,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.mainBlue,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    createButtonDisabled: {
      opacity: 0.7,
    },
    createButtonText: {
      fontSize: 16,
      color: theme.mainBlue,
    },
  });
