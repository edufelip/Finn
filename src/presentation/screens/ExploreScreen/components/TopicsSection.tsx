import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Topic } from '../../../../domain/models/topic';
import type { ThemeColors } from '../../../theme/colors';
import { exploreCopy } from '../../../content/exploreCopy';
import TopicCard from './TopicCard';

type TopicTone = 'orange' | 'green' | 'purple' | 'blue';

type TopicsSectionProps = {
  topics: Topic[];
  theme: ThemeColors;
  onTopicPress: (topicId: number) => void;
};

const TopicsSection = React.memo<TopicsSectionProps>(({ topics, theme, onTopicPress }) => {
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{exploreCopy.topicsTitle}</Text>
      <View style={styles.grid}>
        {topics.map((topic) => {
          const tonePalette = topicPalette[topic.tone as TopicTone];
          return (
            <TopicCard
              key={topic.id}
              topic={topic}
              palette={tonePalette}
              theme={theme}
              onPress={() => onTopicPress(topic.id)}
            />
          );
        })}
      </View>
    </View>
  );
});

TopicsSection.displayName = 'TopicsSection';

const createStyles = (theme: ThemeColors) =>
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
  });

export default TopicsSection;
