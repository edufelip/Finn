import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Community } from '../../../../domain/models/community';
import type { ThemeColors } from '../../../theme/colors';
import { palette } from '../../../theme/palette';
import { formatCompactNumber } from '../../../i18n/formatters';
import { exploreCopy } from '../../../content/exploreCopy';

type TrendingCardProps = {
  community: Community;
  tagLabel: string;
  tagBackground: string;
  tagText: string;
  theme: ThemeColors;
  onPress: () => void;
};

const TrendingCard = React.memo<TrendingCardProps>(({ community, tagLabel, tagBackground, tagText, theme, onPress }) => {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const members = formatCompactNumber(community.subscribersCount ?? 0);
  const meta = exploreCopy.trendingMembersLabel(members);

  const cardContent = (
    <View style={styles.content}>
      <View style={[styles.tag, { backgroundColor: tagBackground }]}>
        <Text style={[styles.tagText, { color: tagText }]}>{tagLabel}</Text>
      </View>
      <Text
        style={styles.title}
        numberOfLines={1}
        testID={exploreCopy.testIds.trendingTitle}
      >
        {community.title || exploreCopy.communityFallback}
      </Text>
      <Text style={styles.meta}>{meta}</Text>
    </View>
  );

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      testID={exploreCopy.testIds.trendingCard}
    >
      {community.imageUrl ? (
        <ImageBackground source={{ uri: community.imageUrl }} style={styles.image} imageStyle={styles.imageRadius}>
          <LinearGradient colors={[palette.transparent, theme.scrim]} style={styles.overlay} />
          {cardContent}
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={[theme.primaryContainer, theme.primary]}
          style={styles.image}
        >
          <LinearGradient colors={[palette.transparent, theme.scrim]} style={styles.overlay} />
          {cardContent}
        </LinearGradient>
      )}
    </Pressable>
  );
});

TrendingCard.displayName = 'TrendingCard';

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: 240,
      height: 150,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: theme.shadow,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    image: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    imageRadius: {
      borderRadius: 20,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 4,
    },
    tag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    tagText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.onPrimary,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onPrimary,
    },
    meta: {
      fontSize: 11,
      color: theme.onScrim,
      fontWeight: '500',
    },
  });

export default TrendingCard;
