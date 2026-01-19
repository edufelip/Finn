import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Community } from '../../../../domain/models/community';
import type { Topic } from '../../../../domain/models/topic';
import type { ThemeColors } from '../../../theme/colors';
import { exploreCopy } from '../../../content/exploreCopy';
import TrendingCard from './TrendingCard';

type TopicTone = 'orange' | 'green' | 'purple' | 'blue';

type TrendingSectionProps = {
  trending: Community[];
  topics: Topic[];
  error: string | null;
  theme: ThemeColors;
  onSeeAll: () => void;
  onCardPress: (communityId: number) => void;
};

const TrendingSection = React.memo<TrendingSectionProps>(
  ({ trending, topics, error, theme, onSeeAll, onCardPress }) => {
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    const tagPalette = React.useMemo(
      () =>
        exploreCopy.trendingTags.map((tag) => ({
          label: tag.label,
          background:
            tag.tone === 'tech'
              ? theme.primary
              : tag.tone === 'travel'
                ? theme.secondary
                : theme.tertiary,
          text:
            tag.tone === 'tech'
              ? theme.onPrimary
              : tag.tone === 'travel'
                ? theme.onSecondary
                : theme.onTertiary,
        })),
      [theme]
    );

    const topicPalette = React.useMemo(
      () => ({
        orange: {
          background: theme.errorContainer,
          border: theme.error,
          icon: theme.onErrorContainer,
        },
        green: {
          background: theme.secondaryContainer,
          border: theme.secondary,
          icon: theme.onSecondaryContainer,
        },
        purple: {
          background: theme.tertiaryContainer,
          border: theme.tertiary,
          icon: theme.onTertiaryContainer,
        },
        blue: {
          background: theme.primaryContainer,
          border: theme.primary,
          icon: theme.onPrimaryContainer,
        },
      }),
      [theme]
    );

    const renderItem = React.useCallback(
      ({ item, index }: { item: Community; index: number }) => {
        const communityTopic = topics.find((t) => t.id === item.topicId);
        const tag = communityTopic
          ? {
              label: communityTopic.label,
              background: topicPalette[communityTopic.tone as TopicTone].border,
              text: theme.onPrimary,
            }
          : tagPalette[index % tagPalette.length];

        return (
          <TrendingCard
            community={item}
            tagLabel={tag.label}
            tagBackground={tag.background}
            tagText={tag.text}
            theme={theme}
            onPress={() => onCardPress(item.id)}
          />
        );
      },
      [topics, topicPalette, tagPalette, theme, onCardPress]
    );

    const keyExtractor = React.useCallback((item: Community) => `${item.id}`, []);

    const ItemSeparator = React.useCallback(() => <View style={styles.separator} />, [styles]);

    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>{exploreCopy.trendingTitle}</Text>
          {trending.length > 0 ? (
            <Pressable
              onPress={onSeeAll}
              testID={exploreCopy.testIds.seeAll}
              accessibilityLabel={exploreCopy.testIds.seeAll}
            >
              <Text style={styles.seeAll}>{exploreCopy.trendingSeeAll}</Text>
            </Pressable>
          ) : null}
        </View>
        <FlatList
          testID={exploreCopy.testIds.trendingList}
          horizontal
          data={trending}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={ItemSeparator}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }
);

TrendingSection.displayName = 'TrendingSection';

const createStyles = (theme: ThemeColors) =>
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
    list: {
      paddingVertical: 4,
    },
    separator: {
      width: 16,
    },
    error: {
      marginTop: 8,
      color: theme.error,
      fontSize: 12,
    },
  });

export default TrendingSection;
