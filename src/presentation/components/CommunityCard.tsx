import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { Community } from '../../domain/models/community';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { exploreCopy } from '../content/exploreCopy';
import { searchCopy } from '../content/searchCopy';
import { communityDetailCopy } from '../content/communityDetailCopy';
import { formatCompactNumber } from '../i18n/formatters';
import { getPlaceholderGradient } from '../theme/gradients';

type CommunityCardProps = {
  community: Community;
  index: number;
  isSubscribed: boolean;
  onPress: (community: Community) => void;
  onToggleSubscription: (community: Community) => void;
};

export const CommunityCard = React.memo<CommunityCardProps>(
  ({ community, index, isSubscribed, onPress, onToggleSubscription }) => {
    const theme = useThemeColors();
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    const tag = exploreCopy.trendingTags[index % exploreCopy.trendingTags.length];
    const members = formatCompactNumber(community.subscribersCount ?? 0);

    return (
      <Pressable
        style={styles.communityCard}
        onPress={() => onPress(community)}
        testID={`community-card-${community.id}`}
      >
        <View style={styles.communityImageContainer}>
          {community.imageUrl ? (
            <Image source={{ uri: community.imageUrl }} style={styles.communityImage} />
          ) : (
            <LinearGradient
              colors={getPlaceholderGradient(community.id) as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.communityIconPlaceholder}
            >
              <MaterialIcons name="groups" size={28} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          )}
        </View>
        <View style={styles.communityInfo}>
          <View style={styles.tagRow}>
            <Text style={[styles.tagText, { color: theme.primary }]}>#{tag.label.toUpperCase()}</Text>
          </View>
          <Text style={styles.communityTitle} numberOfLines={1}>
            {community.title}
          </Text>
          <Text style={styles.communityDescription} numberOfLines={1}>
            {community.description}
          </Text>
          <View style={styles.communityMeta}>
            <MaterialIcons name="groups" size={14} color={theme.onSurfaceVariant} />
            <Text style={styles.communityMetaText}>
              {members} {searchCopy.followersLabel}
            </Text>
          </View>
        </View>
        <Pressable
          style={[styles.joinButton, isSubscribed && styles.joinedButton]}
          onPress={(e) => {
            e.stopPropagation();
            onToggleSubscription(community);
          }}
        >
          <Text style={[styles.joinButtonText, isSubscribed && styles.joinedButtonText]}>
            {isSubscribed ? communityDetailCopy.unsubscribe : communityDetailCopy.subscribe}
          </Text>
        </Pressable>
      </Pressable>
    );
  }
);

CommunityCard.displayName = 'CommunityCard';

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    communityCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      marginBottom: 16,
      shadowColor: theme.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    communityImageContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    communityImage: {
      width: '100%',
      height: '100%',
    },
    communityIconPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    communityInfo: {
      flex: 1,
      marginLeft: 16,
      marginRight: 8,
    },
    tagRow: {
      marginBottom: 2,
    },
    tagText: {
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    communityTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.onSurface,
      marginBottom: 2,
    },
    communityDescription: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
      marginBottom: 6,
    },
    communityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    communityMetaText: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.onSurfaceVariant,
    },
    joinButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 80,
      alignItems: 'center',
    },
    joinedButton: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    joinButtonText: {
      color: theme.onPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    joinedButtonText: {
      color: theme.primary,
    },
  });
