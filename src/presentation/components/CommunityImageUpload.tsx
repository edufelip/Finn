import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import { useLocalization } from '../../app/providers/LocalizationProvider';
import type { ThemeColors } from '../theme/colors';
import { editCommunityCopy } from '../content/editCommunityCopy';

type CommunityImageUploadProps = {
  imageUri: string | null;
  onPress: () => void;
};

const CommunityImageUpload = ({ imageUri, onPress }: CommunityImageUploadProps) => {
  const theme = useThemeColors();
  useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{editCommunityCopy.coverImageLabel}</Text>
      <Pressable
        style={styles.coverImageContainer}
        onPress={onPress}
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
  );
};

export default React.memo(CommunityImageUpload);

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
      marginBottom: 12,
      marginHorizontal: 16,
    },
    coverImageContainer: {
      height: 160,
      marginHorizontal: 16,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.surfaceVariant,
      position: 'relative',
    },
    coverImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    coverImagePlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverImageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    coverImageText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
  });
