import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';

import type { MainStackParamList } from '../navigation/MainStack';
import type { Community, PostPermission } from '../../domain/models/community';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { editCommunityCopy } from '../content/editCommunityCopy';
import ImageSourceSheet from '../components/ImageSourceSheet';

type Navigation = NativeStackNavigationProp<MainStackParamList, 'EditCommunity'>;
type Route = RouteProp<MainStackParamList, 'EditCommunity'>;

export default function EditCommunityScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { session } = useAuth();
  const { communities: communityRepository, moderationLogs: moderationLogRepository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { communityId } = route.params;

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [postPermission, setPostPermission] = useState<PostPermission>('anyone_follows');
  const [originalPermission, setOriginalPermission] = useState<PostPermission>('anyone_follows');
  const [imageSourceOpen, setImageSourceOpen] = useState(false);
  const skipDiscardPromptRef = useRef(false);

  const hasChanges = useMemo(() => {
    return imageUri !== originalImageUrl || postPermission !== originalPermission;
  }, [imageUri, originalImageUrl, postPermission, originalPermission]);

  const loadCommunity = useCallback(async () => {
    if (!session?.user?.id) {
      Alert.alert(
        editCommunityCopy.alerts.signInRequired.title,
        editCommunityCopy.alerts.signInRequired.message
      );
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      const data = await communityRepository.getCommunity(communityId);
      if (!data) {
        Alert.alert(editCommunityCopy.alerts.failed.title, 'Community not found');
        navigation.goBack();
        return;
      }

      if (data.ownerId !== session.user.id) {
        Alert.alert(
          editCommunityCopy.alerts.notAuthorized.title,
          editCommunityCopy.alerts.notAuthorized.message
        );
        navigation.goBack();
        return;
      }

      setCommunity(data);
      const permission = data.postPermission ?? 'anyone_follows';
      setPostPermission(permission);
      setOriginalPermission(permission);
      setImageUri(data.imageUrl ?? null);
      setOriginalImageUrl(data.imageUrl ?? null);
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert(editCommunityCopy.alerts.failed.title, err.message);
      }
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [communityId, communityRepository, navigation, session?.user?.id]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (skipDiscardPromptRef.current || !hasChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
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
  }, [navigation, hasChanges]);

  const handlePickFromGallery = async () => {
    setImageSourceOpen(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickFromCamera = async () => {
    setImageSourceOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id || !community) {
      return;
    }

    const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
    if (!status.isConnected) {
      Alert.alert(editCommunityCopy.alerts.offline.title, editCommunityCopy.alerts.offline.message);
      return;
    }

    setSaving(true);
    try {
      await communityRepository.updateCommunitySettings(
        communityId,
        {
          postPermission: postPermission !== originalPermission ? postPermission : undefined,
        },
        imageUri !== originalImageUrl ? imageUri : undefined
      );

      if (postPermission !== originalPermission) {
        await moderationLogRepository.createLog({
          communityId,
          moderatorId: session.user.id,
          action: 'settings_changed',
          postId: null,
        });
      }

      setOriginalImageUrl(imageUri);
      setOriginalPermission(postPermission);

      skipDiscardPromptRef.current = true;
      Alert.alert(
        editCommunityCopy.alerts.saved.title,
        editCommunityCopy.alerts.saved.message,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert(editCommunityCopy.alerts.failed.title, err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNavigateToModeration = useCallback(
    (screen: 'PendingContent' | 'ReportedContent' | 'ModerationLogs' | 'ManageModerators') => {
      navigation.navigate(screen, { communityId });
    },
    [navigation, communityId]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.onBackground} />
          </Pressable>
          <Text style={styles.headerTitle}>{editCommunityCopy.title}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.onBackground} />
          </Pressable>
          <Text style={styles.headerTitle}>{editCommunityCopy.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{editCommunityCopy.coverImageLabel}</Text>
            <Pressable
              style={styles.coverImageContainer}
              onPress={() => setImageSourceOpen(true)}
              testID={editCommunityCopy.testIds.coverImageButton}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverImagePlaceholder}>
                  <MaterialIcons name="add-photo-alternate" size={48} color={theme.onSurfaceVariant} />
                </View>
              )}
              <View style={styles.coverImageOverlay}>
                <MaterialIcons name="photo-camera" size={24} color="#fff" />
                <Text style={styles.coverImageText}>{editCommunityCopy.changeCoverImage}</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{editCommunityCopy.postPermissionLabel}</Text>
            <View style={styles.radioGroup}>
              <RadioOption
                selected={postPermission === 'anyone_follows'}
                onPress={() => setPostPermission('anyone_follows')}
                label={editCommunityCopy.postPermissionOptions.anyone_follows.label}
                description={editCommunityCopy.postPermissionOptions.anyone_follows.description}
                testID={editCommunityCopy.testIds.postPermissionAnyoneFollows}
                theme={theme}
              />
              <RadioOption
                selected={postPermission === 'moderated'}
                onPress={() => setPostPermission('moderated')}
                label={editCommunityCopy.postPermissionOptions.moderated.label}
                description={editCommunityCopy.postPermissionOptions.moderated.description}
                testID={editCommunityCopy.testIds.postPermissionModerated}
                theme={theme}
              />
              <RadioOption
                selected={postPermission === 'private'}
                onPress={() => setPostPermission('private')}
                label={editCommunityCopy.postPermissionOptions.private.label}
                description={editCommunityCopy.postPermissionOptions.private.description}
                testID={editCommunityCopy.testIds.postPermissionPrivate}
                theme={theme}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{editCommunityCopy.moderationSection}</Text>
            <View style={styles.moderationButtons}>
              <ModerationButton
                icon="pending-actions"
                label={editCommunityCopy.pendingContentButton}
                onPress={() => handleNavigateToModeration('PendingContent')}
                testID={editCommunityCopy.testIds.pendingContentButton}
                theme={theme}
              />
              <ModerationButton
                icon="flag"
                label={editCommunityCopy.reportedContentButton}
                onPress={() => handleNavigateToModeration('ReportedContent')}
                testID={editCommunityCopy.testIds.reportedContentButton}
                theme={theme}
              />
              <ModerationButton
                icon="history"
                label={editCommunityCopy.moderationLogsButton}
                onPress={() => handleNavigateToModeration('ModerationLogs')}
                testID={editCommunityCopy.testIds.moderationLogsButton}
                theme={theme}
              />
              <ModerationButton
                icon="manage-accounts"
                label={editCommunityCopy.manageModeratorsButton}
                onPress={() => handleNavigateToModeration('ManageModerators')}
                testID={editCommunityCopy.testIds.manageModeratorsButton}
                theme={theme}
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
            testID={editCommunityCopy.testIds.saveButton}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color={theme.onPrimary} style={styles.saveButtonSpinner} />
                <Text style={styles.saveButtonText}>{editCommunityCopy.savingButton}</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="save" size={20} color={theme.onPrimary} />
                <Text style={styles.saveButtonText}>{editCommunityCopy.saveButton}</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ImageSourceSheet
        visible={imageSourceOpen}
        onClose={() => setImageSourceOpen(false)}
        onSelectCamera={handlePickFromCamera}
        onSelectGallery={handlePickFromGallery}
      />
    </SafeAreaView>
  );
}

type RadioOptionProps = {
  selected: boolean;
  onPress: () => void;
  label: string;
  description: string;
  testID: string;
  theme: ThemeColors;
};

const RadioOption = React.memo<RadioOptionProps>(
  ({ selected, onPress, label, description, testID, theme }) => {
    const styles = useMemo(() => createRadioStyles(theme), [theme]);

    return (
      <Pressable
        style={[styles.radioOption, selected && styles.radioOptionSelected]}
        onPress={onPress}
        testID={testID}
      >
        <View style={styles.radioCircle}>
          {selected && <View style={styles.radioCircleInner} />}
        </View>
        <View style={styles.radioContent}>
          <Text style={styles.radioLabel}>{label}</Text>
          <Text style={styles.radioDescription}>{description}</Text>
        </View>
      </Pressable>
    );
  }
);

type ModerationButtonProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  testID: string;
  theme: ThemeColors;
};

const ModerationButton = React.memo<ModerationButtonProps>(
  ({ icon, label, onPress, testID, theme }) => {
    const styles = useMemo(() => createModerationButtonStyles(theme), [theme]);

    return (
      <Pressable style={styles.button} onPress={onPress} testID={testID}>
        <View style={styles.iconWrapper}>
          <MaterialIcons name={icon} size={24} color={theme.primary} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <MaterialIcons name="chevron-right" size={20} color={theme.onSurfaceVariant} />
      </Pressable>
    );
  }
);

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.outline,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: theme.onBackground,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 44,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.onBackground,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    coverImageContainer: {
      width: '100%',
      height: 180,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    coverImagePlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverImageOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    coverImageText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    radioGroup: {
      gap: 12,
    },
    moderationButtons: {
      gap: 12,
    },
    bottomSpacer: {
      height: 100,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.outline,
      backgroundColor: theme.background,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 14,
      gap: 8,
      shadowColor: theme.surfaceTint,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 3,
    },
    saveButtonDisabled: {
      backgroundColor: theme.surfaceVariant,
      shadowOpacity: 0,
      elevation: 0,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onPrimary,
    },
    saveButtonSpinner: {
      marginRight: 4,
    },
  });

const createRadioStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    radioOption: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.outline,
      padding: 16,
      gap: 12,
    },
    radioOptionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryContainer,
    },
    radioCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.outline,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    radioCircleInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.primary,
    },
    radioContent: {
      flex: 1,
    },
    radioLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onBackground,
      marginBottom: 4,
    },
    radioDescription: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
      lineHeight: 18,
    },
  });

const createModerationButtonStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
      padding: 16,
      gap: 12,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: theme.onBackground,
    },
  });
