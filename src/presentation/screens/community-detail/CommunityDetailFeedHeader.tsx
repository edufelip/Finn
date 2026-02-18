import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { ThemeColors } from '../../theme/colors';
import { communityDetailCopy } from '../../content/communityDetailCopy';
import { useLocalization } from '../../../app/providers/LocalizationProvider';

type CommunityDetailFeedHeaderProps = {
  theme: ThemeColors;

  onPressSort?: () => void;
  sortLabel: string;
};

export default function CommunityDetailFeedHeader({ theme, onPressSort, sortLabel }: CommunityDetailFeedHeaderProps) {
  useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.feedHeader}>
      <Text style={styles.feedTitle}>{communityDetailCopy.feedTitle}</Text>
      <Pressable style={styles.sortButton} onPress={onPressSort} disabled={!onPressSort}>
        <MaterialIcons name="sort" size={14} color={theme.primary} />
        <Text style={styles.sortButtonText}>{communityDetailCopy.feedSort(sortLabel)}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    feedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginTop: 12,
      marginBottom: 8,
    },
    feedTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.onBackground,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sortButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
  });
