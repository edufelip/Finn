import { StyleSheet } from 'react-native';
import type { ThemeColors } from '../../theme/colors';

export const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingHorizontal: 16,
    },
    scrollStack: {
      flex: 1,
    },
    scrollLayer: {
      ...StyleSheet.absoluteFillObject,
    },
  });
