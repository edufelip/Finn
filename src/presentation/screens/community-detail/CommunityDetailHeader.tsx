import React, { useCallback, useMemo, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { Community } from '../../../domain/models/community';
import type { Subscription as CommunitySubscription } from '../../../domain/models/subscription';
import type { ThemeColors } from '../../theme/colors';
import { communityDetailCopy } from '../../content/communityDetailCopy';
import { getPlaceholderGradient } from '../../theme/gradients';
import { useLocalization } from '../../../app/providers/LocalizationProvider';

type CommunityDetailHeaderProps = {
  community: Community;

  hasNoPosts: boolean;
  isGuest: boolean;
  subscription: CommunitySubscription | null;
  subscribersCount: number;
  theme: ThemeColors;
  onPressBack: () => void;
  onPressMore?: (position: { x: number; y: number }) => void;
  onPressSubscribe: () => void;
};

const BANNER_HEIGHT = 224;
const BANNER_HEIGHT_EMPTY = 176;

export default function CommunityDetailHeader({
  community,
  hasNoPosts,
  isGuest,
  subscription,
  subscribersCount,
  theme,
  onPressBack,
  onPressMore,
  onPressSubscribe,
}: CommunityDetailHeaderProps) {
  useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const moreButtonRef = useRef<View>(null);

  const handleMorePress = useCallback(() => {
    if (!onPressMore) return;
    if (process.env.NODE_ENV === 'test') {
      onPressMore({ x: 0, y: 0 });
      return;
    }
    setTimeout(() => {
      moreButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        onPressMore({ x: pageX + width, y: pageY + height });
      });
    }, 0);
  }, [onPressMore]);

  return (
    <View style={styles.headerContainer}>
      <View style={[styles.bannerContainer, hasNoPosts && styles.bannerContainerEmpty]}>
        {!community.imageUrl ? (
          <LinearGradient
            colors={getPlaceholderGradient(community.id)}
            style={styles.bannerImage}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ) : (
          <>
            <Image
              source={{ uri: community.imageUrl }}
              style={styles.bannerImage}
              blurRadius={10}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent', theme.background]}
              style={styles.gradientOverlay}
            />
          </>
        )}
        <Pressable style={[styles.backButton, hasNoPosts && styles.emptyStateButton]} onPress={onPressBack}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <View ref={moreButtonRef} collapsable={false}>
          <Pressable
            style={[styles.moreButton, hasNoPosts && styles.emptyStateButton]}
            onPress={handleMorePress}
            disabled={!onPressMore}
          >
            <MaterialIcons name="more-horiz" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <View style={styles.iconWrapper}>
            {community.imageUrl ? (
              <Image
                source={{ uri: community.imageUrl }}
                style={styles.communityIcon}
                testID={communityDetailCopy.testIds.image}
                accessibilityLabel={communityDetailCopy.testIds.image}
              />
            ) : (
              <LinearGradient
                colors={getPlaceholderGradient(community.id)}
                style={styles.communityIconPlaceholder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="groups" size={48} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            )}
          </View>

          <View style={styles.joinButtonWrapper}>
            <Pressable
              style={[
                styles.joinButton,
                subscription && styles.joinedButton,
                isGuest && styles.lockedButton,
              ]}
              onPress={onPressSubscribe}
              testID={communityDetailCopy.testIds.subscribe}
              accessibilityLabel={communityDetailCopy.testIds.subscribe}
            >
              <Text style={[styles.joinButtonText, subscription && styles.joinedButtonText]}>
                {subscription ? communityDetailCopy.unsubscribe : communityDetailCopy.subscribe}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title} testID={communityDetailCopy.testIds.title}>
              {community.title}
            </Text>
            <MaterialIcons name="verified" size={20} color={theme.primary} />
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.memberCount}>
              {communityDetailCopy.subscribers(subscribersCount)}
            </Text>
          </View>
        </View>

        <Text style={styles.description} testID={communityDetailCopy.testIds.description}>
          {community.description}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    headerContainer: {
      marginBottom: 24,
    },
    bannerContainer: {
      height: BANNER_HEIGHT,
      width: '100%',
      position: 'relative',
    },
    bannerContainerEmpty: {
      height: BANNER_HEIGHT_EMPTY,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    backButton: {
      position: 'absolute',
      top: 80,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    moreButton: {
      position: 'absolute',
      top: 80,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentContainer: {
      paddingHorizontal: 20,
      marginTop: -48,
      position: 'relative',
      zIndex: 10,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    iconWrapper: {
      width: 96,
      height: 96,
      borderRadius: 24,
      backgroundColor: theme.surface,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    communityIcon: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
      backgroundColor: theme.primary,
    },
    communityIconPlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    joinButtonWrapper: {
      marginTop: 64,
    },
    joinButton: {
      marginBottom: 8,
      paddingHorizontal: 32,
      paddingVertical: 10,
      backgroundColor: theme.primary,
      borderRadius: 9999,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    joinedButton: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    lockedButton: {
      opacity: 0.8,
    },
    joinButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
    },
    joinedButtonText: {
      color: theme.primary,
    },
    infoSection: {
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: -0.5,
      color: theme.onBackground,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    memberCount: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.onSurfaceVariant,
    },
    description: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.onSurfaceVariant,
      maxWidth: '90%',
    },
  });
