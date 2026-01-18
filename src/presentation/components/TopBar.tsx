import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import Divider from './Divider';
import { useThemeColors } from '../../app/providers/ThemeProvider';

type TopBarProps = {
  title?: string;
  onBack?: () => void;
  showDivider?: boolean;
  titleAlign?: 'left' | 'center';
  backgroundColor?: string;
  textColor?: string;
  titleSize?: number;
  rightSlot?: React.ReactNode;
};

export default function TopBar({
  title,
  onBack,
  showDivider = true,
  titleAlign = 'left',
  backgroundColor,
  textColor,
  titleSize = 16,
  rightSlot,
}: TopBarProps) {
  const theme = useThemeColors();
  const resolvedBackground = backgroundColor ?? theme.surface;
  const resolvedText = textColor ?? theme.onSurface;
  const rippleColor = theme.outlineVariant;

  return (
    <View style={[styles.container, { backgroundColor: resolvedBackground }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            android_ripple={{ color: rippleColor, borderless: true }}
          >
            <MaterialIcons name="keyboard-arrow-left" size={24} color={resolvedText} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <Text
          style={[
            styles.title,
            {
              color: resolvedText,
              textAlign: titleAlign === 'center' ? 'center' : 'left',
              fontSize: titleSize,
            },
          ]}
          numberOfLines={1}
        >
          {title ?? ''}
        </Text>
        <View style={styles.right}>{rightSlot}</View>
      </View>
      {showDivider ? <Divider /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 36,
    height: 36,
  },
  title: {
    flex: 1,
    fontSize: 16,
  },
  right: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
