import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { compressImageUri } from '../utils/imageProcessing';
import * as Network from 'expo-network';

import type { MainStackParamList } from '../navigation/MainStack';
import type { PostPermission } from '../../domain/models/community';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { isMockMode } from '../../config/appConfig';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { editCommunityCopy } from '../content/editCommunityCopy';
import ImageSourceSheet from '../components/ImageSourceSheet';
import CommunityImageUpload from '../components/CommunityImageUpload';
import PostPermissionSelector from '../components/PostPermissionSelector';
import ModerationNavSection from '../components/ModerationNavSection';
import { useModerationAuth } from '../hooks/useModerationAuth';

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

  // Memoize alerts to prevent infinite loops in useModerationAuth
  const authAlerts = useMemo(() => ({
    signInRequired: editCommunityCopy.alerts.signInRequired,
    notFound: { title: editCommunityCopy.alerts.failed.title, message: 'Community not found' },
    notAuthorized: editCommunityCopy.alerts.notAuthorized,
    failed: editCommunityCopy.alerts.failed,
  }), []);

  // Use moderation auth hook to handle authorization
  const { community, loading, isAuthorized } = useModerationAuth({
    communityId,
    requireOwner: true, // Only owners can edit community settings
    alerts: authAlerts,
  });

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

  // Initialize form state from community data
  useEffect(() => {
    if (community) {
      const permission = community.postPermission ?? 'anyone_follows';
      setPostPermission(permission);
      setOriginalPermission(permission);
      setImageUri(community.imageUrl ?? null);
      setOriginalImageUrl(community.imageUrl ?? null);
    }
  }, [community]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (skipDiscardPromptRef.current || !hasChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        editCommunityCopy.alerts.unsavedChanges.title,
        editCommunityCopy.alerts.unsavedChanges.message,
        [
          { text: editCommunityCopy.alerts.unsavedChanges.keepEditing, style: 'cancel' },
          {
            text: editCommunityCopy.alerts.unsavedChanges.discard,
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
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      const processed = await compressImageUri(asset.uri, asset.width, { maxWidth: 1280 });
      setImageUri(processed);
    }
  };

  const handlePickFromCamera = async () => {
    setImageSourceOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      const processed = await compressImageUri(asset.uri, asset.width, { maxWidth: 1280 });
      setImageUri(processed);
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
        [{ text: editCommunityCopy.alerts.saved.okButton, onPress: () => navigation.goBack() }]
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

  if (!isAuthorized || !community) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
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
          <CommunityImageUpload
            imageUri={imageUri}
            onPress={() => setImageSourceOpen(true)}
          />

          <PostPermissionSelector
            selected={postPermission}
            onSelect={setPostPermission}
          />

          <ModerationNavSection onNavigate={handleNavigateToModeration} />

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
      paddingTop: 20,
      paddingBottom: 24,
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
