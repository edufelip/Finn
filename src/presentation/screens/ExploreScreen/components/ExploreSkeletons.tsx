import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../../../theme/colors';
import { exploreCopy } from '../../../content/exploreCopy';
import Shimmer from '../../../components/Shimmer';
import { useLocalization } from '../../../../app/providers/LocalizationProvider';

type ExploreSkeleTonsProps = {
  theme: ThemeColors;

};

export const TrendingSkeleton = React.memo<ExploreSkeleTonsProps>(({ theme }) => {
  useLocalization();
  const styles = React.useMemo(() => createTrendingStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{exploreCopy.trendingTitle}</Text>
        <Text style={styles.seeAll}>{exploreCopy.trendingSeeAll}</Text>
      </View>
      <View style={styles.row} testID={exploreCopy.testIds.trendingSkeleton}>
        {Array.from({ length: exploreCopy.trendingLimit }).map((_, index) => (
          <Shimmer
            key={`trending-skeleton-${index}`}
            baseColor={theme.surfaceVariant}
            highlightColor={theme.surface}
            style={styles.card}
            borderRadius={20}
          />
        ))}
      </View>
    </View>
  );
});

TrendingSkeleton.displayName = 'TrendingSkeleton';

export const FeedSkeleton = React.memo<ExploreSkeleTonsProps>(({ theme }) => {
  const styles = React.useMemo(() => createFeedStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{exploreCopy.feedTitle}</Text>
      <View style={styles.wrap} testID={exploreCopy.testIds.feedSkeleton}>
        {Array.from({ length: exploreCopy.feedSkeletonCount }).map((_, index) => (
          <Shimmer
            key={`feed-skeleton-${index}`}
            baseColor={theme.surfaceVariant}
            highlightColor={theme.surface}
            style={styles.card}
            borderRadius={20}
          />
        ))}
      </View>
    </View>
  );
});

FeedSkeleton.displayName = 'FeedSkeleton';

export const TopicsSkeleton = React.memo<ExploreSkeleTonsProps>(({ theme }) => {
  const styles = React.useMemo(() => createTopicsStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{exploreCopy.topicsTitle}</Text>
      <View style={styles.grid}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Shimmer
            key={`topic-skeleton-${index}`}
            baseColor={theme.surfaceVariant}
            highlightColor={theme.surface}
            style={styles.card}
            borderRadius={16}
          />
        ))}
      </View>
    </View>
  );
});

TopicsSkeleton.displayName = 'TopicsSkeleton';

const createTrendingStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.onBackground,
    },
    seeAll: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    row: {
      flexDirection: 'row',
      gap: 16,
    },
    card: {
      width: 240,
      height: 150,
      borderRadius: 20,
    },
  });

const createFeedStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginTop: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.onBackground,
      marginBottom: 12,
    },
    wrap: {
      gap: 12,
    },
    card: {
      width: '100%',
      height: 92,
      borderRadius: 20,
    },
  });

const createTopicsStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginTop: 16,
    },
    title: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    card: {
      width: '48%',
      height: 54,
      borderRadius: 16,
      marginBottom: 12,
    },
  });
