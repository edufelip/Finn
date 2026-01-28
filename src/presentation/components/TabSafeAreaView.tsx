import React, { useMemo } from 'react';
import { Platform, StatusBar, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

type TabSafeAreaViewProps = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const getFallbackTopInset = () => {
  if (Platform.OS === 'ios') {
    return 20;
  }
  return StatusBar.currentHeight ?? 0;
};

export default function TabSafeAreaView({ style, children }: TabSafeAreaViewProps) {
  const insets = useSafeAreaInsets();
  const initialTop = initialWindowMetrics?.insets.top ?? 0;
  const fallbackTop = getFallbackTopInset();
  const topInset = Math.max(insets.top, initialTop, fallbackTop);

  const containerStyle = useMemo(
    () => [style, { paddingTop: topInset }],
    [style, topInset]
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={containerStyle}>
      {children}
    </SafeAreaView>
  );
}
