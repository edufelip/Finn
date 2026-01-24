import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Community } from '../../../../domain/models/community';
import type { ThemeColors } from '../../../theme/colors';
import { exploreCopy } from '../../../content/exploreCopy';
import { formatCompactNumber } from '../../../i18n/formatters';
import { useLocalization } from '../../../../app/providers/LocalizationProvider';

type FeedSectionProps = {
  feedItems: Community[];
  theme: ThemeColors;
  onItemPress: (communityId: number) => void;
};

const FeedSection = React.memo<FeedSectionProps>(({ feedItems, theme, onItemPress }) => {
  useLocalization();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  if (feedItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{exploreCopy.feedTitle}</Text>
      {feedItems.map((item) => (
        <Pressable
          key={`feed-${item.id}`}
          style={styles.item}
          onPress={() => onItemPress(item.id)}
        >
          <View style={styles.badge} />
          <View style={styles.content}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title || exploreCopy.communityFallback}
            </Text>
            {item.description ? (
              <Text style={styles.body} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <Text style={styles.meta}>
              {exploreCopy.trendingMembersLabel(formatCompactNumber(item.subscribersCount ?? 0))}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
});

FeedSection.displayName = 'FeedSection';

const createStyles = (theme: ThemeColors) =>
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
    item: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
      marginBottom: 12,
      flexDirection: 'row',
      gap: 12,
      shadowColor: theme.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    badge: {
      width: 6,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    content: {
      flex: 1,
      gap: 6,
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.onSurface,
    },
    body: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
    meta: {
      fontSize: 11,
      color: theme.onSurfaceVariant,
    },
  });

export default FeedSection;
