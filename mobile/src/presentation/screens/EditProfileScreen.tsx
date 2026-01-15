import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { MainStackParamList } from '../navigation/MainStack';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { editProfileCopy } from '../content/editProfileCopy';
import { imagePickerCopy } from '../content/imagePickerCopy';
import ImageSourceSheet from '../components/ImageSourceSheet';
import { useUserStore } from '../../app/store/userStore';

export default function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { session } = useAuth();
  const { users: userRepository } = useRepositories();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageSourceOpen, setImageSourceOpen] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    name: '',
    bio: '',
    location: '',
    photoUri: null as string | null,
  });
  const skipDiscardPromptRef = useRef(false);

  const bioMaxLength = 300;
  const bioCount = editProfileCopy.bioCount(bio.length, bioMaxLength);
  const gradientColors = useMemo<readonly [string, string]>(
    () => [`${theme.background}00`, theme.background],
    [theme.background]
  );

  const currentUser = useUserStore((state) => state.currentUser);

  // Helper to check if changes exist
  const hasChanges = (
    current: { name: string; bio: string; location: string; photoUri: string | null },
    original: { name: string; bio: string; location: string; photoUri: string | null }
  ): boolean => {
    return (
      current.name.trim() !== original.name.trim() ||
      current.bio.trim() !== original.bio.trim() ||
      current.location.trim() !== original.location.trim() ||
      current.photoUri !== original.photoUri
    );
  };

  const currentValues = useMemo(() => ({
    name,
    bio,
    location,
    photoUri,
  }), [name, bio, location, photoUri]);

  const changesExist = useMemo(
    () => hasChanges(currentValues, originalValues),
    [currentValues, originalValues]
  );

  // Initialize form from store
  useEffect(() => {
    if (currentUser) {
      const values = {
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        photoUri: currentUser.photoUrl || null,
      };

      setName(values.name);
      setBio(values.bio);
      setLocation(values.location);
      setPhotoUri(values.photoUri);
      setOriginalPhotoUrl(values.photoUri);
      setOriginalValues(values);
    }
  }, [currentUser]);

  // Navigation blocker for unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (skipDiscardPromptRef.current) {
        return;
      }
      if (!changesExist) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        editProfileCopy.unsavedChanges.title,
        editProfileCopy.unsavedChanges.message,
        [
          {
            text: editProfileCopy.unsavedChanges.keep,
            style: 'cancel',
          },
          {
            text: editProfileCopy.unsavedChanges.discard,
            style: 'destructive',
            onPress: () => {
              if (e.data?.action) {
                navigation.dispatch(e.data.action);
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, changesExist]);

  // Image picker handlers
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
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
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
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        imagePickerCopy.alerts.cameraUnavailable.title,
        imagePickerCopy.alerts.cameraUnavailable.message
      );
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) {
      Alert.alert(
        editProfileCopy.alerts.signInRequired.title,
        editProfileCopy.alerts.signInRequired.message
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert(
        editProfileCopy.alerts.nameRequired.title,
        editProfileCopy.alerts.nameRequired.message
      );
      return;
    }

    if (bio.length > bioMaxLength) {
      Alert.alert(
        editProfileCopy.alerts.bioTooLong.title,
        editProfileCopy.alerts.bioTooLong.message
      );
      return;
    }

    // Check if any changes exist
    if (!changesExist) {
      navigation.goBack();
      return;
    }

    setLoading(true);
    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      setLoading(false);
      Alert.alert(editProfileCopy.alerts.offline.title, editProfileCopy.alerts.offline.message);
      return;
    }

    try {
      let nextPhotoUrl = originalPhotoUrl;
      if (photoUri && photoUri !== originalPhotoUrl) {
        const updatedUser = await userRepository.updateProfilePhoto(session.user.id, photoUri);
        useUserStore.getState().setUser(updatedUser);
        nextPhotoUrl = updatedUser.photoUrl ?? null;
        setPhotoUri(updatedUser.photoUrl ?? null);
      }

      const profileChanges: { name?: string; bio?: string | null; location?: string | null } = {};
      if (name.trim() !== originalValues.name.trim()) profileChanges.name = name.trim();
      if (bio.trim() !== originalValues.bio.trim()) profileChanges.bio = bio.trim() || null;
      if (location.trim() !== originalValues.location.trim()) profileChanges.location = location.trim() || null;

      if (Object.keys(profileChanges).length > 0) {
        const updatedUser = await userRepository.updateProfile(session.user.id, profileChanges);
        useUserStore.getState().setUser(updatedUser);
        if (!nextPhotoUrl) {
          nextPhotoUrl = updatedUser.photoUrl ?? null;
          setPhotoUri(updatedUser.photoUrl ?? null);
        }
      }

      const normalizedName = name.trim();
      const normalizedBio = bio.trim() || '';
      const normalizedLocation = location.trim() || '';
      setOriginalPhotoUrl(nextPhotoUrl);
      setOriginalValues({
        name: normalizedName,
        bio: normalizedBio,
        location: normalizedLocation,
        photoUri: nextPhotoUrl,
      });
      skipDiscardPromptRef.current = true;
      navigation.goBack();
    } catch (error: any) {
      const message = error instanceof Error ? error.message : (error?.message || 'An unexpected error occurred');
      Alert.alert(editProfileCopy.alerts.failed.title, message);
      return;
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios-new" size={20} color={theme.onBackground} />
          </Pressable>
          <Text style={styles.headerTitle}>{editProfileCopy.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              <View style={styles.photoWrapper}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <MaterialIcons name="person" size={48} color={theme.onSurfaceVariant} />
                  </View>
                )}
                <Pressable
                  style={styles.cameraIconOverlay}
                  onPress={() => setImageSourceOpen(true)}
                  testID="edit-profile-camera-icon"
                >
                  <MaterialIcons name="photo-camera" size={20} color={theme.onPrimary} />
                </Pressable>
              </View>
              <Pressable
                style={styles.changePhotoButton}
                onPress={() => setImageSourceOpen(true)}
                testID={editProfileCopy.testIds.photoButton}
              >
                <Text style={styles.changePhotoText}>{editProfileCopy.changePhoto}</Text>
              </Pressable>
            </View>
          </View>

          {/* Name Field */}
          <View style={styles.field}>
            <Text style={styles.label}>{editProfileCopy.nameLabel}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={editProfileCopy.namePlaceholder}
                placeholderTextColor={theme.onSurfaceVariant}
                value={name}
                onChangeText={setName}
                testID={editProfileCopy.testIds.nameInput}
                accessibilityLabel={editProfileCopy.testIds.nameInput}
              />
            </View>
          </View>

          {/* Bio Field */}
          <View style={styles.field}>
            <Text style={styles.label}>{editProfileCopy.bioLabel}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={editProfileCopy.bioPlaceholder}
                placeholderTextColor={theme.onSurfaceVariant}
                value={bio}
                onChangeText={setBio}
                maxLength={bioMaxLength}
                multiline
                textAlignVertical="top"
                testID={editProfileCopy.testIds.bioInput}
                accessibilityLabel={editProfileCopy.testIds.bioInput}
              />
            </View>
            <Text style={styles.counter}>{bioCount}</Text>
          </View>

          {/* Location Field */}
          <View style={styles.field}>
            <Text style={styles.label}>{editProfileCopy.locationLabel}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={editProfileCopy.locationPlaceholder}
                placeholderTextColor={theme.onSurfaceVariant}
                value={location}
                onChangeText={setLocation}
                testID={editProfileCopy.testIds.locationInput}
                accessibilityLabel={editProfileCopy.testIds.locationInput}
              />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Save Button */}
        <LinearGradient
          style={[styles.stickyFooter, { paddingBottom: insets.bottom + 20 }]}
          colors={gradientColors}
          pointerEvents="box-none"
        >
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              loading && styles.saveButtonDisabled,
              pressed && !loading && styles.saveButtonPressed,
            ]}
            onPress={handleSave}
            disabled={loading}
            testID={editProfileCopy.testIds.saveButton}
            accessibilityLabel={editProfileCopy.testIds.saveButton}
          >
            <Text style={styles.saveButtonText}>
              {loading ? editProfileCopy.savingButton : editProfileCopy.saveButton}
            </Text>
          </Pressable>
        </LinearGradient>

        {/* Image Source Sheet */}
        <ImageSourceSheet
          visible={imageSourceOpen}
          onClose={() => setImageSourceOpen(false)}
          onSelectCamera={handlePickFromCamera}
          onSelectGallery={handlePickFromGallery}
        />

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingOverlayText}>{editProfileCopy.savingButton}</Text>
          </View>
        )}
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
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 12,
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
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    photoSection: {
      marginBottom: 24,
      alignItems: 'center',
    },
    photoContainer: {
      alignItems: 'center',
      gap: 12,
    },
    photoWrapper: {
      position: 'relative',
      width: 120,
      height: 120,
    },
    photo: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.surfaceVariant,
    },
    photoPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraIconOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: theme.background,
    },
    changePhotoButton: {
      paddingVertical: 8,
    },
    changePhotoText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    field: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    inputContainer: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
      backgroundColor: theme.surface,
    },
    input: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: theme.onSurface,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 14,
      textAlignVertical: 'top',
    },
    counter: {
      textAlign: 'right',
      marginTop: 4,
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
    stickyFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    saveButton: {
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 4,
    },
    saveButtonDisabled: {
      backgroundColor: theme.outlineVariant,
    },
    saveButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    saveButtonText: {
      color: theme.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.scrim,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    },
    loadingOverlayText: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: '600',
      color: theme.onBackground,
    },
  });
