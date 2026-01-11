import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../data/offline/queueStore';
import { isMockMode } from '../../config/appConfig';
import { persistOfflineImage } from '../../data/offline/offlineImages';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { createCommunityCopy } from '../content/createCommunityCopy';
import { imagePickerCopy } from '../content/imagePickerCopy';
import ImageSourceSheet from '../components/ImageSourceSheet';
import GuestGateScreen from '../components/GuestGateScreen';
import { guestCopy } from '../content/guestCopy';

export default function CreateCommunityScreen() {
  const navigation = useNavigation();
  const { session, isGuest, exitGuest } = useAuth();
  const { communities: communityRepository } = useRepositories();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageSourceOpen, setImageSourceOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const titleMaxLength = 25;
  const descriptionMaxLength = 300;
  const descriptionCount = createCommunityCopy.descriptionCount(description.length, descriptionMaxLength);
  const gradientColors = useMemo<readonly [string, string]>(
    () => [`${theme.background}00`, theme.background],
    [theme.background]
  );

  if (isGuest) {
    return (
      <GuestGateScreen
        title={guestCopy.restricted.title(guestCopy.features.createCommunity)}
        body={guestCopy.restricted.body(guestCopy.features.createCommunity)}
        onSignIn={() => void exitGuest()}
      />
    );
  }

  const handlePickFromGallery = async () => {
    setImageSourceOpen(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        imagePickerCopy.alerts.galleryPermission.title,
        imagePickerCopy.alerts.galleryPermission.message
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickFromCamera = async () => {
    setImageSourceOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        imagePickerCopy.alerts.cameraPermission.title,
        imagePickerCopy.alerts.cameraPermission.message
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        imagePickerCopy.alerts.cameraUnavailable.title,
        imagePickerCopy.alerts.cameraUnavailable.message
      );
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
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios-new" size={20} color={theme.onBackground} />
          </Pressable>
          <Text style={styles.headerTitle}>{createCommunityCopy.headerTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 140 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.field}>
            <Text style={styles.label}>{createCommunityCopy.titleLabel}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={createCommunityCopy.titlePlaceholder}
                placeholderTextColor={theme.onSurfaceVariant}
                value={title}
                onChangeText={setTitle}
                maxLength={titleMaxLength}
                testID={createCommunityCopy.testIds.title}
                accessibilityLabel={createCommunityCopy.testIds.title}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{createCommunityCopy.descriptionLabel}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={createCommunityCopy.descriptionPlaceholder}
                placeholderTextColor={theme.onSurfaceVariant}
                value={description}
                onChangeText={setDescription}
                maxLength={descriptionMaxLength}
                multiline
                textAlignVertical="top"
                testID={createCommunityCopy.testIds.description}
                accessibilityLabel={createCommunityCopy.testIds.description}
              />
            </View>
            <Text style={styles.counter}>{descriptionCount}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{createCommunityCopy.iconLabel}</Text>
            <View style={styles.iconSection}>
              <Pressable
                style={styles.iconSelect}
                onPress={() => setImageSourceOpen(true)}
                testID={createCommunityCopy.testIds.image}
                accessibilityLabel={createCommunityCopy.testIds.image}
              >
                <LinearGradient style={styles.iconOuter} colors={[theme.surfaceVariant, theme.surface]}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.iconImage}
                      testID={createCommunityCopy.testIds.imagePreview}
                      accessibilityLabel={createCommunityCopy.testIds.imagePreview}
                    />
                  ) : (
                    <MaterialIcons name="groups" size={40} color={theme.onSurfaceVariant} />
                  )}
                </LinearGradient>
                <View style={styles.iconBadge}>
                  <MaterialIcons name="edit" size={16} color={theme.onPrimary} />
                </View>
              </Pressable>
              <Text style={styles.iconHelper}>{createCommunityCopy.iconHelper}</Text>
            </View>
          </View>
        </ScrollView>
        <ImageSourceSheet
          visible={imageSourceOpen}
          onClose={() => setImageSourceOpen(false)}
          onSelectCamera={handlePickFromCamera}
          onSelectGallery={handlePickFromGallery}
        />
        <View style={styles.ctaContainer} pointerEvents="box-none">
          <LinearGradient colors={gradientColors} style={[styles.ctaGradient, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.createButtonPressed,
                loading && styles.createButtonDisabled,
              ]}
              onPress={submit}
              disabled={loading}
              testID={createCommunityCopy.testIds.submit}
              accessibilityLabel={createCommunityCopy.testIds.submit}
            >
              <Text style={styles.createButtonText}>
                {loading ? createCommunityCopy.submitLoading : createCommunityCopy.submit}
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color={theme.onPrimary} />
            </Pressable>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.onBackground,
    },
    headerSpacer: {
      width: 36,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 12,
      gap: 20,
    },
    field: {
      gap: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
    },
    inputContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      shadowColor: theme.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    input: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 15,
      color: theme.onSurface,
    },
    textArea: {
      minHeight: 120,
    },
    counter: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
      textAlign: 'right',
    },
    iconSection: {
      alignItems: 'center',
      gap: 12,
    },
    iconSelect: {
      width: 112,
      height: 112,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconOuter: {
      width: 112,
      height: 112,
      borderRadius: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: theme.surface,
      shadowColor: theme.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    iconImage: {
      width: '100%',
      height: '100%',
      borderRadius: 56,
    },
    iconBadge: {
      position: 'absolute',
      bottom: 0,
      right: 6,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.surface,
      shadowColor: theme.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    iconHelper: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
      maxWidth: 220,
      lineHeight: 16,
    },
    ctaContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    ctaGradient: {
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.primary,
      borderRadius: 20,
      paddingVertical: 16,
      shadowColor: theme.surfaceTint,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    createButtonPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.95,
    },
    createButtonDisabled: {
      opacity: 0.6,
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onPrimary,
    },
  });
