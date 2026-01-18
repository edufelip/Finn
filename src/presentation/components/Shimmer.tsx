import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ShimmerProps = {
  baseColor: string;
  highlightColor: string;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

export default function Shimmer({ baseColor, highlightColor, style, borderRadius = 16 }: ShimmerProps) {
  const shimmer = useMemo(() => new Animated.Value(0), []);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!width) return;
    shimmer.setValue(0);
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer, width]);

  const translateX = useMemo(
    () =>
      shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
      }),
    [shimmer, width]
  );

  const shimmerWidth = Math.max(width * 0.6, 120);

  return (
    <View
      style={[styles.base, { backgroundColor: baseColor, borderRadius }, style]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            {
              width: shimmerWidth,
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={[baseColor, highlightColor, baseColor]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
});
