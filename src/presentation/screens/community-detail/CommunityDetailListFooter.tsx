import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { ThemeColors } from '../../theme/colors';

type CommunityDetailListFooterProps = {
  theme: ThemeColors;
};

export default function CommunityDetailListFooter({ theme }: CommunityDetailListFooterProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={theme.primary} />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    footer: {
      paddingVertical: 16,
    },
  });
