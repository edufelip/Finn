import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Network from 'expo-network';
import * as ImagePicker from 'expo-image-picker';
import { compressImageUri } from '../utils/imageProcessing';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Community } from '../../domain/models/community';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { isMockMode } from '../../config/appConfig';
import { enqueueWrite } from '../../data/offline/queueStore';
import { persistOfflineImage } from '../../data/offline/offlineImages';
import { useTheme, useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { palette } from '../theme/palette';
import { createPostCopy } from '../content/createPostCopy';
import { imagePickerCopy } from '../content/imagePickerCopy';
import type { MainStackParamList } from '../navigation/MainStack';
import ImageSourceSheet from '../components/ImageSourceSheet';
import GuestGateScreen from '../components/GuestGateScreen';
import { guestCopy } from '../content/guestCopy';

type CreatePostRouteProp = RouteProp<MainStackParamList, 'CreatePost'>;

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const route = useRoute<CreatePostRouteProp>();
  const initialCommunityId = route.params?.communityId;
  const { session, isGuest, exitGuest } = useAuth();
  const [content, setContent] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
    initialCommunityId ?? null
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [imageSourceOpen, setImageSourceOpen] = useState(false);
  const [userCanModerate, setUserCanModerate] = useState(false);
  const insets = useSafeAreaInsets();
  const contentMaxLength = 500;

  const { 
    communities: communityRepository, 
    posts: postRepository,
    communityModerators: moderatorRepository,
  } = useRepositories();
  const { isDark } = useTheme();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const contentCount = createPostCopy.contentCount(content.length, contentMaxLength);
  const gradientColors = useMemo<readonly [string, string]>(
    () => [`${theme.background}00`, theme.background],
    [theme.background]
  );

  useEffect(() => {
    let cancelled = false;
    const loadCommunities = async () => {
      if (!session?.user?.id) {
        setCommunities([]);
        setSelectedCommunityId(null);
        return;
      }

      try {
        const data = await communityRepository.getSubscribedCommunities(session.user.id);
        if (cancelled) return;
        setCommunities(data);
        setSelectedCommunityId((current) => {
          if (current && data.some((community) => community.id === current)) {
            return current;
          }
          if (initialCommunityId && data.some((community) => community.id === initialCommunityId)) {
            return initialCommunityId;
          }
          return data[0]?.id ?? null;
        });
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert(createPostCopy.alerts.loadCommunitiesFailed.title, error.message);
        }
      }
    };

    loadCommunities();

    return () => {
      cancelled = true;
    };
  }, [communityRepository, session?.user?.id, initialCommunityId]);

  // Check if user can moderate the selected community
  useEffect(() => {
    let cancelled = false;
    const checkModeration = async () => {
      if (!session?.user?.id || !selectedCommunityId) {
        setUserCanModerate(false);
        return;
      }

      try {
        const community = communities.find((c) => c.id === selectedCommunityId);
        if (!community) {
          setUserCanModerate(false);
          return;
        }

        // Check if user is owner
        if (community.ownerId === session.user.id) {
          if (!cancelled) setUserCanModerate(true);
          return;
        }

        // Check if user is moderator
        const isMod = await moderatorRepository.isModerator(selectedCommunityId, session.user.id);
        if (!cancelled) setUserCanModerate(isMod);
      } catch (error) {
        if (!cancelled) setUserCanModerate(false);
      }
    };

    checkModeration();

    return () => {
      cancelled = true;
    };
  }, [selectedCommunityId, session?.user?.id, communities, moderatorRepository]);

  if (isGuest) {
    return (
      <GuestGateScreen
        title={guestCopy.restricted.title(guestCopy.features.createPost)}
        body={guestCopy.restricted.body(guestCopy.features.createPost)}
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
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      quality: 0.8,
      allowsMultipleSelection: false,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      const processed = await compressImageUri(asset.uri, asset.width, { maxWidth: 1080 });
      setImageUri(processed);
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
        mediaTypes: ['images'] as ImagePicker.MediaType[],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
      const processed = await compressImageUri(asset.uri, asset.width, { maxWidth: 1080 });
        setImageUri(processed);
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

    const selectedCommunity = communities.find((c) => c.id === selectedCommunityId);
    if (!selectedCommunity) {
      Alert.alert(createPostCopy.alerts.failed.title, 'Community not found');
      return;
    }

    // Determine moderation status
    // If user is owner/moderator OR community doesn't require moderation, approve immediately
    const needsModeration = selectedCommunity.postPermission === 'moderated' && !userCanModerate;
    const moderationStatus = needsModeration ? 'pending' : 'approved';

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
          moderationStatus,
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
          moderationStatus,
        },
        imageUri ?? null
      );
      
      if (needsModeration) {
        Alert.alert(
          'Post Submitted',
          'Your post has been submitted and is pending moderator approval.'
        );
      } else {
        Alert.alert(createPostCopy.alerts.posted.title, createPostCopy.alerts.posted.message);
      }
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor={theme.surface} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color={theme.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>{createPostCopy.title}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Pressable
              style={styles.communityPicker}
              onPress={() => setPickerOpen(true)}
              testID={createPostCopy.testIds.communityPicker}
              accessibilityLabel={createPostCopy.testIds.communityPicker}
            >
              <View style={styles.communityLeft}>
                <View style={styles.communityIcon}>
                  <MaterialIcons name="public" size={16} color={theme.primary} />
                </View>
                <Text style={styles.communityText}>
                  {selectedCommunity?.title ?? createPostCopy.communityPlaceholder}
                </Text>
              </View>
              <MaterialIcons name="expand-more" size={20} color={theme.onSurfaceVariant} />
            </Pressable>
            {selectedCommunity?.postPermission === 'moderated' && !userCanModerate && (
              <View style={styles.moderationNotice}>
                <MaterialIcons name="info" size={16} color={theme.tertiary} />
                <Text style={styles.moderationNoticeText}>
                  This community requires moderator approval before posts are visible.
                </Text>
              </View>
            )}
          </View>
          <View style={styles.contentSection}>
            <TextInput
              style={styles.textArea}
              placeholder={createPostCopy.contentPlaceholder}
              placeholderTextColor={theme.onSurfaceVariant}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={contentMaxLength}
              textAlignVertical="top"
              testID={createPostCopy.testIds.content}
              accessibilityLabel={createPostCopy.testIds.content}
            />
          </View>
          <View style={styles.mediaSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaRow}
            >
              <Pressable
                style={styles.mediaTile}
                onPress={() => setImageSourceOpen(true)}
                testID={createPostCopy.testIds.image}
                accessibilityLabel={createPostCopy.testIds.image}
              >
                <MaterialIcons name="add-photo-alternate" size={28} color={theme.onSurfaceVariant} />
                <Text style={styles.mediaLabel}>{createPostCopy.mediaLabel}</Text>
              </Pressable>
              {imageUri ? (
                <View style={styles.mediaPreview}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    testID={createPostCopy.testIds.imagePreview}
                    accessibilityLabel={createPostCopy.testIds.imagePreview}
                  />
                </View>
              ) : null}
            </ScrollView>
            <View style={styles.mediaHelperRow}>
              <MaterialIcons name="info" size={16} color={theme.onSurfaceVariant} />
              <Text style={styles.mediaHelper}>{createPostCopy.mediaHelper}</Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.ctaContainer} pointerEvents="box-none">
          <LinearGradient
            colors={gradientColors}
            style={[styles.ctaGradient, { paddingBottom: insets.bottom + 12 }]}
          >
            <View style={styles.actionRow}>
              <View style={styles.actionButtons}>
                <Pressable style={styles.actionButton} disabled>
                  <MaterialIcons name="text-format" size={22} color={theme.onSurfaceVariant} />
                </Pressable>
                <Pressable style={styles.actionButton} disabled>
                  <MaterialIcons name="alternate-email" size={22} color={theme.onSurfaceVariant} />
                </Pressable>
                <Pressable style={styles.actionButton} disabled>
                  <MaterialIcons name="tag" size={22} color={theme.onSurfaceVariant} />
                </Pressable>
              </View>
              <Text style={styles.counter}>{contentCount}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.createButtonPressed,
                loading && styles.createButtonDisabled,
              ]}
              onPress={submit}
              disabled={loading}
              testID={createPostCopy.testIds.submit}
              accessibilityLabel={createPostCopy.testIds.submit}
            >
              <Text style={styles.createButtonText}>
                {loading ? createPostCopy.submitLoading : createPostCopy.submit}
              </Text>
              <MaterialIcons name="send" size={18} color={theme.onPrimary} />
            </Pressable>
          </LinearGradient>
        </View>
        <ImageSourceSheet
          visible={imageSourceOpen}
          onClose={() => setImageSourceOpen(false)}
          onSelectCamera={handlePickFromCamera}
          onSelectGallery={handlePickFromGallery}
        />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    body: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.outlineVariant,
      backgroundColor: theme.surface,
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
      fontWeight: '600',
      color: theme.onSurface,
    },
    headerSpacer: {
      width: 36,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    communityPicker: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: theme.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    communityLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    communityIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    communityText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onSurface,
    },
    moderationNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.tertiaryContainer,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.tertiary,
    },
    moderationNoticeText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: theme.onTertiaryContainer,
      fontWeight: '500',
    },
    contentSection: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    textArea: {
      minHeight: 220,
      padding: 12,
      fontSize: 16,
      lineHeight: 22,
      textAlignVertical: 'top',
      backgroundColor: palette.transparent,
      color: theme.onSurface,
    },
    mediaSection: {
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 8,
    },
    mediaRow: {
      gap: 16,
    },
    mediaTile: {
      width: 96,
      height: 96,
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.outline,
      backgroundColor: theme.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    mediaLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    mediaPreview: {
      width: 96,
      height: 96,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    imagePreview: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    mediaHelperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 4,
    },
    mediaHelper: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
    ctaContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    ctaGradient: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      marginBottom: 12,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    actionButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    counter: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
      fontWeight: '600',
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: theme.primary,
      shadowColor: theme.surfaceTint,
      shadowOpacity: 0.3,
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
      fontWeight: '600',
      color: theme.onPrimary,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.scrim,
    },
    modalSheet: {
      backgroundColor: theme.surface,
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
      color: theme.onSurface,
    },
    modalItem: {
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    modalItemText: {
      fontSize: 16,
      color: theme.onSurface,
    },
  });
