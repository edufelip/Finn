import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';

type DividerProps = {
  height?: number;
};

export default function Divider({ height = 2 }: DividerProps) {
  return (
    <LinearGradient
      colors={[colors.dividerStart, colors.white]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.divider, { height }]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});
