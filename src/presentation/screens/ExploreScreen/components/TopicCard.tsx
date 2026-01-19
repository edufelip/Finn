import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Topic } from '../../../../domain/models/topic';
import type { ThemeColors } from '../../../theme/colors';

type TopicTone = 'orange' | 'green' | 'purple' | 'blue';

type TopicPalette = {
  background: string;
  border: string;
  icon: string;
};

type TopicCardProps = {
  topic: Topic;
  palette: TopicPalette;
  theme: ThemeColors;
  onPress: () => void;
};

const TopicCard = React.memo<TopicCardProps>(({ topic, palette, theme, onPress }) => {
  const styles = React.useMemo(() => createStyles(theme, palette), [theme, palette]);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={topic.icon as any} size={18} color={palette.icon} />
      </View>
      <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
        {topic.label}
      </Text>
    </Pressable>
  );
});

TopicCard.displayName = 'TopicCard';

const createStyles = (theme: ThemeColors, palette: TopicPalette) =>
  StyleSheet.create({
    card: {
      width: '48%',
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor: palette.background,
      borderColor: palette.border,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: palette.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: theme.onSurface,
    },
  });

export default TopicCard;
