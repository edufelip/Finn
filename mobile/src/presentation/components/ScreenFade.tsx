import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet } from 'react-native';

type ScreenFadeProps = {
  children: React.ReactNode;
  duration?: number;
};

export default function ScreenFade({ children, duration = 160 }: ScreenFadeProps) {
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    const next = isFocused ? 1 : 0;
    opacity.value = withTiming(next, { duration: reduceMotion ? 0 : duration });
  }, [duration, isFocused, opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.container, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
