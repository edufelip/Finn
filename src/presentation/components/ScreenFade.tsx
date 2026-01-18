import React, { useEffect, useRef } from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useIsFocused, useNavigationState as useNavigationStateBase } from '@react-navigation/native';
import { StyleSheet } from 'react-native';

type ScreenFadeProps = {
  children: React.ReactNode;
  duration?: number;
  onlyOnTabSwitch?: boolean;
};

export default function ScreenFade({ children, duration = 160, onlyOnTabSwitch = false }: ScreenFadeProps) {
  const isFocused = useIsFocused();
  const useNavigationStateSafe =
    typeof useNavigationStateBase === 'function'
      ? useNavigationStateBase
      : ((selector: (state: { index: number }) => number) => selector({ index: 0 }));
  const tabIndex = useNavigationStateSafe((state) => state.index ?? 0);
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(isFocused ? 1 : 0);
  const previousFocused = useRef(isFocused);
  const previousTabIndex = useRef(tabIndex);

  useEffect(() => {
    const wasFocused = previousFocused.current;
    const tabChanged = previousTabIndex.current !== tabIndex;
    previousFocused.current = isFocused;
    previousTabIndex.current = tabIndex;

    const next = isFocused ? 1 : 0;

    if (onlyOnTabSwitch) {
      if (tabChanged) {
        opacity.value = withTiming(next, { duration: reduceMotion ? 0 : duration });
        return;
      }

      if (wasFocused && !isFocused) {
        opacity.value = 1;
        return;
      }

      opacity.value = next;
      return;
    }

    opacity.value = withTiming(next, { duration: reduceMotion ? 0 : duration });
  }, [duration, isFocused, opacity, reduceMotion, onlyOnTabSwitch, tabIndex]);

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
