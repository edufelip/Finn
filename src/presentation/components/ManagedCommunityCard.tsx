import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { Community } from '../../domain/models/community';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

type ManagedCommunityCardProps = {
  community: Community;
  onPress: () => void;
  showManageButton?: boolean;
  onManagePress?: () => void;
};

export default function ManagedCommunityCard({
  community,
  onPress,
  showManageButton = false,
  onManagePress,
}: ManagedCommunityCardProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const subscribersLabel = `${community.subscribersCount ?? 0} ${(community.subscribersCount ?? 0) === 1 ? 'member' : 'members'}`;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      testID={`community-card-${community.id}`}
    >
      <View style={styles.imageWrapper}>
        {community.imageUrl ? (
          <Image source={{ uri: community.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <MaterialIcons name="groups" size={32} color={theme.onSurfaceVariant} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {community.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {community.description}
        </Text>
        <Text style={styles.subscribers}>{subscribersLabel}</Text>
      </View>
      {showManageButton && onManagePress && (
        <Pressable
          style={styles.manageButton}
          onPress={(e) => {
            e.stopPropagation();
            onManagePress();
          }}
          testID={`community-manage-${community.id}`}
        >
          <MaterialIcons name="settings" size={20} color={theme.primary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.outline,
      padding: 12,
      marginHorizontal: 16,
      marginVertical: 6,
      shadowColor: theme.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    imageWrapper: {
      width: 72,
      height: 72,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.surfaceVariant,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.surfaceVariant,
    },
    content: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onBackground,
      marginBottom: 4,
    },
    description: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.onSurfaceVariant,
      marginBottom: 6,
      lineHeight: 18,
    },
    subscribers: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    manageButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
  });
